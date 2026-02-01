const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder
} = require('discord.js');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});


// ================= COMMAND =================

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
        { name: 'after tax', value: 'after' },
        { name: 'before tax', value: 'before' }
      )
      .setRequired(true)
  )

  .addIntegerOption(o =>
    o.setName('rate')
      .setDescription('Set custom price')
      .setRequired(true)
  );


// ================= REGISTER =================

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: [command.toJSON()] }
  );
})();


// ================= BOT READY =================

client.once('ready', () => {
  console.log(`Bot online: ${client.user.tag}`);
});


// ================= FORMATTER =================

const format = n => n.toLocaleString('id-ID');


// ================= INTERACTION =================

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

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
    .setColor('#2b8cff') // biru
    .setTitle('Robux Tax Calculator')
    .setDescription(
`Gamepass : ${format(gamepass)} Robux
Diterima : ${format(diterima)} Robux
Harga    : Rp ${format(harga)}

──────────────
rate ${rate}`
    );

  await interaction.reply({ embeds: [embed] });
});


// ================= LOGIN =================

client.login(token);