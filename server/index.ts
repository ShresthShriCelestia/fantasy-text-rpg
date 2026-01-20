import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { Location } from "./models/Location";
import { CityData } from "./models/CityData";
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

    .listen(3000);

console.log(`Dungeon Master is listening at ${app.server?.hostname}:${app.server?.port}`);
