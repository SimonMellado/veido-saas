async function loadEvents(client) {
    const { loadFiles } = require("../Functions/fileLoader");
    const ascii = require("ascii-table");
    const table = new ascii().setHeading("Event", "Status");

    client.events.clear();

    const files = await loadFiles("Events");

    for (const file of files) {
        const event = require(file);

        const execute = (...args) => event.execute(...args, client);

        if (event.once) {
            client.once(event.name, execute);
        } else {
            client.on(event.name, execute);
        }

        client.events.set(event.name, execute);
        table.addRow(event.name, "✅ SUCCESS");
    }

    console.log(table.toString(), "\nEvents Loaded.");
}

module.exports = { loadEvents };