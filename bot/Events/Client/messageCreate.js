const axios = require("axios");
const User = require("../../../api/models/User");
const Guild = require("../../../api/models/Guild");

const API = process.env.API_URL || "https://veido-bot2.onrender.com/";
const COOLDOWN_MS = 60000; // 1 minuto entre XP

// XP necesario para subir de nivel (progresivo)
function xpForNextLevel(level) {
    return level * 100 + 100;
}

module.exports = {
    name: "messageCreate",

    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (message.content.startsWith("/")) return;

        try {
            // ── Obtener o crear datos del servidor ──
            let guildData = await Guild.findOne({ guildId: message.guild.id });
            if (!guildData) {
                guildData = await Guild.create({
                    guildId: message.guild.id,
                    name: message.guild.name,
                    modules: { levels: false, welcome: false, autoroles: false }
                });
            }

            // ── Sistema de niveles (solo si está activado) ──
            if (guildData.modules.levels) {
                let user = await User.findOne({
                    userId: message.author.id,
                    guildId: message.guild.id
                });

                if (!user) {
                    user = await User.create({
                        userId: message.author.id,
                        guildId: message.guild.id,
                        xp: 0,
                        level: 0,
                        messages: 0
                    });
                }

                // ✅ Cooldown para evitar spam de XP
                const now = Date.now();
                const lastMsg = user.lastMessage ? new Date(user.lastMessage).getTime() : 0;
                const onCooldown = now - lastMsg < COOLDOWN_MS;

                if (!onCooldown) {
                    const xpGained = Math.floor(Math.random() * 10) + 5;
                    user.xp += xpGained;
                    user.messages = (user.messages || 0) + 1;
                    user.lastMessage = new Date();

                    const nextLevelXp = xpForNextLevel(user.level);

                    if (user.xp >= nextLevelXp) {
                        user.level++;
                        user.xp -= nextLevelXp; // XP sobrante pasa al siguiente nivel

                        message.channel.send({
                            content: `🎉 ${message.author} subió a nivel **${user.level}**! Usa \`/rank\` para ver tu progreso.`
                        }).catch(() => {});
                    }

                    await user.save();

                    // ✅ Enviar datos a API secundaria (mantenido de tu código original)
                    axios.post(`${API}message`, {
                        user: message.author.tag,
                        content: message.content,
                        xp: user.xp,
                        level: user.level,
                        guildId: message.guild.id
                    }).catch(() => {}); // No bloquear si la API falla
                }
            }

        } catch (err) {
            console.error("❌ Error en messageCreate:", err.message);
        }
    }
};