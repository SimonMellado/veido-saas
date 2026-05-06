import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API;

function Dashboard({ user }) {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!API) return;

    fetch(`${API}/guilds`, { credentials: "include" })
      .then(res => {
        console.log("STATUS:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("GUILDS:", data);
        setGuilds(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setGuilds([]);
        setLoading(false);
      });
  }, [API]);

  const handleLogout = () => {
    fetch(`${API}/auth/logout`, { credentials: "include" })
      .finally(() => window.location.href = "/login");
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">VEIDO</div>

        <div className="sidebar-user">
          <span className="user-name">{user.username}</span>
          <button className="btn-logout" onClick={handleLogout}>Salir</button>
        </div>
      </aside>

      <main className="main">
        <h1>Mis Servidores</h1>

        {loading ? (
          <div>Cargando...</div>
        ) : guilds.length === 0 ? (
          <div>No tienes servidores admin 😢</div>
        ) : (
          <div className="grid">
            {guilds.map(g => (
              <div key={g.id} onClick={() => navigate(`/guild/${g.id}`)}>
                {g.name}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;