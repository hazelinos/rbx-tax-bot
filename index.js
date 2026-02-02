/* ================= IMPORT ================= */

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const express = require('express');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;


/* ================= WEB (ANTI SLEEP) ================= */

const app = express();

app.get('/', (req, res) => {
  res.send('Bot Alive');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('🌐 Web server running');
});


/* ================= CLIENT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();


/* ================= DATA SAFE ================= */

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'leaderboard.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}');


function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}


/* ================= LOAD COMMANDS ================= */

const commands = [];
const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of files) {
  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.data.name, cmd);
  commands.push(cmd.data.toJSON());
}


/* ================= REGISTER SLASH ================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commands }
  );

  console.log('✅ Slash commands registered');
})();


/* ================= READY ================= */

client.once('clientReady', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});


/* ================= SLASH HANDLER ================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction, { loadDB, saveDB });
  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      interaction.reply({
        content: 'Error command',
        ephemeral: true
      });
    }
  }
});


/* ================================================= */
/* =============== AUTO VOUCH SYSTEM =============== */
/* ================================================= */

const TAX_RATE = 0.7;
const VOUCH_CHANNEL_ID = '1448898315411259424';

const vouchRegex =
/(vouch|vouc|voc|vos|voch|v0uch|vuch|vouchh|vouhc|cup|vid)/i;


/* ================= AUTO LISTENER ================= */

client.on('messageCreate', msg => {
  if (msg.author.bot) return;
  if (msg.channel.id !== VOUCH_CHANNEL_ID) return;

  const text = msg.content.toLowerCase();
  if (!vouchRegex.test(text)) return;

  let amount = 1;

  const match = text.match(/(\d+(?:\.\d+)?k?)/i);
  if (match) {
    let val = match[1].toLowerCase();
    if (val.includes('k')) amount = parseFloat(val) * 1000;
    else amount = parseFloat(val);
  }

  if (text.includes('after')) {
    amount = Math.ceil(amount / TAX_RATE);
  }

  const db = loadDB();

  if (!db[msg.author.id])
    db[msg.author.id] = { robux: 0, vouch: 0 };

  db[msg.author.id].robux += amount;
  db[msg.author.id].vouch += 1;

  saveDB(db);

  console.log(`AUTO VOUCH → ${msg.author.tag} +${amount}`);
});


/* ================= LOGIN ================= */

client.login(token);