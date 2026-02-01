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

const format = n => Number(n).toLocaleString('id-ID');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function getTime() {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());
}

function buildEmbed(page = 0) {

  const db = loadDB();

  const list = Object.entries(db)
    .sort((a, b) => b[1].robux - a[1].robux);

  const perPage = 10;
  const pages = Math.max(1, Math.ceil(list.length / perPage));

  const slice = list.slice(page * perPage, page * perPage + perPage);

  let desc = '';

  slice.forEach(([id, data], i) => {
    const rank = String(i + 1 + page * perPage).padStart(2, '0');
    desc += `${rank} — <@${id}> • ${format(data.robux)} Robux • ${data.vouch} Vouch\n`;
  });

  if (!desc) desc = 'Belum ada data';

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('━━━ ✦ Top Spend Robux & Vouch ✦ ━━━')
    .setDescription(desc)
    .setFooter({
      text: `Nice Blox • Page ${page + 1}/${pages} | Today ${getTime()}`
    });

  return { embed, pages };
}

module.exports = {

  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top spend robux & vouch'),

  async execute(i) {

    let page = 0;

    const { embed, pages } = buildEmbed(page);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('◀').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('▶').setStyle(ButtonStyle.Secondary)
    );

    const msg = await i.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true
    });

    const collector = msg.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', async btn => {

      if (btn.user.id !== i.user.id)
        return btn.reply({ content: 'Bukan buat kamu 😆', ephemeral: true });

      if (btn.customId === 'prev') page--;
      if (btn.customId === 'next') page++;

      if (page < 0) page = 0;
      if (page >= pages) page = pages - 1;

      btn.update({ embeds: [buildEmbed(page).embed] });
    });
  }
};