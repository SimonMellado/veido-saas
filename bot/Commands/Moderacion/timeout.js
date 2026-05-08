const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Silencia temporalmente a un usuario")
        .addUserOption(o => o.setName("target").setDescription("Usuario a silenciar").setRequired(true))
        .addIntegerOption(o => o.setName("tiempo").setDescription("Tiempo en minutos").setRequired(true).setMinValue(1).setMaxValue(40320))
        .addStringOption(o => o.setName("razon").setDescription("Razón del silencio"))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client) {
        const user = interaction.options.getUser("target");
        const tiempo = interaction.options.getInteger("tiempo");
        const razon = interaction.options.getString("razon") || "Sin razón especificada";
        const { guild } = interaction;

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "❌ No encontré ese usuario en el servidor", ephemeral: true });

        if (user.id === interaction.user.id) return interaction.reply({ content: "❌ No puedes silenciarte a ti mismo", ephemeral: true });
        if (user.id === client.user.id) return interaction.reply({ content: "❌ No puedes silenciarme a mí", ephemeral: true });
        if (member.roles.highest.position >= interaction.member.roles.highest.position)
            return interaction.reply({ content: "❌ No puedes silenciar a alguien con un rol igual o superior al tuyo", ephemeral: true });

        await member.timeout(tiempo * 60 * 1000, razon);

        // Formatear tiempo legible
        const horas = Math.floor(tiempo / 60);
        const mins = tiempo % 60;
        const tiempoStr = horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;

        const embed = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
            .setTitle("🔇 Usuario Silenciado")
            .setColor("#f59e0b")
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "Usuario", value: `${user.tag} (${user.id})`, inline: true },
                { name: "Moderador", value: interaction.user.tag, inline: true },
                { name: "Duración", value: tiempoStr, inline: true },
                { name: "Expira", value: `<t:${Math.floor((Date.now() + tiempo * 60 * 1000) / 1000)}:R>`, inline: true },
                { name: "Razón", value: razon }
            )
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};