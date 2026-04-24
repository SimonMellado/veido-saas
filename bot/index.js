const { Client, GatewayIntentBits, Collection } = require("discord.js");
const mongoose = require("mongoose");
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const { loadEvents } = require("./Handlers/eventHandler");
const { loadCommands } = require("./Handlers/commandHandler");

client.config = require("./config.json");
client.events = new Collection();
client.commands = new Collection();

loadEvents(client);
loadCommands(client); // 🔥 TE FALTABA ESTO

console.log("🔎 MONGO_URL:", process.env.MONGO_URL);

if (!process.env.MONGO_URL) {
    console.error("❌ MONGO_URL no está definido en .env");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ DB conectada correctamente"))
    .catch(err => console.error("❌ Error DB:", err));


if (!process.env.TOKEN && !client.config.token) {
    console.error("❌ Falta el token en .env o config.json");
    process.exit(1);
}

client.login(process.env.TOKEN || client.config.token);

module.exports = { client };