const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const command = new SlashCommandBuilder()
  .setName('tax')
  .setDescription('RBX tax calculator')
  .addIntegerOption(o =>
    o.setName('amount')
      .setDescription('Jumlah robux')
      .setRequired(true)
  )
  .addStringOption(o =>
    o.setName('mode')
      .setDescription('Mode perhitungan')
      .addChoices(
        { name: 'before', value: 'before' },
        { name: 'after', value: 'after' }
      )
      .setRequired(true)
  );

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: [command.toJSON()] }
  );
})();

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const amount = interaction.options.getInteger('amount');
  const mode = interaction.options.getString('mode');

  if (mode === 'before') {
    const received = Math.floor(amount * 0.7);

    await interaction.reply(
`📊 BEFORE TAX

🎮 Gamepass : ${amount} Robux
📥 Diterima : ${received} Robux`
    );
  }

  if (mode === 'after') {
    const total = Math.ceil(amount / 0.7);

    await interaction.reply(
`📊 AFTER TAX

📥 Diterima : ${amount} Robux
🎮 Gamepass : ${total} Robux`
    );
  }
});

client.login(token);