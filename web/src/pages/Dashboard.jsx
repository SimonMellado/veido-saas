import { useEffect, useState } from "react";

function Dashboard() {
  const [guilds, setGuilds] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/guilds")
      .then(res => res.json())
      .then(setGuilds);
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