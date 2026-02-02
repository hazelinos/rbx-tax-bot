const { SlashCommandBuilder } = require('discord.js');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('List semua gamepass Roblox (private included)')
    .addStringOption(o =>
      o.setName('username')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    try {

      const username = interaction.options.getString('username');
      const cookie = process.env.ROBLOX_COOKIE;

      if (!cookie)
        return interaction.editReply('COOKIE belum di set');


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
        return interaction.editReply('User tidak ditemukan');


      /* ========= USER -> UNIVERSE ========= */
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=10`
      );

      const gameData = await gameRes.json();
      const universeId = gameData.data?.[0]?.id;

      if (!universeId)
        return interaction.editReply('User tidak punya game');


      /* ===================================================
         🔥 AMBIL CSRF TOKEN DULU (WAJIB BANGET)
      =================================================== */
      const csrfRes = await fetch(
        'https://auth.roblox.com/v2/logout',
        {
          method: 'POST',
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`
          }
        }
      );

      const csrf = csrfRes.headers.get('x-csrf-token');


      /* ===================================================
         🔥 REQUEST CREATOR API PAKAI TOKEN
      =================================================== */
      const passRes = await fetch(
        `https://develop.roblox.com/v1/universes/${universeId}/game-passes?limit=100`,
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`,
            'X-CSRF-TOKEN': csrf
          }
        }
      );

      const passData = await passRes.json();

      if (!passData.data?.length)
        return interaction.editReply('Tidak ada gamepass');


      /* ========= FORMAT OUTPUT ========= */
      let text = `Semua gamepass milik ${username}\n\n`;

      passData.data.forEach(p => {
        text += `Gamepass, ${p.price} Robux, ${p.id}\n`;
      });

      interaction.editReply(text);

    } catch (err) {
      console.log(err);
      interaction.editReply('Error ambil gamepass');
    }
  }
};