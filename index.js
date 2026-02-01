const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TAX = 0.3;
const format = n => n.toLocaleString('id-ID');



/* ================= COMMANDS ================= */

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


/* ✅ ubah deskripsi */
const cekCommand = new SlashCommandBuilder()
  .setName('cek')
  .setDescription('Mengambil place id player')
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
    { body: [taxCommand.toJSON(), cekCommand.toJSON()] }
  );
})();



/* ================= READY ================= */

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});



/* ================= INTERACTION ================= */

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

    return interaction.reply(
`Robux Tax Calculator

Gamepass : ${format(gamepass)} Robux
Diterima : ${format(diterima)} Robux
Harga    : Rp ${format(harga)}

Rate ${rate}`
    );
  }



  /* ===== CEK USERNAME (PLACE ONLY) ===== */
  if (interaction.commandName === 'cek') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      // username -> userId
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] })
      });

      const userData = await userRes.json();
      const userId = userData.data?.[0]?.id;

      if (!userId)
        return interaction.editReply('User tidak ditemukan.');



      // creations -> ambil place id (INI BIARIN, UDAH WORK)
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`
      );

      const gameData = await gameRes.json();

      const game = gameData.data?.find(g => g.rootPlace?.id);
      const placeId = game?.rootPlace?.id ?? 'Tidak ditemukan';



      return interaction.editReply(
`Roblox Info

Username : ${username}
Place ID : ${placeId}`
      );

    } catch (err) {
      console.error(err);
      interaction.editReply('Gagal mengambil data Roblox.');
    }
  }

});


client.login(token);