import React, { useState, useRef } from 'react';

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

interface CityDetailViewProps {
  city: City;
  onBack: () => void;
}

// Generate Watabou city URL
const generateCityURL = (city: City, exportJson = false): string => {
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

  if (exportJson) {
    params.append('export', 'json');
  }

  return `https://watabou.github.io/city-generator/?${params.toString()}`;
};

export const CityDetailView: React.FC<CityDetailViewProps> = ({ city, onBack }) => {
  // All hooks must be called before any early returns
  const [viewMode, setViewMode] = useState<'embedded' | 'interactive'>('embedded');
  const [cityData, setCityData] = useState<any>(null);

  // Debug logging
  console.log('CityDetailView rendered with city:', city);

  const handleExportCity = () => {
    // Open the export URL which will trigger a JSON download
    window.open(generateCityURL(city, true), '_blank');
  };

  const handleImportCity = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      console.log('File content preview:', text.substring(0, 200));

      const jsonData = JSON.parse(text);
      console.log('Parsed JSON data:', jsonData);

      setCityData(jsonData);

      // Save to backend
      const response = await fetch(`http://localhost:3000/city-data/${city._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save city data to server: ${errorText}`);
      }

      console.log('City data imported and saved to server');

      // Switch to interactive view
      setViewMode('interactive');
    } catch (error) {
      console.error('Failed to import city data:', error);
      alert(`Failed to import city data: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease ensure the file is a valid JSON export from the city generator.`);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#2a2a2a'
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px 20px',
        backgroundColor: '#1a1a1a',
        borderBottom: '2px solid #444',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              backgroundColor: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ← Back to World Map
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
            {city.type === 'Capital' ? '👑' : '🏘️'} {city.name}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '5px', backgroundColor: '#333', borderRadius: '6px', padding: '4px' }}>
            <button
              onClick={() => setViewMode('embedded')}
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'embedded' ? '#4CAF50' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🗺️ Generator
            </button>
            <button
              onClick={() => setViewMode('interactive')}
              disabled={!cityData}
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'interactive' ? '#4CAF50' : 'transparent',
                color: cityData ? 'white' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: cityData ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem'
              }}
            >
              🏛️ Interactive
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCity}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            📥 Export JSON
          </button>

          {/* Import Button */}
          <label style={{
            padding: '8px 16px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}>
            📤 Import JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportCity}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {viewMode === 'embedded' ? (
          // Embedded City Generator View
          <iframe
            src={generateCityURL(city)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title={`${city.name} City Generator`}
          />
        ) : (
          // Interactive City View (with imported data)
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {cityData ? (
              <InteractiveCityView cityData={cityData} cityInfo={city} />
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <h2>No City Data Loaded</h2>
                <p>Import a JSON file to view the interactive city map</p>
                <ol style={{ textAlign: 'left', maxWidth: '500px', lineHeight: '1.8' }}>
                  <li>Click "Export JSON" button to download the city data</li>
                  <li>Click "Import JSON" button to load the exported file</li>
                  <li>Explore districts, buildings, and define key locations</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Interactive City View Component
const InteractiveCityView: React.FC<{ cityData: any; cityInfo: City }> = ({ cityData }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'key'>('all');
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [hoveredFeature, setHoveredFeature] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Parse GeoJSON data
  const features = cityData?.features || [];

  // Calculate bounds for viewport
  const calculateBounds = () => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    features.forEach((feature: any) => {
      if (feature.geometry?.coordinates) {
        feature.geometry.coordinates.forEach((ring: any) => {
          ring.forEach((coord: any) => {
            const [x, y] = coord;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          });
        });
      }
    });

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  };

  const bounds = calculateBounds();
  const padding = 50;
  const viewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`;

  // Convert polygon coordinates to SVG path
  const coordinatesToPath = (coordinates: any) => {
    if (!coordinates || !coordinates[0]) return '';
    return coordinates[0].map((coord: any, i: number) => {
      const [x, y] = coord;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ') + ' Z';
  };

  // Get color based on feature type
  const getFeatureColor = (feature: any) => {
    const type = feature.properties?.type || feature.id;

    // Buildings
    if (type === 'building') return '#d4c5b9';
    if (type === 'castle') return '#8b7355';
    if (type === 'temple') return '#9b8b7e';

    // Roads and paths
    if (type === 'road') return '#ffffff';
    if (type === 'path') return '#e8dcc8';

    // Water
    if (type === 'river' || type === 'water') return '#7ea5c4';

    // Walls
    if (type === 'wall') return '#4a4a4a';

    // Default
    return '#c4b5a0';
  };

  const getStrokeColor = (feature: any) => {
    if (feature.properties?.type === 'wall') return '#2a2a2a';
    return '#8b7d6b';
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left Side - City Visualization */}
      <div style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#f4f1e8',
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {/* Render all features */}
          {features.map((feature: any, index: number) => {
            const isHovered = hoveredFeature === feature;
            const isSelected = selectedFeature === feature;

            return (
              <path
                key={index}
                d={coordinatesToPath(feature.geometry?.coordinates)}
                fill={getFeatureColor(feature)}
                stroke={isSelected ? '#ff6b00' : isHovered ? '#ff9933' : getStrokeColor(feature)}
                strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.5}
                opacity={feature.properties?.type === 'building' ? 0.9 : 1}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={() => setHoveredFeature(feature)}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => setSelectedFeature(feature)}
              />
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredFeature && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '10px 15px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '6px',
            fontSize: '0.9rem',
            pointerEvents: 'none',
            zIndex: 1000
          }}>
            <strong>{hoveredFeature.properties?.type || hoveredFeature.id || 'Feature'}</strong>
            {hoveredFeature.properties?.name && <div>Name: {hoveredFeature.properties.name}</div>}
          </div>
        )}
      </div>

      {/* Right Side Panel */}
      <div style={{
        width: '350px',
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        borderLeft: '2px solid #444'
      }}>
        <h3 style={{ marginTop: 0 }}>City Inspector</h3>

        {/* Filter Controls */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px'
        }}>
          <h4 style={{ marginTop: 0, fontSize: '0.95rem' }}>Filter Buildings:</h4>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setFilterMode('all')}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: filterMode === 'all' ? '#4CAF50' : '#444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              All Buildings
            </button>
            <button
              onClick={() => setFilterMode('key')}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: filterMode === 'key' ? '#4CAF50' : '#444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Key Locations
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          padding: '15px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ marginTop: 0, fontSize: '0.95rem' }}>City Statistics:</h4>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
            <p style={{ margin: '5px 0' }}><strong>Total Features:</strong> {features.length || 0}</p>
            <p style={{ margin: '5px 0' }}><strong>Buildings:</strong> {features.filter((f: any) => f.properties?.type === 'building').length}</p>
            <p style={{ margin: '5px 0' }}><strong>Roads:</strong> {features.filter((f: any) => f.properties?.type === 'road').length}</p>
          </div>
        </div>

        {/* Selected Feature Details */}
        {selectedFeature ? (
          <div style={{
            padding: '15px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ marginTop: 0, fontSize: '0.95rem', color: '#4CAF50' }}>Selected Feature</h4>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
              <p style={{ margin: '5px 0' }}><strong>Type:</strong> {selectedFeature.properties?.type || selectedFeature.id || 'Unknown'}</p>
              {selectedFeature.properties?.name && (
                <p style={{ margin: '5px 0' }}><strong>Name:</strong> {selectedFeature.properties.name}</p>
              )}
              {selectedFeature.properties?.ward && (
                <p style={{ margin: '5px 0' }}><strong>Ward:</strong> {selectedFeature.properties.ward}</p>
              )}
            </div>

            {/* Mark as POI button (only for buildings) */}
            {selectedFeature.properties?.type === 'building' && (
              <button style={{
                marginTop: '15px',
                width: '100%',
                padding: '10px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                📍 Mark as Key Location
              </button>
            )}
          </div>
        ) : (
          <div style={{
            padding: '15px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            color: '#999'
          }}>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Click on a building or feature in the map to view details
            </p>
          </div>
        )}

        {/* Instructions */}
        <div style={{
          padding: '15px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#999',
          lineHeight: '1.6'
        }}>
          <h4 style={{ marginTop: 0, fontSize: '0.9rem', color: '#fff' }}>How to use:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Hover over features to highlight them</li>
            <li>Click to select and view details</li>
            <li>Mark buildings as key locations (taverns, guilds, etc.)</li>
            <li>Use filters to show only key locations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
