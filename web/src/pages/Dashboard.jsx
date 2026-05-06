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
      .then(res => res.json())
      .then(data => {
        setGuilds(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setGuilds([]);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    fetch(`${API}/auth/logout`, { credentials: "include" })
      .finally(() => window.location.href = "/login");
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">VEIDO</div>
        <nav className="sidebar-nav">
          <span className="nav-label">Servidores</span>
        </nav>
        <div className="sidebar-user">
          <img
            className="user-avatar"
            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
            alt={user.username}
            onError={e => { e.target.style.display = "none"; }}
          />
          <span className="user-name">{user.username}</span>
          <button className="btn-logout" onClick={handleLogout}>Salir</button>
        </div>
      </aside>

      <main className="main">
        <div className="page-header">
          <h1>Mis Servidores</h1>
          <p className="page-subtitle">Selecciona un servidor para configurarlo</p>
        </div>

        {loading ? (
          <div className="loading-spinner" />
        ) : guilds.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron servidores donde seas administrador.</p>
          </div>
        ) : (
          <div className="grid">
            {guilds.map(g => (
              <div
                key={g.id}
                className="card"
                onClick={() => navigate(`/guild/${g.id}`)}
                style={{ cursor: "pointer" }}
              >
                {g.icon ? (
                  <img
                    className="guild-icon"
                    src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
                    alt={g.name}
                  />
                ) : (
                  <div className="guild-icon-placeholder">
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="guild-name">{g.name}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
