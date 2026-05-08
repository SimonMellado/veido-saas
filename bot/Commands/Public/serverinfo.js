const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Muestra información del servidor"),

    async execute(interaction) {
        const { guild } = interaction;
        await guild.fetch();

        const owner = await guild.fetchOwner();
        const channels = guild.channels.cache;
        const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
        const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;

        const members = guild.members.cache;
        const humans = members.filter(m => !m.user.bot).size;
        const bots = members.filter(m => m.user.bot).size;

        const verificationLevels = {
            0: "Ninguno",
            1: "Bajo",
            2: "Medio",
            3: "Alto",
            4: "Muy Alto"
        };

        const boostTiers = {
            0: "Sin nivel",
            1: "Nivel 1 🥉",
            2: "Nivel 2 🥈",
            3: "Nivel 3 🥇"
        };

        const embed = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
            .setTitle("🏠 Información del Servidor")
            .setColor("#ff0033")
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
                { name: "🪪 ID", value: guild.id, inline: true },
                { name: "👑 Dueño", value: `${owner.user.tag}`, inline: true },
                { name: "📅 Creado", value: `<t:${Math.floor(guild.createdAt / 1000)}:D>`, inline: true },
                { name: "👥 Miembros", value: `Total: **${guild.memberCount}**\nHumanos: **${humans}**\nBots: **${bots}**`, inline: true },
                { name: "💬 Canales", value: `Texto: **${textChannels}**\nVoz: **${voiceChannels}**\nCategorías: **${categories}**`, inline: true },
                { name: "🎭 Roles", value: `${guild.roles.cache.size}`, inline: true },
                { name: "🔒 Verificación", value: verificationLevels[guild.verificationLevel], inline: true },
                { name: "💎 Boosts", value: `${guild.premiumSubscriptionCount} boosts\n${boostTiers[guild.premiumTier]}`, inline: true },
                { name: "😀 Emojis", value: `${guild.emojis.cache.size}`, inline: true }
            )
            .setImage(guild.bannerURL({ size: 1024 }) || null)
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};