require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const session = require("express-session");

const app = express();

app.set("trust proxy", 1);

// ✅ FIX: Se permite el origen del frontend en Vercel
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());

// ✅ FIX: Se agrega 'store' en producción recomendado, pero con MemoryStore funciona
// Si usas Render (servicio gratuito que "duerme"), las sesiones se pierden al despertar.
// Considera usar connect-mongo: MongoStore para persistir sesiones en tu MongoDB existente.
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // ✅ FIX: solo true en producción
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // ✅ FIX: "none" requiere HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
}));

// ──────────────────────────────────────────────
// RUTAS DE AUTENTICACIÓN DISCORD
// ──────────────────────────────────────────────

// LOGIN - redirige a Discord OAuth
app.get("/auth/login", (req, res) => {
  const url =
    `https://discord.com/api/oauth2/authorize` +
    `?client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&response_type=code&scope=identify%20guilds`;

  res.redirect(url);
});

// CALLBACK - Discord redirige aquí con el código
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;

  // ✅ FIX: Validar que el código existe antes de procesar
  if (!code) {
    return res.status(400).send("Falta el código de autorización");
  }

  try {
    // Intercambiar código por token de acceso
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    // Obtener datos del usuario
    const userResponse = await axios.get(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`
        }
      }
    );

    // ✅ FIX: Guardar también el access_token en sesión por si se necesita después
    req.session.user = userResponse.data;
    req.session.accessToken = tokenResponse.data.access_token;

    // ✅ FIX: Guardar sesión explícitamente antes de redirigir
    req.session.save((err) => {
      if (err) {
        console.error("❌ Error guardando sesión:", err);
        return res.status(500).send("Error al guardar sesión");
      }
      // Redirigir al frontend en Vercel (no a localhost)
      res.redirect(process.env.CLIENT_URL);
    });

  } catch (err) {
    console.error("🔥 ERROR OAuth:", err.response?.data || err.message);
    res.status(500).send("Error en OAuth de Discord");
  }
});

// LOGOUT
app.get("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error al cerrar sesión");
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada correctamente" });
  });
});

// ──────────────────────────────────────────────
// RUTAS DE API
// ──────────────────────────────────────────────

// Devuelve el usuario de la sesión actual
app.get("/user", (req, res) => {
  res.json(req.session.user || null);
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
});

// ──────────────────────────────────────────────
// INICIO DEL SERVIDOR
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor Express corriendo en puerto ${PORT}`);
  console.log(`   CLIENT_URL: ${process.env.CLIENT_URL}`);
  console.log(`   REDIRECT_URI: ${process.env.REDIRECT_URI}`);
});
