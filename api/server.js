require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());

// ✅ Sesión persistida en MongoDB (no se pierde cuando Render duerme)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    ttl: 60 * 60 * 24 // 24 horas
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// ──────────────────────────────────────────────
// MIDDLEWARE: verificar autenticación
// ──────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.user || !req.session.accessToken) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
}

// ──────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────

app.get("/auth/login", (req, res) => {
  const url =
    `https://discord.com/api/oauth2/authorize` +
    `?client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&response_type=code&scope=identify%20guilds`;

  res.redirect(url);
});

app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Falta el código de autorización");
  }

  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });

    req.session.user = userResponse.data;
    req.session.accessToken = tokenResponse.data.access_token;

    req.session.save((err) => {
      if (err) {
        console.error("❌ Error guardando sesión:", err);
        return res.status(500).send("Error al guardar sesión");
      }
      res.redirect(process.env.CLIENT_URL + "/dashboard");
    });

  } catch (err) {
    console.error("🔥 ERROR OAuth:", err.response?.data || err.message);
    res.status(500).send("Error en OAuth de Discord");
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Error al cerrar sesión");
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada correctamente" });
  });
});

// ──────────────────────────────────────────────
// USUARIO
// ──────────────────────────────────────────────

app.get("/user", (req, res) => {
  res.json(req.session.user || null);
});

// ──────────────────────────────────────────────
// GUILDS — servidores donde el usuario es admin
// ──────────────────────────────────────────────

app.get("/guilds", requireAuth, async (req, res) => {
  try {
    const response = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      { headers: { Authorization: `Bearer ${req.session.accessToken}` } }
    );

    // Solo servidores donde el usuario tiene permisos de administrador
    const adminGuilds = response.data.filter(
      g => (parseInt(g.permissions) & 0x8) === 0x8
    );

    res.json(adminGuilds);
  } catch (err) {
    console.error("❌ Error guilds:", err.response?.data || err.message);
    res.status(500).json([]);
  }
});

// ──────────────────────────────────────────────
// GUILD — configuración de un servidor específico
// ──────────────────────────────────────────────

app.get("/guild/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el usuario pertenece a ese servidor
    const guildsResponse = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      { headers: { Authorization: `Bearer ${req.session.accessToken}` } }
    );

    const guild = guildsResponse.data.find(g => g.id === id);
    const isAdmin = guild && (parseInt(guild.permissions) & 0x8) === 0x8;

    if (!isAdmin) {
      return res.status(403).json({ error: "No tienes permisos en este servidor" });
    }

    // Aquí puedes buscar la config en MongoDB si tienes un modelo GuildConfig
    // const config = await GuildConfig.findOne({ guildId: id }) || {};

    res.json({
      guildId: id,
      name: guild.name,
      icon: guild.icon,
      modules: {
        levels: false,
        welcome: false
        // Añade más módulos aquí según tu bot
      }
    });

  } catch (err) {
    console.error("❌ Error guild:", err.response?.data || err.message);
    res.status(500).json(null);
  }
});

// ──────────────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
});

// ──────────────────────────────────────────────
// INICIO
// ──────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`   CLIENT_URL:   ${process.env.CLIENT_URL}`);
  console.log(`   REDIRECT_URI: ${process.env.REDIRECT_URI}`);
});