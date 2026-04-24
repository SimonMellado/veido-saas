const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("timeout a un usuario que eligas")
        .addUserOption((option) => option.setName(`target`).setDescription(`Usuario a timeout`).setRequired(true))
        .addIntegerOption((option) => option.setName(`tiempo`).setDescription(`tiempo del timeout en minutos`).setRequired(true))
        .addStringOption((option) => option.setName(`razon`).setDescription(`Razon del timeout`))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction, client) {
        const user = interaction.options.getUser(`target`);
        const tiempo = interaction.options.getInteger(`tiempo`)
        const { guild } = interaction;

        let razon = interaction.options.getString(`razon`);
        const member = await interaction.guild.members.fetch(user.id).catch(console.error)

    if (!razon) razon = "No hay razon";
    if(user.id === interaction.user.id) return interaction.reply({content: `No puedes timeoutear a ti mismo`, ephemeral:true});
    if(user.id === client.user.id) return interaction.reply({content: `No puedes timeoutear a mi`, ephemeral:true});
    if(member.roles.highest.position >= interaction.member.roles.highest.position) return interaction.reply({content: `No puedes timeoutear a alguien con un rol igual o superior al tuyo`, ephemeral: true});
    if (!member.kickable) return interaction.reply({content: `No puedo timeoutear a alguien con un rol superior al mio`, ephemeral:true});

    if(tiempo > 100000) return interaction.reply({content: `El tiempo no puede superar los 100.000 minutos`, ephemeral: true})

    const embed = new EmbedBuilder()
    .setAuthor({ name: `${guild.name}`, iconURL: `${guild.iconURL({dinamyc: true}) || "https://media.discordapp.net/attachments/1495109465165402345/1497022407360254143/veido.png?ex=69ec0243&is=69eab0c3&hm=7d9f07f485eed8a5ec2bc5e854d3f2b6a70890ba3437ab4a5957713e28e953ef&=&format=webp&quality=lossless&width=960&height=960"} `})
    .setTitle(`${user.tag} Ha sido timeouteado del servidor.`)
    .setColor(`#ff0000`)
    .setTimestamp()
    .setThumbnail(`${user.displayAvatarURL({dinamyc: true})}`)
    .addFields({name: `Razon`, value: `${razon}`, inline: true}, {name: `Tiempo`, value: `${tiempo}`, inline: true});

    await member.timeout(tiempo * 60 * 1000, razon).catch(console.error);

    interaction.reply({embeds: [embed]});
},
};