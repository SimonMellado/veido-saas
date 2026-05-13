const mongoose = require("mongoose");

const UserLevelSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    lastMessage: { type: Date, default: null }
}, { timestamps: true });

UserLevelSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model("UserLevel", UserLevelSchema);