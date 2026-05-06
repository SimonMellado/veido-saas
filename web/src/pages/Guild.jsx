import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API;

function Guild() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!API || !id) return;

    // ✅ FIX: fetch dentro del componente, con el id correcto
    fetch(`${API}/guild/${id}`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Error al cargar");
        return res.json();
      })
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="app">
        <div className="main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            <button className="btn-discord" onClick={() => navigate("/dashboard")} style={{ marginTop: 16 }}>
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
        <button
          className="btn-logout"
          onClick={() => navigate("/dashboard")}
          style={{ marginTop: 12 }}
        >
          ← Volver
        </button>
      </aside>

      <main className="main">
        <div className="page-header">
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

export default Guild;
