const axios = require("axios");
const User = require("../../../api/models/User");
const Guild = require("../../../api/models/Guild");

const API = process.env.API_URL || "https://veido-saas.onrender.com";

module.exports = {
  name: "messageCreate",

  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    try {
      let guildData = await Guild.findOne({ guildId: message.guild.id });

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

      if (!guildData.modules.levels) return;

      let user = await User.findOne({
        userId: message.author.id,
        guildId: message.guild.id
      });

      if (!user) {
        user = await User.create({
          userId: message.author.id,
          guildId: message.guild.id,
          xp: 0,
          level: 0
        });
      }

      const xpGained = Math.floor(Math.random() * 10) + 5;
      user.xp += xpGained;

      const nextLevelXp = user.level * 100 + 100;

      if (user.xp >= nextLevelXp) {
        user.level++;

        message.channel.send({
          content: `🎉 ${message.author} subió a nivel **${user.level}**`
        });
      }

      await user.save();

      // 🚀 ENVIAR A RENDER API
      await axios.post(`${API}/message`, {
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