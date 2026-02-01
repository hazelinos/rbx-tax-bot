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
   FORMAT HELPER
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


// ===== GAMEPASS =====
const gamepassCommand = new SlashCommandBuilder()
  .setName('gamepass')
  .setDescription('Menampilkan gamepass yang dimiliki player')
  .addStringOption(o =>
    o.setName('username')
      .setDescription('Username Roblox')
      .setRequired(true)
  );


// ===== PLACE ID =====
const placeCommand = new SlashCommandBuilder()
  .setName('placeid')
  .setDescription('Menampilkan place id player')
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

    await interaction.reply({ embeds: [embed] });
  }



  /* ===== GAMEPASS ===== */
  if (interaction.commandName === 'gamepass') {

    const username = interaction.options.getString('username');

    const userRes = await fetch(`https://users.roblox.com/v1/usernames/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username] })
    });

    const userData = await userRes.json();
    const userId = userData.data[0]?.id;

    if (!userId) return interaction.reply('User tidak ditemukan.');

    const passRes = await fetch(
      `https://inventory.roblox.com/v1/users/${userId}/items/GamePass?limit=50`
    );

    const passData = await passRes.json();

    if (!passData.data.length)
      return interaction.reply('User tidak memiliki gamepass.');

    const list = passData.data
      .map(p => `• ${p.name} — ${p.price ?? 0} Robux`)
      .join('\n');

    await interaction.reply(`Gamepass milik ${username}\n\n${list}`);
  }



  /* ===== PLACE ID ===== */
  if (interaction.commandName === 'placeid') {

    const username = interaction.options.getString('username');

    const userRes = await fetch(`https://users.roblox.com/v1/usernames/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username] })
    });

    const userData = await userRes.json();
    const userId = userData.data[0]?.id;

    if (!userId) return interaction.reply('User tidak ditemukan.');

    const gameRes = await fetch(
      `https://games.roblox.com/v2/users/${userId}/games?limit=1`
    );

    const gameData = await gameRes.json();
    const placeId = gameData.data[0]?.rootPlace?.id ?? 'Tidak ditemukan';

    await interaction.reply(
`Username : ${username}
User ID  : ${userId}
Place ID : ${placeId}`
    );
  }

});



client.login(token);