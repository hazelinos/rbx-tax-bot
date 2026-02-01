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


// ===== CEK PLACE =====
const placeCommand = new SlashCommandBuilder()
  .setName('cekplace')
  .setDescription('Cek place id & gamepass dari link Roblox')
  .addStringOption(o =>
    o.setName('link')
      .setDescription('Link game Roblox')
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
   INTERACTION
========================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;



  /* =========================
     TAX COMMAND
  ========================= */
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



  /* =========================
     CEKPLACE COMMAND
  ========================= */
  if (interaction.commandName === 'cekplace') {

    const link = interaction.options.getString('link');

    // ambil place id dari link
    const match = link.match(/games\/(\d+)/);

    if (!match)
      return interaction.reply('❌ Link tidak valid.');

    const placeId = match[1];

    try {

      const res = await fetch(
        `https://games.roblox.com/v1/games/${placeId}/game-passes?limit=50`
      );

      const data = await res.json();

      let passList = 'Tidak ada gamepass';

      if (data.data && data.data.length) {
        passList = data.data
          .map(p => `• ${p.name} — ${format(p.price ?? 0)} Robux`)
          .join('\n');
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Place Info')
        .setDescription(
`Place ID : ${placeId}

Gamepass
${passList}`
        );

      interaction.reply({ embeds: [embed] });

    } catch {
      interaction.reply('❌ Gagal mengambil data.');
    }
  }

});



client.login(token);