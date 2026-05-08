const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Advierte a un usuario")
        .addUserOption(o => o.setName("target").setDescription("Usuario a advertir").setRequired(true))
        .addStringOption(o => o.setName("razon").setDescription("Razón de la advertencia").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client) {
        const user = interaction.options.getUser("target");
        const razon = interaction.options.getString("razon");
        const { guild } = interaction;

        if (user.id === interaction.user.id) return interaction.reply({ content: "❌ No puedes advertirte a ti mismo", ephemeral: true });
        if (user.id === client.user.id) return interaction.reply({ content: "❌ No puedes advertirme a mí", ephemeral: true });

        // Intentar enviar DM al usuario
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle(`⚠️ Has recibido una advertencia en ${guild.name}`)
                .setColor("#f59e0b")
                .addFields({ name: "Razón", value: razon })
                .setTimestamp();
            await user.send({ embeds: [dmEmbed] });
        } catch {}

        const embed = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
            .setTitle("⚠️ Usuario Advertido")
            .setColor("#f59e0b")
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