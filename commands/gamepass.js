const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cheerio = require('cheerio');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('Cari semua gamepass dari store Roblox (scraping)')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Username roblox')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString('username');

    try {

      /* ================= USERNAME -> USERID ================= */
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


      /* ================= USER -> GAME / PLACE ================= */
      const gameRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/games?limit=10`
      );

      const gameData = await gameRes.json();
      const placeId = gameData.data?.[0]?.rootPlace?.id;

      if (!placeId)
        return interaction.editReply('❌ User tidak punya game');


      /* ================= SCRAPE STORE PAGE ================= */
      const page = await fetch(
        `https://www.roblox.com/games/${placeId}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept-Language': 'en-US'
          }
        }
      );

      const html = await page.text();
      const $ = cheerio.load(html);

      const ids = new Set();

      // cari semua link gamepass di halaman
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        const match = href.match(/game-pass\/(\d+)/);
        if (match) ids.add(match[1]);
      });

      if (!ids.size)
        return interaction.editReply('❌ Tidak ada gamepass ditemukan');


      /* ================= AMBIL DETAIL HARGA ================= */
      let text = '';

      for (const id of ids) {

        const infoRes = await fetch(
          `https://economy.roblox.com/v1/game-passes/${id}/product-info`
        );

        const info = await infoRes.json();

        text += `• **${info.Name}** — ${info.PriceInRobux} Robux
https://www.roblox.com/game-pass/${id}\n\n`;
      }


      /* ================= EMBED ================= */
      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle(`🎟 Gamepass ${username}`)
        .setDescription(text.slice(0, 4000));

      interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      interaction.editReply('❌ Error scraping Roblox');
    }
  }
};