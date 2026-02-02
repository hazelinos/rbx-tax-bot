const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('List semua gamepass dari user Roblox')
    .addStringOption(o =>
      o.setName('username')
        .setRequired(true)
        .setDescription('Username Roblox')
    ),

  async execute(interaction) {

    await interaction.deferReply();

    try {

      const username = interaction.options.getString('username');
      const cookie = process.env.ROBLOX_COOKIE;

      if (!cookie)
        return interaction.editReply('❌ ROBLOX_COOKIE belum diset di Railway');

      /* USERNAME -> USERID */
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


      /* USER -> GAMES */
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=10`
      );

      const gameData = await gameRes.json();
      const universeId = gameData.data?.[0]?.id;

      if (!universeId)
        return interaction.editReply('❌ User tidak punya game');


      /* AMBIL CSRF */
      const csrfRes = await fetch(
        'https://auth.roblox.com/v2/logout',
        {
          method: 'POST',
          headers: { Cookie: `.ROBLOSECURITY=${cookie}` }
        }
      );

      const csrf = csrfRes.headers.get('x-csrf-token');


      /* AMBIL GAMEPASS */
      const passRes = await fetch(
        `https://develop.roblox.com/v1/universes/${universeId}/game-passes?limit=100`,
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`,
            'x-csrf-token': csrf
          }
        }
      );

      const passData = await passRes.json();

      if (!passData.data?.length)
        return interaction.editReply('❌ Tidak ada gamepass');


      let text = '';

      passData.data.forEach(p => {
        text += `🎟 ${p.name}\n💰 ${p.price} Robux\n🆔 ${p.id}\nhttps://www.roblox.com/game-pass/${p.id}\n\n`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle(`Gamepass milik ${username}`)
        .setDescription(text.slice(0, 4000));

      interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      interaction.editReply('❌ Error ambil data');
    }
  }
};