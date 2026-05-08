import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const API = process.env.REACT_APP_API;

const SECTIONS = [
  { id: "general",    label: "General",    icon: "⚙️", available: true  },
  { id: "bienvenida", label: "Bienvenida", icon: "👋", available: true  },
  { id: "moderacion", label: "Moderación", icon: "🛡️", available: false },
  { id: "musica",     label: "Música",     icon: "🎵", available: false },
  { id: "niveles",    label: "Niveles",    icon: "⭐", available: false },
  { id: "memes",      label: "Memes",      icon: "😂", available: false },
  { id: "anime",      label: "Anime",      icon: "🌸", available: false },
  { id: "economia",   label: "Economía",   icon: "💰", available: false },
];

const VARIABLES = [
  { var: "{user}",        desc: "Mención del usuario" },
  { var: "{username}",    desc: "Nombre de usuario" },
  { var: "{displayname}", desc: "Nombre en el servidor" },
  { var: "{server}",      desc: "Nombre del servidor" },
  { var: "{membercount}", desc: "Total de miembros" },
  { var: "{position}",    desc: "Posición del miembro" },
  { var: "{accountage}",  desc: "Antigüedad de la cuenta" },
];

const DEFAULT_WELCOME = {
  enabled: false,
  channelId: null,
  message: "¡Bienvenido/a {user} a {server}! 🎉 Eres el miembro #{membercount}.",
  backgroundUrl: null,
  useAvatar: true,
  embedColor: "#ff0033"
};

const DEFAULT_FAREWELL = {
  enabled: false,
  channelId: null,
  message: "👋 {username} ha abandonado {server}. Nos quedamos con {membercount} miembros.",
  backgroundUrl: null,
  useAvatar: true,
  embedColor: "#5865F2"
};

function ComingSoon({ label, icon }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320, gap:16, textAlign:"center" }}>
      <div style={{ fontSize:56, lineHeight:1 }}>{icon}</div>
      <h2 style={{ fontFamily:"var(--font-display,'Rajdhani',sans-serif)", fontSize:26, fontWeight:700, color:"var(--text-primary,#e8eaf0)", margin:0 }}>{label}</h2>
      <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 18px", background:"rgba(255,0,51,0.1)", border:"1px solid rgba(255,0,51,0.25)", borderRadius:20 }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:"#ff0033", display:"inline-block", animation:"pulse 1.5s ease-in-out infinite" }}/>
        <span style={{ color:"#ff0033", fontSize:13, fontWeight:500 }}>Próximamente</span>
      </div>
      <p style={{ color:"var(--text-secondary,#6b7280)", fontSize:14, maxWidth:300, margin:0 }}>
        Estamos trabajando en esta sección. Pronto podrás configurar {label.toLowerCase()} desde aquí.
      </p>
    </div>
  );
}

function SectionGeneral({ config }) {
  return (
    <div>
      <div className="page-header">
        {config.icon && <img src={`https://cdn.discordapp.com/icons/${config.guildId}/${config.icon}.png?size=256`} alt={config.name} style={{ width:80, height:80, borderRadius:16, marginBottom:16, border:"3px solid #5865F2" }} />}
        <h1>{config.name}</h1>
        <p className="page-subtitle">ID: {config.guildId}</p>
      </div>
      <div className="panel">
        <h2>Módulos</h2>
        <div className="grid">
          {SECTIONS.filter(s => s.id !== "general").map(s => (
            <div className="card" key={s.id}>
              <p style={{ fontSize:28, margin:"0 0 8px" }}>{s.icon}</p>
              <p className="guild-name">{s.label}</p>
              {s.available ? <span className="badge badge-on">Disponible</span> : <span className="badge badge-off">Próximamente</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionBienvenida({ guildId, channels }) {
  const [welcome, setWelcome] = useState({ ...DEFAULT_WELCOME });
  const [farewell, setFarewell] = useState({ ...DEFAULT_FAREWELL });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("welcome");

  const loadConfig = useCallback(async () => {
    const token = localStorage.getItem("discord_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      // ✅ FIX: URL correcta apuntando directo a la API
      const res = await fetch(`${API}/guild/${guildId}/welcome`, {
        credentials: "include",
        headers
      });

      if (!res.ok) {
        console.warn("⚠️ No se pudo cargar config, usando defaults");
        return;
      }

      const data = await res.json();
      // ✅ FIX: Siempre hacer merge con defaults para evitar nulls
      setWelcome({ ...DEFAULT_WELCOME, ...(data.welcome || {}) });
      setFarewell({ ...DEFAULT_FAREWELL, ...(data.farewell || {}) });
    } catch (err) {
      console.error("❌ Error cargando welcome config:", err);
      // Usar defaults si falla — no crashear
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("discord_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API}/guild/${guildId}/welcome`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ welcome, farewell })
      });

      if (!res.ok) throw new Error("Error al guardar");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("❌ Error guardando:", err);
      alert("❌ Error al guardar. Verifica que la API esté corriendo.");
    } finally {
      setSaving(false);
    }
  };

  const insertVar = (varText, setter, current) => {
    setter({ ...current, message: (current.message || "") + varText });
  };

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", padding:40 }}>
      <div className="loading-spinner"/>
    </div>
  );

  const cfg = tab === "welcome" ? welcome : farewell;
  const setCfg = tab === "welcome" ? setWelcome : setFarewell;
  const accentColor = tab === "welcome" ? "#ff0033" : "#5865F2";
  const tabLabel = tab === "welcome" ? "Bienvenida" : "Despedida";

  return (
    <div>
      <div className="page-header">
        <h1>👋 Bienvenida & Despedida</h1>
        <p className="page-subtitle">Configura los mensajes con canvas personalizado</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {["welcome","farewell"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:500, fontSize:14,
            background: tab === t ? (t === "welcome" ? "rgba(255,0,51,0.15)" : "rgba(88,101,242,0.15)") : "rgba(255,255,255,0.05)",
            color: tab === t ? (t === "welcome" ? "#ff0033" : "#5865F2") : "var(--text-secondary,#6b7280)",
            borderBottom: tab === t ? `2px solid ${t === "welcome" ? "#ff0033" : "#5865F2"}` : "2px solid transparent"
          }}>
            {t === "welcome" ? "👋 Bienvenida" : "👋 Despedida"}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:700 }}>

        {/* Activar/desactivar */}
        <div className="card" style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p className="guild-name" style={{ margin:0 }}>Activar {tabLabel}</p>
            <p style={{ color:"var(--text-secondary,#6b7280)", fontSize:13, margin:"4px 0 0" }}>
              {tab === "welcome" ? "Envía un mensaje cuando alguien entra al servidor" : "Envía un mensaje cuando alguien sale del servidor"}
            </p>
          </div>
          <div onClick={() => setCfg({ ...cfg, enabled: !cfg.enabled })} style={{
            width:48, height:26, borderRadius:13, cursor:"pointer", position:"relative", transition:"background 0.2s",
            background: cfg.enabled ? accentColor : "rgba(255,255,255,0.1)"
          }}>
            <div style={{
              position:"absolute", top:3, left: cfg.enabled ? 25 : 3, width:20, height:20,
              borderRadius:"50%", background:"white", transition:"left 0.2s"
            }}/>
          </div>
        </div>

        {/* Canal */}
        <div className="card" style={{ gap:8 }}>
          <p className="guild-name" style={{ margin:"0 0 8px" }}>Canal de {tabLabel.toLowerCase()}</p>
          <select
            value={cfg.channelId || ""}
            onChange={e => setCfg({ ...cfg, channelId: e.target.value })}
            style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"var(--bg-base,#080b12)", color:"var(--text-primary,#e8eaf0)", fontSize:14 }}
          >
            <option value="">— Selecciona un canal —</option>
            {channels.map(ch => (
              <option key={ch.id} value={ch.id}>#{ch.name}</option>
            ))}
          </select>
          {channels.length === 0 && (
            <p style={{ fontSize:12, color:"var(--text-secondary,#6b7280)", margin:"4px 0 0" }}>
              ⚠️ No se cargaron canales. Verifica que el bot esté en el servidor.
            </p>
          )}
        </div>

        {/* Mensaje */}
        <div className="card" style={{ gap:8 }}>
          <p className="guild-name" style={{ margin:"0 0 4px" }}>Mensaje personalizado</p>
          <p style={{ color:"var(--text-secondary,#6b7280)", fontSize:12, margin:"0 0 8px" }}>Haz clic en una variable para insertarla</p>

          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
            {VARIABLES.map(v => (
              <button key={v.var} title={v.desc} onClick={() => insertVar(v.var, setCfg, cfg)} style={{
                padding:"4px 10px", borderRadius:6, border:`1px solid ${accentColor}40`,
                background:`${accentColor}10`, color: accentColor, fontSize:12, cursor:"pointer", fontFamily:"monospace"
              }}>
                {v.var}
              </button>
            ))}
          </div>

          <textarea
            value={cfg.message || ""}
            onChange={e => setCfg({ ...cfg, message: e.target.value })}
            rows={3}
            style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"var(--bg-base,#080b12)", color:"var(--text-primary,#e8eaf0)", fontSize:14, resize:"vertical", boxSizing:"border-box" }}
          />

          {cfg.message && (
            <div style={{ padding:"10px 12px", borderRadius:8, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", fontSize:13, color:"var(--text-secondary,#6b7280)", marginTop:4 }}>
              <span style={{ fontSize:11, color: accentColor, marginBottom:4, display:"block" }}>Vista previa:</span>
              {cfg.message
                .replace(/{user}/g, "@Usuario")
                .replace(/{username}/g, "Usuario")
                .replace(/{displayname}/g, "Usuario")
                .replace(/{server}/g, "Mi Servidor")
                .replace(/{membercount}/g, "42")
                .replace(/{position}/g, "42")
                .replace(/{accountage}/g, "365 días")}
            </div>
          )}
        </div>

        {/* Diseño del canvas */}
        <div className="card" style={{ gap:12 }}>
          <p className="guild-name" style={{ margin:"0 0 4px" }}>Diseño de la imagen</p>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ margin:0, fontSize:14, color:"var(--text-primary,#e8eaf0)" }}>Usar avatar como fondo</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"var(--text-secondary,#6b7280)" }}>El avatar del usuario se usa como fondo difuminado</p>
            </div>
            <div onClick={() => setCfg({ ...cfg, useAvatar: !cfg.useAvatar })} style={{
              width:48, height:26, borderRadius:13, cursor:"pointer", position:"relative", transition:"background 0.2s",
              background: cfg.useAvatar ? accentColor : "rgba(255,255,255,0.1)"
            }}>
              <div style={{ position:"absolute", top:3, left: cfg.useAvatar ? 25 : 3, width:20, height:20, borderRadius:"50%", background:"white", transition:"left 0.2s" }}/>
            </div>
          </div>

          {!cfg.useAvatar && (
            <div>
              <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-secondary,#6b7280)" }}>URL de imagen de fondo (800x250 recomendado)</p>
              <input
                type="url"
                placeholder="https://ejemplo.com/fondo.png"
                value={cfg.backgroundUrl || ""}
                onChange={e => setCfg({ ...cfg, backgroundUrl: e.target.value })}
                style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"var(--bg-base,#080b12)", color:"var(--text-primary,#e8eaf0)", fontSize:14, boxSizing:"border-box" }}
              />
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <p style={{ margin:0, fontSize:14, color:"var(--text-primary,#e8eaf0)", flex:1 }}>Color de acento</p>
            <input
              type="color"
              value={cfg.embedColor || accentColor}
              onChange={e => setCfg({ ...cfg, embedColor: e.target.value })}
              style={{ width:48, height:36, borderRadius:8, border:"none", cursor:"pointer", background:"transparent" }}
            />
            <span style={{ fontSize:13, color:"var(--text-secondary,#6b7280)", fontFamily:"monospace" }}>{cfg.embedColor}</span>
          </div>
        </div>

        {/* Botón guardar */}
        <button onClick={handleSave} disabled={saving} style={{
          padding:"12px 32px", borderRadius:10, border:"none", cursor: saving ? "not-allowed" : "pointer",
          background: saved ? "#22c55e" : accentColor, color:"white", fontWeight:600, fontSize:15,
          transition:"background 0.2s", opacity: saving ? 0.7 : 1, alignSelf:"flex-start"
        }}>
          {saving ? "Guardando..." : saved ? "✅ Guardado" : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}

function Guild({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  useEffect(() => {
    if (!API || !id) { setError(true); setLoading(false); return; }

    const token = localStorage.getItem("discord_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${API}/guild/${id}`, { credentials:"include", headers })
      .then(res => {
        if (!res.ok) { if (res.status === 401) navigate("/login"); throw new Error("Error"); }
        return res.json();
      })
      .then(data => {
        setConfig(data);
        setChannels(data.channels || []);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [id, navigate]);

  if (loading) return <div className="app"><div className="main" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}><div className="loading-spinner"/></div></div>;
  if (error || !config) return <div className="app"><div className="main"><div className="empty-state"><p>No se pudo cargar la configuración.</p><button className="btn-discord" onClick={() => navigate("/dashboard")} style={{ marginTop:16 }}>Volver</button></div></div></div>;

  const activeData = SECTIONS.find(s => s.id === activeSection);

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
        .nav-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; cursor:pointer; font-size:14px; font-weight:500; color:var(--text-secondary,#6b7280); border:none; background:transparent; width:100%; text-align:left; transition:background .15s,color .15s; }
        .nav-item:hover { background:rgba(255,255,255,.05); color:var(--text-primary,#e8eaf0); }
        .nav-item.active { background:rgba(255,0,51,.1); color:#ff0033; }
        .nav-item .soon-badge { margin-left:auto; font-size:10px; padding:2px 6px; border-radius:10px; background:rgba(255,255,255,.07); color:var(--text-secondary,#6b7280); }
      `}</style>

      <div className="app">
        <aside className="sidebar" style={{ width:220 }}>
          <div className="sidebar-brand">VEIDO</div>
          <button className="btn-logout" onClick={() => navigate("/dashboard")} style={{ marginBottom:20 }}>← Volver</button>
          <span className="nav-label" style={{ padding:"0 8px", marginBottom:6, display:"block" }}>Configuración</span>
          {SECTIONS.map(s => (
            <button key={s.id} className={`nav-item ${activeSection === s.id ? "active" : ""}`} onClick={() => setActiveSection(s.id)}>
              <span style={{ fontSize:16 }}>{s.icon}</span>
              {s.label}
              {!s.available && <span className="soon-badge">pronto</span>}
            </button>
          ))}
          {user && (
            <div className="sidebar-user" style={{ marginTop:"auto" }}>
              {user.avatar && <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`} alt={user.username} style={{ width:32, height:32, borderRadius:"50%", marginRight:8 }}/>}
              <span className="user-name" style={{ fontSize:13 }}>{user.global_name || user.username}</span>
            </div>
          )}
        </aside>

        <main className="main">
          {activeSection === "general" && <SectionGeneral config={config} />}
          {activeSection === "bienvenida" && <SectionBienvenida guildId={id} channels={channels} />}
          {!["general","bienvenida"].includes(activeSection) && <ComingSoon label={activeData.label} icon={activeData.icon} />}
        </main>
      </div>
    </>
  );
}

Guild.propTypes = {
  user: PropTypes.shape({ id: PropTypes.string.isRequired, username: PropTypes.string.isRequired, avatar: PropTypes.string, global_name: PropTypes.string }).isRequired
};

export default Guild;