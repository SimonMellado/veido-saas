const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Banea a un usuario del servidor")
        .addUserOption(o => o.setName("target").setDescription("Usuario a banear").setRequired(true))
        .addStringOption(o => o.setName("razon").setDescription("Razón del baneo"))
        .addIntegerOption(o => o.setName("dias").setDescription("Días de mensajes a eliminar (0-7)").setMinValue(0).setMaxValue(7))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction, client) {
        const user = interaction.options.getUser("target");
        const razon = interaction.options.getString("razon") || "Sin razón especificada";
        const dias = interaction.options.getInteger("dias") || 0;
        const { guild } = interaction;

        const member = await guild.members.fetch(user.id).catch(() => null);

        if (user.id === interaction.user.id) return interaction.reply({ content: "❌ No puedes banearte a ti mismo", ephemeral: true });
        if (user.id === client.user.id) return interaction.reply({ content: "❌ No puedes banearme a mí", ephemeral: true });
        if (member) {
            if (member.roles.highest.position >= interaction.member.roles.highest.position)
                return interaction.reply({ content: "❌ No puedes banear a alguien con un rol igual o superior al tuyo", ephemeral: true });
            if (!member.bannable)
                return interaction.reply({ content: "❌ No tengo permisos para banear a este usuario", ephemeral: true });
        }

        await guild.members.ban(user.id, { deleteMessageSeconds: dias * 86400, reason: razon });

        const embed = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
            .setTitle("🔨 Usuario Baneado")
            .setColor("#ff0033")
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "Usuario", value: `${user.tag} (${user.id})`, inline: true },
                { name: "Moderador", value: interaction.user.tag, inline: true },
                { name: "Razón", value: razon },
                { name: "Mensajes eliminados", value: `${dias} día(s)`, inline: true }
            )
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};