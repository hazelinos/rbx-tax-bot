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

const client = new Client({
  intents: [GatewayIntentBits.Guilds] // ❗ leaderboard TIDAK butuh message intent
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
        .setDescription('Mode tax')
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
    .setDescription('Menampilkan leaderboard spend robux'),



  /* ===== ADMIN SET ===== */
  new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Admin only - tambah data leaderboard manual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(o =>
      o.setName('user')
        .setDescription('User target')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('robux')
        .setDescription('Jumlah robux')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('vouch')
        .setDescription('Jumlah vouch')
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



/* ================= INTERACTION ================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;



  /* ================================================= */
  /* ===================== TAX ======================= */
  /* ================================================= */

  if (interaction.commandName === 'tax') {

    const jumlah = interaction.options.getInteger('jumlah');
    const mode = interaction.options.getString('mode');
    const rate = interaction.options.getInteger('rate');

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
`Gamepass : ${format(gamepass)} Robux
Diterima : ${format(diterima)} Robux
Harga    : Rp ${format(harga)}

──────────────
Rate ${rate}`
      );

    return interaction.reply({ embeds: [embed] });
  }



  /* ================================================= */
  /* ==================== PLACE ID =================== */
  /* ================================================= */

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
      const game = gameData.data?.find(g => g.rootPlace?.id);
      const placeId = game?.rootPlace?.id ?? 'Tidak ditemukan';

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`Place ID milik ${username} :`)
        .setDescription(`\`\`\`\n${placeId}\n\`\`\``);

      return interaction.editReply({ embeds: [embed] });

    } catch {
      return interaction.editReply('Gagal mengambil data.');
    }
  }



  /* ================================================= */
  /* ================= LEADERBOARD =================== */
  /* ================================================= */

  if (interaction.commandName === 'leaderboard') {

    const sorted = Object.entries(leaderboardData)
      .sort((a, b) => b[1].robux - a[1].robux)
      .slice(0, 10);

    if (!sorted.length)
      return interaction.reply('Belum ada data.');

    const text = sorted.map((u, i) =>
      `${i + 1}. <@${u[0]}> • ${format(u[1].robux)} Robux • ${u[1].vouch} vouch`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Spend Robux Leaderboard')
      .setDescription(text);

    return interaction.reply({ embeds: [embed] });
  }



  /* ================================================= */
  /* ================= ADMIN SET ===================== */
  /* ================================================= */

  if (interaction.commandName === 'setleaderboard') {

    const user = interaction.options.getUser('user');
    const robux = interaction.options.getInteger('robux');
    const vouch = interaction.options.getInteger('vouch');

    if (!leaderboardData[user.id])
      leaderboardData[user.id] = { robux: 0, vouch: 0 };

    leaderboardData[user.id].robux += robux;
    leaderboardData[user.id].vouch += vouch;

    saveDB();

    return interaction.reply(`✅ Ditambahkan ke ${user.username}`);
  }

});



client.login(token);