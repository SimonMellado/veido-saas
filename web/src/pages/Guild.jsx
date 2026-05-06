import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const API = process.env.REACT_APP_API;

function Guild({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!API || !id) {
      console.error("❌ API o ID no definidos");
      setError(true);
      setLoading(false);
      return;
    }

    console.log("🔍 Cargando configuración del servidor:", id);

    fetch(`${API}/guild/${id}`, { credentials: "include" })
      .then(res => {
        console.log("📊 STATUS:", res.status);
        
        if (!res.ok) {
          if (res.status === 401) {
            console.log("❌ No autenticado");
            navigate("/login");
          }
          throw new Error("Error al cargar");
        }
        return res.json();
      })
      .then(data => {
        console.log("✅ Configuración cargada:", data);
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Error al cargar guild:", err);
        setError(true);
        setLoading(false);
      });
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="app">
        <div className="main" style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          minHeight: "100vh"
        }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="app">
        <div className="main">
          <div className="empty-state">
            <p>No se pudo cargar la configuración del servidor.</p>
            <button 
              className="btn-discord" 
              onClick={() => navigate("/dashboard")} 
              style={{ marginTop: 16 }}
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">VEIDO</div>
        
        {user && (
          <div className="sidebar-user">
            {user.avatar && (
              <img 
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`}
                alt={user.username}
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: "50%", 
                  marginRight: 8 
                }}
              />
            )}
            <span className="user-name" style={{ fontSize: 14 }}>
              {user.global_name || user.username}
            </span>
          </div>
        )}
        
        <button
          className="btn-logout"
          onClick={() => {
            console.log("🔙 Volviendo al dashboard");
            navigate("/dashboard");
          }}
          style={{ marginTop: 12 }}
        >
          ← Volver
        </button>
      </aside>

      <main className="main">
        <div className="page-header">
          {config.icon && (
            <img 
              src={`https://cdn.discordapp.com/icons/${config.guildId}/${config.icon}.png?size=256`}
              alt={config.name}
              style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 16, 
                marginBottom: 16,
                border: "3px solid #5865F2"
              }}
            />
          )}
          <h1>{config.name}</h1>
          <p className="page-subtitle">ID: {config.guildId}</p>
        </div>

        <div className="panel">
          <h2>Módulos</h2>
          <div className="grid">
            <div className="card">
              <p className="guild-name">Niveles</p>
              <span className={`badge ${config.modules?.levels ? "badge-on" : "badge-off"}`}>
                {config.modules?.levels ? "Activado" : "Desactivado"}
              </span>
            </div>
            <div className="card">
              <p className="guild-name">Bienvenida</p>
              <span className={`badge ${config.modules?.welcome ? "badge-on" : "badge-off"}`}>
                {config.modules?.welcome ? "Activado" : "Desactivado"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

Guild.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    global_name: PropTypes.string
  }).isRequired
};

export default Guild;