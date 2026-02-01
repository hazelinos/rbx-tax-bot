const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const fs = require('fs');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const TAX = 0.3;
const EMBED_COLOR = 0x1F6FEB;
const format = n => n.toLocaleString('id-ID');



/* ================================================= */
/* ================= CLIENT ========================= */
/* ================================================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});



/* ================================================= */
/* ================= DATABASE ======================= */
/* ================================================= */

const DB_FILE = './leaderboard.json';

let leaderboardData = {};

if (fs.existsSync(DB_FILE)) {
  leaderboardData = JSON.parse(fs.readFileSync(DB_FILE));
}

const saveDB = () =>
  fs.writeFileSync(DB_FILE, JSON.stringify(leaderboardData, null, 2));



/* ================================================= */
/* ================= COMMANDS ======================= */
/* ================================================= */

const commands = [

  /* ===== TAX ===== */
  new SlashCommandBuilder()
    .setName('tax')
    .setDescription('Robux tax calculator')
    .addIntegerOption(o =>
      o.setName('jumlah').setDescription('Jumlah robux').setRequired(true))
    .addStringOption(o =>
      o.setName('mode')
        .setDescription('Before / After')
        .addChoices(
          { name: 'After Tax', value: 'after' },
          { name: 'Before Tax', value: 'before' }
        )
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('rate')
        .setDescription('Harga per robux')
        .setRequired(true)),



  /* ===== PLACE ID ===== */
  new SlashCommandBuilder()
    .setName('placeid')
    .setDescription('Mengambil place id player')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Username Roblox')
        .setRequired(true)),



  /* ===== LEADERBOARD ===== */
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top Spend Robux & Vouch leaderboard'),



  /* ===== ADMIN MANUAL ===== */
  new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Admin only - edit robux & vouch manual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(o =>
      o.setName('user').setDescription('Target user').setRequired(true))
    .addIntegerOption(o =>
      o.setName('robux').setDescription('Tambah / minus robux').setRequired(true))
    .addIntegerOption(o =>
      o.setName('vouch').setDescription('Tambah / minus vouch').setRequired(true))
];



/* ================================================= */
/* ================= REGISTER ======================= */
/* ================================================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commands.map(c => c.toJSON()) }
  );
})();



/* ================================================= */
/* ================= READY ========================== */
/* ================================================= */

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});



/* ================================================= */
/* ================= SMART PARSER =================== */
/* ================================================= */

function parseAmount(text) {
  const match = text.match(/(\d+(?:[.,]\d+)?)(k)?/i);
  if (!match) return 0;

  let num = parseFloat(match[1].replace(',', '.'));
  if (match[2]) num *= 1000;

  return Math.floor(num);
}

function isVouch(text) {
  return /(^|\s)v\w{0,4}/i.test(text); // voc, vch, vouchh, dll
}

function isAfter(text) {
  return /(after|aft|aftr|af)/i.test(text);
}



/* ================================================= */
/* ================= AUTO VOUCH ===================== */
/* ================================================= */

client.on('messageCreate', message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  if (!isVouch(content)) return;

  const amount = parseAmount(content);
  if (!amount) return;

  const robux = isAfter(content)
    ? Math.ceil(amount / (1 - TAX))
    : amount;

  const id = message.author.id;

  if (!leaderboardData[id])
    leaderboardData[id] = { robux: 0, vouch: 0 };

  leaderboardData[id].robux += robux;
  leaderboardData[id].vouch += 1;

  saveDB();
});



/* ================================================= */
/* ================= LEADERBOARD UI ================= */
/* ================================================= */

function buildLeaderboardPage(page = 0) {
  const entries = Object.entries(leaderboardData)
    .sort((a, b) => b[1].robux - a[1].robux);

  const perPage = 10;
  const maxPage = Math.ceil(entries.length / perPage) - 1;

  const start = page * perPage;
  const current = entries.slice(start, start + perPage);

  const lines = current.map(([id, d], i) => {
    const rank = String(start + i + 1).padStart(2, '0');
    return `${rank} — <@${id}>   • ${format(d.robux)} Robux   • ${d.vouch} Vouch`;
  });

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(
`───  ✦  Top Spend Robux & Vouch  ✦  ───

${lines.join('\n')}

Nice Blox • Cheap & Trusted Roblox store`
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`prev_${page}`)
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),

    new ButtonBuilder()
      .setCustomId(`next_${page}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= maxPage)
  );

  return { embed, row };
}



/* ================================================= */
/* ================= INTERACTIONS =================== */
/* ================================================= */

client.on('interactionCreate', async interaction => {

  /* ===== BUTTONS ===== */
  if (interaction.isButton()) {
    const [type, pageStr] = interaction.customId.split('_');
    let page = parseInt(pageStr);

    if (type === 'next') page++;
    if (type === 'prev') page--;

    const { embed, row } = buildLeaderboardPage(page);

    return interaction.update({
      embeds: [embed],
      components: [row],
      allowedMentions: { parse: [] }
    });
  }



  if (!interaction.isChatInputCommand()) return;



  /* ===== LEADERBOARD ===== */
  if (interaction.commandName === 'leaderboard') {
    const { embed, row } = buildLeaderboardPage(0);

    return interaction.reply({
      embeds: [embed],
      components: [row],
      allowedMentions: { parse: [] }
    });
  }



  /* ===== SET MANUAL ===== */
  if (interaction.commandName === 'setleaderboard') {

    const user = interaction.options.getUser('user');
    const robux = interaction.options.getInteger('robux');
    const vouch = interaction.options.getInteger('vouch');

    if (!leaderboardData[user.id])
      leaderboardData[user.id] = { robux: 0, vouch: 0 };

    leaderboardData[user.id].robux += robux;
    leaderboardData[user.id].vouch += vouch;

    saveDB();

    return interaction.reply(`✅ Data ${user.username} diperbarui`);
  }

});



client.login(token);