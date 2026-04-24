const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema({
  guildId: String,
  name: String,
  modules: {
    levels: { type: Boolean, default: true },
    welcome: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model("Guild", guildSchema);