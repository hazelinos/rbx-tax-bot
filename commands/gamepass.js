const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('Cari gamepass dari username roblox')

    .addStringOption(o =>
      o
        .setName('username')
        .setDescription('Username Roblox yang mau dicari') // WAJIB ADA
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString('username');
    const cookie = process.env.ROBLOX_COOKIE;

    try {

      /* username -> userId */
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
        return interaction.editReply('User tidak ditemukan');

      /* userId -> games */
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=10`,
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`
          }
        }
      );

      const gameData = await gameRes.json();

      if (!gameData.data?.length)
        return interaction.editReply('User tidak punya game');

      const universeId = gameData.data[0].id;

      /* universe -> gamepasses */
      const passRes = await fetch(
        `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=50`,
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`
          }
        }
      );

      const passData = await passRes.json();

      if (!passData.data?.length)
        return interaction.editReply('Gamepass tidak ditemukan');

      let text = '';

      passData.data.slice(0, 10).forEach(p => {
        text += `${p.name} • ${p.price} Robux\n`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x1F6FEB)
        .setTitle(`Gamepass ${username}`)
        .setDescription(text);

      interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      interaction.editReply('Error ambil data roblox');
    }
  }
};