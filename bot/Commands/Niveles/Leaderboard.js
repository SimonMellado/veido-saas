const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserLevel = require("../../models/UserLevel");
const { xpProgress } = require("./levelUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Muestra el top 10 de usuarios con más nivel"),

    async execute(interaction) {
        await interaction.deferReply();

        const top = await UserLevel.find({ guildId: interaction.guild.id })
            .sort({ xp: -1 })
            .limit(10);

        if (!top.length) return interaction.followUp("📭 Nadie tiene XP todavía. ¡Empieza a chatear!");

        const medals = ["🥇", "🥈", "🥉"];

        const lines = await Promise.all(top.map(async (u, i) => {
            const { level, current, needed } = xpProgress(u.xp);
            let name;
            try {
                const member = await interaction.guild.members.fetch(u.userId);
                name = member.displayName;
            } catch {
                name = `Usuario (${u.userId.slice(-4)})`;
            }
            const medal = medals[i] || `\`${i + 1}.\``;
            return `${medal} **${name}** — Nivel ${level} (${u.xp} XP)`;
        }));

        const embed = new EmbedBuilder()
            .setColor(0xff0033)
            .setTitle(`🏆 Top 10 — ${interaction.guild.name}`)
            .setDescription(lines.join("\n"))
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: "Gana XP chateando en el servidor" })
            .setTimestamp();

        return interaction.followUp({ embeds: [embed] });
    }
};