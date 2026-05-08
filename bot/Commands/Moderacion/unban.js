const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Desbanea a un usuario del servidor")
        .addStringOption(o => o.setName("userid").setDescription("ID del usuario a desbanear").setRequired(true))
        .addStringOption(o => o.setName("razon").setDescription("Razón del desbaneo"))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction, client) {
        const userId = interaction.options.getString("userid");
        const razon = interaction.options.getString("razon") || "Sin razón especificada";
        const { guild } = interaction;

        const ban = await guild.bans.fetch(userId).catch(() => null);
        if (!ban) return interaction.reply({ content: "❌ Ese usuario no está baneado en este servidor", ephemeral: true });

        await guild.members.unban(userId, razon);

        const embed = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
            .setTitle("✅ Usuario Desbaneado")
            .setColor("#22c55e")
            .setThumbnail(ban.user.displayAvatarURL())
            .addFields(
                { name: "Usuario", value: `${ban.user.tag} (${userId})`, inline: true },
                { name: "Moderador", value: interaction.user.tag, inline: true },
                { name: "Razón original del baneo", value: ban.reason || "Sin razón", inline: false },
                { name: "Razón del desbaneo", value: razon }
            )
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};