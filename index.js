// ===============================
// IMPORT
// ===============================

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");
const express = require("express");


// ===============================
// RAILWAY WEB (ANTI SLEEP)
// ===============================

const app = express();

app.get("/", (req, res) => {
  res.send("Bot Alive");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Web server running");
});


// ===============================
// CLIENT
// ===============================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();


// ===============================
// LOAD COMMAND FILES
// ===============================

const commands = [];

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  client.commands.set(command.data.name, command);

  // 🔥 PENTING buat register slash
  commands.push(command.data.toJSON());
}


// ===============================
// 🔥 REGISTER SLASH COMMANDS (INI YG HILANG TADI)
// ===============================

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash registered");
  } catch (err) {
    console.error(err);
  }
})();


// ===============================
// READY
// ===============================

client.once("clientReady", () => {
  console.log(`✅ Login sebagai ${client.user.tag}`);
});


// ===============================
// SLASH HANDLER
// ===============================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "Error command",
        ephemeral: true
      });
    }
  }
});


// ===============================
// LOGIN
// ===============================

client.login(process.env.TOKEN);