const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const UserLevel = require("../../models/UserLevel");
const { xpProgress } = require("./levelUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("Muestra tu nivel o el de otro usuario")
        .addUserOption(o => o.setName("usuario").setDescription("Usuario a consultar")),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser("usuario") || interaction.user;
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        let data = await UserLevel.findOne({ userId: target.id, guildId: interaction.guild.id });
        if (!data) data = { xp: 0, level: 0, messages: 0 };

        const { level, current, needed } = xpProgress(data.xp);
        const progress = Math.floor((current / needed) * 100);

        // Ranking
        const rank = await UserLevel.countDocuments({
            guildId: interaction.guild.id,
            xp: { $gt: data.xp }
        }) + 1;

        // Canvas
        const canvas = createCanvas(800, 200);
        const ctx = canvas.getContext("2d");

        // Fondo
        const gradient = ctx.createLinearGradient(0, 0, 800, 200);
        gradient.addColorStop(0, "#0b0b0f");
        gradient.addColorStop(1, "#1a0008");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 200);

        // Patrón puntitos
        ctx.fillStyle = "rgba(255,0,51,0.05)";
        for (let i = 0; i < 800; i += 25) {
            for (let j = 0; j < 200; j += 25) {
                ctx.beginPath();
                ctx.arc(i, j, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Avatar circular
        try {
            const avatarUrl = target.displayAvatarURL({ extension: "png", size: 256 });
            const avatar = await loadImage(avatarUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(100, 100, 65, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 35, 35, 130, 130);
            ctx.restore();

            // Borde avatar
            ctx.beginPath();
            ctx.arc(100, 100, 67, 0, Math.PI * 2);
            ctx.strokeStyle = "#ff0033";
            ctx.lineWidth = 4;
            ctx.stroke();
        } catch {}

        // Nombre
        ctx.font = "bold 28px Sans";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(member?.displayName || target.username, 190, 70);

        // Ranking
        ctx.font = "18px Sans";
        ctx.fillStyle = "#ff0033";
        ctx.fillText(`#${rank} en el servidor`, 190, 100);

        // Stats
        ctx.font = "15px Sans";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText(`Mensajes: ${data.messages || 0}`, 190, 125);

        // Nivel y XP
        ctx.font = "bold 22px Sans";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Nivel ${level}`, 600, 60);
        ctx.font = "14px Sans";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(`${current} / ${needed} XP`, 600, 85);

        // Barra de progreso
        const barX = 190, barY = 145, barW = 560, barH = 20;
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 10);
        ctx.fill();

        const fillW = Math.floor((progress / 100) * barW);
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, "#ff0033");
        barGrad.addColorStop(1, "#ff6b6b");
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, Math.max(fillW, 20), barH, 10);
        ctx.fill();

        ctx.font = "bold 13px Sans";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${progress}%`, barX + fillW / 2 - 10, barY + 14);

        const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "rank.png" });
        return interaction.followUp({ files: [attachment] });
    }
};