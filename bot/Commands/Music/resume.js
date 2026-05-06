const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Reanuda la música"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue) return interaction.reply("❌ No hay música");

        queue.node.setPaused(false);
        return interaction.reply("▶️ Música reanudada");
    }
};