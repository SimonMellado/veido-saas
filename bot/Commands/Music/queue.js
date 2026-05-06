const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Muestra la cola de música"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.tracks.size) {
            return interaction.reply("📭 La cola está vacía");
        }

        const tracks = queue.tracks.toArray().slice(0, 10);

        let description = tracks
            .map((t, i) => `${i + 1}. ${t.title}`)
            .join("\n");

        return interaction.reply({
            content: `🎵 **Cola de música:**\n${description}`
        });
    }
};