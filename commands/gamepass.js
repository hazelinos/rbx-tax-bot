const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('Ambil gamepass dari store game user')
    .addStringOption(o =>
      o.setName('username')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString('username');

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


      /* user -> games */
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=10`
      );

      const gameData = await gameRes.json();
      const universeId = gameData.data?.[0]?.id;

      if (!universeId)
        return interaction.editReply('User tidak punya game');


      /* 🔥 STORE PASS API (INI YANG BENER) */
      const passRes = await fetch(
        `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100`
      );

      const passData = await passRes.json();

      if (!passData.data?.length)
        return interaction.editReply('❌ Tidak ada gamepass');


      let text = '';

      passData.data.forEach(p => {
        text += `• **${p.name}** — ${p.price} Robux\nhttps://www.roblox.com/game-pass/${p.id}\n\n`;
      });


      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle(`🎟 Gamepass milik ${username}`)
        .setDescription(text);

      interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      interaction.editReply('Error ambil data');
    }
  }
};