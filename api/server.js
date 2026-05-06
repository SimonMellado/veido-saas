require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();

// 1. IMPORTANTE: Confiar en el proxy de Vercel para HTTPS
app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());

// 2. Configuración de sesión para cookies cross-site en Vercel
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URL 
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: true, // Importante para Render/Vercel
    sameSite: 'none'
  }
}));

// Middleware para autorizar rutas
function requireAuth(req, res, next) {
  if (!req.session.user || !req.session.accessToken) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
}

// ──────────────── AUTH ────────────────
app.get("/auth/login", (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
  res.redirect(url);
});

app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Falta el código");

  try {
    const tokenResponse = await axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI
    }).toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });

    req.session.user = userResponse.data;
    req.session.accessToken = tokenResponse.data.access_token;
    
    // Redirigir al dashboard
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (err) {
    console.error("🔥 Error:", err.response?.data || err.message);
    res.status(500).send("Error en autenticación");
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => res.clearCookie("connect.sid").json({ message: "OK" }));
});

// ──────────────── RUTA DE USUARIO (Frontend la consulta) ────────────────
app.get("/user", (req, res) => {
  res.json(req.session.user || null);
});

// ──────────────── GUILDS ────────────────
app.get("/guilds", requireAuth, async (req, res) => {
  try {
    const response = await axios.get("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${req.session.accessToken}` }
    });
    const adminGuilds = response.data.filter(g => (parseInt(g.permissions) & 0x8) === 0x8);
    res.json(adminGuilds);
  } catch (err) {
    res.status(500).json([]);
  }
});

app.get("/guild/:id", requireAuth, async (req, res) => {
  // Tu lógica existente de guild específico
  res.json({ guildId: req.params.id, name: "Servidor", modules: { levels: false, welcome: false } });
});

app.listen(process.env.PORT || 3001);