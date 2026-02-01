const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require('discord.js');

global.fetch = fetch;

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ================= CONFIG ================= */

const TAX = 0.3;
const BLUE = 0x1f2b3a; // biru tua clean
const format = n => n.toLocaleString('id-ID');


/* ================= COMMANDS ================= */

const taxCommand = new SlashCommandBuilder()
  .setName('tax')
  .setDescription('Hitung pajak Robux')
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


const placeCommand = new SlashCommandBuilder()
  .setName('placeid')
  .setDescription('Mengambil place id player')
  .addStringOption(o =>
    o.setName('username')
      .setDescription('Username Roblox')
      .setRequired(true)
  );


const passCommand = new SlashCommandBuilder()
  .setName('gamepass')
  .setDescription('Mengambil semua gamepass player')
  .addStringOption(o =>
    o.setName('username')
      .setDescription('Username Roblox')
      .setRequired(true)
  );


/* ================= REGISTER ================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: [
      taxCommand.toJSON(),
      placeCommand.toJSON(),
      passCommand.toJSON()
    ]}
  );
})();


/* ================= READY ================= */

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});


/* ================= HELPER ================= */

async function getUserId(username) {
  const res = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username] })
  });

  const data = await res.json();
  return data.data?.[0]?.id;
}


async function getUserGames(userId) {
  const res = await fetch(
    `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`
  );

  const data = await res.json();
  return data.data || [];
}


async function getGamepasses(placeId) {
  const res = await fetch(
    `https://games.roblox.com/v1/games/${placeId}/game-passes?limit=100`
  );

  const data = await res.json();
  return data.data || [];
}


/* ================= INTERACTION ================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;


  /* ================= TAX ================= */

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
      .setColor(BLUE)
      .setTitle('Robux Tax Calculator')
      .setDescription(
`Gamepass : ${format(gamepass)} Robux
Diterima : ${format(diterima)} Robux
Harga    : Rp ${format(harga)}

Rate ${rate}`
      );

    return interaction.reply({ embeds: [embed] });
  }



  /* ================= PLACE ID ================= */

  if (interaction.commandName === 'placeid') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      const userId = await getUserId(username);
      if (!userId) return interaction.editReply('User tidak ditemukan.');

      const games = await getUserGames(userId);

      const placeId = games.find(g => g.rootPlace?.id)?.rootPlace?.id;

      const embed = new EmbedBuilder()
        .setColor(BLUE)
        .setTitle(`Place id milik ${username} :`)
        .setDescription(`${placeId ?? 'Tidak ditemukan'}`);

      return interaction.editReply({ embeds: [embed] });

    } catch {
      interaction.editReply('Gagal mengambil data.');
    }
  }



  /* ================= GAMEPASS ================= */

  if (interaction.commandName === 'gamepass') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      const userId = await getUserId(username);
      if (!userId) return interaction.editReply('User tidak ditemukan.');

      const games = await getUserGames(userId);

      let allPasses = [];

      for (const g of games) {
        const placeId = g.rootPlace?.id;
        if (!placeId) continue;

        const passes = await getGamepasses(placeId);
        allPasses.push(...passes);
      }

      if (!allPasses.length) {
        return interaction.editReply('Tidak ada gamepass.');
      }

      const text = allPasses
        .map(p => `${p.name} - ${format(p.price ?? 0)} Robux`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(BLUE)
        .setTitle(`Gamepass milik ${username}`)
        .setDescription(text);

      return interaction.editReply({ embeds: [embed] });

    } catch {
      interaction.editReply('Gagal mengambil data.');
    }
  }

});


client.login(token);