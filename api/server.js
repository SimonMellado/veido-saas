require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const session = require("express-session");

const app = express();

/* =========================
   TRUST PROXY (RENDER FIX)
========================= */
app.set("trust proxy", 1);

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // HTTPS (Render)
    sameSite: "none",    // cross-site (Vercel ↔ Render)
    httpOnly: true
  }
}));

/* =========================
   DISCORD LOGIN
========================= */
app.get("/auth/login", (req, res) => {
  const url =
    `https://discord.com/api/oauth2/authorize` +
    `?client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify%20guilds`;

  res.redirect(url);
});

/* =========================
   DISCORD CALLBACK
========================= */
app.get("/auth/discord/callback", async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) return res.status(400).send("No code provided");

    // GET TOKEN
    const tokenRes = await axios.post(
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

    const access_token = tokenRes.data.access_token;

    // GET USER
    const userRes = await axios.get(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    // SAVE SESSION
    req.session.user = userRes.data;

    // REDIRECT FRONTEND
    res.redirect(process.env.CLIENT_URL);

  } catch (err) {
    console.error("OAuth Error:", err.message);
    res.status(500).send("OAuth error");
  }
});

/* =========================
   USER SESSION
========================= */
app.get("/user", (req, res) => {
  res.json(req.session.user || null);
});

/* =========================
   GUILDS (PLACEHOLDER)
========================= */
app.get("/guilds", (req, res) => {
  if (!req.session.user) return res.json([]);

  res.json([
    { id: "1", name: "Servidor Demo 1" },
    { id: "2", name: "Servidor Demo 2" }
  ]);
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "Veido API running 🚀"
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});