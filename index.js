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
app.get('/', (_, res) => res.send('Bot Alive'));
app.listen(process.env.PORT || 3000);


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
const VOUCH_LOG = path.join(DATA_DIR, 'vouchLogs.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

if (!fs.existsSync(DB_FILE))
  fs.writeFileSync(DB_FILE, '{}');

if (!fs.existsSync(VOUCH_LOG))
  fs.writeFileSync(VOUCH_LOG, '{}');


/* ================= DB HELPERS ================= */

const loadJSON = file => JSON.parse(fs.readFileSync(file));
const saveJSON = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));


/* ================= LOAD COMMANDS ================= */

const commands = [];

const files = fs
  .readdirSync('./commands')
  .filter(f => f.endsWith('.js'));

for (const file of files) {

  const cmd = require(`./commands/${file}`);

  /* 🔥 ANTI CRASH (kalau command rusak skip aja) */
  if (!cmd?.data || !cmd?.execute) {
    console.log(`❌ Skip command rusak: ${file}`);
    continue;
  }

  client.commands.set(cmd.data.name, cmd);
  commands.push(cmd.data.toJSON());
}


/* ================= REGISTER SLASH ================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log('✅ Slash commands registered');
  } catch (err) {
    console.log('REGISTER ERROR:', err);
  }
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
    await cmd.execute(interaction);
  } catch (err) {
    console.log(err);

    if (!interaction.replied)
      interaction.reply({
        content: 'Error command',
        ephemeral: true
      });
  }
});


/* ================================================= */
/* =============== AUTO VOUCH SYSTEM =============== */
/* ================================================= */

const TAX_RATE = 0.7;
const VOUCH_CHANNEL_ID = '1448898315411259424';

const vouchRegex =
/(vouch|vouc|voc|vos|voch|v0uch|vuch|vouchh|vouhc|v0cuh|cup|vid|vvoch)/i;


/* ---------- PARSER ---------- */

function parseAmount(text) {

  const match = text.match(/(\d+(?:\.\d+)?k?)/i);

  if (!match) return 1;

  let val = match[1].toLowerCase();

  if (val.includes('k'))
    return parseFloat(val) * 1000;

  return parseFloat(val);
}


/* ================= ADD VOUCH ================= */

client.on('messageCreate', msg => {

  if (msg.author.bot) return;
  if (msg.channel.id !== VOUCH_CHANNEL_ID) return;

  const text = msg.content.toLowerCase();

  if (!vouchRegex.test(text)) return;

  let amount = parseAmount(text);

  if (text.includes('after'))
    amount = Math.ceil(amount / TAX_RATE);

  const db = loadJSON(DB_FILE);
  const logs = loadJSON(VOUCH_LOG);

  if (!db[msg.author.id])
    db[msg.author.id] = { robux: 0, vouch: 0 };

  db[msg.author.id].robux += amount;
  db[msg.author.id].vouch += 1;

  logs[msg.id] = {
    user: msg.author.id,
    robux: amount
  };

  saveJSON(DB_FILE, db);
  saveJSON(VOUCH_LOG, logs);

  console.log(`AUTO VOUCH → +${amount}`);
});


/* ================= REMOVE VOUCH ================= */

client.on('messageDelete', msg => {

  if (!msg?.id) return;

  const logs = loadJSON(VOUCH_LOG);
  const log = logs[msg.id];

  if (!log) return;

  const db = loadJSON(DB_FILE);

  if (db[log.user]) {

    db[log.user].robux -= log.robux;
    db[log.user].vouch -= 1;

    if (db[log.user].robux < 0) db[log.user].robux = 0;
    if (db[log.user].vouch < 0) db[log.user].vouch = 0;
  }

  delete logs[msg.id];

  saveJSON(DB_FILE, db);
  saveJSON(VOUCH_LOG, logs);

  console.log(`REMOVE VOUCH → -${log.robux}`);
});


/* ================= LOGIN ================= */

client.login(token);