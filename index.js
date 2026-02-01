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
const DEFAULT_RATE = 70;


// format ribuan
function format(num) {
  return Math.round(num).toLocaleString('en-US');
}


// ===== Slash Command =====
const command = new SlashCommandBuilder()
  .setName('tax')
  .setDescription('Calculate Robux tax, gamepass & price')

  .addIntegerOption(o =>
    o.setName('jumlah')
      .setDescription('Robux amount')
      .setRequired(true)
  )

  .addStringOption(o =>
    o.setName('after_tax')
      .setDescription('Amount is after tax?')
      .addChoices(
        { name: 'iya', value: 'yes' },
        { name: 'tidak', value: 'no' }
      )
      .setRequired(false)
  )

  .addNumberOption(o =>
    o.setName('rate')
      .setDescription('Custom price per Robux')
      .setRequired(false)
  );


// ===== Register command =====
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
  const after = interaction.options.getString('after_tax') ?? 'no';
  const rateInput = interaction.options.getNumber('rate');

  const rate = rateInput ?? DEFAULT_RATE;

  let gamepass, diterima;

  // after tax = iya
  if (after === 'yes') {
    gamepass = Math.ceil(jumlah / (1 - TAX));
    diterima = jumlah;
  }
  // before tax
  else {
    gamepass = jumlah;
    diterima = Math.floor(jumlah * (1 - TAX));
  }

  const harga = gamepass * rate;

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
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