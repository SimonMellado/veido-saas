const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("Lanza una moneda")
        .addStringOption(o =>
            o.setName("eleccion")
                .setDescription("Elige cara o sello")
                .addChoices(
                    { name: "🪙 Cara", value: "cara" },
                    { name: "🔵 Sello", value: "sello" }
                )
        ),

    async execute(interaction) {
        const eleccion = interaction.options.getString("eleccion");
        const resultado = Math.random() < 0.5 ? "cara" : "sello";
        const gano = eleccion ? eleccion === resultado : null;

        const embed = new EmbedBuilder()
            .setColor(gano === null ? 0xff0033 : gano ? 0x22c55e : 0xff0033)
            .setTitle("🪙 Lanzamiento de moneda")
            .setDescription(`Resultado: **${resultado === "cara" ? "🪙 Cara" : "🔵 Sello"}**`)
            .addFields(
                eleccion ? { name: "Tu elección", value: eleccion === "cara" ? "🪙 Cara" : "🔵 Sello", inline: true } : { name: "\u200b", value: "\u200b", inline: true },
                { name: "Resultado", value: gano === null ? "—" : gano ? "✅ Ganaste!" : "❌ Perdiste!", inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    }
};