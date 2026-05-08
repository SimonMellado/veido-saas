const { createCanvas, loadImage, registerFont } = require("canvas");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");

// Variables disponibles para personalizar mensajes
function parseMessage(template, member, guild) {
    return template
        .replace(/{user}/g, `<@${member.id}>`)
        .replace(/{username}/g, member.user.username)
        .replace(/{displayname}/g, member.displayName)
        .replace(/{server}/g, guild.name)
        .replace(/{membercount}/g, guild.memberCount)
        .replace(/{position}/g, guild.memberCount)
        .replace(/{accountage}/g, Math.floor((Date.now() - member.user.createdAt) / (1000 * 60 * 60 * 24)) + " días");
}

// Genera la imagen canvas de bienvenida
async function generateWelcomeCard(member, config, type = "welcome") {
    const cfg = type === "welcome" ? config.welcome : config.farewell;
    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext("2d");

    // ── Fondo ──
    if (cfg.backgroundUrl) {
        try {
            const bg = await loadImage(cfg.backgroundUrl);
            ctx.drawImage(bg, 0, 0, 800, 250);
            // Overlay oscuro para legibilidad
            ctx.fillStyle = "rgba(0,0,0,0.55)";
            ctx.fillRect(0, 0, 800, 250);
        } catch {
            drawDefaultBackground(ctx, cfg.embedColor, type);
        }
    } else if (cfg.useAvatar) {
        // Usar avatar del usuario como fondo difuminado
        try {
            const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 512 });
            const avatar = await loadImage(avatarUrl);
            ctx.filter = "blur(20px)";
            ctx.drawImage(avatar, -50, -50, 900, 350);
            ctx.filter = "none";
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(0, 0, 800, 250);
        } catch {
            drawDefaultBackground(ctx, cfg.embedColor, type);
        }
    } else {
        drawDefaultBackground(ctx, cfg.embedColor, type);
    }

    // ── Avatar circular ──
    try {
        const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 256 });
        const avatar = await loadImage(avatarUrl);

        const x = 125, y = 125, radius = 70;

        // Sombra del avatar
        ctx.shadowColor = cfg.embedColor;
        ctx.shadowBlur = 20;

        // Círculo del avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
        ctx.restore();

        ctx.shadowBlur = 0;

        // Borde del avatar
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = cfg.embedColor;
        ctx.lineWidth = 4;
        ctx.stroke();
    } catch {}

    // ── Texto ──
    const textX = 230;

    // Título (Bienvenido / Adiós)
    ctx.font = "bold 22px Sans";
    ctx.fillStyle = cfg.embedColor;
    ctx.fillText(type === "welcome" ? "¡BIENVENIDO/A!" : "¡HASTA LUEGO!", textX, 80);

    // Nombre de usuario
    ctx.font = "bold 34px Sans";
    ctx.fillStyle = "#ffffff";
    const displayName = member.displayName.length > 20
        ? member.displayName.substring(0, 20) + "..."
        : member.displayName;
    ctx.fillText(displayName, textX, 130);

    // Servidor y contador
    ctx.font = "18px Sans";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`${member.guild.name} • Miembro #${member.guild.memberCount}`, textX, 165);

    // Línea decorativa
    ctx.beginPath();
    ctx.moveTo(textX, 90);
    ctx.lineTo(textX + 500, 90);
    ctx.strokeStyle = cfg.embedColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    return canvas.toBuffer("image/png");
}

function drawDefaultBackground(ctx, color, type) {
    // Gradiente oscuro por defecto
    const gradient = ctx.createLinearGradient(0, 0, 800, 250);
    gradient.addColorStop(0, "#0b0b0f");
    gradient.addColorStop(0.5, type === "welcome" ? "#1a0008" : "#0a0a1a");
    gradient.addColorStop(1, "#0b0b0f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 250);

    // Patrón de puntos decorativo
    ctx.fillStyle = `${color}15`;
    for (let i = 0; i < 800; i += 30) {
        for (let j = 0; j < 250; j += 30) {
            ctx.beginPath();
            ctx.arc(i, j, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

module.exports = {
    name: "guildMemberAdd",
    async execute(member) {
        try {
            const config = await GuildConfig.findOne({ guildId: member.guild.id });

            if (!config?.welcome?.enabled || !config?.welcome?.channelId) return;

            const channel = member.guild.channels.cache.get(config.welcome.channelId);
            if (!channel) return;

            // Generar canvas
            const imageBuffer = await generateWelcomeCard(member, config, "welcome");
            const attachment = new AttachmentBuilder(imageBuffer, { name: "welcome.png" });

            // Parsear mensaje personalizado
            const message = parseMessage(config.welcome.message, member, member.guild);

            // Embed con la imagen
            const embed = new EmbedBuilder()
                .setColor(config.welcome.embedColor || "#ff0033")
                .setDescription(message)
                .setImage("attachment://welcome.png")
                .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
                .setTimestamp();

            await channel.send({ embeds: [embed], files: [attachment] });

        } catch (err) {
            console.error("❌ Error en guildMemberAdd:", err);
        }
    }
};