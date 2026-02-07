import mongoose from "mongoose";

// POI (Point of Interest) types
export enum POIType {
  CASTLE = "castle",
  TEMPLE = "temple",
  TAVERN = "tavern",
  SHOP = "shop",
  GUILD = "guild",
  PLAZA = "plaza",
  RESIDENCE = "residence",
  PORT = "port",
  BARRACKS = "barracks",
  CUSTOM = "custom"
}

// Schema for POIs (Points of Interest)
const POISchema = new mongoose.Schema({
  poiId: { type: String, required: true }, // Unique POI identifier
  name: { type: String, required: true }, // e.g., "The Prancing Pony", "Castle"
  type: {
    type: String,
    enum: Object.values(POIType),
    required: true
  },
  district: String, // Which district/quarter it's in
  description: String, // Detailed description for players

  // Location data
  coordinates: {
    x: Number,
    y: Number
  },

  // Property system (for residences)
  available: { type: Boolean, default: false }, // Can be purchased?
  price: Number, // Purchase price
  owner: String, // Player username/ID if owned

  // Interaction data
  visited: { type: Boolean, default: false }, // Has player visited?
  notes: String, // Player/DM notes
  customData: mongoose.Schema.Types.Mixed // Flexible field for quests, NPCs, etc
});

// Schema for city districts/wards
const DistrictSchema = new mongoose.Schema({
  watabouWardId: Number, // Ward ID from Watabou
  name: String, // Custom district name
  description: String,
  buildings: [String], // Array of building IDs in this district
});

// Main city data schema
const CityDataSchema = new mongoose.Schema({
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true,
    unique: true
  },

  // Raw Watabou JSON export (for reference)
  rawData: mongoose.Schema.Types.Mixed,

  // Parsed and enhanced data
  pois: [POISchema], // Points of interest (key locations)
  districts: [DistrictSchema],

  // Additional city-level data
  cityMap: {
    width: Number,
    height: Number,
    imageUrl: String // Optional: stored SVG or image
  },

  // Timestamps
  importedAt: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now }
});

// Update lastModified on save
CityDataSchema.pre('save', function() {
  this.lastModified = new Date();
});

export const CityData = mongoose.model("CityData", CityDataSchema);
