const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

const CATEGORIES = {
    moderacion: {
        label: "🛡️ Moderación",
        description: "Comandos para moderar el servidor",
        commands: [
            { name: "/ban", desc: "Banea a un usuario" },
            { name: "/unban", desc: "Desbanea a un usuario por ID" },
            { name: "/kick", desc: "Expulsa a un usuario" },
            { name: "/timeout", desc: "Silencia temporalmente a un usuario" },
            { name: "/untimeout", desc: "Quita el silencio a un usuario" },
            { name: "/warn", desc: "Advierte a un usuario con DM" },
        ]
    },
    musica: {
        label: "🎵 Música",
        description: "Comandos para reproducir música",
        commands: [
            { name: "/play", desc: "Reproduce desde YouTube, Spotify, SoundCloud" },
            { name: "/nowplaying", desc: "Canción actual con botones de control" },
            { name: "/queue", desc: "Cola con paginación y controles" },
            { name: "/skip", desc: "Salta la canción actual" },
            { name: "/stop", desc: "Detiene la música" },
            { name: "/pause", desc: "Pausa la música" },
            { name: "/resume", desc: "Reanuda la música" },
            { name: "/volume", desc: "Ajusta el volumen (1-100)" },
            { name: "/loop", desc: "Repite canción/cola/autoplay" },
            { name: "/seek", desc: "Salta a un momento (mm:ss)" },
        ]
    },
    niveles: {
        label: "⭐ Niveles",
        description: "Sistema de experiencia y niveles",
        commands: [
            { name: "/rank", desc: "Muestra tu nivel con tarjeta visual" },
            { name: "/leaderboard", desc: "Top 10 usuarios con más nivel" },
        ]
    },
    diversión: {
        label: "😂 Diversión",
        description: "Comandos de entretenimiento",
        commands: [
            { name: "/meme", desc: "Meme aleatorio de Reddit" },
            { name: "/joke", desc: "Chiste aleatorio en español" },
            { name: "/coinflip", desc: "Lanza una moneda" },
        ]
    },
    info: {
        label: "ℹ️ Información",
        description: "Información del servidor y usuarios",
        commands: [
            { name: "/userinfo", desc: "Info detallada de un usuario" },
            { name: "/serverinfo", desc: "Info del servidor" },
            { name: "/ping", desc: "Latencia del bot" },
        ]
    }
};

function buildCategoryEmbed(categoryId, guild) {
    const cat = CATEGORIES[categoryId];
    return new EmbedBuilder()
        .setColor(0xff0033)
        .setTitle(cat.label)
        .setDescription(cat.description)
        .addFields(
            cat.commands.map(cmd => ({
                name: cmd.name,
                value: cmd.desc,
                inline: true
            }))
        )
        .setFooter({ text: `${guild.name} • Veido Bot` })
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Muestra todos los comandos disponibles"),

    async execute(interaction) {
        const mainEmbed = new EmbedBuilder()
            .setColor(0xff0033)
            .setTitle("📚 Comandos de Veido Bot")
            .setDescription("Selecciona una categoría del menú para ver sus comandos")
            .addFields(
                Object.entries(CATEGORIES).map(([, cat]) => ({
                    name: cat.label,
                    value: cat.description,
                    inline: true
                }))
            )
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: "Veido Bot • Dashboard: veido-dashboard.vercel.app" })
            .setTimestamp();

        const menu = new StringSelectMenuBuilder()
            .setCustomId("help_menu")
            .setPlaceholder("📂 Selecciona una categoría")
            .addOptions(
                Object.entries(CATEGORIES).map(([id, cat]) => ({
                    label: cat.label,
                    description: cat.description,
                    value: id
                }))
            );

        const row = new ActionRowBuilder().addComponents(menu);
        const msg = await interaction.reply({ embeds: [mainEmbed], components: [row], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ time: 120000 });

        collector.on("collect", async select => {
            if (select.user.id !== interaction.user.id)
                return select.reply({ content: "❌ Este menú no es para ti", ephemeral: true });

            await select.deferUpdate();
            const embed = buildCategoryEmbed(select.values[0], interaction.guild);
            await msg.edit({ embeds: [embed], components: [row] });
        });

        collector.on("end", () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};