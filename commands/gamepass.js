const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('Cari semua gamepass dari username Roblox')
    .addStringOption(o =>
      o.setName('username')
        .setDescription('Username Roblox')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const username = interaction.options.getString('username');

    try {

      /* ================= USERNAME -> USERID ================= */
      const userRes = await axios.post(
        'https://users.roblox.com/v1/usernames/users',
        { usernames: [username] }
      );

      const userId = userRes.data.data?.[0]?.id;

      if (!userId)
        return interaction.editReply('❌ User tidak ditemukan');


      /* ================= USERID -> GAME LIST ================= */
      const gamesRes = await axios.get(
        `https://games.roblox.com/v2/users/${userId}/games?limit=10`
      );

      const universeId = gamesRes.data.data?.[0]?.id;

      if (!universeId)
        return interaction.editReply('❌ User tidak punya game');


      /* ================= SCRAPE STORE PAGE ================= */
      const url = `https://www.roblox.com/games/${universeId}`;

      const html = (await axios.get(url)).data;

      const $ = cheerio.load(html);

      const passes = [];

      $('a[href*="/game-pass/"]').each((i, el) => {
        const href = $(el).attr('href');

        const idMatch = href.match(/game-pass\/(\d+)/);
        if (!idMatch) return;

        const id = idMatch[1];
        const name = $(el).text().trim();

        const priceMatch = name.match(/\d+/);
        const price = priceMatch ? priceMatch[0] : '?';

        passes.push({
          id,
          name,
          price
        });
      });

      if (!passes.length)
        return interaction.editReply('❌ Tidak ada gamepass ditemukan');


      /* ================= FORMAT ================= */
      let text = '';

      passes.slice(0, 20).forEach(p => {
        text += `🎟 **${p.name}** — ${p.price} Robux\nID: ${p.id}\nhttps://www.roblox.com/game-pass/${p.id}\n\n`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle(`Gamepass milik ${username}`)
        .setDescription(text);

      interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      interaction.editReply('❌ Error ambil gamepass');
    }
  }
};