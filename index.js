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
  .setDescription('Calculate Robux tax, gamepass & price')
  .addIntegerOption(o =>
    o.setName('jumlah')
      .setDescription('Robux amount')
      .setRequired(true)
  )
  .addStringOption(o =>
    o.setName('mode')
      .setDescription('Calculation mode')
      .addChoices(
        { name: 'After Tax', value: 'after' },
        { name: 'Before Tax', value: 'before' }
      )
      .setRequired(true)
  )
  .addIntegerOption(o =>
    o.setName('rate')
      .setDescription('Custom price per Robux')
      .setRequired(true)
  );



// ===== CEK USER =====
const cekCommand = new SlashCommandBuilder()
  .setName('cek')
  .setDescription('Cek place id + gamepass dari username Roblox')
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
   INTERACTIONS
========================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;



  /* ======================
     TAX
  ====================== */
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



  /* ======================
     CEK USER (PLACE + GAMEPASS)
  ====================== */
  if (interaction.commandName === 'cek') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      // === get user id ===
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] })
      });

      const userData = await userRes.json();
      const userId = userData.data[0]?.id;

      if (!userId)
        return interaction.editReply('User tidak ditemukan.');



      // === get place id ===
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=1`
      );

      const gameData = await gameRes.json();

      const placeId =
        gameData.data?.[0]?.rootPlace?.id ||
        gameData.data?.[0]?.id ||
        'Tidak ditemukan';



      // === get gamepass ===
      const passRes = await fetch(
        `https://games.roblox.com/v1/games/${placeId}/game-passes?limit=50`
      );

      const passData = await passRes.json();

      let gamepassText = 'Tidak ada gamepass';

      if (passData.data?.length) {
        gamepassText = passData.data
          .map(p => `• ${p.name} — ${p.price ?? 0} Robux`)
          .join('\n');
      }



      const embed = new EmbedBuilder()
        .setColor(0x00b894)
        .setTitle('Roblox Info')
        .setDescription(
`Username : ${username}
User ID  : ${userId}
Place ID : ${placeId}

Gamepass
${gamepassText}`
        );

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      return interaction.editReply('Gagal mengambil data Roblox.');
    }
  }

});



client.login(token);