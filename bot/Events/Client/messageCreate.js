const axios = require("axios");
const User = require("../../api/models/User");
const Guild = require("../../api/models/Guild");

module.exports = {
  name: "messageCreate",

  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    console.log(`${message.author.tag}: ${message.content}`);

    try {
      // 🔥 Obtener configuración del servidor
      let guildData = await Guild.findOne({
        guildId: message.guild.id
      });

      // Si no existe, crear config por defecto
      if (!guildData) {
        guildData = await Guild.create({
          guildId: message.guild.id,
          name: message.guild.name,
          modules: {
            levels: false,
            welcome: false
          }
        });
      }

      // ❌ Si niveles está desactivado → salir
      if (!guildData.modules.levels) return;

      // 🔥 Buscar usuario
      let user = await User.findOne({
        userId: message.author.id,
        guildId: message.guild.id
      });

      // Si no existe → crearlo
      if (!user) {
        user = await User.create({
          userId: message.author.id,
          guildId: message.guild.id,
          xp: 0,
          level: 0
        });
      }

      // ➕ sumar XP (puedes ajustar)
      const xpGained = Math.floor(Math.random() * 10) + 5;
      user.xp += xpGained;

      // 🎯 fórmula nivel
      const nextLevelXp = user.level * 100 + 100;

      if (user.xp >= nextLevelXp) {
        user.level++;

        message.channel.send({
          content: `🎉 ${message.author} subió a nivel **${user.level}**`
        });
      }

      await user.save();

      // 📡 enviar a tu API (dashboard)
      await axios.post("http://localhost:3001/message", {
        user: message.author.tag,
        content: message.content,
        xp: user.xp,
        level: user.level,
        guildId: message.guild.id
      });

    } catch (err) {
      console.log("❌ Error en messageCreate:", err.message);
    }
  }
};