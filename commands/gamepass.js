const { SlashCommandBuilder } = require('discord.js');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('List semua gamepass dari username')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Username Roblox')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    try {

      const username = interaction.options.getString('username');
      const cookie = process.env.ROBLOX_COOKIE;

      if (!cookie)
        return interaction.editReply('❌ ROBLOX_COOKIE belum di set');

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
        return interaction.editReply('❌ User tidak ditemukan');


      /* user -> universe */
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=10`
      );

      const gameData = await gameRes.json();
      const universeId = gameData.data?.[0]?.id;

      if (!universeId)
        return interaction.editReply('❌ User tidak punya game');


      /* 🔥 CREATOR API (PRIVATE PASSES KEDETEK) */
      const passRes = await fetch(
        `https://develop.roblox.com/v1/universes/${universeId}/game-passes?limit=100`,
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`
          }
        }
      );

      const passData = await passRes.json();

      if (!passData.data?.length)
        return interaction.editReply('❌ Tidak ada gamepass');


      /* ===== FORMAT KAYAK SCREENSHOT ===== */
      let text = `Semua gamepass milik ${username}\n\n`;

      passData.data.forEach(p => {
        text += `Gamepass, ${p.price} Robux, ${p.id}\n`;
      });

      interaction.editReply(text);

    } catch (err) {
      console.log(err);
      interaction.editReply('❌ Error ambil gamepass');
    }
  }
};