const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("untimeout")
        .setDescription("Quita el silencio a un usuario")
        .addUserOption(o => o.setName("target").setDescription("Usuario a quitar el silencio").setRequired(true))
        .addStringOption(o => o.setName("razon").setDescription("Razón"))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client) {
        const user = interaction.options.getUser("target");
        const razon = interaction.options.getString("razon") || "Sin razón especificada";
        const { guild } = interaction;

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "❌ No encontré ese usuario en el servidor", ephemeral: true });
        if (!member.isCommunicationDisabled()) return interaction.reply({ content: "❌ Ese usuario no está silenciado", ephemeral: true });

        await member.timeout(null, razon);

        const embed = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
            .setTitle("🔊 Silencio Removido")
            .setColor("#22c55e")
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