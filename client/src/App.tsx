import { useEffect, useState } from 'react';
import axios from 'axios';
import { WorldMap } from './components/WorldMap';

interface City {
  _id: string;
  name: string;
  type: string;
  population: number;
  coordinates: { x: number; y: number };
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🌍 The Atlas RPG</h1>
      {loading ? (
        <p>Loading world data...</p>
      ) : (
        <WorldMap cities={cities} />
      )}
    </div>
  );
}

export default App;