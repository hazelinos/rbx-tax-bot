const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/leaderboard.json');
const LOG_FILE = path.join(__dirname, '../data/vouchLogs.json');

const load = file => JSON.parse(fs.readFileSync(file));
const save = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

module.exports = {

  data: new SlashCommandBuilder()
    .setName('resetleaderboard')
    .setDescription('Reset data leaderboard user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(o =>
      o.setName('user')
        .setDescription('Target user')
        .setRequired(true)
    ),

  async execute(interaction) {

    const user = interaction.options.getUser('user');

    const db = load(DB_FILE);
    const logs = load(LOG_FILE);

    /* hapus leaderboard */
    delete db[user.id];

    /* hapus semua log message user */
    for (const msgId in logs) {
      if (logs[msgId].user === user.id) {
        delete logs[msgId];
      }
    }

    save(DB_FILE, db);
    save(LOG_FILE, logs);

    await interaction.reply({
      content: `✅ Data leaderboard ${user} berhasil di reset`,
      ephemeral: true
    });
  }
};