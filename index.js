const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require('discord.js');

const axios = require('axios');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const format = n => n.toLocaleString('id-ID');



/* =========================
   COMMANDS
========================= */

const taxCommand = new SlashCommandBuilder()
  .setName('tax')
  .setDescription('Robux tax calculator')
  .addIntegerOption(o =>
    o.setName('jumlah')
      .setDescription('Robux amount')
      .setRequired(true))
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
      .setDescription('Set custom price per Robux')
      .setRequired(true));


const gamepassCommand = new SlashCommandBuilder()
  .setName('gamepass')
  .setDescription('Show player gamepasses')
  .addStringOption(o =>
    o.setName('username')
      .setRequired(true));


const placeCommand = new SlashCommandBuilder()
  .setName('placeid')
  .setDescription('Show player place id')
  .addStringOption(o =>
    o.setName('username')
      .setRequired(true));



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
        gamepassCommand.toJSON(),
        placeCommand.toJSON()
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



  /* ===== GAMEPASS ===== */
  if (interaction.commandName === 'gamepass') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      const user = await axios.post(
        'https://users.roblox.com/v1/usernames/users',
        { usernames: [username] }
      );

      const userId = user.data.data[0]?.id;

      if (!userId)
        return interaction.editReply('User tidak ditemukan.');

      const pass = await axios.get(
        `https://inventory.roblox.com/v1/users/${userId}/items/GamePass?limit=50`
      );

      if (!pass.data.data.length)
        return interaction.editReply('User tidak punya gamepass.');

      const list = pass.data.data
        .map(p => `• ${p.name} — ${p.price ?? 0} Robux`)
        .join('\n');

      interaction.editReply(`Gamepass milik **${username}**\n\n${list}`);

    } catch {
      interaction.editReply('Gagal ambil data.');
    }
  }



  /* ===== PLACEID ===== */
  if (interaction.commandName === 'placeid') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      const user = await axios.post(
        'https://users.roblox.com/v1/usernames/users',
        { usernames: [username] }
      );

      const userId = user.data.data[0]?.id;

      if (!userId)
        return interaction.editReply('User tidak ditemukan.');

      const game = await axios.get(
        `https://games.roblox.com/v2/users/${userId}/games?limit=1`
      );

      const placeId = game.data.data[0]?.rootPlace?.id ?? 'Tidak ditemukan';

      interaction.editReply(
`Username : ${username}
User ID  : ${userId}
Place ID : ${placeId}`
      );

    } catch {
      interaction.editReply('Gagal ambil data.');
    }
  }

});



client.login(token);