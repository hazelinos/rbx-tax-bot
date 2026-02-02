const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('Cari semua gamepass dari username roblox')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Username Roblox')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString('username');

    try {

      /* ========= USERNAME -> USERID ========= */
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



      /* ========= USERID -> GAMEPASS (FIXED API) ========= */
      const passRes = await fetch(
        `https://inventory.roblox.com/v1/users/${userId}/items/GamePass?limit=100`
      );

      const passData = await passRes.json();

      if (!passData.data?.length)
        return interaction.editReply('❌ User tidak punya gamepass');



      let text = '';

      passData.data.slice(0, 15).forEach(p => {

        const price = p.product?.priceInRobux ?? 'Offsale';
        const link = `https://www.roblox.com/game-pass/${p.assetId}`;

        text += `• **${p.name}** — ${price} Robux\n${link}\n\n`;
      });



      const embed = new EmbedBuilder()
        .setColor(0x1F6FEB)
        .setTitle(`🎟 Gamepass milik ${username}`)
        .setDescription(text);



      interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      interaction.editReply('❌ Error ambil data roblox');
    }
  }
};