const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('List gamepass roblox')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Username Roblox')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString('username');
    const cookie = process.env.ROBLOX_COOKIE;

    if (!cookie)
      return interaction.editReply('❌ ROBLOX_COOKIE belum di set di Railway');

    try {

      /* USER -> ID */
      const userRes = await fetch(
        'https://users.roblox.com/v1/usernames/users',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames: [username] })
        }
      );

      const userId = (await userRes.json()).data?.[0]?.id;
      if (!userId) return interaction.editReply('User tidak ditemukan');


      /* GAME -> UNIVERSE */
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=1`
      );

      const universeId = (await gameRes.json()).data?.[0]?.id;
      if (!universeId) return interaction.editReply('User tidak punya game');


      /* PASSES (AUTH REQUIRED) */
      const passRes = await fetch(
        `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100`,
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`
          }
        }
      );

      const passes = (await passRes.json()).data;

      if (!passes?.length)
        return interaction.editReply('❌ Tidak ada gamepass / cookie salah');


      let desc = '';

      for (const p of passes) {
        desc +=
`🎟 **${p.name}**
💰 ${p.price} Robux
🔗 https://www.roblox.com/id/game-pass/${p.id}

`;
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle(`Gamepass ${username}`)
        .setDescription(desc);

      interaction.editReply({ embeds: [embed] });

    } catch (e) {
      console.log(e);
      interaction.editReply('Error ambil data roblox');
    }
  }
};