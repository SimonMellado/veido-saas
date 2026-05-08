const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("Muestra la canción que está sonando"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: "❌ No hay música reproduciéndose", ephemeral: true });
        }

        const track = queue.currentTrack;
        const progress = queue.node.createProgressBar();

        const embed = new EmbedBuilder()
            .setColor(0xff0033)
            .setTitle("🎶 Sonando ahora")
            .setDescription(`**${track.title}**\n👤 ${track.author}`)
            .addFields(
                { name: "Progreso", value: progress || "—" },
                { name: "Duración", value: track.duration, inline: true },
                { name: "Fuente", value: track.source || "Desconocido", inline: true }
            )
            .setThumbnail(track.thumbnail || null);

        return interaction.reply({ embeds: [embed] });
    }
};