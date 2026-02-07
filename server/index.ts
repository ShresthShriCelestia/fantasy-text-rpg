import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { Location } from "./models/Location";
import { CityData } from "./models/CityData";
import { generatePOIs } from "./utils/poiGenerator";
import { parseWatabouJSON, assignPOIsToBuildings } from "./utils/watabouParser";
import mongoose from 'mongoose'

// Read the connection string from the .env file
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in environment variables.");
    process.exit(1);
}

// Connect to MongoDB
try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully.");
} catch (error) {
    console.error("Error connecting to MongoDB:", error);
}

// Start the Game Server
const app = new Elysia()
    .use(cors()) // Allows Frontend to talk later
    .get('/', () => 'Game Server is running!')

    // Quick test to endpoint
    .get("/ping", () => "pong")

    // The endpoint to get all cities from mongo db
    .get("/locations", async () => {
        const cities = await Location.find(); // Fetch from Mongo
        return cities;
    })

    // Get city data for a specific location
    .get("/city-data/:locationId", async ({ params }) => {
        const cityData = await CityData.findOne({ locationId: params.locationId });
        return cityData;
    })

    // Save/update city data (import from Watabou JSON)
    .post("/city-data/:locationId", async ({ params, body }) => {
        try {
            const locationId = params.locationId;

            console.log('Received city data import request for location:', locationId);
            console.log('Body type:', typeof body);
            console.log('Body preview:', JSON.stringify(body).substring(0, 200));

            // Check if city data already exists
            let cityData = await CityData.findOne({ locationId });

            if (cityData) {
                // Update existing
                cityData.rawData = body;
                // Clear existing buildings
                cityData.buildings.splice(0, cityData.buildings.length);
                // TODO: Parse Watabou JSON and populate buildings array
            } else {
                // Create new
                cityData = new CityData({
                    locationId,
                    rawData: body,
                    buildings: [],
                    districts: []
                });
            }

            await cityData.save();
            console.log('City data saved successfully');
            return { success: true, cityData };
        } catch (error) {
            console.error('Error saving city data:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    })

    // Update a building to be a POI or modify POI details
    .patch("/city-data/:locationId/building/:buildingId", async ({ params, body }) => {
        const { locationId, buildingId } = params;

        const cityData = await CityData.findOne({ locationId });
        if (!cityData) {
            return { success: false, error: "City data not found" };
        }

        // Find and update the building
        const building = cityData.buildings.id(buildingId);
        if (!building) {
            return { success: false, error: "Building not found" };
        }

        // Update building properties
        Object.assign(building, body);
        await cityData.save();

        return { success: true, building };
    })

    // Delete POI status from a building
    .delete("/city-data/:locationId/building/:buildingId/poi", async ({ params }) => {
        const { locationId, buildingId } = params;

        const cityData = await CityData.findOne({ locationId });
        if (!cityData) {
            return { success: false, error: "City data not found" };
        }

        const building = cityData.buildings.id(buildingId);
        if (!building) {
            return { success: false, error: "Building not found" };
        }

        building.isPOI = false;
        building.poiType = undefined;
        building.name = undefined;
        building.description = undefined;

        await cityData.save();

        return { success: true };
    })

    // ===== POI ENDPOINTS =====

    // Generate POIs for a city (auto-generate based on city stats)
    .post("/locations/:locationId/generate-pois", async ({ params }) => {
        try {
            const locationId = params.locationId;

            // Get the location/city data
            const location = await Location.findById(locationId);
            if (!location) {
                return { success: false, error: "Location not found" };
            }

            // Generate POIs based on city characteristics
            const pois = generatePOIs({
                name: location.name,
                population: location.population || 0,
                type: location.type as any,
                cityType: location.cityType || '',
                citadel: location.citadel || 0,
                plaza: location.plaza || 0,
                temple: location.temple || 0,
                port: location.port || '0',
                walls: location.walls || 0
            });

            // Save or update city data with POIs
            let cityData = await CityData.findOne({ locationId });
            if (!cityData) {
                cityData = new CityData({
                    locationId,
                    pois: pois,
                    districts: []
                });
            } else {
                cityData.pois = pois as any;
            }

            await cityData.save();

            return { success: true, pois, count: pois.length };
        } catch (error) {
            console.error('Error generating POIs:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    })

    // Get all POIs for a city
    .get("/locations/:locationId/pois", async ({ params }) => {
        const cityData = await CityData.findOne({ locationId: params.locationId });
        if (!cityData) {
            return { pois: [] };
        }
        return { pois: cityData.pois || [] };
    })

    // Update a specific POI
    .patch("/locations/:locationId/pois/:poiId", async ({ params, body }) => {
        const { locationId, poiId } = params;

        const cityData = await CityData.findOne({ locationId });
        if (!cityData) {
            return { success: false, error: "City data not found" };
        }

        const poi = cityData.pois.find((p: any) => p.poiId === poiId);
        if (!poi) {
            return { success: false, error: "POI not found" };
        }

        // Update POI properties
        Object.assign(poi, body);
        await cityData.save();

        return { success: true, poi };
    })

    // Purchase a property (for residences)
    .post("/locations/:locationId/pois/:poiId/purchase", async ({ params, body }) => {
        const { locationId, poiId } = params;
        const { playerName } = body as any;

        const cityData = await CityData.findOne({ locationId });
        if (!cityData) {
            return { success: false, error: "City data not found" };
        }

        const poi = cityData.pois.find((p: any) => p.poiId === poiId);
        if (!poi) {
            return { success: false, error: "POI not found" };
        }

        if (poi.type !== 'residence') {
            return { success: false, error: "This location is not for sale" };
        }

        if (!poi.available) {
            return { success: false, error: "This property is not available" };
        }

        // Mark as sold
        poi.available = false;
        poi.owner = playerName;

        await cityData.save();

        return { success: true, message: `You are now the owner of ${poi.name}!`, poi };
    })

    // Upload Watabou JSON and auto-position POIs
    .post("/locations/:locationId/upload-watabou", async ({ params, body }) => {
        try {
            const { locationId } = params;
            const watabouJSON = body as any;

            console.log('Received Watabou JSON for location:', locationId);

            // Get existing city data with POIs
            const cityData = await CityData.findOne({ locationId });
            if (!cityData || !cityData.pois || cityData.pois.length === 0) {
                return { success: false, error: "Please generate POIs first before uploading Watabou data" };
            }

            // Parse Watabou JSON
            const watabouData = parseWatabouJSON(watabouJSON);
            console.log(`Parsed Watabou data: ${watabouData.castles.length} castles, ${watabouData.plazas.length} plazas, ${watabouData.buildings.length} buildings`);

            // Assign POIs to buildings
            const updatedPOIs = assignPOIsToBuildings(cityData.pois as any[], watabouData);

            // Update city data
            cityData.pois = updatedPOIs as any;
            cityData.rawData = watabouJSON; // Store the raw Watabou data

            // Save with version key check disabled to avoid conflicts
            try {
                await cityData.save();
            } catch (error: any) {
                if (error.name === 'VersionError') {
                    // Retry once by fetching fresh data
                    const freshData = await CityData.findOne({ locationId });
                    if (freshData) {
                        freshData.pois = updatedPOIs as any;
                        freshData.rawData = watabouJSON;
                        await freshData.save();
                    }
                } else {
                    throw error;
                }
            }

            return {
                success: true,
                message: 'POIs positioned based on Watabou map data',
                stats: {
                    castles: watabouData.castles.length,
                    plazas: watabouData.plazas.length,
                    buildings: watabouData.buildings.length,
                    poisUpdated: updatedPOIs.length
                }
            };
        } catch (error) {
            console.error('Error processing Watabou JSON:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    })

    .listen(3000);

console.log(`Dungeon Master is listening at ${app.server?.hostname}:${app.server?.port}`);
