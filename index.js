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

const TAX = 0.3;

// format ribuan
function format(num) {
  return num.toLocaleString('en-US');
}


// ===== Slash Command =====
const command = new SlashCommandBuilder()
  .setName('tax')
  .setDescription('Robux tax calculator')

  .addIntegerOption(o =>
    o.setName('jumlah')
      .setDescription('Jumlah robux')
      .setRequired(true)
  )

  .addStringOption(o =>
    o.setName('aftertax')
      .setDescription('Hitung setelah tax?')
      .addChoices(
        { name: 'ya', value: 'yes' },
        { name: 'tidak', value: 'no' }
      )
      .setRequired(true)
  )

  .addNumberOption(o =>
    o.setName('rate')
      .setDescription('Harga per 1 robux (opsional)')
      .setRequired(false)
  );


// ===== Register =====
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
  const after = interaction.options.getString('aftertax');
  const rate = interaction.options.getNumber('rate');

  let gamepass, diterima;

  if (after === 'yes') {
    gamepass = Math.ceil(jumlah / (1 - TAX));
    diterima = jumlah;
  } else {
    gamepass = jumlah;
    diterima = Math.floor(jumlah * (1 - TAX));
  }

  // harga = gamepass × rate
  let hargaText = '—';
  if (rate) {
    const harga = gamepass * rate;
    hargaText = `Rp ${format(harga)}`;
  }

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('💸 RBX TAX CALCULATOR')
    .addFields(
      { name: '🎮 Gamepass', value: `${format(gamepass)} Robux`, inline: true },
      { name: '📥 Diterima', value: `${format(diterima)} Robux`, inline: true },
      { name: '💰 Harga', value: hargaText, inline: true }
    )
    .setFooter({ text: 'Tax Roblox 30%' });

  await interaction.reply({ embeds: [embed] });
});


client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});

client.login(token);