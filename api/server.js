require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const loginAttempts = new Map();

const autorolesRoutes = require("./routes/autorolesRoutes");
app.use("/guild", autorolesRoutes);

const app = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: true,
    sameSite: "none"
  }
}));

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    req.accessToken = authHeader.split(" ")[1];
    return next();
  }
  if (req.session.user && req.session.accessToken) {
    req.accessToken = req.session.accessToken;
    return next();
  }
  return res.status(401).json({ error: "No autenticado" });
}

// ✅ Retry con backoff exponencial para evitar rate limiting de Discord
const fetchWithRetry = async (fn, retries = 3, delay = 2000) => {
  try {
    return await fn();
  } catch (err) {
    if (err.response?.status === 429 && retries > 0) {
      const retryAfter = (err.response?.data?.retry_after || 30) * 1000;
      const waitTime = Math.max(retryAfter, delay);
      console.log(`⏳ Rate limited por Discord, esperando ${waitTime}ms... (${retries} intentos restantes)`);
      await new Promise(r => setTimeout(r, waitTime));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
};

// ──────────────── AUTH ────────────────

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
  if (!code) return res.status(400).send("Falta el código");

  try {
    const tokenResponse = await fetchWithRetry(() =>
      axios.post(
        "https://discord.com/api/oauth2/token",
        new URLSearchParams({
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.REDIRECT_URI
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      )
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await fetchWithRetry(() =>
      axios.get("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    );

    req.session.user = userResponse.data;
    req.session.accessToken = accessToken;
    await req.session.save();

    const payload = encodeURIComponent(JSON.stringify({
      id: userResponse.data.id,
      username: userResponse.data.username,
      avatar: userResponse.data.avatar,
      global_name: userResponse.data.global_name,
      token: accessToken
    }));

    res.redirect(`${process.env.CLIENT_URL}/dashboard?user=${payload}`);

  } catch (err) {
    console.error("🔥 Error en OAuth:", err.response?.data || err.message);
    if (err.response?.status === 429) {
      return res.status(503).send("Servidor ocupado por rate limit, intenta en 30 segundos");
    }
    res.status(500).send("Error en autenticación");
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid").json({ message: "Sesión cerrada correctamente" });
  });
});

// ──────────────── RUTAS DE DATOS ────────────────

app.get("/user", (req, res) => {
  res.json(req.session.user || null);
});

app.get("/guilds", requireAuth, async (req, res) => {
  try {
    const response = await fetchWithRetry(() =>
      axios.get("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${req.accessToken}` }
      })
    );
    const adminGuilds = response.data.filter(
      g => (Number.parseInt(g.permissions) & 0x8) === 0x8
    );
    res.json(adminGuilds);
  } catch (err) {
    console.error("🔥 Error cargando servidores:", err.message);
    res.status(500).json([]);
  }
});

app.get("/guild/:id", requireAuth, async (req, res) => {
  try {
    const guildsResponse = await fetchWithRetry(() =>
      axios.get("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${req.accessToken}` }
      })
    );

    const guild = guildsResponse.data.find(g => g.id === req.params.id);
    const isAdmin = guild && (Number.parseInt(guild.permissions) & 0x8) === 0x8;
    if (!isAdmin) return res.status(403).json({ error: "Sin permisos" });

    let channels = [];
    try {
      const channelsResponse = await fetchWithRetry(() =>
        axios.get(
          `https://discord.com/api/guilds/${req.params.id}/channels`,
          { headers: { Authorization: `Bot ${process.env.TOKEN}` } }
        )
      );
      channels = channelsResponse.data
        .filter(ch => ch.type === 0)
        .map(ch => ({ id: ch.id, name: ch.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      channels = [];
    }

    res.json({
      guildId: req.params.id,
      name: guild.name,
      icon: guild.icon,
      channels,
      modules: { levels: false, welcome: false }
    });
  } catch (err) {
    console.error("🔥 Error guild:", err.message);
    res.status(500).json(null);
  }
});

// ──────────────── RUTAS DE BIENVENIDA ────────────────

const welcomeRoutes = require("./routes/welcomeRoutes");
app.use("/guild", welcomeRoutes);

// ──────────────── HEALTH CHECK ────────────────

app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
});

// ──────────────── ARRANQUE ────────────────

const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });