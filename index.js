require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

require('./utils/backup'); // 🔥 auto backup + auto create file

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

/* ================= LOAD COMMANDS ================= */
const commandsPath = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(commandsPath)) {
  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.data.name, cmd);
}

/* ================= READY ================= */
client.once('ready', () => {
  console.log(`✅ Login sebagai ${client.user.tag}`);
});

/* ================= INTERACTION ================= */
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);
  }
});

client.login(process.env.TOKEN);