// ===============================
// IMPORT
// ===============================

const {
  Client,
  GatewayIntentBits,
  Collection
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
// LOAD COMMANDS FOLDER
// ===============================

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}


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