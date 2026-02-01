const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

global.fetch = fetch;

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
      .setDescription('Harga per robux')
      .setRequired(true)
  );


const cekCommand = new SlashCommandBuilder()
  .setName('cek')
  .setDescription('Cek place id & gamepass player')
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
   INTERACTIONS
========================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;



  /* ================= TAX ================= */
  if (interaction.commandName === 'tax') {

    const jumlah = interaction.options.getInteger('jumlah');
    const mode = interaction.options.getString('mode');
    const rate = interaction.options.getInteger('rate');

    let gamepass, diterima;

    if (mode === 'before') {
      gamepass = jumlah;
      diterima = Math.floor(jumlah * 0.7);
    } else {
      diterima = jumlah;
      gamepass = Math.ceil(jumlah / 0.7);
    }

    const harga = gamepass * rate;

    await interaction.reply(
`Robux Tax Calculator

Gamepass : ${format(gamepass)} Robux
Diterima : ${format(diterima)} Robux
Harga    : Rp ${format(harga)}

──────────────
Rate ${rate}`
    );
  }



  /* ================= CEK ================= */
  if (interaction.commandName === 'cek') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      /* USER → USERID */
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] })
      });

      const userData = await userRes.json();
      const userId = userData.data?.[0]?.id;

      if (!userId)
        return interaction.editReply('User tidak ditemukan.');



      /* USERID → PLACE ID (FIX ENDPOINT) */
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=1`
      );

      const gameData = await gameRes.json();
      const placeId = gameData.data?.[0]?.rootPlace?.id || 'Tidak ditemukan';



      /* USERID → GAMEPASS */
      const passRes = await fetch(
        `https://inventory.roblox.com/v1/users/${userId}/items/GamePass?limit=50`
      );

      const passData = await passRes.json();

      let gamepassText = 'Tidak ada gamepass';

      if (passData.data && passData.data.length) {
        gamepassText = passData.data
          .map(p => `${p.name} (${p.price ?? 0} Robux)`)
          .join('\n');
      }



      await interaction.editReply(
`Roblox Info

Username : ${username}
Place ID : ${placeId}

Gamepass :
${gamepassText}`
      );

    } catch (err) {
      console.error(err);
      interaction.editReply('Gagal mengambil data Roblox.');
    }
  }

});



client.login(token);