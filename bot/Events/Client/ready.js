const { loadCommands } = require("../../Handlers/commandHandler");

module.exports = {
  name: "ready",
  once: true,

  async execute(client) {
    console.log(`✅ Logged as ${client.user.tag}`);

    await client.application.fetch();

    await loadCommands(client);
  }
};