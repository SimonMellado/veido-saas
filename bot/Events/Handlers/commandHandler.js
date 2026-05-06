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
                console.log(`❌ Error en comando ${file}:`, err);
                table.addRow(file.split("/").pop(), "❌ ERROR");
            }
        }

        console.log(table.toString());

        if (!client.application) {
            console.log("⏳ Application aún no lista, reintentando...");

            setTimeout(() => {
                client.application?.commands.set(commandsArray);
                console.log("✅ Slash commands registrados (retry)");
            }, 5000);

            return;
        }

        await client.application.commands.set(commandsArray);

        console.log("🚀 Commands Loaded Successfully.");

    } catch (error) {
        console.error("❌ Error cargando comandos:", error);
    }
}