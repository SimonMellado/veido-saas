import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const API = process.env.REACT_APP_API;

function Dashboard({ user, setUser }) {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!API) {
      console.error("❌ REACT_APP_API no definida");
      setLoading(false);
      return;
    }

    console.log("🔍 Cargando servidores...");
    
    fetch(`${API}/guilds`, { credentials: "include" })
      .then(res => {
        console.log("📊 STATUS:", res.status);
        
        if (res.status === 401) {
          console.log("❌ No autenticado, redirigiendo al login...");
          setUser(null);
          navigate("/login");
          return [];
        }
        
        return res.json();
      })
      .then(data => {
        console.log("✅ GUILDS recibidos:", data);
        setGuilds(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Error al cargar guilds:", err);
        setGuilds([]);
        setLoading(false);
      });
  }, [API, navigate, setUser]);

  const handleLogout = async () => {
    try {
      console.log("🚪 Cerrando sesión...");
      await fetch(`${API}/auth/logout`, { credentials: "include" });
      console.log("✅ Sesión cerrada");
      setUser(null);
    } catch (err) {
      console.error("❌ Error al cerrar sesión:", err);
    } finally {
      window.location.href = "/login";
    }
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
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: "50%", 
                marginRight: 8,
                border: "2px solid #5865F2"
              }}
            />
          )}
          <span className="user-name">{user.global_name || user.username}</span>
          <button className="btn-logout" onClick={handleLogout}>Salir</button>
        </div>
      </aside>

      <main className="main">
        <h1>Mis Servidores</h1>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <div className="loading-spinner" />
          </div>
        ) : guilds.length === 0 ? (
          <div className="empty-state">
            <p>No tienes servidores donde seas administrador 😢</p>
          </div>
        ) : (
          <div className="grid">
            {guilds.map(g => (
              <div 
                key={g.id} 
                className="card" 
                onClick={() => {
                  console.log("🖱️ Navegando a guild:", g.name);
                  navigate(`/guild/${g.id}`);
                }}
                style={{ cursor: "pointer" }}
              >
                {g.icon ? (
                  <img 
                    src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`}
                    alt={g.name}
                    style={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: 8, 
                      marginBottom: 12 
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 8, 
                    backgroundColor: "#5865F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: 12
                  }}>
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