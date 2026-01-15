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
});

// Create te model 
export const Location = mongoose.model("Location", LocationSchema);

