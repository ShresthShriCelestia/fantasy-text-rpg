import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LocationsView } from './LocationsView';

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
    // Request detailed JSON with all features including individual buildings
    params.append('format', 'json');
  }

  return `https://watabou.github.io/city-generator/?${params.toString()}`;
};

interface POI {
  poiId: string;
  name: string;
  type: string;
  district?: string;
  description: string;
  available: boolean;
  price?: number;
  owner?: string;
}

export const CityDetailView: React.FC<CityDetailViewProps> = ({ city, onBack }) => {
  // All hooks must be called before any early returns
  const [viewMode, setViewMode] = useState<'embedded' | 'interactive'>('embedded');
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);

  const generatePOIs = useCallback(async () => {
    console.log('Generating POIs for city:', city._id, city.name);
    try {
      const url = `http://localhost:3000/locations/${city._id}/generate-pois`;
      console.log('POST request to:', url);
      const response = await axios.post(url);
      console.log('Generate POIs response:', response.data);

      if (response.data.success) {
        setPois(response.data.pois);
        alert(`Generated ${response.data.count} locations for ${city.name}!`);
      } else {
        console.error('Generation failed:', response.data.error);
        alert(`Failed to generate locations: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating POIs:', error);
      alert('Failed to generate locations: ' + (error as any).message);
    }
  }, [city._id, city.name]);

  const loadPOIs = useCallback(async () => {
    console.log('Loading POIs for city:', city._id, city.name);
    setLoading(true);
    try {
      const url = `http://localhost:3000/locations/${city._id}/pois`;
      console.log('GET request to:', url);
      const response = await axios.get(url);
      console.log('Load POIs response:', response.data);
      setPois(response.data.pois || []);
    } catch (error) {
      console.error('Error loading POIs:', error);
      setPois([]);
    } finally {
      setLoading(false);
    }
  }, [city._id, city.name]);

  // Load or generate POIs when switching to interactive mode
  useEffect(() => {
    if (viewMode === 'interactive') {
      loadPOIs();
    }
  }, [viewMode, loadPOIs]);

  const purchaseProperty = async (poi: POI) => {
    const playerName = prompt('Enter your character name:');
    if (!playerName) return;

    try {
      const response = await axios.post(
        `http://localhost:3000/locations/${city._id}/pois/${poi.poiId}/purchase`,
        { playerName }
      );

      if (response.data.success) {
        alert(response.data.message);
        // Reload POIs to reflect the purchase
        loadPOIs();
      } else {
        alert(response.data.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase property');
    }
  };

  const uploadWatabouJSON = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const json = JSON.parse(text);

        console.log('Uploading Watabou JSON...');
        const response = await axios.post(
          `http://localhost:3000/locations/${city._id}/upload-watabou`,
          json
        );

        if (response.data.success) {
          alert(`Success! Positioned ${response.data.stats.poisUpdated} POIs based on ${response.data.stats.buildings} buildings`);
          // Reload POIs to show new positions
          loadPOIs();
        } else {
          alert(`Failed: ${response.data.error}`);
        }
      } catch (error) {
        console.error('Error uploading Watabou JSON:', error);
        alert('Failed to upload JSON file');
      }
    };
    input.click();
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
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'interactive' ? '#4CAF50' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🏛️ Locations
            </button>
          </div>
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
          // POI List View
          <LocationsView
            pois={pois}
            loading={loading}
            cityName={city.name}
            cityMapUrl={generateCityURL(city)}
            selectedPOI={selectedPOI}
            onSelectPOI={setSelectedPOI}
            onPurchaseProperty={purchaseProperty}
            onRegenerate={generatePOIs}
            onUploadWatabou={uploadWatabouJSON}
          />
        )}
      </div>
    </div>
  );
};
