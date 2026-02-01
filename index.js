const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const TAX = 0.3;
const EMBED_COLOR = 0x1F6FEB;

const format = n => n.toLocaleString('id-ID');



/* ================= CLIENT ================= */
/* AUTO VOUCH BUTUH intents ini */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});



/* ================= DATABASE ================= */

const DB_FILE = './leaderboard.json';

let leaderboardData = {};

if (fs.existsSync(DB_FILE)) {
  leaderboardData = JSON.parse(fs.readFileSync(DB_FILE));
}

const saveDB = () =>
  fs.writeFileSync(DB_FILE, JSON.stringify(leaderboardData, null, 2));



/* ================= COMMANDS ================= */

const commands = [

  /* ===== TAX ===== */
  new SlashCommandBuilder()
    .setName('tax')
    .setDescription('Robux tax calculator')
    .addIntegerOption(o =>
      o.setName('jumlah')
        .setDescription('Jumlah robux')
        .setRequired(true))
    .addStringOption(o =>
      o.setName('mode')
        .setDescription('Before / After tax')
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
    .setDescription('Menampilkan Top Spend Robux & Vouch'),



  /* ===== ADMIN MANUAL ===== */
  new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Admin only - tambah robux & vouch manual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(o =>
      o.setName('user')
        .setDescription('User target')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('robux')
        .setDescription('Tambah robux')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('vouch')
        .setDescription('Tambah vouch')
        .setRequired(true))
];



/* ================= REGISTER ================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commands.map(c => c.toJSON()) }
  );
})();



/* ================= READY ================= */

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});



/* ================================================= */
/* ================= AUTO VOUCH ===================== */
/* ================================================= */

function parseAmount(text) {
  const match = text.match(/(\d+(?:\.\d+)?)(k)?/i);
  if (!match) return 0;

  let num = parseFloat(match[1]);
  if (match[2]) num *= 1000;

  return Math.floor(num);
}

client.on('messageCreate', message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  /* deteksi kata vouch */
  if (!/(vouch|vocuh|vouc|voch|\+vouch)/.test(content)) return;

  const amount = parseAmount(content);
  if (!amount) return;

  const isAfter = /after/.test(content);

  const robux = isAfter
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
/* ================= INTERACTION ==================== */
/* ================================================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;



  /* ===== TAX ===== */
  if (interaction.commandName === 'tax') {

    const jumlah = interaction.options.getInteger('jumlah');
    const mode   = interaction.options.getString('mode');
    const rate   = interaction.options.getInteger('rate');

    let gamepass, diterima;

    if (mode === 'before') {
      gamepass = jumlah;
      diterima = Math.floor(jumlah * 0.7);
    } else {
      diterima = jumlah;
      gamepass = Math.ceil(jumlah / 0.7);
    }

    const harga = gamepass * rate;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Robux Tax Calculator')
      .setDescription(
`Gamepass : ${format(gamepass)} Robux
Diterima : ${format(diterima)} Robux
Harga    : Rp ${format(harga)}

Rate ${rate}`);

    return interaction.reply({ embeds: [embed] });
  }



  /* ===== LEADERBOARD ===== */
  if (interaction.commandName === 'leaderboard') {

    const sorted = Object.entries(leaderboardData)
      .sort((a, b) => b[1].robux - a[1].robux)
      .slice(0, 10);

    if (!sorted.length)
      return interaction.reply('Belum ada data.');

    const lines = sorted.map(([id, d], i) =>
      `${i+1}. <@${id}> • ${format(d.robux)} Robux • ${d.vouch} vouch`
    );

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Top Spend Robux & Vouch')
      .setDescription(lines.join('\n'));

    return interaction.reply({
      embeds: [embed],
      allowedMentions: { parse: [] }
    });
  }



  /* ===== ADMIN MANUAL ===== */
  if (interaction.commandName === 'setleaderboard') {

    const user  = interaction.options.getUser('user');
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