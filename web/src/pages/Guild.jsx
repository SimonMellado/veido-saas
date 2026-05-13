import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const API = process.env.REACT_APP_API;

const SECTIONS = [
  { id: "general",    label: "General",    icon: "⚙️", available: true  },
  { id: "bienvenida", label: "Bienvenida", icon: "👋", available: true  },
  { id: "moderacion", label: "Moderación", icon: "🛡️", available: true  },
  { id: "musica",     label: "Música",     icon: "🎵", available: true  },
  { id: "niveles",    label: "Niveles",    icon: "⭐", available: true  },
  { id: "autoroles",  label: "Autoroles",  icon: "🎭", available: true  },
  { id: "memes",      label: "Memes",      icon: "😂", available: true  },
  { id: "anime",      label: "Anime",      icon: "🌸", available: false },
  { id: "economia",   label: "Economía",   icon: "💰", available: false },
];

const VARIABLES = [
  { var: "{user}", desc: "Mención" }, { var: "{username}", desc: "Nombre" },
  { var: "{displayname}", desc: "Apodo" }, { var: "{server}", desc: "Servidor" },
  { var: "{membercount}", desc: "Miembros" }, { var: "{position}", desc: "Posición" },
  { var: "{accountage}", desc: "Antigüedad" },
];

const DEFAULT_WELCOME = { enabled: false, channelId: null, message: "¡Bienvenido/a {user} a {server}! 🎉 Eres el miembro #{membercount}.", backgroundUrl: null, useAvatar: true, embedColor: "#ff0033" };
const DEFAULT_FAREWELL = { enabled: false, channelId: null, message: "👋 {username} ha abandonado {server}. Nos quedamos con {membercount} miembros.", backgroundUrl: null, useAvatar: true, embedColor: "#5865F2" };

const MOD_COMMANDS = [
  { cmd: "/ban", desc: "Banea a un usuario", icon: "🔨", perms: "BanMembers" },
  { cmd: "/unban", desc: "Desbanea por ID", icon: "✅", perms: "BanMembers" },
  { cmd: "/kick", desc: "Expulsa a un usuario", icon: "👢", perms: "KickMembers" },
  { cmd: "/timeout", desc: "Silencia temporalmente", icon: "🔇", perms: "ModerateMembers" },
  { cmd: "/untimeout", desc: "Quita el silencio", icon: "🔊", perms: "ModerateMembers" },
  { cmd: "/warn", desc: "Advierte con DM automático", icon: "⚠️", perms: "ModerateMembers" },
  { cmd: "/userinfo", desc: "Info detallada de usuario", icon: "👤", perms: "Todos" },
  { cmd: "/serverinfo", desc: "Info del servidor", icon: "🏠", perms: "Todos" },
  { cmd: "/ping", desc: "Latencia del bot", icon: "🏓", perms: "Todos" },
];

const MUSIC_COMMANDS = [
  { cmd: "/play", args: "<canción>", desc: "YouTube, Spotify, SoundCloud", icon: "▶️" },
  { cmd: "/nowplaying", args: "", desc: "Canción actual con botones", icon: "🎶" },
  { cmd: "/queue", args: "[página]", desc: "Cola con paginación y controles", icon: "📋" },
  { cmd: "/skip", args: "[pos]", desc: "Salta canción o posición", icon: "⏭️" },
  { cmd: "/stop", args: "", desc: "Detiene y limpia la cola", icon: "⏹️" },
  { cmd: "/pause", args: "", desc: "Pausa la música", icon: "⏸️" },
  { cmd: "/resume", args: "", desc: "Reanuda la música", icon: "▶️" },
  { cmd: "/volume", args: "<1-100>", desc: "Ajusta el volumen", icon: "🔊" },
  { cmd: "/loop", args: "<modo>", desc: "Repetir canción/cola/autoplay", icon: "🔁" },
  { cmd: "/seek", args: "<mm:ss>", desc: "Salta a un momento", icon: "⏩" },
];

const LEVEL_COMMANDS = [
  { cmd: "/rank", args: "[usuario]", desc: "Tarjeta de nivel con barra de progreso visual", icon: "⭐" },
  { cmd: "/leaderboard", args: "", desc: "Top 10 usuarios con más XP del servidor", icon: "🏆" },
];

const MEME_COMMANDS = [
  { cmd: "/meme", args: "[tipo]", desc: "Meme aleatorio de Reddit (dank, funny, etc.)", icon: "😂" },
  { cmd: "/joke", args: "", desc: "Chiste aleatorio en español con spoiler", icon: "🤣" },
  { cmd: "/coinflip", args: "[cara/sello]", desc: "Lanza una moneda y adivina", icon: "🪙" },
];

function getHeaders() {
  const token = localStorage.getItem("discord_token");
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function ComingSoon({ label, icon }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320, gap:16, textAlign:"center" }}>
      <div style={{ fontSize:56 }}>{icon}</div>
      <h2 style={{ fontFamily:"var(--font-display,'Rajdhani',sans-serif)", fontSize:26, fontWeight:700, color:"var(--text-primary,#e8eaf0)", margin:0 }}>{label}</h2>
      <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 18px", background:"rgba(255,0,51,0.1)", border:"1px solid rgba(255,0,51,0.25)", borderRadius:20 }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:"#ff0033", display:"inline-block", animation:"pulse 1.5s ease-in-out infinite" }}/>
        <span style={{ color:"#ff0033", fontSize:13, fontWeight:500 }}>Próximamente</span>
      </div>
    </div>
  );
}

function CommandList({ commands }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, maxWidth:750 }}>
      {commands.map(cmd => (
        <div key={cmd.cmd} className="card" style={{ flexDirection:"row", alignItems:"center", gap:16, padding:"12px 18px" }}>
          <span style={{ fontSize:24, flexShrink:0, width:32, textAlign:"center" }}>{cmd.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
              <span style={{ fontFamily:"monospace", fontSize:14, fontWeight:700, color:"#ff0033" }}>{cmd.cmd}</span>
              {cmd.args && <span style={{ fontFamily:"monospace", fontSize:12, color:"var(--text-secondary,#6b7280)" }}>{cmd.args}</span>}
            </div>
            <p style={{ margin:"3px 0 0", fontSize:13, color:"var(--text-secondary,#6b7280)" }}>{cmd.desc}</p>
          </div>
          {cmd.perms && (
            <span style={{ flexShrink:0, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:500, background: cmd.perms==="Todos" ? "rgba(34,197,94,0.1)" : "rgba(255,0,51,0.1)", color: cmd.perms==="Todos" ? "#4ade80" : "#ff0033", border:`1px solid ${cmd.perms==="Todos" ? "rgba(34,197,94,0.25)" : "rgba(255,0,51,0.25)"}` }}>
              {cmd.perms}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionGeneral({ config, onNavigate }) {
  return (
    <div>
      <div className="page-header">
        {config.icon && <img src={`https://cdn.discordapp.com/icons/${config.guildId}/${config.icon}.png?size=256`} alt={config.name} style={{ width:80, height:80, borderRadius:16, marginBottom:16, border:"3px solid #5865F2" }}/>}
        <h1>{config.name}</h1>
        <p className="page-subtitle">ID: {config.guildId}</p>
      </div>
      <div className="panel">
        <h2>Módulos</h2>
        <div className="grid">
          {SECTIONS.filter(s => s.id !== "general").map(s => (
            <div key={s.id} className="card" onClick={() => s.available && onNavigate(s.id)} style={{ cursor: s.available ? "pointer" : "default", transition:"transform 0.15s" }}>
              <p style={{ fontSize:32, margin:"0 0 8px" }}>{s.icon}</p>
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

  useEffect(() => {
    fetch(`${API}/guild/${guildId}/welcome`, { credentials:"include", headers: getHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setWelcome({ ...DEFAULT_WELCOME, ...(d.welcome||{}) }); setFarewell({ ...DEFAULT_FAREWELL, ...(d.farewell||{}) }); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [guildId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/guild/${guildId}/welcome`, { method:"POST", credentials:"include", headers: getHeaders(), body: JSON.stringify({ welcome, farewell }) });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { alert("❌ Error al guardar"); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:40 }}><div className="loading-spinner"/></div>;

  const cfg = tab === "welcome" ? welcome : farewell;
  const setCfg = tab === "welcome" ? setWelcome : setFarewell;
  const accent = tab === "welcome" ? "#ff0033" : "#5865F2";

  return (
    <div>
      <div className="page-header"><h1>👋 Bienvenida & Despedida</h1><p className="page-subtitle">Configura mensajes con canvas personalizado</p></div>
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {["welcome","farewell"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:500, fontSize:14, background: tab===t ? (t==="welcome" ? "rgba(255,0,51,0.15)" : "rgba(88,101,242,0.15)") : "rgba(255,255,255,0.05)", color: tab===t ? (t==="welcome" ? "#ff0033" : "#5865F2") : "var(--text-secondary,#6b7280)", borderBottom: tab===t ? `2px solid ${t==="welcome" ? "#ff0033" : "#5865F2"}` : "2px solid transparent" }}>
            {t==="welcome" ? "👋 Bienvenida" : "👋 Despedida"}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:700 }}>
        <div className="card" style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <div><p className="guild-name" style={{ margin:0 }}>Activar {tab==="welcome" ? "Bienvenida" : "Despedida"}</p><p style={{ color:"var(--text-secondary,#6b7280)", fontSize:13, margin:"4px 0 0" }}>{tab==="welcome" ? "Mensaje al entrar" : "Mensaje al salir"}</p></div>
          <div onClick={() => setCfg({ ...cfg, enabled: !cfg.enabled })} style={{ width:48, height:26, borderRadius:13, cursor:"pointer", position:"relative", background: cfg.enabled ? accent : "rgba(255,255,255,0.1)" }}>
            <div style={{ position:"absolute", top:3, left: cfg.enabled ? 25 : 3, width:20, height:20, borderRadius:"50%", background:"white", transition:"left 0.2s" }}/>
          </div>
        </div>
        <div className="card" style={{ gap:8 }}>
          <p className="guild-name" style={{ margin:"0 0 8px" }}>Canal</p>
          <select value={cfg.channelId||""} onChange={e => setCfg({ ...cfg, channelId: e.target.value })} style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"var(--bg-base,#080b12)", color:"var(--text-primary,#e8eaf0)", fontSize:14 }}>
            <option value="">— Selecciona un canal —</option>
            {channels.map(ch => <option key={ch.id} value={ch.id}>#{ch.name}</option>)}
          </select>
        </div>
        <div className="card" style={{ gap:8 }}>
          <p className="guild-name" style={{ margin:"0 0 4px" }}>Mensaje</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
            {VARIABLES.map(v => <button key={v.var} title={v.desc} onClick={() => setCfg({ ...cfg, message: (cfg.message||"") + v.var })} style={{ padding:"3px 8px", borderRadius:6, border:`1px solid ${accent}40`, background:`${accent}10`, color: accent, fontSize:11, cursor:"pointer", fontFamily:"monospace" }}>{v.var}</button>)}
          </div>
          <textarea value={cfg.message||""} onChange={e => setCfg({ ...cfg, message: e.target.value })} rows={3} style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"var(--bg-base,#080b12)", color:"var(--text-primary,#e8eaf0)", fontSize:14, resize:"vertical", boxSizing:"border-box" }}/>
          {cfg.message && <div style={{ padding:"10px 12px", borderRadius:8, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", fontSize:13, color:"var(--text-secondary,#6b7280)", marginTop:4 }}>
            <span style={{ fontSize:11, color: accent, display:"block", marginBottom:4 }}>Vista previa:</span>
            {cfg.message.replace(/{user}/g,"@Usuario").replace(/{username}/g,"Usuario").replace(/{displayname}/g,"Usuario").replace(/{server}/g,"Mi Servidor").replace(/{membercount}/g,"42").replace(/{position}/g,"42").replace(/{accountage}/g,"365 días")}
          </div>}
        </div>
        <div className="card" style={{ gap:12 }}>
          <p className="guild-name" style={{ margin:"0 0 4px" }}>Diseño del canvas</p>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div><p style={{ margin:0, fontSize:14, color:"var(--text-primary,#e8eaf0)" }}>Usar avatar como fondo</p><p style={{ margin:"2px 0 0", fontSize:12, color:"var(--text-secondary,#6b7280)" }}>Avatar difuminado de fondo</p></div>
            <div onClick={() => setCfg({ ...cfg, useAvatar: !cfg.useAvatar })} style={{ width:48, height:26, borderRadius:13, cursor:"pointer", position:"relative", background: cfg.useAvatar ? accent : "rgba(255,255,255,0.1)" }}>
              <div style={{ position:"absolute", top:3, left: cfg.useAvatar ? 25 : 3, width:20, height:20, borderRadius:"50%", background:"white", transition:"left 0.2s" }}/>
            </div>
          </div>
          {!cfg.useAvatar && <input type="url" placeholder="https://ejemplo.com/fondo.png" value={cfg.backgroundUrl||""} onChange={e => setCfg({ ...cfg, backgroundUrl: e.target.value })} style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"var(--bg-base,#080b12)", color:"var(--text-primary,#e8eaf0)", fontSize:14, boxSizing:"border-box" }}/>}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <p style={{ margin:0, fontSize:14, color:"var(--text-primary,#e8eaf0)", flex:1 }}>Color de acento</p>
            <input type="color" value={cfg.embedColor||accent} onChange={e => setCfg({ ...cfg, embedColor: e.target.value })} style={{ width:48, height:36, borderRadius:8, border:"none", cursor:"pointer" }}/>
            <span style={{ fontSize:13, color:"var(--text-secondary,#6b7280)", fontFamily:"monospace" }}>{cfg.embedColor}</span>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ padding:"12px 32px", borderRadius:10, border:"none", cursor: saving ? "not-allowed" : "pointer", background: saved ? "#22c55e" : accent, color:"white", fontWeight:600, fontSize:15, opacity: saving ? 0.7 : 1, alignSelf:"flex-start" }}>
          {saving ? "Guardando..." : saved ? "✅ Guardado" : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}

function SectionAutoroles({ guildId, channels }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [newRoleId, setNewRoleId] = useState("");
  const [allRoles, setAllRoles] = useState([]);

  useEffect(() => {
    fetch(`${API}/guild/${guildId}/autoroles`, { credentials:"include", headers: getHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setRoles(d.autoroles || []);
          setEnabled(d.enabled || false);
          setAllRoles(d.allRoles || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [guildId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/guild/${guildId}/autoroles`, {
        method: "POST", credentials:"include", headers: getHeaders(),
        body: JSON.stringify({ enabled, autoroles: roles })
      });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { alert("❌ Error al guardar"); }
    finally { setSaving(false); }
  };

  const addRole = () => {
    if (!newRoleId || roles.includes(newRoleId) || roles.length >= 10) return;
    setRoles([...roles, newRoleId]);
    setNewRoleId("");
  };

  const removeRole = (id) => setRoles(roles.filter(r => r !== id));

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:40 }}><div className="loading-spinner"/></div>;

  return (
    <div>
      <div className="page-header"><h1>🎭 Autoroles</h1><p className="page-subtitle">Roles asignados automáticamente al entrar al servidor</p></div>
      <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:700 }}>
        <div className="card" style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <div><p className="guild-name" style={{ margin:0 }}>Activar Autoroles</p><p style={{ color:"var(--text-secondary,#6b7280)", fontSize:13, margin:"4px 0 0" }}>Asigna roles automáticamente a nuevos miembros</p></div>
          <div onClick={() => setEnabled(!enabled)} style={{ width:48, height:26, borderRadius:13, cursor:"pointer", position:"relative", background: enabled ? "#ff0033" : "rgba(255,255,255,0.1)" }}>
            <div style={{ position:"absolute", top:3, left: enabled ? 25 : 3, width:20, height:20, borderRadius:"50%", background:"white", transition:"left 0.2s" }}/>
          </div>
        </div>

        <div className="card" style={{ gap:12 }}>
          <p className="guild-name" style={{ margin:"0 0 4px" }}>Añadir rol automático</p>
          <p style={{ color:"var(--text-secondary,#6b7280)", fontSize:13, margin:"0 0 12px" }}>Máximo 10 roles. Usa el comando <code style={{ background:"rgba(255,0,51,0.1)", padding:"1px 6px", borderRadius:4, color:"#ff0033" }}>/autorole add</code> desde Discord o selecciona aquí.</p>

          <div style={{ display:"flex", gap:8 }}>
            <select value={newRoleId} onChange={e => setNewRoleId(e.target.value)} style={{ flex:1, padding:"10px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"var(--bg-base,#080b12)", color:"var(--text-primary,#e8eaf0)", fontSize:14 }}>
              <option value="">— Selecciona un rol —</option>
              {allRoles.filter(r => !roles.includes(r.id)).map(r => <option key={r.id} value={r.id}>@{r.name}</option>)}
            </select>
            <button onClick={addRole} disabled={!newRoleId || roles.length >= 10} style={{ padding:"10px 20px", borderRadius:8, border:"none", background:"#ff0033", color:"white", fontWeight:600, cursor:"pointer", opacity: !newRoleId || roles.length >= 10 ? 0.5 : 1 }}>
              Añadir
            </button>
          </div>

          {allRoles.length === 0 && <p style={{ fontSize:12, color:"var(--text-secondary,#6b7280)" }}>⚠️ No se cargaron los roles. Verifica que el bot esté en el servidor.</p>}
        </div>

        {roles.length > 0 && (
          <div className="card" style={{ gap:10 }}>
            <p className="guild-name" style={{ margin:"0 0 4px" }}>Roles configurados ({roles.length}/10)</p>
            {roles.map(id => {
              const role = allRoles.find(r => r.id === id);
              return (
                <div key={id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize:14, color:"var(--text-primary,#e8eaf0)" }}>
                    {role ? <span style={{ color: role.color || "#ff0033" }}>@{role.name}</span> : `ID: ${id}`}
                  </span>
                  <button onClick={() => removeRole(id)} style={{ padding:"4px 12px", borderRadius:6, border:"1px solid rgba(255,0,51,0.3)", background:"rgba(255,0,51,0.1)", color:"#ff0033", cursor:"pointer", fontSize:13 }}>Eliminar</button>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{ padding:"12px 32px", borderRadius:10, border:"none", cursor: saving ? "not-allowed" : "pointer", background: saved ? "#22c55e" : "#ff0033", color:"white", fontWeight:600, fontSize:15, opacity: saving ? 0.7 : 1, alignSelf:"flex-start" }}>
          {saving ? "Guardando..." : saved ? "✅ Guardado" : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}

function SectionNiveles() {
  return (
    <div>
      <div className="page-header"><h1>⭐ Niveles</h1><p className="page-subtitle">Sistema de experiencia por chatear en el servidor</p></div>
      <div className="panel" style={{ marginBottom:24 }}>
        <h2>Cómo funciona</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:10, maxWidth:700 }}>
          {[
            { icon:"💬", title:"Gana XP chateando", desc:"Cada mensaje da entre 5 y 15 XP con cooldown de 1 minuto para evitar spam" },
            { icon:"⬆️", title:"Sube de nivel", desc:"Al alcanzar el XP necesario el bot notifica en el canal con un mensaje" },
            { icon:"📊", title:"Barra de progreso visual", desc:"Usa /rank para ver tu tarjeta de nivel con barra de progreso animada" },
            { icon:"🏆", title:"Leaderboard del servidor", desc:"Compite con otros miembros en el top 10 con /leaderboard" },
          ].map(item => (
            <div key={item.title} className="card" style={{ flexDirection:"row", alignItems:"flex-start", gap:16 }}>
              <span style={{ fontSize:28, flexShrink:0 }}>{item.icon}</span>
              <div><p style={{ margin:0, fontWeight:600, color:"var(--text-primary,#e8eaf0)" }}>{item.title}</p><p style={{ margin:"4px 0 0", fontSize:13, color:"var(--text-secondary,#6b7280)" }}>{item.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel"><h2>Comandos</h2><CommandList commands={LEVEL_COMMANDS} /></div>
      <div style={{ marginTop:20, padding:"14px 18px", borderRadius:10, background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.2)", maxWidth:700 }}>
        <p style={{ margin:0, fontSize:13, color:"var(--text-secondary,#6b7280)" }}>
          ⚙️ <strong style={{ color:"var(--text-primary,#e8eaf0)" }}>Nota:</strong> El sistema de niveles se activa desde Discord con el módulo de configuración del servidor. Próximamente podrás activarlo desde aquí.
        </p>
      </div>
    </div>
  );
}

function SectionMemes() {
  return (
    <div>
      <div className="page-header"><h1>😂 Memes & Diversión</h1><p className="page-subtitle">Comandos de entretenimiento para tu servidor</p></div>
      <div className="panel"><h2>Comandos disponibles</h2><CommandList commands={MEME_COMMANDS} /></div>
      <div style={{ marginTop:20, padding:"14px 18px", borderRadius:10, background:"rgba(255,0,51,0.05)", border:"1px solid rgba(255,0,51,0.15)", maxWidth:700 }}>
        <p style={{ margin:0, fontSize:13, color:"var(--text-secondary,#6b7280)" }}>
          💡 <strong style={{ color:"var(--text-primary,#e8eaf0)" }}>Tip:</strong> Los memes se obtienen en tiempo real desde Reddit. Usa <code style={{ background:"rgba(255,255,255,0.08)", padding:"1px 6px", borderRadius:4, fontSize:12 }}>/meme tipo:Dank Memes</code> para filtrar por categoría.
        </p>
      </div>
    </div>
  );
}

function SectionModeracion() {
  return (
    <div>
      <div className="page-header"><h1>🛡️ Moderación</h1><p className="page-subtitle">Comandos de moderación disponibles en tu servidor</p></div>
      <div className="panel"><CommandList commands={MOD_COMMANDS} /></div>
    </div>
  );
}

function SectionMusica() {
  const SOURCES = [
    { name:"YouTube", icon:"🔴", status:"Activo" },
    { name:"Spotify", icon:"🟢", status:"Activo" },
    { name:"SoundCloud", icon:"🟠", status:"Activo" },
    { name:"Apple Music", icon:"⚪", status:"Limitado" },
  ];
  return (
    <div>
      <div className="page-header"><h1>🎵 Música</h1><p className="page-subtitle">Reproduce música desde múltiples plataformas</p></div>
      <div className="panel" style={{ marginBottom:24 }}>
        <h2>Plataformas</h2>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {SOURCES.map(s => (
            <div key={s.name} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:20, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize:16 }}>{s.icon}</span>
              <span style={{ fontSize:14, fontWeight:500, color:"var(--text-primary,#e8eaf0)" }}>{s.name}</span>
              <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background: s.status==="Activo" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)", color: s.status==="Activo" ? "#4ade80" : "#fbbf24" }}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel"><h2>Comandos</h2><CommandList commands={MUSIC_COMMANDS} /></div>
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
    fetch(`${API}/guild/${id}`, { credentials:"include", headers: getHeaders() })
      .then(r => { if (!r.ok) { if (r.status===401) navigate("/login"); throw new Error(); } return r.json(); })
      .then(d => { setConfig(d); setChannels(d.channels||[]); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [id, navigate]);

  if (loading) return <div className="app"><div className="main" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}><div className="loading-spinner"/></div></div>;
  if (error||!config) return <div className="app"><div className="main"><div className="empty-state"><p>No se pudo cargar la configuración.</p><button className="btn-discord" onClick={() => navigate("/dashboard")} style={{ marginTop:16 }}>Volver</button></div></div></div>;

  const renderSection = () => {
    switch(activeSection) {
      case "general":    return <SectionGeneral config={config} onNavigate={setActiveSection} />;
      case "bienvenida": return <SectionBienvenida guildId={id} channels={channels} />;
      case "moderacion": return <SectionModeracion />;
      case "musica":     return <SectionMusica />;
      case "niveles":    return <SectionNiveles />;
      case "autoroles":  return <SectionAutoroles guildId={id} channels={channels} />;
      case "memes":      return <SectionMemes />;
      default:           return <ComingSoon label={SECTIONS.find(s=>s.id===activeSection)?.label||""} icon={SECTIONS.find(s=>s.id===activeSection)?.icon||""} />;
    }
  };

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
            <button key={s.id} className={`nav-item ${activeSection===s.id?"active":""}`} onClick={() => setActiveSection(s.id)}>
              <span style={{ fontSize:16 }}>{s.icon}</span>{s.label}
              {!s.available && <span className="soon-badge">pronto</span>}
            </button>
          ))}
          {user && (
            <div className="sidebar-user" style={{ marginTop:"auto" }}>
              {user.avatar && <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`} alt={user.username} style={{ width:32, height:32, borderRadius:"50%", marginRight:8 }}/>}
              <span className="user-name" style={{ fontSize:13 }}>{user.global_name||user.username}</span>
            </div>
          )}
        </aside>
        <main className="main">{renderSection()}</main>
      </div>
    </>
  );
}

Guild.propTypes = { user: PropTypes.shape({ id: PropTypes.string.isRequired, username: PropTypes.string.isRequired, avatar: PropTypes.string, global_name: PropTypes.string }).isRequired };

export default Guild;