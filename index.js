const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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


const placeCommand = new SlashCommandBuilder()
  .setName('placeid')
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
    { body: [taxCommand.toJSON(), placeCommand.toJSON()] }
  );
})();



/* ================= READY ================= */

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});



/* ================= INTERACTION ================= */

client.on('interactionCreate', async interaction => {

  /* ================= SLASH ================= */

  if (interaction.isChatInputCommand()) {

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



    /* ===== PLACEID ===== */
    if (interaction.commandName === 'placeid') {

      await interaction.deferReply();

      const username = interaction.options.getString('username');

      try {

        // username -> userId
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



        // creations -> place id (yang sudah terbukti WORK)
        const gameRes = await fetch(
          `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`
        );

        const gameData = await gameRes.json();

        const game = gameData.data?.find(g => g.rootPlace?.id);
        const placeId = game?.rootPlace?.id ?? 'Tidak ditemukan';



        /* ==== EMBED ==== */
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('Roblox Place Info')
          .setDescription(
`Username : ${username}
Place ID : ${placeId}`
          );



        /* ==== BUTTON COPY ==== */
        const button = new ButtonBuilder()
          .setCustomId(`copy_${placeId}`)
          .setLabel('Salin Place ID')
          .setEmoji('📋')
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);



        return interaction.editReply({
          embeds: [embed],
          components: [row]
        });

      } catch (err) {
        console.log(err);
        return interaction.editReply('Gagal mengambil data Roblox.');
      }
    }
  }



  /* ================= BUTTON ================= */

  if (interaction.isButton()) {

    if (interaction.customId.startsWith('copy_')) {

      const placeId = interaction.customId.replace('copy_', '');

      return interaction.reply({
        content: placeId,
        ephemeral: true
      });
    }
  }

});



client.login(token);