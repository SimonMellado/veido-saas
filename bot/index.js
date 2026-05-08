require("dotenv").config();

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const mongoose = require("mongoose");
const { Player } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");
const { YoutubeiExtractor } = require("discord-player-youtubei");


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
// CONFIGURACIÓN MONGOOSE
// ──────────────────────────────────────────────

// Evita buffering timeout
mongoose.set("bufferCommands", false);

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
// FFMPEG — forzar ruta del sistema en Windows
// ──────────────────────────────────────────────

const { execSync } = require("node:child_process");

try {
    const ffmpegPath = execSync("where ffmpeg")
        .toString()
        .trim()
        .split("\n")[0]
        .trim();

    process.env.FFMPEG_PATH = ffmpegPath;

    console.log("✅ ffmpeg encontrado en:", ffmpegPath);

} catch {

    try {

        process.env.FFMPEG_PATH = require("ffmpeg-static");

        console.log(
            "✅ ffmpeg-static cargado:",
            process.env.FFMPEG_PATH
        );

    } catch {

        console.warn(
            "⚠️ No se encontró ffmpeg — el audio puede no funcionar"
        );
    }
}

// ──────────────────────────────────────────────
// CONFIGURACIÓN DEL PLAYER DE MÚSICA
// ──────────────────────────────────────────────

client.player = new Player(client, {
    skipFFmpeg: false
});

async function initializePlayer() {
    try {
        await client.player.extractors.loadMulti(DefaultExtractors);
        await client.player.extractors.register(YoutubeiExtractor, {
            cookie: require("fs").readFileSync("./cookies.txt", "utf-8")
        });
        console.log("🎧 Extractors cargados con cookies de YouTube");
    } catch (err) {
        console.error("❌ Error al cargar extractors:", err);
    }
}

// ──────────────────────────────────────────────
// EVENTOS DEL PLAYER
// ──────────────────────────────────────────────

client.player.events.on("playerStart", (queue, track) => {

    queue.metadata?.channel
        ?.send(
            `🎶 Ahora reproduciendo: **${track.title}** — ${track.author}`
        )
        .catch(() => {});
});

client.player.events.on("audioTrackAdd", (queue, track) => {

    queue.metadata?.channel
        ?.send(
            `✅ Añadido a la cola: **${track.title}**`
        )
        .catch(() => {});
});

client.player.events.on("emptyQueue", (queue) => {

    queue.metadata?.channel
        ?.send(
            "✅ Cola terminada. ¡Hasta la próxima!"
        )
        .catch(() => {});
});

client.player.events.on("emptyChannel", (queue) => {

    queue.metadata?.channel
        ?.send(
            "👋 Canal de voz vacío, saliendo..."
        )
        .catch(() => {});
});

client.player.events.on("playerError", (queue, error) => {

    console.error(
        "❌ Player Error:",
        error.message
    );

    queue.metadata?.channel
        ?.send(
            `❌ Error al reproducir: ${error.message}`
        )
        .catch(() => {});
});

client.player.events.on("error", (queue, error) => {

    console.error(
        "❌ Error general del player:",
        error.message
    );
});

// ──────────────────────────────────────────────
// COLECCIONES Y CONFIGURACIÓN
// ──────────────────────────────────────────────

client.config = require("./config.json");

client.events = new Collection();
client.commands = new Collection();

// ──────────────────────────────────────────────
// MANEJO DE ERRORES GLOBALES
// ──────────────────────────────────────────────

process.on("unhandledRejection", (reason, promise) => {

    console.error(
        "⚠️ Unhandled Rejection en:",
        promise,
        "\nRazón:",
        reason
    );
});

process.on("uncaughtException", (error) => {

    console.error(
        "💥 Uncaught Exception:",
        error
    );
});

// ──────────────────────────────────────────────
// READY EVENT NUEVO
// ──────────────────────────────────────────────

client.on("clientReady", () => {

    console.log(
        `✅ Logged as ${client.user.tag}`
    );
});

// ──────────────────────────────────────────────
// INICIO PRINCIPAL
// ──────────────────────────────────────────────

async function main() {

    try {

        // =============================
        // CONEXIÓN MONGODB
        // =============================

        console.log("🔎 Conectando a MongoDB...");

        await mongoose.connect(process.env.MONGO_URL);

        console.log("✅ DB conectada correctamente");

        // =============================
        // PLAYER
        // =============================

        await initializePlayer();

        // =============================
        // CARGAR EVENTOS Y COMANDOS
        // AHORA SÍ, DESPUÉS DE MONGO
        // =============================

        const { loadEvents } = require("./Events/Handlers/eventHandler");
        const { loadCommands } = require("./Events/Handlers/commandHandler");

        loadEvents(client);
        loadCommands(client);

        // =============================
        // LOGIN DISCORD
        // =============================

        const token =
            process.env.TOKEN ||
            client.config?.token;

        if (!token) {

            console.error(
                "❌ Falta el token de Discord"
            );

            process.exit(1);
        }

        await client.login(token);

        console.log("🤖 Bot conectado a Discord");

    } catch (err) {

        console.error(
            "❌ Error al iniciar el bot:",
            err
        );

        process.exit(1);
    }
}

main();

module.exports = { client };