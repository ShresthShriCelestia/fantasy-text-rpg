import React, { useState } from 'react';

// Define the shape of a City
interface City {
  _id: string;
  name: string;
  type: string;
  population: number;
  coordinates: { x: number; y: number };
}

interface WorldMapProps {
  cities: City[];
}

export const WorldMap: React.FC<WorldMapProps> = ({ cities }) => {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // 🛠️ CALIBRATION ZONE (Tweaked for your screenshot) 🛠️
  // Since dots are "overshooting" to the right, we need to SHRINK the coordinates.
  const SCALE = 1.0;     // <--- CHANGE THIS. Try 0.8, then 0.6, or 1.5
  const OFFSET_X = 0;    // <--- CHANGE THIS. Moves dots Left (negative) or Right (positive)
  const OFFSET_Y = 0;    // <--- CHANGE THIS. Moves dots Up (negative) or Down (positive)

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100vh', overflow: 'hidden' }}>
      
      {/* LEFT PANEL: The Scrollable Map */}
      <div style={{ 
        position: 'relative', 
        flex: 1,                 
        overflow: 'auto',        
        border: '2px solid #333',
        backgroundColor: '#2a2a2a'
      }}>
        
        {/* Background Image */}
        <img 
          src="/world_map.png" 
          alt="Game World" 
          style={{ display: 'block' }} 
        />

        {/* The Interactive Dots */}
        {cities.map((city) => (
          <div
            key={city._id}
            onClick={() => setSelectedCity(city)}
            style={{
              position: 'absolute',
              // 🧮 THIS IS THE MISSING MATH PART:
              left: `${(city.coordinates.x * SCALE) + OFFSET_X}px`,
              top: `${(city.coordinates.y * SCALE) + OFFSET_Y}px`,
              
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

      {/* RIGHT PANEL: Info Box */}
      <div style={{ 
        width: '350px',
        padding: '20px', 
        backgroundColor: '#f4f4f4', 
        borderLeft: '4px solid #333',
        overflowY: 'auto'
      }}>
        {selectedCity ? (
          <div>
            <h2 style={{ marginTop: 0 }}>🏰 {selectedCity.name}</h2>
            <p><strong>Type:</strong> {selectedCity.type}</p>
            <p><strong>Population:</strong> {selectedCity.population.toLocaleString()}</p>
            <hr />
            <button style={{ 
              width: '100%',
              padding: '12px', 
              backgroundColor: '#333', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '1rem'
            }}>
              Travel Here
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
            <h3>Select a Location</h3>
            <p>Click any red dot on the map to view details.</p>
          </div>
        )}
      </div>

    </div>
  );
};