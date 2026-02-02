const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('Ambil semua gamepass milik user Roblox')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Username roblox')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString('username');

    try {

      /* ================= username -> userId ================= */
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


      /* ================= INVENTORY API (🔥 WORK ALWAYS) ================= */
      const invRes = await fetch(
        `https://inventory.roblox.com/v1/users/${userId}/items/GamePass?limit=100`
      );

      const invData = await invRes.json();

      if (!invData.data?.length)
        return interaction.editReply('❌ Tidak ada gamepass');


      let text = '';

      invData.data.forEach(p => {
        text += `• **${p.name}** — ${p.price} Robux\nhttps://www.roblox.com/game-pass/${p.assetId}\n\n`;
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