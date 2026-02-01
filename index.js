const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const fs = require('fs');

/* ================= CONFIG ================= */

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const TAX = 0.3;
const EMBED_COLOR = 0x1F6FEB;

const FOOTER_ICON =
  'https://cdn.discordapp.com/attachments/1449386611036127343/1467515005825187972/20260107_131913.png';

const format = n => n.toLocaleString('id-ID');

/* ================= CLIENT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* ================= DATABASE ================= */

const DB_FILE = './leaderboard.json';
let db = {};

if (fs.existsSync(DB_FILE))
  db = JSON.parse(fs.readFileSync(DB_FILE));

const saveDB = () =>
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

function addData(id, robux, vouch = 1) {
  if (!db[id]) db[id] = { robux: 0, vouch: 0 };
  db[id].robux += robux;
  db[id].vouch += vouch;
  saveDB();
}

/* ================= WIB TIME ================= */

function getSmartTime() {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  );

  const time = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `Today at ${time}`;
}

/* ================= COMMANDS (FIXED DESCRIPTION) ================= */

const commands = [

  new SlashCommandBuilder()
    .setName('tax')
    .setDescription('Robux tax calculator')
    .addIntegerOption(o =>
      o.setName('jumlah')
        .setDescription('Jumlah robux')
        .setRequired(true))
    .addStringOption(o =>
      o.setName('mode')
        .setDescription('Before atau After tax')
        .addChoices(
          { name: 'After Tax', value: 'after' },
          { name: 'Before Tax', value: 'before' }
        )
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('rate')
        .setDescription('Harga per robux')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('placeid')
    .setDescription('Get place id player')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Username Roblox')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top Spend Robux & Vouch'),

  new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Admin edit data manual')
    .addUserOption(o =>
      o.setName('user')
        .setDescription('Target user')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('robux')
        .setDescription('Jumlah robux')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('vouch')
        .setDescription('Jumlah vouch')
        .setRequired(true))

].map(c => c.toJSON());

/* ================= REGISTER ================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
})();

/* ================= READY ================= */

client.once('ready', () => {
  console.log('✅ Bot Online');
});

/* ================= AUTO VOUCH ================= */

const vouchRegex =
/(vouch|vouc|voc|voch|v0uch|vuch|vouchh|v0c|vouhc|v0cuh)/i;

function parseRobux(text) {
  let match = text.match(/(\d+(?:\.\d+)?k?)/i);
  if (!match) return null;

  let val = match[1].toLowerCase();
  if (val.includes('k')) return parseFloat(val) * 1000;
  return parseFloat(val);
}

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  const content = msg.content.toLowerCase();

  if (!vouchRegex.test(content)) return;

  const amount = parseRobux(content);
  if (!amount) return;

  let robux = amount;

  if (content.includes('after'))
    robux = Math.ceil(amount / (1 - TAX));

  addData(msg.author.id, robux, 1);
});

/* ================= LEADERBOARD EMBED ================= */

function buildEmbed(page = 0) {

  const list = Object.entries(db)
    .sort((a, b) => b[1].robux - a[1].robux);

  const perPage = 10;
  const pages = Math.ceil(list.length / perPage) || 1;

  const slice = list.slice(page * perPage, page * perPage + perPage);

  let desc = '';

  slice.forEach(([id, data], i) => {
    const rank = String(i + 1 + page * perPage).padStart(2, '0');
    desc += `${rank} — <@${id}> • ${format(data.robux)} Robux • ${data.vouch} Vouch\n`;
  });

  if (!desc) desc = 'Belum ada data';

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('━━━ ✦ Top Spend Robux & Vouch ✦ ━━━')
    .setDescription(desc)
    .setFooter({
      text: `Nice Blox • Page ${page + 1}/${pages} | ${getSmartTime()}`,
      iconURL: FOOTER_ICON
    });

  return { embed, pages };
}

/* ================= LOGIN ================= */

client.login(token);