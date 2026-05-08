const mongoose = require("mongoose");

const GuildConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },

    welcome: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        message: { type: String, default: "¡Bienvenido/a {user} a {server}! 🎉 Eres el miembro #️{membercount}." },
        backgroundUrl: { type: String, default: null },  // URL de imagen de fondo personalizada
        useAvatar: { type: Boolean, default: true },      // usar foto de perfil como fondo
        embedColor: { type: String, default: "#ff0033" }
    },

    farewell: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        message: { type: String, default: "👋 {username} ha abandonado {server}. Nos quedamos con {membercount} miembros." },
        backgroundUrl: { type: String, default: null },
        useAvatar: { type: Boolean, default: true },
        embedColor: { type: String, default: "#5865F2" }
    }
}, { timestamps: true });

module.exports = mongoose.model("GuildConfig", GuildConfigSchema);