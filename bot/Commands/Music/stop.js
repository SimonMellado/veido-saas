const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Detiene la música, limpia la cola y desconecta el bot"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue)
            return interaction.reply({ content: "❌ No hay música reproduciéndose", ephemeral: true });

        const trackCount = queue.tracks.size;
        queue.delete();

        const embed = new EmbedBuilder()
            .setColor(0xff0033)
            .setTitle("⏹️ Música detenida")
            .setDescription("La cola fue limpiada y el bot desconectado")
            .addFields({ name: "Canciones eliminadas", value: `${trackCount + 1}`, inline: true });

        return interaction.reply({ embeds: [embed] });
    }
};