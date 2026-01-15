import { useEffect, useState } from 'react';
import axios from 'axios';

// Define what a City looks like (matching your Backend)
interface City {
  _id: string;
  name: string;
  type: string;
  population: number;
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
      <h1>🌍 World Dashboard</h1>
      {loading ? (
        <p>Loading world data...</p>
      ) : (
        <div>
          <h3>Known Locations: {cities.length}</h3>
          <ul>
            {cities.slice(0, 10).map(city => (
              <li key={city._id}>
                <strong>{city.name}</strong> ({city.type}) - Pop: {city.population}
              </li>
            ))}
          </ul>
          <p>...and {cities.length - 10} more.</p>
        </div>
      )}
    </div>
  );
}

export default App;