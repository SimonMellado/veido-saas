const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");

function xpForNextLevel(level) { return level * 100 + 100; }

function getLevel(totalXp) {
    let level = 0, xp = totalXp;
    while (xp >= xpForNextLevel(level)) { xp -= xpForNextLevel(level); level++; }
    return level;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Muestra el top 10 de usuarios con más nivel"),

    async execute(interaction) {
        await interaction.deferReply();

        const top = await User.find({ guildId: interaction.guild.id })
            .sort({ xp: -1 }).limit(10);

        if (!top.length) return interaction.followUp("📭 Nadie tiene XP todavía. ¡Empieza a chatear!");

        const medals = ["🥇","🥈","🥉"];
        const lines = await Promise.all(top.map(async (u, i) => {
            const level = getLevel(u.xp || 0);
            let name;
            try { const m = await interaction.guild.members.fetch(u.userId); name = m.displayName; }
            catch { name = `Usuario`; }
            return `${medals[i] || `\`${i+1}.\``} **${name}** — Nivel ${level} · ${u.xp || 0} XP · ${u.messages || 0} msgs`;
        }));

        return interaction.followUp({ embeds: [
            new EmbedBuilder()
                .setColor(0xff0033)
                .setTitle(`🏆 Top 10 — ${interaction.guild.name}`)
                .setDescription(lines.join("\n"))
                .setThumbnail(interaction.guild.iconURL())
                .setFooter({ text: "Gana XP chateando • Cooldown: 1 minuto" })
                .setTimestamp()
        ]});
    }
};