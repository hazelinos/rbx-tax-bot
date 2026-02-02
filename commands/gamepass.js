const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('Cari semua gamepass dari username Roblox')
    .addStringOption(option =>
      option
        .setName('username')
        .setDescription('Username Roblox')
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


      /* ================= SCRAPE INVENTORY PAGE ================= */
      const url = `https://www.roblox.com/users/${userId}/inventory#!/game-passes`;

      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const $ = cheerio.load(html);

      const passes = [];

      $('a[href*="/game-pass/"]').each((i, el) => {

        const link = $(el).attr('href');
        const name = $(el).text().trim();

        const idMatch = link.match(/game-pass\/(\d+)/);

        if (!idMatch) return;

        const id = idMatch[1];

        passes.push({
          id,
          name: name || 'Gamepass',
          url: `https://www.roblox.com${link}`
        });
      });


      if (!passes.length)
        return interaction.editReply('❌ Tidak ada gamepass');


      let text = '';

      passes.slice(0, 20).forEach(p => {
        text += `• **${p.name}**\nID: \`${p.id}\`\n${p.url}\n\n`;
      });


      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle(`🎟 Gamepass milik ${username}`)
        .setDescription(text);

      interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      interaction.editReply('❌ Error scraping');
    }
  }
};