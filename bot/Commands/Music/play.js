const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce música desde YouTube, Spotify o SoundCloud")
        .addStringOption(o =>
            o.setName("query")
                .setDescription("Nombre de la canción o link")
                .setRequired(true)
        ),

    async execute(interaction) {
        const player = interaction.client.player;
        const channel = interaction.member?.voice?.channel;
        const query = interaction.options.getString("query");

        if (!channel) {
            return interaction.reply({
                content: "❌ Debes estar en un canal de voz primero",
                ephemeral: true
            });
        }

        // Verificar que el bot puede unirse al canal
        const permissions = channel.permissionsFor(interaction.guild.members.me);
        if (!permissions.has("Connect") || !permissions.has("Speak")) {
            return interaction.reply({
                content: "❌ No tengo permisos para entrar a tu canal de voz",
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const result = await player.play(channel, query, {
                nodeOptions: {
                    metadata: { channel: interaction.channel },
                    volume: 80,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 5000,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 5000,
                    leaveOnStop: true,
                    selfDeaf: true
                }
            });

            const track = result?.track;

            if (!track) {
                return interaction.followUp("❌ No encontré esa canción. Prueba con otro nombre o link.");
            }

            return interaction.followUp(
                `🎶 **Reproduciendo:** ${track.title}\n` +
                `👤 **Artista:** ${track.author}\n` +
                `⏱️ **Duración:** ${track.duration}`
            );

        } catch (err) {
            console.error("❌ PLAY ERROR:", err);
            return interaction.followUp(
                "❌ No pude reproducir esa canción. Prueba con otro nombre o link de YouTube/Spotify."
            );
        }
    }
};