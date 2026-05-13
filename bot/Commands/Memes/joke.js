const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("joke")
        .setDescription("Obtiene un chiste aleatorio en español"),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const res = await axios.get("https://v2.jokeapi.dev/joke/Any?lang=es&blacklistFlags=nsfw,racist,sexist,explicit&type=twopart", {
                headers: { "Accept": "application/json" }
            });

            const joke = res.data;

            const embed = new EmbedBuilder()
                .setColor(0xff0033)
                .setTitle("😂 Chiste del día")
                .addFields(
                    { name: "Setup", value: joke.setup || "—" },
                    { name: "Remate", value: `||${joke.delivery || "—"}||` }
                )
                .setFooter({ text: "Haz clic en el remate para verlo" });

            return interaction.followUp({ embeds: [embed] });
        } catch {
            const chistes = [
                { setup: "¿Por qué el libro de matemáticas está triste?", delivery: "Porque tiene muchos problemas." },
                { setup: "¿Qué le dice un techo a otro techo?", delivery: "Nada, los techos no hablan." },
                { setup: "¿Cómo se llama el campeón de buceo de Japón?", delivery: "Tokofondo." },
            ];
            const c = chistes[Math.floor(Math.random() * chistes.length)];
            const embed = new EmbedBuilder()
                .setColor(0xff0033)
                .setTitle("😂 Chiste del día")
                .addFields(
                    { name: "Setup", value: c.setup },
                    { name: "Remate", value: `||${c.delivery}||` }
                );
            return interaction.followUp({ embeds: [embed] });
        }
    }
};