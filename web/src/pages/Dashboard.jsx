import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API;

fetch(`${API}/guilds`, {
  credentials: "include"
});

function Dashboard() {
  const [guilds, setGuilds] = useState([]);

  useEffect(() => {
    fetch(`${API}/guilds`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(setGuilds)
      .catch(() => setGuilds([]));
  }, []);

  return (
    <div>
      <h1>Mis Servidores</h1>

      {guilds.map(g => (
        <div key={g.id}>
          <p>{g.name}</p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;