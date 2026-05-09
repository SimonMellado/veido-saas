const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Salta la canción actual o a una posición de la cola")
        .addIntegerOption(o =>
            o.setName("posicion")
                .setDescription("Posición en la cola a la que saltar (opcional)")
                .setMinValue(1)
        ),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        const posicion = interaction.options.getInteger("posicion");

        if (!queue || !queue.isPlaying())
            return interaction.reply({ content: "❌ No hay música reproduciéndose", ephemeral: true });

        const current = queue.currentTrack;

        if (posicion) {
            const tracks = queue.tracks.toArray();
            if (posicion > tracks.length)
                return interaction.reply({ content: `❌ La cola solo tiene ${tracks.length} canciones`, ephemeral: true });

            // Eliminar canciones hasta la posición
            for (let i = 0; i < posicion - 1; i++) {
                queue.tracks.store.shift();
            }
        }

        queue.node.skip();

        const embed = new EmbedBuilder()
            .setColor(0xff0033)
            .setTitle("⏭️ Canción saltada")
            .setDescription(`Saltando: **${current?.title || "canción actual"}**`)
            .addFields({ name: "En cola", value: `${queue.tracks.size} canción(es)`, inline: true });

        return interaction.reply({ embeds: [embed] });
    }
};