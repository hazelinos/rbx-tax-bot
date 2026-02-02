const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/leaderboard.json');

const format = n => Number(n).toLocaleString('id-ID');

module.exports = {

  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top spend robux & vouch'),

  async execute(interaction) {

    const db = JSON.parse(fs.readFileSync(DB_FILE));

    const list = Object.entries(db)
      .sort((a, b) => b[1].robux - a[1].robux);

    let desc = '';

    list.slice(0, 10).forEach(([id, data], i) => {
      desc += `**${String(i + 1).padStart(2, '0')} —** <@${id}> • **${format(data.robux)} Robux** • **${data.vouch} Vouch**\n`;
    });

    if (!desc) desc = 'Belum ada data';

    const embed = new EmbedBuilder()
      .setColor(0x1F6FEB)

      /* 🔥 STYLE KAYA DULU */
      .setTitle('━━━ ✦ Top Spend Robux & Vouch ✦ ━━━')

      .setDescription(desc)

      /* 🔥 FOTO / ICON */
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))

      /* 🔥 FOOTER */
      .setFooter({
        text: `Nice Blox • Page 1/1 | Today ${new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        })}`
      });

    await interaction.reply({ embeds: [embed] });
  }
};