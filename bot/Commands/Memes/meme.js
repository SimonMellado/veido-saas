const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const SUBREDDITS = ["memes", "dankmemes", "me_irl", "AdviceAnimals", "funny"];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("meme")
        .setDescription("Obtiene un meme aleatorio de Reddit")
        .addStringOption(o =>
            o.setName("tipo")
                .setDescription("Tipo de meme")
                .addChoices(
                    { name: "🔥 Dank Memes", value: "dankmemes" },
                    { name: "😂 Memes", value: "memes" },
                    { name: "🙂 Me IRL", value: "me_irl" },
                    { name: "😆 Funny", value: "funny" },
                    { name: "🎲 Aleatorio", value: "random" }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        let sub = interaction.options.getString("tipo") || "random";
        if (sub === "random") sub = SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)];

        try {
            const res = await axios.get(`https://www.reddit.com/r/${sub}/random.json?limit=1`, {
                headers: { "User-Agent": "VeidoBot/1.0" }
            });

            const post = res.data[0]?.data?.children[0]?.data;
            if (!post || post.over_18) return interaction.followUp("❌ No encontré un meme apropiado, intenta de nuevo");

            const embed = new EmbedBuilder()
                .setColor(0xff0033)
                .setTitle(post.title.length > 256 ? post.title.substring(0, 253) + "..." : post.title)
                .setImage(post.url)
                .setFooter({ text: `r/${sub} • 👍 ${post.ups} • 💬 ${post.num_comments}` })
                .setURL(`https://reddit.com${post.permalink}`);

            return interaction.followUp({ embeds: [embed] });
        } catch {
            return interaction.followUp("❌ No pude obtener un meme en este momento. Intenta de nuevo.");
        }
    }
};