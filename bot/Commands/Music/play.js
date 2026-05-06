const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce música")
        .addStringOption(o =>
            o.setName("query")
                .setDescription("Canción o link")
                .setRequired(true)
        ),

    async execute(interaction) {
        const player = interaction.client.player;
        const channel = interaction.member.voice.channel;
        const query = interaction.options.getString("query");

        if (!channel)
            return interaction.reply({
                content: "❌ Entra a un canal de voz",
                ephemeral: true
            });

        await interaction.deferReply();

        try {
            const result = await player.play(channel, query, {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel
                    },
                    volume: 80,
                    leaveOnEmpty: true,
                    leaveOnEnd: true,
                    leaveOnStop: true
                }
            });

            const track = result?.track || result;

            return interaction.followUp(`🎶 Reproduciendo: **${track.title}**`);

        } catch (err) {
            console.log("❌ PLAY ERROR:", err);

            return interaction.followUp(
                "❌ No pude reproducir esa canción. Prueba con otro nombre o link de YouTube."
            );
        }
    }
};