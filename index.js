const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST } = require('discord.js');

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
      .setDescription('before / after')
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
    { body: [command] }
  );
})();

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
