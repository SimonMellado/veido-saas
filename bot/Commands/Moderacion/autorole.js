const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Guild = require("../../models/Guild");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autorole")
        .setDescription("Configura los roles que se asignan automáticamente al entrar")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Añade un rol automático")
                .addRoleOption(o => o.setName("rol").setDescription("Rol a añadir").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("remove")
                .setDescription("Elimina un rol automático")
                .addRoleOption(o => o.setName("rol").setDescription("Rol a eliminar").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("Lista los roles automáticos configurados")
        )
        .addSubcommand(sub =>
            sub.setName("clear")
                .setDescription("Elimina todos los roles automáticos")
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const { guild } = interaction;

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData) {
            guildData = await Guild.create({
                guildId: guild.id,
                name: guild.name,
                modules: { levels: false, welcome: false, autoroles: false },
                autoroles: []
            });
        }

        if (sub === "add") {
            const role = interaction.options.getRole("rol");

            if (role.managed) return interaction.reply({ content: "❌ No puedo asignar roles de bots/integrations", ephemeral: true });
            if (role.position >= guild.members.me.roles.highest.position)
                return interaction.reply({ content: "❌ Ese rol está por encima del mío", ephemeral: true });
            if (guildData.autoroles.includes(role.id))
                return interaction.reply({ content: "❌ Ese rol ya está en la lista", ephemeral: true });
            if (guildData.autoroles.length >= 10)
                return interaction.reply({ content: "❌ Máximo 10 autoroles por servidor", ephemeral: true });

            guildData.autoroles.push(role.id);
            guildData.modules.autoroles = true;
            await guildData.save();

            const embed = new EmbedBuilder()
                .setColor(0x22c55e)
                .setTitle("✅ Autorole añadido")
                .setDescription(`${role} será asignado automáticamente a nuevos miembros`);
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === "remove") {
            const role = interaction.options.getRole("rol");
            if (!guildData.autoroles.includes(role.id))
                return interaction.reply({ content: "❌ Ese rol no está en la lista", ephemeral: true });

            guildData.autoroles = guildData.autoroles.filter(id => id !== role.id);
            if (guildData.autoroles.length === 0) guildData.modules.autoroles = false;
            await guildData.save();

            const embed = new EmbedBuilder()
                .setColor(0xff0033)
                .setTitle("🗑️ Autorole eliminado")
                .setDescription(`${role} ya no se asignará automáticamente`);
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === "list") {
            const roles = guildData.autoroles
                .map(id => `<@&${id}>`)
                .join("\n") || "_No hay autoroles configurados_";

            const embed = new EmbedBuilder()
                .setColor(0xff0033)
                .setTitle("📋 Autoroles configurados")
                .setDescription(roles)
                .setFooter({ text: `${guildData.autoroles.length}/10 autoroles` });
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === "clear") {
            guildData.autoroles = [];
            guildData.modules.autoroles = false;
            await guildData.save();

            return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0033).setTitle("🗑️ Autoroles limpiados").setDescription("Se eliminaron todos los autoroles")] });
        }
    }
};