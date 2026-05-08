const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Muestra la cola de música"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || (!queue.isPlaying() && !queue.tracks.size)) {
            return interaction.reply({ content: "📭 La cola está vacía", ephemeral: true });
        }

        const current = queue.currentTrack;
        const tracks = queue.tracks.toArray().slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor(0xff0033)
            .setTitle("🎵 Cola de música")
            .setDescription(
                (current ? `▶️ **Ahora:** ${current.title} — ${current.author}\n\n` : "") +
                (tracks.length > 0
                    ? tracks.map((t, i) => `${i + 1}. **${t.title}** — ${t.author}`).join("\n")
                    : "_No hay más canciones en la cola_")
            )
            .setFooter({
                text: `${queue.tracks.size} canción(es) en cola`
            });

        return interaction.reply({ embeds: [embed] });
    }
};