// Watabou MFCG JSON Parser
// Parses the GeoJSON export from Medieval Fantasy City Generator

interface Coordinate {
  x: number;
  y: number;
}

interface Building {
  center: Coordinate;
  polygon: Coordinate[];
  type: 'regular' | 'castle' | 'plaza';
}

interface WatabouData {
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  castles: Building[];
  plazas: Building[];
  buildings: Building[];
  districts: Array<{ name?: string; polygon: Coordinate[] }>;
}

export function parseWatabouJSON(json: any): WatabouData {
  const data: WatabouData = {
    bounds: { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
    castles: [],
    plazas: [],
    buildings: [],
    districts: []
  };

  // Helper to calculate polygon center
  function getPolygonCenter(coords: number[][]): Coordinate {
    let sumX = 0, sumY = 0;
    for (const point of coords) {
      sumX += point[0];
      sumY += point[1];
      // Update bounds
      data.bounds.minX = Math.min(data.bounds.minX, point[0]);
      data.bounds.maxX = Math.max(data.bounds.maxX, point[0]);
      data.bounds.minY = Math.min(data.bounds.minY, point[1]);
      data.bounds.maxY = Math.max(data.bounds.maxY, point[1]);
    }
    return {
      x: sumX / coords.length,
      y: sumY / coords.length
    };
  }

  // Helper to convert coordinates array to Coordinate objects
  function convertCoords(coords: number[][]): Coordinate[] {
    return coords.map(c => ({ x: c[0], y: c[1] }));
  }

  // Parse features
  if (json.features) {
    for (const feature of json.features) {
      // Prisms = Castle towers (MultiPolygon)
      if (feature.id === 'prisms' && feature.type === 'MultiPolygon' && feature.coordinates) {
        for (const multiPoly of feature.coordinates) {
          // Each multiPoly is an array of polygons
          for (const polygon of multiPoly) {
            if (polygon && polygon.length > 0) {
              const coords = polygon;
              data.castles.push({
                center: getPolygonCenter(coords),
                polygon: convertCoords(coords),
                type: 'castle'
              });
            }
          }
        }
      }

      // Squares = Town plazas (MultiPolygon)
      if (feature.id === 'squares' && feature.type === 'MultiPolygon' && feature.coordinates) {
        for (const multiPoly of feature.coordinates) {
          for (const polygon of multiPoly) {
            if (polygon && polygon.length > 0) {
              const coords = polygon;
              data.plazas.push({
                center: getPolygonCenter(coords),
                polygon: convertCoords(coords),
                type: 'plaza'
              });
            }
          }
        }
      }

      // Regular buildings (MultiPolygon)
      if (feature.id === 'buildings' && feature.type === 'MultiPolygon' && feature.coordinates) {
        for (const multiPoly of feature.coordinates) {
          for (const polygon of multiPoly) {
            if (polygon && polygon.length > 0) {
              const coords = polygon;
              data.buildings.push({
                center: getPolygonCenter(coords),
                polygon: convertCoords(coords),
                type: 'regular'
              });
            }
          }
        }
      }

      // Districts (for future use - district-based placement)
      if (feature.id === 'districts' && feature.geometries) {
        for (const geom of feature.geometries) {
          if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates[0]) {
            data.districts.push({
              name: geom.properties?.name,
              polygon: convertCoords(geom.coordinates[0])
            });
          }
        }
      }
    }
  }

  return data;
}

// Convert world coordinates to percentage (0-100) for overlay positioning
export function worldToPercentage(
  worldCoord: Coordinate,
  bounds: WatabouData['bounds']
): Coordinate {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  return {
    x: ((worldCoord.x - bounds.minX) / width) * 100,
    y: ((worldCoord.y - bounds.minY) / height) * 100
  };
}

// Assign POIs to buildings based on type
export function assignPOIsToBuildings(
  pois: any[],
  watabouData: WatabouData
): any[] {
  const assigned = pois.map(poi => ({ ...poi }));

  // 1. Assign castles to prism buildings
  const castlePOIs = assigned.filter(p => p.type === 'castle');
  castlePOIs.forEach((poi, index) => {
    if (watabouData.castles[index]) {
      const center = watabouData.castles[index].center;
      const percentCoord = worldToPercentage(center, watabouData.bounds);
      console.log(`Castle "${poi.name}" positioned at:`, {
        worldCoords: center,
        percentCoords: percentCoord,
        bounds: watabouData.bounds
      });
      poi.x = percentCoord.x;
      poi.y = percentCoord.y;
    }
  });

  // 2. Assign plazas to square buildings
  const plazaPOIs = assigned.filter(p => p.type === 'plaza');
  plazaPOIs.forEach((poi, index) => {
    if (watabouData.plazas[index]) {
      const center = watabouData.plazas[index].center;
      const percentCoord = worldToPercentage(center, watabouData.bounds);
      poi.x = percentCoord.x;
      poi.y = percentCoord.y;
    }
  });

  // 3. Track used buildings to avoid duplicates
  const usedBuildings = new Set<number>();

  // Helper to mark building as used
  const markUsed = (buildings: Building[], index: number) => {
    const buildingIndex = watabouData.buildings.indexOf(buildings[index]);
    if (buildingIndex !== -1) usedBuildings.add(buildingIndex);
  };

  // 3. Assign barracks near walls (top 10% of map)
  const barracksPOIs = assigned.filter(p => p.type === 'barracks');
  const topBuildings = watabouData.buildings
    .filter(b => b.center.y < (watabouData.bounds.minY + (watabouData.bounds.maxY - watabouData.bounds.minY) * 0.3))
    .sort((a, b) => a.center.y - b.center.y);

  barracksPOIs.forEach((poi, index) => {
    if (topBuildings[index]) {
      const center = topBuildings[index].center;
      const percentCoord = worldToPercentage(center, watabouData.bounds);
      poi.x = percentCoord.x;
      poi.y = percentCoord.y;
      markUsed(topBuildings, index);
    }
  });

  // 4. Calculate center coordinates (used for temple and residence placement)
  const centerX = (watabouData.bounds.minX + watabouData.bounds.maxX) / 2;
  const centerY = (watabouData.bounds.minY + watabouData.bounds.maxY) / 2;

  // Assign temples to buildings near center
  const templePOIs = assigned.filter(p => p.type === 'temple');

  const centralBuildings = watabouData.buildings
    .map(b => ({
      ...b,
      distToCenter: Math.sqrt(Math.pow(b.center.x - centerX, 2) + Math.pow(b.center.y - centerY, 2))
    }))
    .sort((a, b) => a.distToCenter - b.distToCenter)
    .slice(10, 50); // Skip the very center (that's the castle)

  templePOIs.forEach((poi, index) => {
    if (centralBuildings[index * 5]) { // Space them out
      const center = centralBuildings[index * 5].center;
      const percentCoord = worldToPercentage(center, watabouData.bounds);
      poi.x = percentCoord.x;
      poi.y = percentCoord.y;
      markUsed(centralBuildings as any, index * 5);
    }
  });

  // 5. Assign ports to buildings near bottom (water is typically at bottom)
  const portPOIs = assigned.filter(p => p.type === 'port');
  const bottomBuildings = watabouData.buildings
    .filter(b => b.center.y > (watabouData.bounds.minY + (watabouData.bounds.maxY - watabouData.bounds.minY) * 0.7))
    .sort((a, b) => b.center.y - a.center.y);

  portPOIs.forEach((poi, index) => {
    if (bottomBuildings[index]) {
      const center = bottomBuildings[index].center;
      const percentCoord = worldToPercentage(center, watabouData.bounds);
      poi.x = percentCoord.x;
      poi.y = percentCoord.y;
    }
  });

  // 6. Assign taverns, shops, guilds to random buildings (exclude already used ones)
  const randomPOIs = assigned.filter(p =>
    ['tavern', 'shop', 'guild'].includes(p.type) && (!p.x || !p.y)
  );

  // Get unused buildings, excluding those too far from center (likely outside walls)
  const maxRadius = Math.min(
    Math.abs(watabouData.bounds.maxX - watabouData.bounds.minX),
    Math.abs(watabouData.bounds.maxY - watabouData.bounds.minY)
  ) * 0.4; // 40% of map size

  const availableBuildings = watabouData.buildings
    .filter((b, idx) => {
      if (usedBuildings.has(idx)) return false;
      const distToCenter = Math.sqrt(
        Math.pow(b.center.x - centerX, 2) + Math.pow(b.center.y - centerY, 2)
      );
      return distToCenter < maxRadius; // Only buildings within reasonable distance from center
    })
    .sort(() => Math.random() - 0.5); // Shuffle

  randomPOIs.forEach((poi, index) => {
    if (availableBuildings[index]) {
      const center = availableBuildings[index].center;
      const percentCoord = worldToPercentage(center, watabouData.bounds);
      poi.x = percentCoord.x;
      poi.y = percentCoord.y;
      const buildingIdx = watabouData.buildings.indexOf(availableBuildings[index]);
      if (buildingIdx !== -1) usedBuildings.add(buildingIdx);
    }
  });

  // 7. Assign residences to remaining unused buildings (avoid castle area)
  const residencePOIs = assigned.filter(p => p.type === 'residence' && (!p.x || !p.y));

  const residentialBuildings = watabouData.buildings
    .filter((b, idx) => {
      if (usedBuildings.has(idx)) return false;
      // Avoid castle area (center 20% of map)
      const distToCenter = Math.sqrt(
        Math.pow(b.center.x - centerX, 2) + Math.pow(b.center.y - centerY, 2)
      );
      const minRadius = maxRadius * 0.3; // At least 30% away from center
      return distToCenter > minRadius && distToCenter < maxRadius;
    })
    .sort(() => Math.random() - 0.5);

  residencePOIs.forEach((poi, index) => {
    if (residentialBuildings[index]) {
      const center = residentialBuildings[index].center;
      const percentCoord = worldToPercentage(center, watabouData.bounds);
      poi.x = percentCoord.x;
      poi.y = percentCoord.y;
    }
  });

  return assigned;
}
