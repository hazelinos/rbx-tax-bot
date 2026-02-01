const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require('discord.js');

const fs = require('fs');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const TAX = 0.3;
const EMBED_COLOR = 0x1F6FEB;

const format = n => n.toLocaleString('id-ID');



/* =========================
   DATABASE
========================= */

const DB_FILE = './leaderboard.json';

let leaderboardData = {};

if (fs.existsSync(DB_FILE)) {
  leaderboardData = JSON.parse(fs.readFileSync(DB_FILE));
}

const saveDB = () =>
  fs.writeFileSync(DB_FILE, JSON.stringify(leaderboardData, null, 2));



/* =========================
   CLIENT
========================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});



/* =========================
   COMMANDS
========================= */

// TAX
const taxCommand = new SlashCommandBuilder()
  .setName('tax')
  .setDescription('Robux tax calculator')
  .addIntegerOption(o =>
    o.setName('jumlah').setDescription('Jumlah robux').setRequired(true))
  .addStringOption(o =>
    o.setName('mode')
      .setDescription('Mode')
      .addChoices(
        { name: 'After Tax', value: 'after' },
        { name: 'Before Tax', value: 'before' }
      )
      .setRequired(true))
  .addIntegerOption(o =>
    o.setName('rate')
      .setDescription('Harga per robux')
      .setRequired(true));


// PLACE ID
const placeCommand = new SlashCommandBuilder()
  .setName('placeid')
  .setDescription('Mengambil place id player')
  .addStringOption(o =>
    o.setName('username')
      .setDescription('Username Roblox')
      .setRequired(true)
  );


// LEADERBOARD
const leaderboardCommand = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Top Robux Spenders');



/* =========================
   REGISTER COMMANDS
========================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    {
      body: [
        taxCommand.toJSON(),
        placeCommand.toJSON(),
        leaderboardCommand.toJSON()
      ]
    }
  );
})();



/* =========================
   READY
========================= */

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});



/* =========================
   INTERACTIONS
========================= */

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
      const game = gameData.data?.find(g => g.rootPlace?.id);

      const placeId = game?.rootPlace?.id ?? 'Tidak ditemukan';

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`Place ID milik ${username} :`)
        .setDescription(`\`\`\`\n${placeId}\n\`\`\``);

      return interaction.editReply({ embeds: [embed] });

    } catch {
      return interaction.editReply('Gagal mengambil data Roblox.');
    }
  }



  /* ===== LEADERBOARD ===== */
  if (interaction.commandName === 'leaderboard') {

    const sorted = Object.entries(leaderboardData)
      .sort((a, b) => b[1].robux - a[1].robux)
      .slice(0, 10);

    if (!sorted.length)
      return interaction.reply('Belum ada data leaderboard.');

    const lines = sorted.map(([id, data], i) =>
      `#${i + 1}  <@${id}>  • ${format(data.robux)} Robux • ${data.vouch} vouch`
    );

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Top Robux Spenders')
      .setDescription(lines.join('\n'))
      .setFooter({ text: 'Auto tracked from #vouch' });

    return interaction.reply({
      embeds: [embed],
      allowedMentions: { parse: [] }
    });
  }

});



/* =========================
   AUTO VOUCH PARSER
========================= */

client.on('messageCreate', message => {

  if (message.author.bot) return;
  if (message.channel.name !== 'vouch') return;

  const content = message.content.toLowerCase();

  const triggers = ['vouch', 'vc', 'voucher', 'beli', 'buy'];
  if (!triggers.some(t => content.includes(t))) return;

  const match = content.match(/(\d+(\.\d+)?\s?(k)?)/);
  if (!match) return;

  let jumlah = match[0];

  if (jumlah.includes('k')) {
    jumlah = parseFloat(jumlah.replace('k', '')) * 1000;
  }

  jumlah = Math.round(jumlah);

  let mode = 'before';

  if (/(after|aft|\ba\b)/.test(content)) mode = 'after';
  if (/(before|bf|\bb\b)/.test(content)) mode = 'before';

  let tambah = mode === 'after'
    ? Math.ceil(jumlah / 0.7)
    : jumlah;

  const uid = message.author.id;

  if (!leaderboardData[uid]) {
    leaderboardData[uid] = { robux: 0, vouch: 0 };
  }

  leaderboardData[uid].robux += tambah;
  leaderboardData[uid].vouch += 1;

  saveDB();

  message.reply(`Vouch tercatat • +${format(tambah)} Robux`);
});



client.login(token);