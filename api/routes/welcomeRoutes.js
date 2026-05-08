const express = require("express");
const router = express.Router();
const GuildConfig = require("../models/GuildConfig");
const axios = require("axios");

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        req.accessToken = authHeader.split(" ")[1];
        return next();
    }
    if (req.session?.user && req.session?.accessToken) {
        req.accessToken = req.session.accessToken;
        return next();
    }
    return res.status(401).json({ error: "No autenticado" });
}

// Verificar que el usuario es admin del servidor
async function verifyAdmin(accessToken, guildId) {
    const response = await axios.get("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const guild = response.data.find(g => g.id === guildId);
    return guild && (Number.parseInt(guild.permissions) & 0x8) === 0x8;
}

// GET — obtener config de bienvenida
router.get("/:guildId/welcome", requireAuth, async (req, res) => {
    try {
        const isAdmin = await verifyAdmin(req.accessToken, req.params.guildId);
        if (!isAdmin) return res.status(403).json({ error: "Sin permisos" });

        const config = await GuildConfig.findOne({ guildId: req.params.guildId });

        res.json({
            welcome: config?.welcome || {
                enabled: false,
                channelId: null,
                message: "¡Bienvenido/a {user} a {server}! 🎉 Eres el miembro #{membercount}.",
                backgroundUrl: null,
                useAvatar: true,
                embedColor: "#ff0033"
            },
            farewell: config?.farewell || {
                enabled: false,
                channelId: null,
                message: "👋 {username} ha abandonado {server}. Nos quedamos con {membercount} miembros.",
                backgroundUrl: null,
                useAvatar: true,
                embedColor: "#5865F2"
            }
        });
    } catch (err) {
        console.error("❌ Error GET welcome:", err);
        res.status(500).json({ error: "Error al cargar configuración" });
    }
});

// POST — guardar config de bienvenida
router.post("/:guildId/welcome", requireAuth, async (req, res) => {
    try {
        const isAdmin = await verifyAdmin(req.accessToken, req.params.guildId);
        if (!isAdmin) return res.status(403).json({ error: "Sin permisos" });

        const { welcome, farewell } = req.body;

        const config = await GuildConfig.findOneAndUpdate(
            { guildId: req.params.guildId },
            {
                $set: {
                    ...(welcome && { welcome }),
                    ...(farewell && { farewell })
                }
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, config });
    } catch (err) {
        console.error("❌ Error POST welcome:", err);
        res.status(500).json({ error: "Error al guardar configuración" });
    }
});

module.exports = router;