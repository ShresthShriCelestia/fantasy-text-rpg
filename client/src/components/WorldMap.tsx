import React, { useState, useRef, useEffect } from 'react';

// Define the shape of a City
interface City {
  _id: string;
  name: string;
  type: string;
  population: number;
  coordinates: { x: number; y: number };
  cityType?: string;
  citadel?: number;
  plaza?: number;
  walls?: number;
  shantytown?: number;
  temple?: number;
  port?: string;
  seed?: number;
}

// Generate Watabou city URL
const generateCityURL = (city: City): string => {
  // Size formula: approximately sqrt(population/15) to match Azgaar's sizing
  // For pop 29245, this gives ~44, which is close to the 47 we see
  const size = Math.min(Math.max(Math.floor(Math.sqrt(city.population / 15)), 10), 60);
  const seed = city.seed || Date.now();
  const coast = city.port === "1" ? 1 : 0;
  const river = city.cityType === "River" ? 1 : 0;

  const params = new URLSearchParams({
    size: size.toString(),
    seed: seed.toString(),
    name: city.name,
    population: city.population.toString(),
    citadel: (city.citadel || 0).toString(),
    urban_castle: (city.citadel || 0).toString(),
    plaza: (city.plaza || 0).toString(),
    temple: (city.temple || 0).toString(),
    walls: (city.walls || 0).toString(),
    shantytown: (city.shantytown || 0).toString(),
    coast: coast.toString(),
    river: river.toString(),
    greens: "0",
    hub: "1"
  });

  return `https://watabou.github.io/city-generator/?${params.toString()}`;
};

interface WorldMapProps {
  cities: City[];
}

export const WorldMap: React.FC<WorldMapProps> = ({ cities }) => {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  // Debug logging
  useEffect(() => {
    if (selectedCity) {
      console.log('Selected city:', selectedCity);
    }
  }, [selectedCity]);

  // Original map dimensions from the map_data.json
  const ORIGINAL_WIDTH = 1690;
  const ORIGINAL_HEIGHT = 1053;

  useEffect(() => {
    const updateScale = () => {
      if (imgRef.current) {
        const actualWidth = imgRef.current.offsetWidth;
        const newScale = actualWidth / ORIGINAL_WIDTH;
        setScale(newScale);
      }
    };

    // Update scale when image loads
    if (imgRef.current) {
      imgRef.current.addEventListener('load', updateScale);
    }

    // Update scale on window resize
    window.addEventListener('resize', updateScale);

    // Initial scale calculation
    updateScale();

    return () => {
      window.removeEventListener('resize', updateScale);
      if (imgRef.current) {
        imgRef.current.removeEventListener('load', updateScale);
      }
    };
  }, [])

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'auto',
      backgroundColor: '#2a2a2a'
    }}>

      {/* Container that wraps both image and dots */}
      <div style={{ position: 'relative', display: 'inline-block', minWidth: '100%', minHeight: '100%' }}>
        {/* Background Image */}
        <img
          ref={imgRef}
          src="/world_map.png"
          alt="Game World"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />

        {/* The Interactive Dots */}
        {cities.map((city) => (
          <div
            key={city._id}
            onClick={() => setSelectedCity(city)}
            style={{
              position: 'absolute',
              left: `${city.coordinates.x * scale}px`,
              top: `${city.coordinates.y * scale}px`,
              width: '10px',
              height: '10px',
              backgroundColor: city.type === 'Capital' ? '#ffd700' : '#ff4444',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              border: '2px solid white',
              zIndex: 10,
            }}
            title={city.name}
          />
        ))}
      </div>

      {/* FLOATING INFO PANEL */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '350px',
        maxHeight: 'calc(100vh - 40px)',
        padding: '20px',
        backgroundColor: 'rgba(244, 244, 244, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        overflowY: 'auto',
        zIndex: 100
      }}>
        {selectedCity ? (
          <div>
            <h2 style={{ marginTop: 0, fontSize: '1.5rem', marginBottom: '15px' }}>
              {selectedCity.type === 'Capital' ? '👑' : '🏘️'} {selectedCity.name}
            </h2>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '8px 0' }}><strong>Type:</strong> {selectedCity.type}</p>
              <p style={{ margin: '8px 0' }}><strong>Settlement:</strong> {selectedCity.cityType || 'Inland'}</p>
              <p style={{ margin: '8px 0' }}><strong>Population:</strong> {selectedCity.population.toLocaleString()}</p>
            </div>

            {/* City Features */}
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '0.9rem' }}>City Features:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.85rem' }}>
                <span>{selectedCity.citadel ? '✅' : '❌'} Citadel</span>
                <span>{selectedCity.walls ? '✅' : '❌'} Walls</span>
                <span>{selectedCity.plaza ? '✅' : '❌'} Plaza</span>
                <span>{selectedCity.temple ? '✅' : '❌'} Temple</span>
                <span>{selectedCity.port === "1" ? '✅' : '❌'} Port</span>
                <span>{selectedCity.shantytown ? '✅' : '❌'} Shantytown</span>
              </div>
            </div>

            <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #ccc' }} />

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => window.open(generateCityURL(selectedCity), '_blank')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  borderRadius: '6px',
                  fontWeight: 'bold'
                }}>
                🗺️ View City Map
              </button>
              <button style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                borderRadius: '6px'
              }}>
                ➡️ Travel Here
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ marginTop: 0, fontSize: '1.5rem', marginBottom: '20px' }}>🌍 The Atlas RPG</h2>
            <div style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Select a Location</h3>
              <p>Click any dot on the map to view details.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '20px' }}>
                <span style={{ color: '#ffd700' }}>●</span> Capital Cities<br/>
                <span style={{ color: '#ff4444' }}>●</span> Towns
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};