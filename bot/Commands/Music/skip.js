const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Salta la canción actual"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: "❌ No hay música reproduciéndose", ephemeral: true });
        }

        const track = queue.currentTrack;
        queue.node.skip();
        return interaction.reply(`⏭️ Saltando: **${track?.title || "canción actual"}**`);
    }
};