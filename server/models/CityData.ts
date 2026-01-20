import mongoose from "mongoose";

// POI (Point of Interest) types
export enum POIType {
  TAVERN = "tavern",
  GUILD = "guild",
  TEMPLE = "temple",
  SHOP = "shop",
  BLACKSMITH = "blacksmith",
  LIBRARY = "library",
  MARKETPLACE = "marketplace",
  BARRACKS = "barracks",
  NOBLE_HOUSE = "noble_house",
  CITY_HALL = "city_hall",
  CUSTOM = "custom"
}

// Schema for individual buildings/POIs
const BuildingSchema = new mongoose.Schema({
  // Original data from Watabou export
  watabouId: String, // ID from the JSON export
  coordinates: {
    x: Number,
    y: Number
  },
  type: String, // Original building type from Watabou

  // Enhanced data for gameplay
  isPOI: { type: Boolean, default: false }, // Is this a key location?
  poiType: {
    type: String,
    enum: Object.values(POIType),
    required: function() { return this.isPOI; }
  },
  name: String, // Custom name for POIs (e.g., "The Prancing Pony", "Blacksmith's Guild")
  description: String, // Detailed description
  owner: String, // NPC owner name
  notes: String, // DM/player notes

  // Metadata
  customData: mongoose.Schema.Types.Mixed // Flexible field for any custom properties
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
  buildings: [BuildingSchema],
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
CityDataSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

export const CityData = mongoose.model("CityData", CityDataSchema);
