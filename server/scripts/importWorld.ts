import mongoose from "mongoose";
import { Location } from "../models/Location";

// 1. Setup DB Connection
const MONGO_URI = process.env.MONGO_URI || "YOUR_CONNECTION_STRING_HERE_IF_ENV_FAILS";

async function importWorld() {
  console.log("⏳ Connecting to DB...");
  await mongoose.connect(MONGO_URI!);

  console.log("🧹 Clearing old locations...");
  await Location.deleteMany({});

  console.log("📖 Reading map file...");
  const file = Bun.file("./data/map_data.json");
  
  if (!(await file.exists())) {
      console.error("❌ Error: server/data/map_data.json not found!");
      process.exit(1);
  }

  const data = await file.json();
  
  // Filter out empty/metadata entries
  const rawBurgs = data.pack.burgs.filter((b: any) => b && b.i && b.name); 

  console.log(`🌍 Found ${rawBurgs.length} cities. Importing...`);

  const locationsToSave = rawBurgs.map((burg: any) => {
    // SAFETY CHECK: Ensure population is a real number, otherwise default to 500
    const rawPop = Number(burg.pop);
    const safePop = !isNaN(rawPop) ? rawPop * 1000 : 500;

    return {
      azgaarId: burg.i,
      name: burg.name,
      type: burg.capital ? "Capital" : "Town",
      coordinates: {
        x: burg.x,
        y: burg.y
      },
      population: safePop 
    };
  });

  try {
    await Location.insertMany(locationsToSave);
    console.log(`✅ Success! Imported ${locationsToSave.length} locations into MongoDB.`);
  } catch (err) {
    console.error("❌ Database Error:", err);
  }

  process.exit(0);
}

importWorld();