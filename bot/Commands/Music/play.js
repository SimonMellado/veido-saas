const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce música desde YouTube, Spotify, SoundCloud y más")
        .addStringOption(o =>
            o.setName("query")
                .setDescription("Nombre de canción, link de YouTube, Spotify, SoundCloud...")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const player = client.player;
        const channel = interaction.member?.voice?.channel;
        const query = interaction.options.getString("query");

        if (!channel) return interaction.reply({ content: "❌ Debes estar en un canal de voz primero", ephemeral: true });

        const permissions = channel.permissionsFor(interaction.guild.members.me);
        if (!permissions?.has("Connect") || !permissions?.has("Speak"))
            return interaction.reply({ content: "❌ No tengo permisos para entrar a tu canal de voz", ephemeral: true });

        await interaction.deferReply();

        try {
            const result = await player.play(channel, query, {
                nodeOptions: {
                    metadata: { channel: interaction.channel, interaction },
                    volume: 80,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 30000,
                    leaveOnEnd: false,
                    leaveOnStop: false,
                    selfDeaf: true,
                    bufferingTimeout: 3000
                }
            });

            const track = result?.track;
            if (!track) return interaction.followUp("❌ No encontré esa canción. Prueba con otro nombre o link.");

            const isPlaylist = result?.playlist;

            if (isPlaylist) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0033)
                    .setTitle("🎵 Playlist añadida a la cola")
                    .setDescription(`**${result.playlist.title}**`)
                    .addFields(
                        { name: "Canciones", value: `${result.playlist.tracks.length}`, inline: true },
                        { name: "Primera canción", value: track.title, inline: true }
                    )
                    .setThumbnail(result.playlist.thumbnail || track.thumbnail || null)
                    .setFooter({ text: `Pedido por ${interaction.user.username}` });
                return interaction.followUp({ embeds: [embed] });
            }

            // Verificar si ya hay algo reproduciéndose
            const queue = useQueue(interaction.guild.id);
            const isPlaying = queue?.isPlaying();

            const embed = new EmbedBuilder()
                .setColor(0xff0033)
                .setTitle(isPlaying ? "✅ Añadido a la cola" : "🎶 Reproduciendo ahora")
                .setDescription(`**${track.title}**`)
                .addFields(
                    { name: "Artista", value: track.author || "Desconocido", inline: true },
                    { name: "Duración", value: track.duration || "—", inline: true },
                    { name: "Fuente", value: track.source || "Desconocido", inline: true }
                )
                .setThumbnail(track.thumbnail || null)
                .setFooter({ text: `Pedido por ${interaction.user.username}` });

            return interaction.followUp({ embeds: [embed] });

        } catch (err) {
            console.error("❌ PLAY ERROR:", err);
            let errorMsg = "❌ No pude reproducir esa canción.";
            if (err.message?.includes("sign in") || err.message?.includes("bot"))
                errorMsg = "❌ YouTube está bloqueando. Prueba con SoundCloud o el nombre de la canción.";
            else if (err.message?.includes("No results") || err.message?.includes("NoResult"))
                errorMsg = "❌ No encontré resultados. Prueba con otro nombre.";
            return interaction.followUp(errorMsg);
        }
    }
};