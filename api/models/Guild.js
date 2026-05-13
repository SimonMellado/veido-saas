const mongoose = require("mongoose");

const GuildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    name: { type: String, default: "" },
    modules: {
        levels: { type: Boolean, default: false },
        welcome: { type: Boolean, default: false },
        autoroles: { type: Boolean, default: false }
    },
    autoroles: [{ type: String }] // IDs de roles a asignar automáticamente
}, { timestamps: true });

module.exports = mongoose.model("Guild", GuildSchema);