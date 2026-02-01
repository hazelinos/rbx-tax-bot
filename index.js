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

/* 🔵 warna embed global (biru tua) */
const EMBED_COLOR = 0x1F6FEB;



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
      .setRequired(true)
  );


const placeCommand = new SlashCommandBuilder()
  .setName('placeid')
  .setDescription('Mengambil place id player')
  .addStringOption(o =>
    o.setName('username')
      .setDescription('Username Roblox')
      .setRequired(true)
  );


/* 🔥 NEW GAMEPASS COMMAND */
const gamepassCommand = new SlashCommandBuilder()
  .setName('gamepass')
  .setDescription('Melihat semua gamepass milik player')
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
    {
      body: [
        taxCommand.toJSON(),
        placeCommand.toJSON(),
        gamepassCommand.toJSON() // ✅ added
      ]
    }
  );
})();



/* ================= READY ================= */

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});



/* ================= INTERACTION ================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;



  /* ===================================================== */
  /* ======================= TAX ========================= */
  /* ===================================================== */

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



  /* ===================================================== */
  /* ===================== PLACE ID ====================== */
  /* ===================================================== */

  if (interaction.commandName === 'placeid') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      // username → userId
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

      // ambil place dari creations
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`
      );

      const gameData = await gameRes.json();

      const game = gameData.data?.find(g => g.rootPlace?.id);
      const placeId = game?.rootPlace?.id ?? 'Tidak ditemukan';

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`Place ID milik ${username} :`)
        .setDescription(
`\`\`\`
${placeId}
\`\`\``
        );

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      return interaction.editReply('Gagal mengambil data Roblox.');
    }
  }



  /* ===================================================== */
  /* ===================== GAMEPASS ====================== */
  /* ===================================================== */

  if (interaction.commandName === 'gamepass') {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      // username → userId
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



      // 🔥 langsung ambil semua gamepass dari user (FIX METHOD)
      const passRes = await fetch(
        `https://develop.roblox.com/v1/users/${userId}/game-passes?limit=100`
      );

      const passData = await passRes.json();

      let text = 'Tidak ada gamepass';

      if (passData.data?.length) {
        text = passData.data
          .map(p =>
            `• ${p.name} — ${format(p.price ?? 0)} Robux (${p.id})`
          )
          .join('\n');
      }



      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`Gamepass milik ${username} :`)
        .setDescription(text);

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      return interaction.editReply('Gagal mengambil gamepass.');
    }
  }

});



client.login(token);