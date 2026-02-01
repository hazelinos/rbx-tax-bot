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
   SLASH COMMAND
========================= */

const command = new SlashCommandBuilder()
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



/* =========================
   REGISTER COMMAND
========================= */

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: [command.toJSON()] }
    );
    console.log('✅ Slash command registered');
  } catch (err) {
    console.error(err);
  }
})();



/* =========================
   BOT READY
========================= */

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});



/* =========================
   HELPER FORMAT
========================= */

const format = n => n.toLocaleString('id-ID');



/* =========================
   COMMAND HANDLER
========================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'tax') {

    const jumlah = interaction.options.getInteger('jumlah');
    const mode   = interaction.options.getString('mode');
    const rate   = interaction.options.getInteger('rate');

    let gamepass, diterima;

    // logic tax 30%
    if (mode === 'before') {
      gamepass = jumlah;
      diterima = Math.floor(jumlah * 0.7);
    } else {
      diterima = jumlah;
      gamepass = Math.ceil(jumlah / 0.7);
    }

    const harga = gamepass * rate;


    const embed = new EmbedBuilder()
      .setColor(0x2B7FFF) // biru
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
});



client.login(token);