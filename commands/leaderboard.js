const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const fs = require('fs');

const DB_FILE = './leaderboard.json';
const COLOR = 0x1F6FEB;

const FOOTER_ICON =
'https://cdn.discordapp.com/attachments/1449386611036127343/1467515005825187972/20260107_131913.png';

const format = n => Number(n).toLocaleString('id-ID');

/* ================= DB ================= */

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE));
}

/* ================= WIB TIME ================= */

function getTime() {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());
}

/* ================= COMMAND ================= */

module.exports = {

  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top Spend Robux & Vouch'),

  async execute(i) {

    /* ⭐ WAJIB biar gak timeout */
    await i.deferReply();

    const db = loadDB();

    const list = Object.entries(db)
      .sort((a, b) => b[1].robux - a[1].robux);

    const perPage = 10;
    const pages = Math.max(1, Math.ceil(list.length / perPage));

    let page = 0;

    /* ================= BUILD EMBED ================= */

    function build(page) {

      const slice = list.slice(page * perPage, page * perPage + perPage);

      let desc = '';

      slice.forEach(([id, data], idx) => {
        const rank = String(idx + 1 + page * perPage).padStart(2, '0');

        desc += `${rank} — <@${id}> • ${format(data.robux)} Robux • ${data.vouch} Vouch\n`;
      });

      if (!desc) desc = 'Belum ada data';

      return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle('━━━ ✦ Top Spend Robux & Vouch ✦ ━━━')
        .setDescription(desc)
        .setFooter({
          text: `Nice Blox • Page ${page + 1}/${pages} | Today ${getTime()}`,
          iconURL: FOOTER_ICON
        });
    }

    /* ================= BUTTONS ================= */

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('◀ Prev')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next ▶')
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await i.editReply({
      embeds: [build(page)],
      components: [row]
    });

    /* ================= COLLECTOR ================= */

    const collector = msg.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', async btn => {

      if (btn.user.id !== i.user.id)
        return btn.reply({
          content: 'Bukan buat kamu 😆',
          ephemeral: true
        });

      if (btn.customId === 'prev') page--;
      if (btn.customId === 'next') page++;

      if (page < 0) page = 0;
      if (page >= pages) page = pages - 1;

      await btn.update({
        embeds: [build(page)]
      });
    });
  }
};