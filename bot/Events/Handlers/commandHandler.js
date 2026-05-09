module.exports = { loadCommands };

async function loadCommands(client) {
    const { loadFiles } = require("../Functions/fileLoader");
    const ascii = require("ascii-table");
    const table = new ascii().setHeading("Commands", "Status");

    client.commands = new Map();
    let commandsArray = [];

    try {
        const Files = await loadFiles("Commands");

        for (const file of Files) {
            try {
                const command = require(file);

                if (!command?.data?.name) {
                    table.addRow(file.split("/").pop(), "❌ INVALID");
                    continue;
                }

                client.commands.set(command.data.name, command);
                commandsArray.push(command.data.toJSON());
                table.addRow(command.data.name, "🟩");

            } catch (err) {
                console.error(`❌ Error en comando ${file}:`, err.message);
                table.addRow(file.split("/").pop(), "❌ ERROR");
            }
        }

        console.log(table.toString());

        // ✅ Registrar comandos con reintentos hasta que client.application esté listo
        const registerCommands = async (retries = 10) => {
            if (client.application) {
                await client.application.commands.set(commandsArray);
                console.log(`🚀 ${commandsArray.length} comandos registrados correctamente`);
                return;
            }

            if (retries <= 0) {
                console.error("❌ No se pudo registrar los comandos: client.application no disponible");
                return;
            }

            console.log(`⏳ Esperando client.application... (${retries} intentos restantes)`);
            setTimeout(() => registerCommands(retries - 1), 3000);
        };

        // Esperar al evento ready para registrar
        if (client.isReady()) {
            await registerCommands();
        } else {
            client.once("ready", async () => {
                await registerCommands();
            });
        }

    } catch (error) {
        console.error("❌ Error cargando comandos:", error);
    }
}