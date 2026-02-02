const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamepass')
    .setDescription('Cari gamepass Roblox dari nama')
    .addStringOption(o =>
      o.setName('nama')
        .setDescription('Nama gamepass')
        .setRequired(true)
    ),

  async execute(interaction) {

    await interaction.deferReply();

    const keyword = interaction.options.getString('nama');

    try {

      /* 🔥 SEARCH GAMEPASS API ROBLOX */
      const res = await axios.get(
        `https://apis.roblox.com/search-api/omni-search`,
        {
          params: {
            searchQuery: keyword,
            assetType: 34, // gamepass
            limit: 1
          }
        }
      );

      const result = res.data?.searchResults?.[0]?.items?.[0];

      if (!result)
        return interaction.editReply('❌ Gamepass tidak ditemukan');

      const id = result.assetId;

      /* 🔥 GET DETAIL */
      const detail = await axios.get(
        `https://economy.roblox.com/v1/assets/${id}/details`
      );

      const data = detail.data;

      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle(`🎮 ${data.Name}`)
        .setDescription(
          `💰 Harga : **${data.PriceInRobux || 0} Robux**\n` +
          `🆔 ID : **${id}**\n` +
          `🔗 https://www.roblox.com/game-pass/${id}`
        )
        .setFooter({ text: 'Nice Blox Gamepass Finder' });

      interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.log(err);
      interaction.editReply('❌ Error ambil data Roblox');
    }
  }
};