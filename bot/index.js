require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const mongoose = require("mongoose");
const { Player } = require("discord-player");
const {
    YoutubeExtractor,
    SpotifyExtractor,
    SoundCloudExtractor
} = require("@discord-player/extractor");

// ──────────────────────────────────────────────
// VALIDACIONES PREVIAS AL INICIO
// ──────────────────────────────────────────────

if (!process.env.MONGO_URL) {
    console.error("❌ MONGO_URL no está definido en .env");
    process.exit(1);
}

if (!process.env.TOKEN) {
    console.error("❌ TOKEN no está definido en .env");
    process.exit(1);
}

// ──────────────────────────────────────────────
// CLIENTE DE DISCORD
// ──────────────────────────────────────────────

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ──────────────────────────────────────────────
// CONFIGURACIÓN DEL PLAYER DE MÚSICA
// ──────────────────────────────────────────────

client.player = new Player(client, {
    skipFFmpeg: false
});

// ✅ FIX: Inicializar extractores como función async para esperar correctamente
async function initializePlayer() {
    try {
        await client.player.extractors.register(YoutubeExtractor);
        await client.player.extractors.register(SpotifyExtractor);
        await client.player.extractors.register(SoundCloudExtractor);
        console.log("🎧 Extractors cargados correctamente");
    } catch (err) {
        console.error("❌ Error al cargar extractors:", err);
    }
}

// Eventos del player
client.player.events.on("playerError", (queue, error) => {
    console.error("❌ Player Error:", error);
});

client.player.events.on("error", (queue, error) => {
    console.error("❌ Error general del player:", error);
});

// ──────────────────────────────────────────────
// COLECCIONES Y CONFIGURACIÓN
// ──────────────────────────────────────────────

client.config = require("./config.json");
client.events = new Collection();
client.commands = new Collection();

// ──────────────────────────────────────────────
// CARGA DE EVENTOS Y COMANDOS
// ──────────────────────────────────────────────

const { loadEvents } = require("./Events/Handlers/eventHandler");
const { loadCommands } = require("./Events/Handlers/commandHandler");

loadEvents(client);
loadCommands(client);

// ──────────────────────────────────────────────
// MANEJO DE ERRORES GLOBALES
// ──────────────────────────────────────────────

process.on("unhandledRejection", (reason, promise) => {
    console.error("⚠️ Unhandled Rejection en:", promise, "\nRazón:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught Exception:", error);
    // En producción considera hacer process.exit(1) y que PM2/Render reinicie
});

// ──────────────────────────────────────────────
// INICIO: MONGO + PLAYER + LOGIN
// ──────────────────────────────────────────────

// ✅ FIX: Función async principal para encadenar correctamente las inicializaciones
async function main() {
    try {
        // 1. Conectar a MongoDB
        console.log("🔎 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅ DB conectada correctamente");

        // 2. Inicializar extractores del player
        await initializePlayer();

        // 3. Login del bot
        const token = process.env.TOKEN || client.config?.token;
        if (!token) {
            console.error("❌ Falta el token de Discord");
            process.exit(1);
        }

        await client.login(token);
        console.log("🤖 Bot conectado a Discord");

    } catch (err) {
        console.error("❌ Error al iniciar el bot:", err);
        process.exit(1);
    }
}

main();

module.exports = { client };
