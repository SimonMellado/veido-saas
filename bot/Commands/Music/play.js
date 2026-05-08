const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce música desde YouTube, Spotify, SoundCloud y más")
        .addStringOption(o =>
            o.setName("query")
                .setDescription("Nombre de canción, link de YouTube, Spotify, SoundCloud...")
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

        const permissions = channel.permissionsFor(interaction.guild.members.me);
        if (!permissions?.has("Connect") || !permissions?.has("Speak")) {
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

                    // ✅ FIX: El bot NO sale cuando termina una canción
                    // Solo sale si el canal queda vacío por 30 segundos
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 30000,

                    // ✅ FIX: No salir al terminar la cola ni al hacer stop manual
                    leaveOnEnd: false,
                    leaveOnStop: false,

                    selfDeaf: true
                }
            });

            const track = result?.track;

            if (!track) {
                return interaction.followUp(
                    "❌ No encontré esa canción. Prueba con otro nombre o link directo de YouTube."
                );
            }

            // Detectar si es playlist
            const isPlaylist = result?.playlist;

            if (isPlaylist) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0033)
                    .setTitle("🎵 Playlist añadida")
                    .setDescription(`**${result.playlist.title}**`)
                    .addFields(
                        { name: "Canciones", value: `${result.playlist.tracks.length}`, inline: true },
                        { name: "Primera canción", value: track.title, inline: true }
                    )
                    .setThumbnail(result.playlist.thumbnail || track.thumbnail || null);

                return interaction.followUp({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor(0xff0033)
                .setTitle("🎶 Reproduciendo")
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

            // Mensajes de error específicos según el problema
            let errorMsg = "❌ No pude reproducir esa canción.";

            if (err.message?.includes("sign in") || err.message?.includes("bot")) {
                errorMsg = "❌ YouTube está bloqueando la reproducción. Prueba con un link de SoundCloud o el nombre de la canción.";
            } else if (err.message?.includes("spotify")) {
                errorMsg = "❌ Error con Spotify. Prueba pegando el nombre de la canción en lugar del link.";
            } else if (err.message?.includes("No results")) {
                errorMsg = "❌ No encontré resultados para esa búsqueda. Prueba con otro nombre.";
            }

            return interaction.followUp(errorMsg);
        }
    }
};