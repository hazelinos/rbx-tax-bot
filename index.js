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



/* =========================
   HELPER
========================= */

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
      .setDescription('Jumlah robux')
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
      .setDescription('Set custom price')
      .setRequired(true)
  );


// ===== CEK (Place + Gamepass) =====
const cekCommand = new SlashCommandBuilder()
  .setName('cek')
  .setDescription('Cek place id dan gamepass player')
  .addStringOption(o =>
    o.setName('username')
      .setDescription('Username Roblox')
      .setRequired(true)
  );



/* =========================
   REGISTER COMMANDS
========================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: [taxCommand.toJSON(), cekCommand.toJSON()] }
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



  /* ================= TAX ================= */
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



  /* ================= CEK ================= */
  if (interaction.commandName === 'cek') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      // ambil userId
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] })
      });

      const userData = await userRes.json();
      const userId = userData.data?.[0]?.id;

      if (!userId)
        return interaction.editReply('User tidak ditemukan.');



      // ambil game (place)
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=1`
      );

      const gameData = await gameRes.json();
      const game = gameData.data?.[0];

      if (!game)
        return interaction.editReply('User belum memiliki game / place.');

      const placeId = game.rootPlace?.id;
      const universeId = game.id;



      // ambil gamepass
      let passText = 'Tidak ada';

      const passRes = await fetch(
        `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=10`
      );

      const passData = await passRes.json();

      if (passData.data?.length) {
        passText = passData.data
          .map(p => `• ${p.name} — ${p.price ?? 0} Robux`)
          .join('\n');
      }



      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`Roblox Info — ${username}`)
        .setDescription(
`Place ID : ${placeId}

Gamepass
${passText}`
        );

      interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      interaction.editReply('Gagal ambil data Roblox.');
    }
  }

});



client.login(token);