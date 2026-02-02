const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const fs = require('fs');

const DB_FILE = path.join(__dirname, '../data/leaderboard.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restore')
    .setDescription('Restore leaderboard dari file json')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addAttachmentOption(o =>
      o.setName('file')
        .setDescription('Upload leaderboard.json')
        .setRequired(true)
    ),

  async execute(interaction) {

    const attachment = interaction.options.getAttachment('file');

    if (!attachment.name.endsWith('.json'))
      return interaction.reply({ content: 'Harus file .json', ephemeral: true });

    const res = await fetch(attachment.url);
    const text = await res.text();

    try {
      JSON.parse(text); // validasi json
      fs.writeFileSync(DB_FILE, text);

      await interaction.reply({
        content: '✅ Restore berhasil!',
        ephemeral: true
      });

    } catch {
      await interaction.reply({
        content: '❌ File tidak valid',
        ephemeral: true
      });
    }
  }
};