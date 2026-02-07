// POI (Point of Interest) Generator
// Generates key locations for cities based on their characteristics

export interface POI {
  poiId: string;
  name: string;
  type: 'castle' | 'temple' | 'tavern' | 'shop' | 'guild' | 'plaza' | 'residence' | 'port' | 'barracks';
  district?: string;
  description: string;
  x?: number;
  y?: number;
  available: boolean; // For properties: true if available for purchase
  price?: number; // For properties
  owner?: string; // Player ID if owned
}

interface CityInfo {
  name: string;
  population: number;
  type: 'Capital' | 'Town';
  cityType: string;
  citadel?: number;
  plaza?: number;
  temple?: number;
  port?: string;
  walls?: number;
}

const TAVERN_NAMES = [
  "The Prancing Pony", "The Golden Griffin", "The Rusty Anchor", "The Dragon's Rest",
  "The Silver Tankard", "The Broken Wheel", "The Laughing Mermaid", "The King's Crown",
  "The Wild Boar", "The Sleeping Giant", "The Drunken Sailor", "The Red Lion"
];

const SHOP_TYPES = [
  { type: "Blacksmith", name: "Forge", items: ["weapons", "armor", "tools"] },
  { type: "Apothecary", name: "Remedy Shop", items: ["potions", "herbs", "medicine"] },
  { type: "General Store", name: "Trading Post", items: ["supplies", "food", "gear"] },
  { type: "Magic Shop", name: "Arcane Emporium", items: ["scrolls", "wands", "components"] },
  { type: "Jeweler", name: "Gem & Gold", items: ["jewelry", "gems", "rings"] },
];

const GUILD_TYPES = [
  { type: "Fighters Guild", description: "Mercenaries and warriors seek contracts here" },
  { type: "Mages Guild", description: "Arcane knowledge and magical services" },
  { type: "Thieves Guild", description: "Information brokers and shadowy dealings" },
  { type: "Merchants Guild", description: "Trade negotiations and business opportunities" },
];

export function generatePOIs(city: CityInfo): POI[] {
  const pois: POI[] = [];
  let idCounter = 0;

  const genId = () => `${city.name.toLowerCase()}-poi-${idCounter++}`;

  // 1. CASTLE (if capital or has citadel)
  if (city.type === 'Capital' || city.citadel) {
    pois.push({
      poiId: genId(),
      name: `${city.name} Castle`,
      type: 'castle',
      district: 'Castle District',
      description: 'The seat of power and throne room. Meet with nobility, seek audience with rulers, or take on royal quests.',
      available: false
    });
  }

  // 2. BARRACKS (if walled city)
  if (city.walls) {
    pois.push({
      poiId: genId(),
      name: 'City Barracks',
      type: 'barracks',
      district: 'Military Quarter',
      description: 'Training grounds and quarters for the city guard. Recruitment and bounties available.',
      available: false
    });
  }

  // 3. TEMPLE (based on temple parameter)
  const templeCount = city.temple ? city.temple : (city.population > 20000 ? 1 : 0);
  for (let i = 0; i < Math.max(1, templeCount); i++) {
    const gods = ['Solara', 'Luneth', 'Terrak', 'Aquion', 'Pyros'];
    pois.push({
      poiId: genId(),
      name: `Temple of ${gods[i % gods.length]}`,
      type: 'temple',
      district: 'Temple District',
      description: 'A place of worship and healing. Seek blessings, healing, or divine guidance.',
      available: false
    });
  }

  // 4. PLAZA (town square)
  if (city.plaza) {
    pois.push({
      poiId: genId(),
      name: 'Town Square',
      type: 'plaza',
      district: 'Market District',
      description: 'The heart of the city. Gather information, meet townsfolk, and hear the latest news.',
      available: false
    });
  }

  // 5. TAVERNS (based on population)
  const tavernCount = Math.floor(city.population / 10000) + 2;
  const selectedTaverns = shuffleArray([...TAVERN_NAMES]).slice(0, Math.min(tavernCount, TAVERN_NAMES.length));

  selectedTaverns.forEach(tavernName => {
    pois.push({
      poiId: genId(),
      name: tavernName,
      type: 'tavern',
      district: pickDistrict(['Market District', 'Harbor District', 'Lower Quarter']),
      description: 'A lively tavern where adventurers gather, rumors spread, and quests begin.',
      available: false
    });
  });

  // 6. SHOPS (based on population)
  const shopCount = Math.min(Math.floor(city.population / 8000) + 1, SHOP_TYPES.length);
  const selectedShops = shuffleArray([...SHOP_TYPES]).slice(0, shopCount);

  selectedShops.forEach(shop => {
    pois.push({
      poiId: genId(),
      name: `${shop.name}`,
      type: 'shop',
      district: 'Market District',
      description: `${shop.type} selling ${shop.items.join(', ')}.`,
      available: false
    });
  });

  // 7. GUILDS (for capitals and large cities)
  if (city.type === 'Capital' || city.population > 15000) {
    const guildCount = city.type === 'Capital' ? 3 : 2;
    const selectedGuilds = shuffleArray([...GUILD_TYPES]).slice(0, guildCount);

    selectedGuilds.forEach(guild => {
      pois.push({
        poiId: genId(),
        name: guild.type,
        type: 'guild',
        district: pickDistrict(['Guild Quarter', 'Market District', 'Upper District']),
        description: guild.description,
        available: false
      });
    });
  }

  // 8. PORT (if naval city)
  if (city.port === '1' || city.cityType.includes('Naval')) {
    pois.push({
      poiId: genId(),
      name: 'Harbor Master\'s Office',
      type: 'port',
      district: 'Harbor District',
      description: 'Manage shipping, book passage, or seek work on the docks.',
      available: false
    });

    pois.push({
      poiId: genId(),
      name: 'The Docks',
      type: 'port',
      district: 'Harbor District',
      description: 'Bustling waterfront with ships from distant lands. Smugglers and sailors frequent here.',
      available: false
    });
  }

  // 9. RESIDENTIAL PROPERTIES (for purchase)
  const propertyCount = Math.floor(city.population / 5000);
  const propertyTypes = [
    { name: 'Modest Cottage', price: 500, desc: 'A small but cozy home in the residential area.' },
    { name: 'Townhouse', price: 2000, desc: 'A comfortable two-story dwelling near the market.' },
    { name: 'Merchant\'s Estate', price: 5000, desc: 'A spacious property suitable for a successful trader.' },
    { name: 'Noble Villa', price: 15000, desc: 'A luxurious estate in the upper district.' },
  ];

  for (let i = 0; i < Math.min(propertyCount, 4); i++) {
    const prop = propertyTypes[i];
    pois.push({
      poiId: genId(),
      name: prop.name,
      type: 'residence',
      district: 'Residential Quarter',
      description: prop.desc,
      available: true,
      price: prop.price
    });
  }

  return pois;
}

// Utility functions
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickDistrict(districts: string[]): string {
  return districts[Math.floor(Math.random() * districts.length)];
}
