/* ================= IMPORT ================= */

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require('discord.js');

const fs = require('fs');
const http = require('http');

/* ================= ENV ================= */

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

/* ================= CLIENT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

/* ================= LOAD COMMAND FILES ================= */

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
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log('✅ Slash commands registered');
})();

/* ================= READY ================= */

client.once('ready', () => {
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
    interaction.reply({
      content: '❌ Error',
      ephemeral: true
    });
  }
});


/* =====================================================
   🔥 AUTO VOUCH SYSTEM (FINAL VERSION)
===================================================== */

const DB_FILE = './leaderboard.json';
const TAX_RATE = 0.7;

/* typo detect */
const vouchRegex =
/(vouch|vouc|voc|vos|voch|v0uch|vuch|vouchh|vouhc|v0cuh|cup|vid|vvoch)/i;

/* ensure file exists */
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, '{}');
}

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function parseAmount(text) {
  const match = text.match(/(\d+(?:k)?)/i);
  if (!match) return null;

  let val = match[1].toLowerCase();

  if (val.includes('k')) return parseFloat(val) * 1000;

  return parseInt(val);
}

/* ================= AUTO VOUCH LISTENER ================= */

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  const text = msg.content.toLowerCase();

  /* harus ada kata vouch */
  if (!vouchRegex.test(text)) return;

  let amount = parseAmount(text);
  if (!amount) return;

  /* after tax */
  if (text.includes('after') || text.includes('aft'))
    amount = Math.ceil(amount / TAX_RATE);

  /* before / angka doang langsung */

  const db = loadDB();

  if (!db[msg.author.id]) {
    db[msg.author.id] = {
      robux: 0,
      vouch: 0
    };
  }

  db[msg.author.id].robux += amount;
  db[msg.author.id].vouch += 1;

  saveDB(db);

  console.log(`AUTO VOUCH → ${msg.author.tag} +${amount}`);
});


/* =====================================================
   🔥 RAILWAY ANTI SLEEP (PENTING BANGET)
===================================================== */

http
  .createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot alive');
  })
  .listen(process.env.PORT || 3000);


/* ================= LOGIN ================= */

client.login(token);