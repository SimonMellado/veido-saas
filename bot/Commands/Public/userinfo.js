const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Muestra información de un usuario")
        .addUserOption(o => o.setName("target").setDescription("Usuario (deja vacío para verte a ti)")),

    async execute(interaction) {
        const user = interaction.options.getUser("target") || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const badges = {
            Staff: "👮 Discord Staff",
            Partner: "🤝 Discord Partner",
            Hypesquad: "🏠 HypeSquad Events",
            BugHunterLevel1: "🐛 Bug Hunter",
            BugHunterLevel2: "🐛 Bug Hunter Gold",
            HypeSquadOnlineHouse1: "🏠 Bravery",
            HypeSquadOnlineHouse2: "🏠 Brilliance",
            HypeSquadOnlineHouse3: "🏠 Balance",
            PremiumEarlySupporter: "⭐ Early Supporter",
            VerifiedDeveloper: "👨‍💻 Verified Developer",
            ActiveDeveloper: "🔨 Active Developer",
        };

        const userFlags = user.flags?.toArray() || [];
        const badgeList = userFlags.map(f => badges[f]).filter(Boolean).join("\n") || "Ninguno";

        const accountAge = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
        const joinAge = member ? Math.floor((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)) : null;

        const roles = member?.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => `<@&${r.id}>`)
            .slice(0, 10)
            .join(" ") || "Ninguno";

        const embed = new EmbedBuilder()
            .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .setTitle("👤 Información de usuario")
            .setColor(member?.displayHexColor || "#ff0033")
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: "🪪 ID", value: user.id, inline: true },
                { name: "🤖 Bot", value: user.bot ? "Sí" : "No", inline: true },
                { name: "📅 Cuenta creada", value: `<t:${Math.floor(user.createdAt / 1000)}:D>\n(hace ${accountAge} días)`, inline: true },
            );

        if (member) {
            embed.addFields(
                { name: "📥 Se unió al servidor", value: `<t:${Math.floor(member.joinedAt / 1000)}:D>\n(hace ${joinAge} días)`, inline: true },
                { name: "🎭 Apodo", value: member.nickname || "Ninguno", inline: true },
                { name: "🏆 Rol más alto", value: `<@&${member.roles.highest.id}>`, inline: true },
                { name: `📋 Roles (${member.roles.cache.size - 1})`, value: roles }
            );
        }

        embed.addFields({ name: "🏅 Insignias", value: badgeList })
             .setImage(user.bannerURL({ size: 512 }) || null)
             .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};