import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { Location } from "./models/Location";
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
    
    .listen(3000);

console.log(`Dungeon Master is listening at ${app.server?.hostname}:${app.server?.port}`);
