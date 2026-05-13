const express = require("express");
const router = express.Router();
const axios = require("axios");
const Guild = require("../models/Guild");

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) { req.accessToken = authHeader.split(" ")[1]; return next(); }
    if (req.session?.user && req.session?.accessToken) { req.accessToken = req.session.accessToken; return next(); }
    return res.status(401).json({ error: "No autenticado" });
}

async function verifyAdmin(accessToken, guildId) {
    const res = await axios.get("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const guild = res.data.find(g => g.id === guildId);
    return guild && (Number.parseInt(guild.permissions) & 0x8) === 0x8;
}

// GET — obtener autoroles
router.get("/:guildId/autoroles", requireAuth, async (req, res) => {
    try {
        const isAdmin = await verifyAdmin(req.accessToken, req.params.guildId);
        if (!isAdmin) return res.status(403).json({ error: "Sin permisos" });

        const guildData = await Guild.findOne({ guildId: req.params.guildId });

        // Obtener roles del servidor via bot token
        let allRoles = [];
        try {
            const rolesRes = await axios.get(
                `https://discord.com/api/guilds/${req.params.guildId}/roles`,
                { headers: { Authorization: `Bot ${process.env.TOKEN}` } }
            );
            allRoles = rolesRes.data
                .filter(r => !r.managed && r.name !== "@everyone")
                .map(r => ({ id: r.id, name: r.name, color: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : null }))
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch {}

        res.json({
            enabled: guildData?.modules?.autoroles || false,
            autoroles: guildData?.autoroles || [],
            allRoles
        });
    } catch (err) {
        console.error("❌ Error GET autoroles:", err.message);
        res.status(500).json({ error: "Error al cargar autoroles" });
    }
});

// POST — guardar autoroles
router.post("/:guildId/autoroles", requireAuth, async (req, res) => {
    try {
        const isAdmin = await verifyAdmin(req.accessToken, req.params.guildId);
        if (!isAdmin) return res.status(403).json({ error: "Sin permisos" });

        const { enabled, autoroles } = req.body;

        await Guild.findOneAndUpdate(
            { guildId: req.params.guildId },
            { $set: { "modules.autoroles": enabled, autoroles: autoroles || [] } },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Error POST autoroles:", err.message);
        res.status(500).json({ error: "Error al guardar autoroles" });
    }
});

module.exports = router;