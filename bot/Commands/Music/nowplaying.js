const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("Muestra la canción que está sonando con controles"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying())
            return interaction.reply({ content: "❌ No hay música reproduciéndose", ephemeral: true });

        const track = queue.currentTrack;
        const progress = queue.node.createProgressBar();
        const volume = queue.node.volume;
        const isPaused = queue.node.isPaused();

        const embed = new EmbedBuilder()
            .setColor(0xff0033)
            .setTitle(`${isPaused ? "⏸️ Pausado" : "🎶 Sonando ahora"}`)
            .setDescription(`**${track.title}**\n👤 ${track.author}`)
            .addFields(
                { name: "Progreso", value: progress || "—" },
                { name: "Duración", value: track.duration, inline: true },
                { name: "Fuente", value: track.source || "—", inline: true },
                { name: "Volumen", value: `${volume}%`, inline: true },
                { name: "En cola", value: `${queue.tracks.size} canción(es)`, inline: true }
            )
            .setThumbnail(track.thumbnail || null)
            .setFooter({ text: `Pedido por ${track.requestedBy?.username || "Desconocido"}` });

        // Botones de control
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("np_prev").setEmoji("⏮️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("np_pause").setEmoji(isPaused ? "▶️" : "⏸️").setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("np_skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("np_stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("np_queue").setEmoji("📋").setStyle(ButtonStyle.Secondary)
        );

        const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        // Collector para los botones (60 segundos)
        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on("collect", async btn => {
            if (btn.user.id !== interaction.user.id)
                return btn.reply({ content: "❌ Solo quien usó el comando puede usar estos botones", ephemeral: true });

            const q = useQueue(interaction.guild.id);
            if (!q) return btn.reply({ content: "❌ Ya no hay música", ephemeral: true });

            await btn.deferUpdate();

            switch (btn.customId) {
                case "np_pause":
                    q.node.setPaused(!q.node.isPaused());
                    break;
                case "np_skip":
                    q.node.skip();
                    break;
                case "np_stop":
                    q.delete();
                    break;
                case "np_queue": {
                    const tracks = q.tracks.toArray().slice(0, 10);
                    const qEmbed = new EmbedBuilder()
                        .setColor(0xff0033)
                        .setTitle("📋 Cola de música")
                        .setDescription(tracks.length > 0
                            ? tracks.map((t, i) => `${i + 1}. **${t.title}** — ${t.author}`).join("\n")
                            : "_La cola está vacía_");
                    await btn.followUp({ embeds: [qEmbed], ephemeral: true });
                    return;
                }
            }

            // Actualizar embed
            const updatedTrack = q.currentTrack;
            if (!updatedTrack) return;
            const updatedEmbed = EmbedBuilder.from(embed)
                .setTitle(`${q.node.isPaused() ? "⏸️ Pausado" : "🎶 Sonando ahora"}`)
                .setDescription(`**${updatedTrack.title}**\n👤 ${updatedTrack.author}`);

            const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("np_prev").setEmoji("⏮️").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("np_pause").setEmoji(q.node.isPaused() ? "▶️" : "⏸️").setStyle(q.node.isPaused() ? ButtonStyle.Success : ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("np_skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("np_stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("np_queue").setEmoji("📋").setStyle(ButtonStyle.Secondary)
            );

            await msg.edit({ embeds: [updatedEmbed], components: [updatedRow] });
        });

        collector.on("end", () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};