const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/leaderboard.json');

const PER_PAGE = 10;
const EMBED_COLOR = 0x1F6FEB;

const format = n => n.toLocaleString('id-ID');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top spend robux & vouch leaderboard'),

  async execute(interaction) {

    const db = JSON.parse(fs.readFileSync(DB_FILE));

    const users = Object.entries(db)
      .sort((a, b) => b[1].robux - a[1].robux);

    if (!users.length)
      return interaction.reply('Belum ada data leaderboard');

    let page = 0;
    const totalPages = Math.ceil(users.length / PER_PAGE);

    /* ================= BUILD EMBED ================= */

    const buildEmbed = (page) => {

      const start = page * PER_PAGE;
      const slice = users.slice(start, start + PER_PAGE);

      let text = '';

      slice.forEach(([id, data], i) => {
        const rank = start + i + 1;

        text +=
`${rank}. <@${id}> • ${format(data.robux)} Robux • ${data.vouch} Vouch\n`;
      });

      return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle('✦ Top Spend Robux & Vouch ✦')
        .setDescription(text)
        .setFooter({
  text: `Nice Blox • Page ${page + 1}/${totalPages} • Today ${new Date().toLocaleTimeString('id-ID',{
    hour:'2-digit',
    minute:'2-digit',
    timeZone:'Asia/Jakarta'
  })}`
        });
    };

    /* ================= NO PAGINATION ================= */

    if (totalPages === 1) {
      return interaction.reply({
        embeds: [buildEmbed(0)]
      });
    }

    /* ================= BUTTONS ================= */

    const getRow = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),

        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1)
      );

    const msg = await interaction.reply({
      embeds: [buildEmbed(page)],
      components: [getRow()],
      fetchReply: true
    });

    /* ================= COLLECTOR ================= */

    const collector = msg.createMessageComponentCollector({
      time: 120000
    });

    collector.on('collect', async i => {

      if (i.user.id !== interaction.user.id)
        return i.reply({
          content: 'Ini bukan tombol kamu',
          ephemeral: true
        });

      if (i.customId === 'prev') page--;
      if (i.customId === 'next') page++;

      await i.update({
        embeds: [buildEmbed(page)],
        components: [getRow()]
      });
    });

    collector.on('end', async () => {
      try {
        await msg.edit({ components: [] });
      } catch {}
    });
  }
};