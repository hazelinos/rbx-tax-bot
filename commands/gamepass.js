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

      /* ========================= */
      /* 🔥 1. CEK COOKIE VALID */
      /* ========================= */

      const authCheck = await fetch(
        'https://users.roblox.com/v1/users/authenticated',
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`
          }
        }
      );

      if (!authCheck.ok) {
        return interaction.editReply(
          '❌ Cookie Roblox tidak valid / expired\nLogin ulang & ambil cookie baru'
        );
      }

      const authData = await authCheck.json();
      console.log("COOKIE VALID → LOGIN AS:", authData.name);



      /* ========================= */
      /* 🔥 2. USERNAME -> USERID */
      /* ========================= */

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
        return interaction.editReply('❌ User tidak ditemukan');



      /* ========================= */
      /* 🔥 3. USER GAMES */
      /* ========================= */

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
        return interaction.editReply('❌ User tidak punya game sendiri');



      /* ========================= */
      /* 🔥 4. AMBIL UNIVERSE ID */
      /* ========================= */

      const universeId =
        gameData.data[0].rootPlaceId ||
        gameData.data[0].id;



      /* ========================= */
      /* 🔥 5. AMBIL GAMEPASS */
      /* ========================= */

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
        return interaction.editReply('❌ Gamepass tidak ditemukan');



      /* ========================= */
      /* 🔥 6. OUTPUT */
      /* ========================= */

      let text = '';

      passData.data.slice(0, 10).forEach(p => {
        text += `• ${p.name} — ${p.price ?? 0} Robux\n`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x1F6FEB)
        .setTitle(`Gamepass ${username}`)
        .setDescription(text);

      interaction.editReply({ embeds: [embed] });

    } catch (err) {

      console.log(err);
      interaction.editReply('❌ Error ambil data Roblox');

    }
  }
};