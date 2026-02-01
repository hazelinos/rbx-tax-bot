const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== CONFIG =====
const TAX = 0.3;
const DEFAULT_RATE = 70; // default rate per robux

// format ribuan
function format(num) {
  return Math.round(num).toLocaleString('en-US');
}

// ===== Slash Command =====
const command = new SlashCommandBuilder()
  .setName('tax')
  .setDescription('Robux tax calculator (default rate 70)')

  .addIntegerOption(o =>
    o.setName('jumlah')
      .setDescription('Jumlah robux')
      .setRequired(true)
  )

  .addStringOption(o =>
    o.setName('mode')
      .setDescription('Mode perhitungan')
      .addChoices(
        { name: 'diterima', value: 'receive' },
        { name: 'gamepass', value: 'gamepass' }
      )
      .setRequired(true)
  )

  .addNumberOption(o =>
    o.setName('rate')
      .setDescription('Harga per 1 robux (opsional, default 70)')
      .setRequired(false)
  );


// ===== Register Command =====
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: [command.toJSON()] }
  );
})();


// ===== Logic =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const jumlah = interaction.options.getInteger('jumlah');
  const mode = interaction.options.getString('mode');
  const rateInput = interaction.options.getNumber('rate');

  // pakai default kalau kosong
  const rate = rateInput ?? DEFAULT_RATE;

  let gamepass, diterima;

  if (mode === 'receive') {
    gamepass = Math.ceil(jumlah / (1 - TAX));
    diterima = jumlah;
  } else {
    gamepass = jumlah;
    diterima = Math.floor(jumlah * (1 - TAX));
  }

  const harga = gamepass * rate;

  const embed = new EmbedBuilder()
    .setColor('#5865F2') // biru discord
    .setTitle('Robux Tax Calculator')
    .setDescription(
`Gamepass : ${format(gamepass)} Robux
Diterima : ${format(diterima)} Robux
Harga    : Rp ${format(harga)}

──────────────
Rate ${rate}/robux`
    );

  await interaction.reply({ embeds: [embed] });
});


client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});

client.login(token);