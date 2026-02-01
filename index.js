const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require('discord.js');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TAX = 0.3;

const format = n => n.toLocaleString('id-ID');


/* =========================
   COMMANDS
========================= */

// ===== TAX =====
const taxCommand = new SlashCommandBuilder()
  .setName('tax')
  .setDescription('Robux tax calculator')

  .addIntegerOption(o =>
    o.setName('jumlah')
      .setDescription('Jumlah Robux')
      .setRequired(true)
  )

  .addStringOption(o =>
    o.setName('mode')
      .setDescription('Mode perhitungan')
      .addChoices(
        { name: 'After Tax', value: 'after' },
        { name: 'Before Tax', value: 'before' }
      )
      .setRequired(true)
  )

  .addIntegerOption(o =>
    o.setName('rate')
      .setDescription('Set custom price per Robux')
      .setRequired(true)
  );



// ===== CEK USER =====
const cekCommand = new SlashCommandBuilder()
  .setName('cek')
  .setDescription('Cek place id & gamepass dari username Roblox')
  .addStringOption(o =>
    o.setName('username')
      .setDescription('Username Roblox')
      .setRequired(true)
  );



/* =========================
   REGISTER
========================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    {
      body: [
        taxCommand.toJSON(),
        cekCommand.toJSON()
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
   INTERACTION
========================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;



  /* =========================
     TAX
  ========================= */
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
      .setColor(0x5865F2)
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



  /* =========================
     CEK USERNAME
  ========================= */
  if (interaction.commandName === 'cek') {

    const username = interaction.options.getString('username');

    try {

      // 1️⃣ username → userId
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] })
      });

      const userData = await userRes.json();
      const userId = userData.data[0]?.id;

      if (!userId)
        return interaction.reply('User tidak ditemukan.');



      // 2️⃣ ambil game milik user
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=1`
      );

      const gameData = await gameRes.json();
      const placeId = gameData.data[0]?.rootPlace?.id;

      if (!placeId)
        return interaction.reply('User tidak punya game.');



      // 3️⃣ ambil gamepass
      const passRes = await fetch(
        `https://games.roblox.com/v1/games/${placeId}/game-passes?limit=50`
      );

      const passData = await passRes.json();

      let passList = 'Tidak ada gamepass';

      if (passData.data?.length) {
        passList = passData.data
          .map(p => `• ${p.name} — ${format(p.price ?? 0)} Robux`)
          .join('\n');
      }



      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Roblox Info')
        .setDescription(
`Username : ${username}
Place ID : ${placeId}

Gamepass
${passList}`
        );

      interaction.reply({ embeds: [embed] });

    } catch {
      interaction.reply('❌ Gagal mengambil data Roblox.');
    }
  }

});



client.login(token);