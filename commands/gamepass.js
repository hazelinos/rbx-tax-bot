const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('List semua gamepass milik user Roblox')
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

      /* ================= USER -> ID ================= */
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


      /* ================= USER -> GAME ================= */
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=10`
      );

      const gameData = await gameRes.json();
      const universeId = gameData.data?.[0]?.id;

      if (!universeId)
        return interaction.editReply('❌ User tidak punya game');


      /* ================= GAME -> PASSES ================= */
      const passRes = await fetch(
        `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100`,
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`
          }
        }
      );

      const passData = await passRes.json();

      if (!passData.data?.length)
        return interaction.editReply('❌ Gamepass tidak ditemukan');


      /* ================= FORMAT ================= */
      let text = '';

      passData.data.slice(0, 20).forEach(p => {

        text +=
`🎟 **${p.name}**
💰 ${p.price} Robux
🆔 ${p.id}
🔗 https://www.roblox.com/id/game-pass/${p.id}

`;
      });


      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle(`🎮 Gamepass milik ${username}`)
        .setDescription(text)
        .setFooter({ text: `Total: ${passData.data.length} gamepass` });

      interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      interaction.editReply('❌ Error ambil data Roblox');
    }
  }
};