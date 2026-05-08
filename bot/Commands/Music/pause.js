const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("Pausa la música actual"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: "❌ No hay música reproduciéndose", ephemeral: true });
        }

        if (queue.node.isPaused()) {
            return interaction.reply({ content: "⏸️ La música ya está pausada", ephemeral: true });
        }

        queue.node.setPaused(true);
        return interaction.reply("⏸️ Música pausada. Usa `/resume` para continuar.");
    }
};