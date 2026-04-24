require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const session = require("express-session");

const app = express();

app.set("trust proxy", 1); // 🔥 IMPORTANTE PARA RENDER

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none"
  }
}));

// 🟢 LOGIN DISCORD
app.get("/auth/login", (req, res) => {
  const url =
    `https://discord.com/api/oauth2/authorize` +
    `?client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify%20guilds`;

  res.redirect(url);
});

// 🟢 CALLBACK OAUTH
app.get("/auth/discord/callback", async (req, res) => {
  try {
    const code = req.query.code;

    const token = await axios.post(
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

    const user = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${token.data.access_token}`
      }
    });

    req.session.user = user.data;

    return res.redirect(process.env.CLIENT_URL);

  } catch (err) {
    console.log("OAuth error:", err.response?.data || err.message);
    return res.status(500).send("OAuth failed");
  }
});

// 🟢 USER
app.get("/user", (req, res) => {
  res.json(req.session.user || null);
});

// 🟢 GUILDS (ejemplo básico)
app.get("/guilds", (req, res) => {
  if (!req.session.user) return res.json([]);
  res.json([]);
});

// 🟢 HOME CHECK
app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("API running on", PORT));