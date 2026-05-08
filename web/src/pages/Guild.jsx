import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const API = process.env.REACT_APP_API;

const SECTIONS = [
  { id: "general",      label: "General",      icon: "⚙️",  available: true  },
  { id: "bienvenida",   label: "Bienvenida",   icon: "👋",  available: false },
  { id: "moderacion",   label: "Moderación",   icon: "🛡️",  available: false },
  { id: "musica",       label: "Música",       icon: "🎵",  available: false },
  { id: "niveles",      label: "Niveles",      icon: "⭐",  available: false },
  { id: "memes",        label: "Memes",        icon: "😂",  available: false },
  { id: "anime",        label: "Anime",        icon: "🌸",  available: false },
  { id: "economia",     label: "Economía",     icon: "💰",  available: false },
];

function ComingSoon({ label, icon }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 320,
      gap: 16,
      textAlign: "center"
    }}>
      <div style={{
        fontSize: 56,
        lineHeight: 1,
        filter: "grayscale(0.3)"
      }}>{icon}</div>
      <h2 style={{
        fontFamily: "var(--font-display, 'Rajdhani', sans-serif)",
        fontSize: 26,
        fontWeight: 700,
        color: "var(--text-primary, #e8eaf0)",
        margin: 0
      }}>{label}</h2>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px",
        background: "rgba(255,0,51,0.1)",
        border: "1px solid rgba(255,0,51,0.25)",
        borderRadius: 20
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#ff0033",
          display: "inline-block",
          animation: "pulse 1.5s ease-in-out infinite"
        }}/>
        <span style={{ color: "#ff0033", fontSize: 13, fontWeight: 500 }}>
          Próximamente
        </span>
      </div>
      <p style={{ color: "var(--text-secondary, #6b7280)", fontSize: 14, maxWidth: 300, margin: 0 }}>
        Estamos trabajando en esta sección. Pronto podrás configurar {label.toLowerCase()} desde aquí.
      </p>
    </div>
  );
}

function SectionGeneral({ config }) {
  return (
    <div>
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
          {SECTIONS.filter(s => s.id !== "general").map(s => (
            <div className="card" key={s.id}>
              <p style={{ fontSize: 28, margin: "0 0 8px" }}>{s.icon}</p>
              <p className="guild-name">{s.label}</p>
              {s.available ? (
                <span className="badge badge-on">Disponible</span>
              ) : (
                <span className="badge badge-off">Próximamente</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Guild({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  useEffect(() => {
    if (!API || !id) {
      setError(true);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("discord_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    console.log("🔍 Cargando configuración del servidor:", id);

    fetch(`${API}/guild/${id}`, { credentials: "include", headers })
      .then(res => {
        console.log("📊 STATUS guild:", res.status);
        if (!res.ok) {
          if (res.status === 401) navigate("/login");
          throw new Error("Error al cargar");
        }
        return res.json();
      })
      .then(data => {
        console.log("✅ Config cargada:", data);
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Error guild:", err);
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

  const activeData = SECTIONS.find(s => s.id === activeSection);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          transition: background 0.15s, color 0.15s;
          position: relative;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-primary, #e8eaf0);
        }
        .nav-item.active {
          background: rgba(255,0,51,0.1);
          color: #ff0033;
        }
        .nav-item .soon-badge {
          margin-left: auto;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          background: rgba(255,255,255,0.07);
          color: var(--text-secondary, #6b7280);
          font-weight: 400;
        }
      `}</style>

      <div className="app">
        <aside className="sidebar" style={{ width: 220 }}>
          <div className="sidebar-brand">VEIDO</div>

          <button
            className="btn-logout"
            onClick={() => navigate("/dashboard")}
            style={{ marginBottom: 20 }}
          >
            ← Volver
          </button>

          <span className="nav-label" style={{ padding: "0 8px", marginBottom: 6, display: "block" }}>
            Configuración
          </span>

          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`nav-item ${activeSection === s.id ? "active" : ""}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              {s.label}
              {!s.available && (
                <span className="soon-badge">pronto</span>
              )}
            </button>
          ))}

          {user && (
            <div className="sidebar-user" style={{ marginTop: "auto" }}>
              {user.avatar && (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`}
                  alt={user.username}
                  style={{ width: 32, height: 32, borderRadius: "50%", marginRight: 8 }}
                />
              )}
              <span className="user-name" style={{ fontSize: 13 }}>
                {user.global_name || user.username}
              </span>
            </div>
          )}
        </aside>

        <main className="main">
          {activeSection === "general" ? (
            <SectionGeneral config={config} />
          ) : (
            <ComingSoon label={activeData.label} icon={activeData.icon} />
          )}
        </main>
      </div>
    </>
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