const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('Cari gamepass dari username Roblox')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Username Roblox')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString('username');
    const cookie = process.env.ROBLOX_COOKIE;

    try {

      /* ============================= */
      /* USERNAME -> USERID */
      /* ============================= */

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

      console.log("USER:", username, "ID:", userId);

      if (!userId)
        return interaction.editReply('❌ User tidak ditemukan');


      /* ============================= */
      /* USERID -> GAMES */
      /* ============================= */

      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=10`,
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`
          }
        }
      );

      const gameData = await gameRes.json();

      console.log("GAMES:", gameData);

      if (!gameData.data?.length)
        return interaction.editReply('❌ User tidak punya game sendiri');


      /* ============================= */
      /* ambil UNIVERSE ID yg BENAR */
      /* ============================= */

      const universeId =
        gameData.data[0].rootPlaceId ||
        gameData.data[0].id;

      console.log("UNIVERSE:", universeId);


      /* ============================= */
      /* UNIVERSE -> GAMEPASSES */
      /* ============================= */

      const passRes = await fetch(
        `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=50`,
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`
          }
        }
      );

      const passData = await passRes.json();

      console.log("PASSES:", passData);


      if (!passData.data?.length)
        return interaction.editReply('❌ Gamepass tidak ditemukan');


      /* ============================= */
      /* BUILD TEXT */
      /* ============================= */

      let text = '';

      passData.data.slice(0, 10).forEach(p => {
        text += `• **${p.name}** — ${p.price ?? 0} Robux\n`;
      });


      /* ============================= */
      /* EMBED */
      /* ============================= */

      const embed = new EmbedBuilder()
        .setColor(0x1F6FEB)
        .setTitle(`🎮 Gamepass milik ${username}`)
        .setDescription(text)
        .setFooter({ text: 'Nice Blox System' });


      interaction.editReply({ embeds: [embed] });

    } catch (err) {

      console.log(err);
      interaction.editReply('❌ Error ambil data Roblox');

    }
  }
};