import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const API = process.env.REACT_APP_API;

function getHeaders() {
  const token = localStorage.getItem("discord_token");
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function Dashboard({ user, setUser }) {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadGuilds = useCallback(async () => {
    if (!API) { setLoading(false); return; }

    try {
      const res = await fetch(`${API}/guilds`, {
        credentials: "include",
        headers: getHeaders()
      });

      if (res.status === 401) { setUser(null); navigate("/login"); return; }

      const data = await res.json();
      setGuilds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error al cargar guilds:", err);
      setGuilds([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, setUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadGuilds(); }, [loadGuilds]);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { credentials: "include" });
      localStorage.removeItem("veido_user");
      localStorage.removeItem("discord_token");
      setUser(null);
    } catch {}
    finally { window.location.href = "/login"; }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">VEIDO</div>
        <div className="sidebar-user">
          {user.avatar && (
            <img
              src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`}
              alt={user.username}
              style={{ width:40, height:40, borderRadius:"50%", marginRight:8, border:"2px solid #5865F2" }}
            />
          )}
          <span className="user-name">{user.global_name || user.username}</span>
          <button className="btn-logout" onClick={handleLogout}>Salir</button>
        </div>
      </aside>

      <main className="main">
        <div className="page-header">
          <h1>Mis Servidores</h1>
          <p className="page-subtitle">Selecciona un servidor para configurarlo</p>
        </div>

        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"40px" }}>
            <div className="loading-spinner" />
          </div>
        ) : guilds.length === 0 ? (
          <div className="empty-state">
            <p>No tienes servidores donde seas administrador 😢</p>
            <p style={{ fontSize:13, color:"var(--text-secondary,#6b7280)", marginTop:8 }}>
              Asegúrate de que el bot esté en el servidor y tengas permisos de administrador.
            </p>
          </div>
        ) : (
          <div className="grid">
            {guilds.map(g => (
              <div
                key={g.id}
                className="card"
                onClick={() => navigate(`/guild/${g.id}`)}
                style={{ cursor:"pointer" }}
              >
                {g.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`}
                    alt={g.name}
                    className="guild-icon"
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

Dashboard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    global_name: PropTypes.string
  }).isRequired,
  setUser: PropTypes.func.isRequired
};

export default Dashboard;