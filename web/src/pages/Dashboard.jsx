import { useEffect, useState } from "react";

const API =
  process.env.REACT_APP_API ||
  "https://veido-saas.onrender.com";

function Dashboard() {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/guilds`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setGuilds(data);
        setLoading(false);
      })
      .catch(() => {
        setGuilds([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h2>Cargando servidores...</h2>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Mis Servidores</h1>

      {guilds.length === 0 ? (
        <p>No tienes servidores disponibles</p>
      ) : (
        guilds.map(g => (
          <div
            key={g.id}
            style={{
              padding: 10,
              marginBottom: 10,
              border: "1px solid #ccc",
              borderRadius: 8
            }}
          >
            <p>{g.name}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Dashboard;