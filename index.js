const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require('discord.js');

const fs = require('fs');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commands = [];

const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of files) {
  const cmd = require(`./commands/${file}`);

  client.commands.set(cmd.data.name, cmd);
  commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log('✅ Slash registered');
})();

client.once('clientReady', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  cmd.execute(interaction);
});

client.login(token);