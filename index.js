process.env.TZ = 'Asia/Jakarta';

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const backup = require('./utils/backup');

const TOKEN = process.env.TOKEN;

const VOUCH_CHANNEL = '1448898315411259424';

const DB_FILE = path.join(__dirname, 'data/leaderboard.json');

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

/* ================= COMMAND LOAD ================= */

const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

/* ================= SAVE FUNCTION ================= */

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  backup(); // 🔥 auto backup tiap save
}

/* ================= READY ================= */

client.once(Events.ClientReady, () => {
  console.log(`✅ Login sebagai ${client.user.tag}`);

  // backup tiap 5 menit (extra aman)
  setInterval(() => {
    backup();
  }, 5 * 60 * 1000);
});

/* ================= VOUCH LISTENER ================= */

client.on(Events.MessageCreate, message => {
  if (message.author.bot) return;

  if (message.channel.id !== VOUCH_CHANNEL) return;

  const db = JSON.parse(fs.readFileSync(DB_FILE));

  const id = message.author.id;

  if (!db[id]) {
    db[id] = {
      robux: 0,
      vouch: 0
    };
  }

  db[id].vouch += 1;

  saveDB(db);
});

/* ================= SLASH COMMAND ================= */

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
  }
});

/* ================= LOGIN ================= */

client.login(TOKEN);