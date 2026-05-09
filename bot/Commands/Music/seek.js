const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("seek")
        .setDescription("Salta a un momento específico de la canción")
        .addStringOption(o =>
            o.setName("tiempo")
                .setDescription("Tiempo en formato mm:ss (ej: 1:30)")
                .setRequired(true)
        ),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        const tiempoStr = interaction.options.getString("tiempo");

        if (!queue || !queue.isPlaying())
            return interaction.reply({ content: "❌ No hay música reproduciéndose", ephemeral: true });

        // Parsear mm:ss o ss
        const parts = tiempoStr.split(":").map(Number);
        let ms;
        if (parts.length === 2) {
            ms = (parts[0] * 60 + parts[1]) * 1000;
        } else {
            ms = parts[0] * 1000;
        }

        if (isNaN(ms) || ms < 0)
            return interaction.reply({ content: "❌ Formato de tiempo inválido. Usa mm:ss (ej: 1:30)", ephemeral: true });

        await queue.node.seek(ms);

        const embed = new EmbedBuilder()
            .setColor(0xff0033)
            .setTitle("⏩ Posición cambiada")
            .setDescription(`Saltando a **${tiempoStr}** en **${queue.currentTrack?.title}**`);

        return interaction.reply({ embeds: [embed] });
    }
};