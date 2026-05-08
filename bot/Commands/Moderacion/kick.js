const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Expulsa a un usuario del servidor")
        .addUserOption(o => o.setName("target").setDescription("Usuario a expulsar").setRequired(true))
        .addStringOption(o => o.setName("razon").setDescription("Razón de la expulsión"))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction, client) {
        const user = interaction.options.getUser("target");
        const razon = interaction.options.getString("razon") || "Sin razón especificada";
        const { guild } = interaction;

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "❌ No encontré ese usuario en el servidor", ephemeral: true });

        if (user.id === interaction.user.id) return interaction.reply({ content: "❌ No puedes expulsarte a ti mismo", ephemeral: true });
        if (user.id === client.user.id) return interaction.reply({ content: "❌ No puedes expulsarme a mí", ephemeral: true });
        if (member.roles.highest.position >= interaction.member.roles.highest.position)
            return interaction.reply({ content: "❌ No puedes expulsar a alguien con un rol igual o superior al tuyo", ephemeral: true });
        if (!member.kickable)
            return interaction.reply({ content: "❌ No tengo permisos para expulsar a este usuario", ephemeral: true });

        await member.kick(razon);

        const embed = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
            .setTitle("👢 Usuario Expulsado")
            .setColor("#ff6600")
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "Usuario", value: `${user.tag} (${user.id})`, inline: true },
                { name: "Moderador", value: interaction.user.tag, inline: true },
                { name: "Razón", value: razon }
            )
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};