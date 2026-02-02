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

const commandFiles = fs
  .readdirSync('./commands')
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
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
    console.log(err);
  }
})();


/* ================= READY ================= */

client.once('clientReady', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});


/* ================= SLASH HANDLER ================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.log(err);

    if (interaction.replied || interaction.deferred) {
      interaction.followUp({ content: '❌ Error', ephemeral: true });
    } else {
      interaction.reply({ content: '❌ Error', ephemeral: true });
    }
  }
});


/* ===================================================== */
/* ================= AUTO VOUCH SYSTEM ================= */
/* ===================================================== */

const DB_FILE = path.join(__dirname, 'leaderboard.json');
const TAX_RATE = 0.7;

const vouchRegex =
/(vouch|vouc|voc|vos|voch|v0uch|vuch|vouchh|vouhc|v0cuh|cup|vid|vvoch)/i;


/* ---------- DB ---------- */

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}


/* ---------- AUTO DETECT MESSAGE ---------- */

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  const text = msg.content.toLowerCase();

  if (!vouchRegex.test(text)) return;

  const match = text.match(/(\d+(?:k)?)/i);
  if (!match) return;

  let amount = match[1];

  if (amount.includes('k')) amount = parseFloat(amount) * 1000;
  else amount = parseInt(amount);

  // after tax
  if (/(after|aft|aftr|fter)/i.test(text))
    amount = Math.ceil(amount / TAX_RATE);

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

  console.log(`✅ AUTO VOUCH → ${msg.author.tag} +${amount}`);
});


/* ================= LOGIN ================= */

client.login(token);