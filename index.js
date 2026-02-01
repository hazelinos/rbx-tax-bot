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
  PermissionsBitField
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

function getWIB() {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  );

  const time = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `Today at ${time}`;
}

/* ================= COMMANDS ================= */

const commands = [

  new SlashCommandBuilder()
    .setName('tax')
    .setDescription('Robux tax calculator')
    .addIntegerOption(o => o.setName('jumlah').setRequired(true))
    .addStringOption(o =>
      o.setName('mode')
        .addChoices(
          { name: 'After Tax', value: 'after' },
          { name: 'Before Tax', value: 'before' }
        ).setRequired(true))
    .addIntegerOption(o => o.setName('rate').setRequired(true)),

  new SlashCommandBuilder()
    .setName('placeid')
    .setDescription('Get place id player')
    .addStringOption(o => o.setName('username').setRequired(true)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top Spend Robux & Vouch'),

  new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Admin only edit')
    .addUserOption(o => o.setName('user').setRequired(true))
    .addIntegerOption(o => o.setName('robux').setRequired(true))
    .addIntegerOption(o => o.setName('vouch').setRequired(true))

].map(c => c.toJSON());

/* ================= REGISTER ================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
})();

/* ================= READY ================= */

client.once('clientReady', () => {
  console.log('✅ Bot Online');
});

/* ================= AUTO VOUCH ================= */

const vouchRegex =
/(vouch|vouc|voc|voch|v0uch|vuch|vouchh|v0c|vouhc|v0cuh)/i;

function parseRobux(text) {
  const m = text.match(/(\d+(?:\.\d+)?k?)/i);
  if (!m) return null;

  let v = m[1].toLowerCase();
  if (v.includes('k')) return parseFloat(v) * 1000;
  return parseFloat(v);
}

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  const c = msg.content.toLowerCase();
  if (!vouchRegex.test(c)) return;

  const amount = parseRobux(c);
  if (!amount) return;

  let robux = amount;
  if (c.includes('after'))
    robux = Math.ceil(amount / (1 - TAX));

  addData(msg.author.id, robux, 1);
});

/* ================= EMBED BUILDER ================= */

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
      text: `Nice Blox • Page ${page + 1}/${pages} | ${getWIB()}`,
      iconURL: FOOTER_ICON
    });

  return { embed, pages };
}

/* ================= INTERACTION ================= */

client.on('interactionCreate', async i => {

  if (!i.isChatInputCommand() && !i.isButton()) return;

  /* ---------- TAX ---------- */
  if (i.isChatInputCommand() && i.commandName === 'tax') {

    await i.deferReply();

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

    return i.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLOR)
          .setTitle('Robux Tax Calculator')
          .setDescription(
`Gamepass : ${format(gamepass)}
Diterima : ${format(diterima)}
Harga : Rp ${format(harga)}`
          )
      ]
    });
  }

  /* ---------- PLACEID ---------- */
  if (i.isChatInputCommand() && i.commandName === 'placeid') {

    await i.deferReply();

    const username = i.options.getString('username');

    return i.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLOR)
          .setTitle(`Place ID milik ${username} :`)
          .setDescription('```\n123456\n```')
      ]
    });
  }

  /* ---------- LEADERBOARD ---------- */
  if (i.isChatInputCommand() && i.commandName === 'leaderboard') {

    await i.deferReply();

    let page = 0;

    const { embed, pages } = buildEmbed(page);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('◀ Prev').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('Next ▶').setStyle(ButtonStyle.Secondary)
    );

    const msg = await i.editReply({
      embeds: [embed],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', async btn => {

      if (btn.user.id !== i.user.id)
        return btn.reply({ content: 'Bukan buat kamu 😆', ephemeral: true });

      if (btn.customId === 'prev') page--;
      if (btn.customId === 'next') page++;

      if (page < 0) page = 0;
      if (page >= pages) page = pages - 1;

      const updated = buildEmbed(page);

      await btn.update({ embeds: [updated.embed] });
    });
  }

  /* ---------- ADMIN SET ---------- */
  if (i.isChatInputCommand() && i.commandName === 'setleaderboard') {

    if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return i.reply({ content: 'Admin only', ephemeral: true });

    const user = i.options.getUser('user');
    const robux = i.options.getInteger('robux');
    const vouch = i.options.getInteger('vouch');

    db[user.id] = { robux, vouch };
    saveDB();

    return i.reply('Updated');
  }

});

/* ================= LOGIN ================= */

client.login(token);