const {
Client,
GatewayIntentBits,
Collection,
REST,
Routes
} = require('discord.js');

const fs = require('fs');

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
const cmd = require(./commands/${file});

client.commands.set(cmd.data.name, cmd);
commands.push(cmd.data.toJSON());
}

/* ================= REGISTER SLASH ================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
await rest.put(Routes.applicationCommands(clientId), { body: commands });
console.log('✅ Slash registered');
})();

/* ================= READY ================= */

client.once('clientReady', () => {
console.log(✅ Bot online: ${client.user.tag});
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

/* ================= AUTO VOUCH ================= */

const DB_FILE = './leaderboard.json';
const TAX_RATE = 0.7;

const vouchRegex =
/(vouch|vouc|voc|vos|voch|v0uch|vuch|vouchh|vouhc|v0cuh|cup|vid|vvoch)/i;

function loadDB() {
if (!fs.existsSync(DB_FILE)) return {};
return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function parseAmount(text) {
const match = text.match(/(\d+(?:.\d+)?k?)/i);
if (!match) return null;

let val = match[1].toLowerCase();

if (val.includes('k')) return parseFloat(val) * 1000;
return parseFloat(val);
}

client.on('messageCreate', msg => {
if (msg.author.bot) return;

const content = msg.content.toLowerCase();

if (!vouchRegex.test(content)) return;

let amount = parseAmount(content);
if (!amount) return;

/* after = user terima -> convert ke gamepass */
if (content.includes('after'))
amount = Math.ceil(amount / TAX_RATE);

/* before / angka doang -> langsung */
const db = loadDB();

if (!db[msg.author.id])
db[msg.author.id] = { robux: 0, vouch: 0 };

db[msg.author.id].robux += amount;
db[msg.author.id].vouch += 1;

saveDB(db);

console.log(AUTO VOUCH → ${msg.author.tag} | +${amount} robux);
});

/* ================= LOGIN ================= */

client.login(token);