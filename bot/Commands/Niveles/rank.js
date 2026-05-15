const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const User = require("../../models/User");

// XP necesario por nivel (igual que en messageCreate)
function xpForNextLevel(level) {
    return level * 100 + 100;
}

function getProgress(totalXp) {
    let level = 0;
    let remaining = totalXp;
    while (remaining >= xpForNextLevel(level)) {
        remaining -= xpForNextLevel(level);
        level++;
    }
    return { level, current: remaining, needed: xpForNextLevel(level) };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("Muestra tu nivel o el de otro usuario")
        .addUserOption(o => o.setName("usuario").setDescription("Usuario a consultar")),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser("usuario") || interaction.user;
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        let data = await User.findOne({ userId: target.id, guildId: interaction.guild.id });
        if (!data) data = { xp: 0, level: 0, messages: 0 };

        const { level, current, needed } = getProgress(data.xp || 0);
        const progress = Math.min(100, Math.floor((current / needed) * 100));

        const rank = await User.countDocuments({
            guildId: interaction.guild.id,
            xp: { $gt: data.xp || 0 }
        }) + 1;

        // Canvas 800x200
        const canvas = createCanvas(800, 200);
        const ctx = canvas.getContext("2d");

        // Fondo degradado
        const bg = ctx.createLinearGradient(0, 0, 800, 200);
        bg.addColorStop(0, "#0b0b0f");
        bg.addColorStop(1, "#1a0008");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 800, 200);

        // Puntitos decorativos
        ctx.fillStyle = "rgba(255,0,51,0.05)";
        for (let i = 0; i < 800; i += 25)
            for (let j = 0; j < 200; j += 25) {
                ctx.beginPath(); ctx.arc(i, j, 1, 0, Math.PI * 2); ctx.fill();
            }

        // Avatar
        try {
            const avatar = await loadImage(target.displayAvatarURL({ extension:"png", size:256 }));
            ctx.save();
            ctx.beginPath(); ctx.arc(100, 100, 65, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
            ctx.drawImage(avatar, 35, 35, 130, 130);
            ctx.restore();
            ctx.beginPath(); ctx.arc(100, 100, 67, 0, Math.PI * 2);
            ctx.strokeStyle = "#ff0033"; ctx.lineWidth = 4; ctx.stroke();
        } catch {}

        // Nombre
        ctx.font = "bold 26px Sans"; ctx.fillStyle = "#ffffff";
        ctx.fillText(member?.displayName || target.username, 190, 65);

        // Ranking
        ctx.font = "16px Sans"; ctx.fillStyle = "#ff0033";
        ctx.fillText(`#${rank} en el servidor`, 190, 92);

        // Mensajes
        ctx.font = "14px Sans"; ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(`Mensajes: ${data.messages || 0}`, 190, 118);

        // Nivel y XP (derecha)
        ctx.font = "bold 24px Sans"; ctx.fillStyle = "#ffffff";
        ctx.fillText(`Nivel ${level}`, 590, 60);
        ctx.font = "13px Sans"; ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(`${current} / ${needed} XP`, 590, 82);

        // Barra de progreso
        const bx = 190, by = 140, bw = 560, bh = 22;
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 11); ctx.fill();

        const fill = Math.max(Math.floor((progress / 100) * bw), 22);
        const barGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        barGrad.addColorStop(0, "#ff0033"); barGrad.addColorStop(1, "#ff6b6b");
        ctx.fillStyle = barGrad;
        ctx.beginPath(); ctx.roundRect(bx, by, fill, bh, 11); ctx.fill();

        ctx.font = "bold 12px Sans"; ctx.fillStyle = "#ffffff";
        ctx.fillText(`${progress}%`, bx + fill / 2 - 12, by + 15);

        return interaction.followUp({ files: [new AttachmentBuilder(canvas.toBuffer("image/png"), { name:"rank.png" })] });
    }
};