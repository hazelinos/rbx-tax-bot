const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const EMBED_COLOR = 0x1F6FEB;

module.exports = {

  data: new SlashCommandBuilder()
    .setName('placeid')
    .setDescription('Mengambil place id player')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Username Roblox')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');

      // username -> userId
      const userRes = await fetch(
        'https://users.roblox.com/v1/usernames/users',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames: [username] })
        }
      );

      const userData = await userRes.json();
      const userId = userData.data?.[0]?.id;

      if (!userId)
        return interaction.editReply('User tidak ditemukan.');

      // creations -> place id (WORKING METHOD)
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`
      );

      const gameData = await gameRes.json();

      const game = gameData.data?.find(g => g.rootPlace?.id);
      const placeId = game?.rootPlace?.id ?? 'Tidak ditemukan';

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`Place ID milik ${username} :`)
        .setDescription(
`\`\`\`
${placeId}
\`\`\``
        );

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      return interaction.editReply('Gagal mengambil data Roblox.');
    }
  }
};