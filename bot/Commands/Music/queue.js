const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Muestra la cola de música")
        .addIntegerOption(o => o.setName("pagina").setDescription("Página de la cola").setMinValue(1)),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || (!queue.isPlaying() && !queue.tracks.size))
            return interaction.reply({ content: "📭 La cola está vacía", ephemeral: true });

        const pageSize = 10;
        const tracks = queue.tracks.toArray();
        const totalPages = Math.max(1, Math.ceil(tracks.length / pageSize));
        let page = (interaction.options.getInteger("pagina") || 1) - 1;
        if (page >= totalPages) page = totalPages - 1;

        const buildEmbed = (p) => {
            const start = p * pageSize;
            const pageTracks = tracks.slice(start, start + pageSize);
            const current = queue.currentTrack;

            return new EmbedBuilder()
                .setColor(0xff0033)
                .setTitle("🎵 Cola de música")
                .setDescription(
                    (current ? `▶️ **Ahora:** ${current.title} — ${current.author}\n\n` : "") +
                    (pageTracks.length > 0
                        ? pageTracks.map((t, i) => `\`${start + i + 1}.\` **${t.title}** — ${t.author} [${t.duration}]`).join("\n")
                        : "_No hay más canciones_")
                )
                .setFooter({ text: `Página ${p + 1}/${totalPages} • ${tracks.length} canciones en cola` });
        };

        const buildRow = (p) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("q_prev").setEmoji("◀️").setStyle(ButtonStyle.Secondary).setDisabled(p === 0),
            new ButtonBuilder().setCustomId("q_next").setEmoji("▶️").setStyle(ButtonStyle.Secondary).setDisabled(p >= totalPages - 1),
            new ButtonBuilder().setCustomId("q_shuffle").setEmoji("🔀").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("q_clear").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
        );

        const msg = await interaction.reply({
            embeds: [buildEmbed(page)],
            components: totalPages > 1 || tracks.length > 0 ? [buildRow(page)] : [],
            fetchReply: true
        });

        if (totalPages <= 1 && tracks.length === 0) return;

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on("collect", async btn => {
            if (btn.user.id !== interaction.user.id)
                return btn.reply({ content: "❌ Solo quien usó el comando puede usar estos botones", ephemeral: true });

            await btn.deferUpdate();
            const q = useQueue(interaction.guild.id);

            switch (btn.customId) {
                case "q_prev": page = Math.max(0, page - 1); break;
                case "q_next": page = Math.min(totalPages - 1, page + 1); break;
                case "q_shuffle":
                    if (q) q.tracks.shuffle();
                    break;
                case "q_clear":
                    if (q) q.tracks.clear();
                    await msg.edit({ embeds: [buildEmbed(0).setDescription("🗑️ Cola limpiada")], components: [] });
                    return;
            }

            await msg.edit({ embeds: [buildEmbed(page)], components: [buildRow(page)] });
        });

        collector.on("end", () => msg.edit({ components: [] }).catch(() => {}));
    }
};