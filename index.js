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

/* ================= SMART TIME ================= */

function getSmartTime() {
  const now = new Date();
  const today = new Date(now.toDateString());

  const time = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (now >= today) return `Today at ${time}`;
  if (now >= yesterday) return `Yesterday at ${time}`;

  return now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short'
  }) + ` at ${time}`;
}

/* ================= COMMANDS ================= */

const commands = [

  new SlashCommandBuilder()
    .setName('tax')
    .setDescription('Robux tax calculator')
    .addIntegerOption(o =>
      o.setName('jumlah').setDescription('Jumlah robux').setRequired(true))
    .addStringOption(o =>
      o.setName('mode')
        .setDescription('Before or After tax')
        .addChoices(
          { name: 'After Tax', value: 'after' },
          { name: 'Before Tax', value: 'before' }
        )
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('rate').setDescription('Harga per robux').setRequired(true)),

  new SlashCommandBuilder()
    .setName('placeid')
    .setDescription('Ambil place id player')
    .addStringOption(o =>
      o.setName('username').setDescription('Username Roblox').setRequired(true)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top Spend Robux & Vouch'),

  new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Admin edit leaderboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(o =>
      o.setName('user').setDescription('Target user').setRequired(true))
    .addIntegerOption(o =>
      o.setName('robux').setDescription('Total robux').setRequired(true))
    .addIntegerOption(o =>
      o.setName('vouch').setDescription('Total vouch').setRequired(true))

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
/(vouch+|vouc|voc|voch|v0uch|vuch|v0c|vouhc)/i;

function parseRobux(text) {
  const m = text.match(/(\d+(?:\.\d+)?k?)/i);
  if (!m) return null;

  let val = m[1].toLowerCase();
  if (val.includes('k')) return parseFloat(val) * 1000;
  return parseFloat(val);
}

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  const t = msg.content.toLowerCase();

  if (!vouchRegex.test(t)) return;

  const amount = parseRobux(t);
  if (!amount) return;

  let robux = amount;

  if (t.includes('after'))
    robux = Math.ceil(amount / (1 - TAX));

  addData(msg.author.id, robux, 1);
});

/* ================= LEADERBOARD EMBED ================= */

function buildEmbed(page = 0) {

  const entries = Object.entries(db)
    .sort((a, b) => b[1].robux - a[1].robux);

  const perPage = 10;
  const pages = Math.max(1, Math.ceil(entries.length / perPage));

  const slice = entries.slice(page * perPage, page * perPage + perPage);

  let desc = '';

  slice.forEach(([id, d], i) => {
    const rank = String(i + 1 + page * perPage).padStart(2, '0');
    desc += `${rank} — <@${id}> • ${format(d.robux)} Robux • ${d.vouch} Vouch\n`;
  });

  if (!desc) desc = 'Belum ada data';

  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('━━━ ✦ Top Spend Robux & Vouch ✦ ━━━')
    .setDescription(desc)
    .setFooter({
      text: `Nice Blox • Page ${page + 1} | ${getSmartTime()}`,
      iconURL: FOOTER_ICON
    });
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

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Robux Tax Calculator')
      .setDescription(
`Gamepass : ${format(gamepass)}
Diterima : ${format(diterima)}
Harga : Rp ${format(harga)}`
      );

    return i.reply({ embeds: [embed] });
  }

  /* LEADERBOARD */
  if (i.commandName === 'leaderboard') {

    let page = 0;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('◀ Prev').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('Next ▶').setStyle(ButtonStyle.Secondary)
    );

    const msg = await i.reply({
      embeds: [buildEmbed(page)],
      components: [row],
      fetchReply: true
    });

    const collector = msg.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', btn => {

      if (btn.customId === 'prev') page--;
      if (btn.customId === 'next') page++;

      const maxPage = Math.max(1, Math.ceil(Object.keys(db).length / 10)) - 1;

      if (page < 0) page = 0;
      if (page > maxPage) page = maxPage;

      btn.update({ embeds: [buildEmbed(page)] });
    });
  }

});

client.login(token);