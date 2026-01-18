import { useEffect, useState } from 'react';
import axios from 'axios';
import { WorldMap } from './components/WorldMap';

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

function App() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from your Bun Server
    axios.get('http://localhost:3000/locations')
      .then(response => {
        setCities(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error connecting to server:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ margin: 0, padding: 0, fontFamily: 'sans-serif', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.5rem',
          color: '#666'
        }}>
          Loading world data...
        </div>
      ) : (
        <WorldMap cities={cities} />
      )}
    </div>
  );
}

export default App;