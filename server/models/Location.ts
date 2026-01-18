import mongoose from "mongoose";

// This tells MongoDB: "Every Location must have these fields"
const LocationSchema = new mongoose.Schema({
    azgaarId: {type: Number, required: true}, // Id from the map file
    name: { type: String, required: true },
    type: String, // e.g., "Capital", "Town", "Citadel"
    coordinates: {
        x: Number,
        y: Number
    },
    population: Number,
    description: String, // We will generate this later using Watabou logic
    // City features for Watabou generator
    cityType: String, // "River", "Naval", "Inland", etc.
    citadel: Number, // 0 or 1
    plaza: Number, // 0 or 1
    walls: Number, // 0 or 1
    shantytown: Number, // 0 or 1
    temple: Number, // 0 or 1
    port: String, // "1" if port city
    seed: Number, // For reproducible city generation
});

// Create te model 
export const Location = mongoose.model("Location", LocationSchema);

