const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Reanuda la música pausada"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue) {
            return interaction.reply({ content: "❌ No hay música en la cola", ephemeral: true });
        }

        if (!queue.node.isPaused()) {
            return interaction.reply({ content: "▶️ La música ya está reproduciéndose", ephemeral: true });
        }

        queue.node.setPaused(false);
        return interaction.reply("▶️ Música reanudada");
    }
};