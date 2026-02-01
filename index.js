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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});



/* ================= CONFIG ================= */

const TAX = 0.3;
const EMBED_COLOR = 0x1F6FEB;
const format = n => n.toLocaleString('id-ID');



/* ================= DATABASE ================= */

const DB_FILE = './leaderboard.json';

let leaderboardData = {};

if (fs.existsSync(DB_FILE)) {
  leaderboardData = JSON.parse(fs.readFileSync(DB_FILE));
}

const saveDB = () =>
  fs.writeFileSync(DB_FILE, JSON.stringify(leaderboardData, null, 2));



/* ================= COMMANDS ================= */

const taxCommand = new SlashCommandBuilder()
  .setName('tax')
  .setDescription('Robux tax calculator')
  .addIntegerOption(o =>
    o.setName('jumlah').setDescription('Jumlah robux').setRequired(true))
  .addStringOption(o =>
    o.setName('mode')
      .addChoices(
        { name: 'After Tax', value: 'after' },
        { name: 'Before Tax', value: 'before' }
      )
      .setRequired(true))
  .addIntegerOption(o =>
    o.setName('rate')
      .setDescription('Harga per robux')
      .setRequired(true));



const placeCommand = new SlashCommandBuilder()
  .setName('placeid')
  .setDescription('Mengambil place id player')
  .addStringOption(o =>
    o.setName('username').setRequired(true));



const leaderboardCommand = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Lihat leaderboard robux');



const setCommand = new SlashCommandBuilder()
  .setName('setleaderboard')
  .setDescription('Admin only - tambah robux & vouch manual')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption(o =>
    o.setName('user').setRequired(true))
  .addIntegerOption(o =>
    o.setName('robux').setRequired(true))
  .addIntegerOption(o =>
    o.setName('vouch').setRequired(true));



/* ================= REGISTER ================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    {
      body: [
        taxCommand.toJSON(),
        placeCommand.toJSON(),
        leaderboardCommand.toJSON(),
        setCommand.toJSON()
      ]
    }
  );
})();



/* ================= READY ================= */

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});



/* ================= AUTO VOUCH PARSER ================= */

function parseRobux(text) {
  const match = text.match(/(\d+(?:\.\d+)?)(k)?/i);
  if (!match) return 0;

  let num = parseFloat(match[1]);
  if (match[2]) num *= 1000;

  return Math.floor(num);
}

client.on('messageCreate', message => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();

  if (!/(vouch|vocuh|vouc|voch|\+vouch)/.test(msg)) return;

  const amount = parseRobux(msg);
  if (!amount) return;

  const isAfter = /after/.test(msg);
  const finalRobux = isAfter
    ? Math.ceil(amount / (1 - TAX))
    : amount;

  const id = message.author.id;

  if (!leaderboardData[id])
    leaderboardData[id] = { robux: 0, vouch: 0 };

  leaderboardData[id].robux += finalRobux;
  leaderboardData[id].vouch += 1;

  saveDB();
});



/* ================= INTERACTIONS ================= */

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



  /* ===== PLACEID ===== */
  if (interaction.commandName === 'placeid') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

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
        return interaction.editReply('User tidak ditemukan.');

      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`
      );

      const gameData = await gameRes.json();
      const placeId = gameData.data?.[0]?.rootPlace?.id ?? 'Tidak ditemukan';

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`Place ID milik ${username} :`)
        .setDescription(`\`\`\`\n${placeId}\n\`\`\``);

      return interaction.editReply({ embeds: [embed] });

    } catch {
      return interaction.editReply('Gagal mengambil data.');
    }
  }



  /* ===== LEADERBOARD ===== */
  if (interaction.commandName === 'leaderboard') {

    const sorted = Object.entries(leaderboardData)
      .sort((a, b) => b[1].robux - a[1].robux)
      .slice(0, 10);

    if (!sorted.length)
      return interaction.reply('Belum ada data.');

    const text = sorted.map((u, i) =>
      `${i+1}. <@${u[0]}> • ${format(u[1].robux)} Robux • ${u[1].vouch} vouch`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Spend Robux Leaderboard')
      .setDescription(text);

    return interaction.reply({ embeds: [embed] });
  }



  /* ===== ADMIN SET ===== */
  if (interaction.commandName === 'setleaderboard') {

    const user  = interaction.options.getUser('user');
    const robux = interaction.options.getInteger('robux');
    const vouch = interaction.options.getInteger('vouch');

    const id = user.id;

    if (!leaderboardData[id])
      leaderboardData[id] = { robux: 0, vouch: 0 };

    leaderboardData[id].robux += robux;
    leaderboardData[id].vouch += vouch;

    saveDB();

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Leaderboard Updated')
      .setDescription(
`User   : <@${id}>
Robux  : +${format(robux)}
Vouch  : +${vouch}

Total sekarang
Robux  : ${format(leaderboardData[id].robux)}
Vouch  : ${leaderboardData[id].vouch}`);

    return interaction.reply({ embeds: [embed] });
  }

});



client.login(token);