const { createCanvas, loadImage } = require("canvas");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");

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

async function generateFarewellCard(member, config) {
    const cfg = config.farewell;
    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext("2d");

    // ── Fondo ──
    if (cfg.backgroundUrl) {
        try {
            const bg = await loadImage(cfg.backgroundUrl);
            ctx.drawImage(bg, 0, 0, 800, 250);
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(0, 0, 800, 250);
        } catch {
            drawDefaultBackground(ctx, cfg.embedColor);
        }
    } else if (cfg.useAvatar) {
        try {
            const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 512 });
            const avatar = await loadImage(avatarUrl);
            ctx.filter = "blur(20px)";
            ctx.drawImage(avatar, -50, -50, 900, 350);
            ctx.filter = "none";
            // Overlay azulado para despedida
            ctx.fillStyle = "rgba(10,10,30,0.65)";
            ctx.fillRect(0, 0, 800, 250);
        } catch {
            drawDefaultBackground(ctx, cfg.embedColor);
        }
    } else {
        drawDefaultBackground(ctx, cfg.embedColor);
    }

    // ── Avatar circular con efecto gris (salida) ──
    try {
        const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 256 });
        const avatar = await loadImage(avatarUrl);

        const x = 125, y = 125, radius = 70;

        ctx.shadowColor = cfg.embedColor;
        ctx.shadowBlur = 15;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        // Efecto desaturado para indicar salida
        ctx.filter = "grayscale(60%)";
        ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
        ctx.filter = "none";
        ctx.restore();

        ctx.shadowBlur = 0;

        // Borde punteado para despedida
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = cfg.embedColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    } catch {}

    // ── Texto ──
    const textX = 230;

    ctx.font = "bold 22px Sans";
    ctx.fillStyle = cfg.embedColor;
    ctx.fillText("¡HASTA LUEGO!", textX, 80);

    ctx.font = "bold 34px Sans";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const displayName = member.displayName.length > 20
        ? member.displayName.substring(0, 20) + "..."
        : member.displayName;
    ctx.fillText(displayName, textX, 130);

    ctx.font = "18px Sans";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(`${member.guild.name} • Quedan ${member.guild.memberCount} miembros`, textX, 165);

    ctx.beginPath();
    ctx.moveTo(textX, 90);
    ctx.lineTo(textX + 500, 90);
    ctx.strokeStyle = cfg.embedColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    return canvas.toBuffer("image/png");
}

function drawDefaultBackground(ctx, color) {
    const gradient = ctx.createLinearGradient(0, 0, 800, 250);
    gradient.addColorStop(0, "#0b0b0f");
    gradient.addColorStop(0.5, "#0a0a1a");
    gradient.addColorStop(1, "#0b0b0f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 250);

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
    name: "guildMemberRemove",
    async execute(member) {
        try {
            const config = await GuildConfig.findOne({ guildId: member.guild.id });

            if (!config?.farewell?.enabled || !config?.farewell?.channelId) return;

            const channel = member.guild.channels.cache.get(config.farewell.channelId);
            if (!channel) return;

            const imageBuffer = await generateFarewellCard(member, config);
            const attachment = new AttachmentBuilder(imageBuffer, { name: "farewell.png" });

            const message = parseMessage(config.farewell.message, member, member.guild);

            const embed = new EmbedBuilder()
                .setColor(config.farewell.embedColor || "#5865F2")
                .setDescription(message)
                .setImage("attachment://farewell.png")
                .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
                .setTimestamp();

            await channel.send({ embeds: [embed], files: [attachment] });

        } catch (err) {
            console.error("❌ Error en guildMemberRemove:", err);
        }
    }
};