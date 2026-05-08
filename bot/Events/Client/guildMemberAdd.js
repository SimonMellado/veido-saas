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

async function generateWelcomeCard(member, config, type = "welcome") {
    const cfg = type === "welcome" ? config.welcome : config.farewell;
    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext("2d");

    if (cfg.backgroundUrl) {
        try {
            const bg = await loadImage(cfg.backgroundUrl);
            ctx.drawImage(bg, 0, 0, 800, 250);
            ctx.fillStyle = "rgba(0,0,0,0.55)";
            ctx.fillRect(0, 0, 800, 250);
        } catch {
            drawDefaultBackground(ctx, cfg.embedColor, type);
        }
    } else if (cfg.useAvatar) {
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

    try {
        const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 256 });
        const avatar = await loadImage(avatarUrl);
        const x = 125, y = 125, radius = 70;

        ctx.shadowColor = cfg.embedColor;
        ctx.shadowBlur = 20;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
        ctx.restore();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = cfg.embedColor;
        ctx.lineWidth = 4;
        ctx.stroke();
    } catch {}

    const textX = 230;

    ctx.font = "bold 22px Sans";
    ctx.fillStyle = cfg.embedColor;
    ctx.fillText(type === "welcome" ? "¡BIENVENIDO/A!" : "¡HASTA LUEGO!", textX, 80);

    ctx.font = "bold 34px Sans";
    ctx.fillStyle = "#ffffff";
    const displayName = member.displayName.length > 20
        ? member.displayName.substring(0, 20) + "..."
        : member.displayName;
    ctx.fillText(displayName, textX, 130);

    ctx.font = "18px Sans";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`${member.guild.name} • Miembro #${member.guild.memberCount}`, textX, 165);

    ctx.beginPath();
    ctx.moveTo(textX, 90);
    ctx.lineTo(textX + 500, 90);
    ctx.strokeStyle = cfg.embedColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    return canvas.toBuffer("image/png");
}

function drawDefaultBackground(ctx, color, type) {
    const gradient = ctx.createLinearGradient(0, 0, 800, 250);
    gradient.addColorStop(0, "#0b0b0f");
    gradient.addColorStop(0.5, type === "welcome" ? "#1a0008" : "#0a0a1a");
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
    name: "guildMemberAdd",
    async execute(member) {
        console.log("🔔 guildMemberAdd disparado para:", member.user.username);

        try {
            const config = await GuildConfig.findOne({ guildId: member.guild.id });
            console.log("📊 Config encontrada:", config ? "SI" : "NO");
            console.log("📊 Welcome enabled:", config?.welcome?.enabled);
            console.log("📊 Channel ID:", config?.welcome?.channelId);

            if (!config?.welcome?.enabled || !config?.welcome?.channelId) {
                console.log("⚠️ Welcome desactivado o sin canal configurado");
                return;
            }

            const channel = member.guild.channels.cache.get(config.welcome.channelId);
            console.log("📊 Canal encontrado:", channel ? channel.name : "NO ENCONTRADO");

            if (!channel) return;

            const imageBuffer = await generateWelcomeCard(member, config, "welcome");
            const attachment = new AttachmentBuilder(imageBuffer, { name: "welcome.png" });
            const message = parseMessage(config.welcome.message, member, member.guild);

            const embed = new EmbedBuilder()
                .setColor(config.welcome.embedColor || "#ff0033")
                .setDescription(message)
                .setImage("attachment://welcome.png")
                .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
                .setTimestamp();

            await channel.send({ embeds: [embed], files: [attachment] });
            console.log("✅ Mensaje de bienvenida enviado");

        } catch (err) {
            console.error("❌ Error en guildMemberAdd:", err);
        }
    }
};