const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');

/* ================= CONFIG ================= */

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const TAX = 0.3;
const EMBED_COLOR = 0x1F6FEB;

const FOOTER_ICON =
  'https://cdn.discordapp.com/attachments/1449386611036127343/1467515005825187972/20260107_131913.png';

const format = n => Number(n).toLocaleString('id-ID');

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

let db = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

const saveDB = () =>
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

function addData(id, robux = 0, vouch = 0) {
  if (!db[id]) db[id] = { robux: 0, vouch: 0 };

  db[id].robux += robux;
  db[id].vouch += vouch;

  if (db[id].robux < 0) db[id].robux = 0;
  if (db[id].vouch < 0) db[id].vouch = 0;

  saveDB();
}

/* ================= WIB TIME ================= */

function getSmartTime() {
  const time = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());

  return `Today at ${time}`;
}

/* ================= COMMANDS ================= */

const commands = [

  /* TAX */
  new SlashCommandBuilder()
    .setName('tax')
    .setDescription('Robux tax calculator')
    .addIntegerOption(o =>
      o.setName('jumlah')
        .setDescription('jumlah robux')
        .setRequired(true))
    .addStringOption(o =>
      o.setName('mode')
        .setDescription('mode tax')
        .addChoices(
          { name: 'After Tax', value: 'after' },
          { name: 'Before Tax', value: 'before' }
        )
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('rate')
        .setDescription('harga per robux')
        .setRequired(true)),

  /* PLACEID */
  new SlashCommandBuilder()
    .setName('placeid')
    .setDescription('Ambil place id player roblox')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('username roblox')
        .setRequired(true)),

  /* LEADERBOARD */
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top spend robux & vouch leaderboard'),

  /* SETLEADERBOARD */
  new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Tambah atau kurang leaderboard manual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('mode')
        .setDescription('plus atau minus')
        .addChoices(
          { name: '+', value: '+' },
          { name: '-', value: '-' }
        )
        .setRequired(true))
    .addUserOption(o =>
      o.setName('user')
        .setDescription('target user')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('robux')
        .setDescription('jumlah robux')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('vouch')
        .setDescription('jumlah vouch')
        .setRequired(true))

].map(c => c.toJSON());

/* ================= REGISTER ================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log('✅ Slash Commands Registered');
})();

/* ================= READY ================= */

client.once('clientReady', () => {
  console.log('✅ Bot Online');
});

/* ================= AUTO VOUCH ================= */

const vouchRegex =
/(vouch|vouc|voc|voch|v0uch|vuch|vouchh|vouhc|v0cuh)/i;

function parseRobux(text) {
  const match = text.match(/(\d+(?:\.\d+)?k?)/i);
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

  addData(msg.author.id, amount, 1);
});

/* ================= LEADERBOARD ================= */

function buildEmbed(page = 0) {

  const list = Object.entries(db)
    .sort((a, b) => b[1].robux - a[1].robux);

  const perPage = 10;
  const pages = Math.max(1, Math.ceil(list.length / perPage));

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

/* ================= INTERACTIONS ================= */

client.on('interactionCreate', async i => {

  if (!i.isChatInputCommand()) return;

  /* TAX */
  if (i.commandName === 'tax') {

    const jumlah = i.options.getInteger('jumlah');
    const mode = i.options.getString('mode');
    const rate = i.options.getInteger('rate');

    let gamepass, diterima;

    if (mode === 'before') {
      gamepass = jumlah;
      diterima = Math.floor(jumlah * (1 - TAX));
    } else {
      diterima = jumlah;
      gamepass = Math.ceil(jumlah / (1 - TAX));
    }

    const harga = gamepass * rate;

    return i.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLOR)
          .setTitle('Robux Tax Calculator')
          .setDescription(
`Gamepass : ${format(gamepass)} Robux
Diterima : ${format(diterima)} Robux
Harga    : Rp ${format(harga)}

Rate ${rate}`
          )
      ]
    });
  }

  /* SETLEADERBOARD (+ / -) */
  if (i.commandName === 'setleaderboard') {

    const mode = i.options.getString('mode');
    const user = i.options.getUser('user');
    const robux = i.options.getInteger('robux');
    const vouch = i.options.getInteger('vouch');

    if (mode === '+')
      addData(user.id, robux, vouch);
    else
      addData(user.id, -robux, -vouch);

    return i.reply('✅ Updated');
  }

});

/* ================= LOGIN ================= */

client.login(token);