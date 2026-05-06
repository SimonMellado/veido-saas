const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Detiene la música y limpia la cola"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue) return interaction.reply("❌ No hay música");

        queue.delete();
        return interaction.reply("🛑 Música detenida");
    }
};