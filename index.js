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

function addData(id, robux, vouch = 1) {
  if (!db[id]) db[id] = { robux: 0, vouch: 0 };
  db[id].robux += robux;
  db[id].vouch += vouch;
  saveDB();
}

/* ================= WIB TIME ================= */

function getSmartTime() {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());
}

/* ================= COMMANDS ================= */

const commands = [

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

  new SlashCommandBuilder()
    .setName('placeid')
    .setDescription('Ambil place id player roblox')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('username roblox')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top Spend Robux & Vouch'),

  new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Admin edit leaderboard manual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(o =>
      o.setName('user')
        .setDescription('target user')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('robux')
        .setDescription('total robux')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('vouch')
        .setDescription('total vouch')
        .setRequired(true))

].map(c => c.toJSON());

/* ================= REGISTER ================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(Routes.applicationCommands(clientId), {
    body: commands
  });
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

  const val = match[1].toLowerCase();
  return val.includes('k')
    ? parseFloat(val) * 1000
    : parseFloat(val);
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

  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('━━━ ✦ Top Spend Robux & Vouch ✦ ━━━')
    .setDescription(desc)
    .setFooter({
      text: `Nice Blox • Page ${page + 1}/${pages} | ${getSmartTime()}`,
      iconURL: FOOTER_ICON
    });
}

/* ================= INTERACTIONS ================= */

client.on('interactionCreate', async i => {

  if (!i.isChatInputCommand()) return;

  /* ===== TAX ===== */
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

Rate ${format(rate)}`
          )
      ]
    });
  }

  /* ===== PLACEID ===== */
  if (i.commandName === 'placeid') {

    await i.deferReply();

    try {
      const username = i.options.getString('username');

      const userRes = await fetch(
        'https://users.roblox.com/v1/usernames/users',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames: [username] })
        }
      );

      const userData = await userRes.json();
      const userId = userData.data?.[0]?.id;

      if (!userId)
        return i.editReply('User tidak ditemukan.');

      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=50`
      );

      const gameData = await gameRes.json();

      const game = gameData.data?.find(g => g.rootPlace?.id);
      const placeId = game?.rootPlace?.id ?? 'Tidak ditemukan';

      return i.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`Place ID milik ${username} :`)
            .setDescription(`\`\`\`\n${placeId}\n\`\`\``)
        ]
      });

    } catch {
      return i.editReply('Gagal mengambil data Roblox.');
    }
  }

});

/* ================= LOGIN ================= */

client.login(token);