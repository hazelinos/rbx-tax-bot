const { SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const fs = require('fs');

const DB_FILE = path.join(__dirname, '../data/leaderboard.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Download leaderboard backup')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    if (!fs.existsSync(DB_FILE))
      return interaction.reply({ content: 'File kosong', ephemeral: true });

    const file = new AttachmentBuilder(DB_FILE);

    await interaction.reply({
      content: '✅ Backup berhasil, download file ini:',
      files: [file],
      ephemeral: true
    });
  }
};