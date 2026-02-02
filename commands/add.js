const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DB = path.join(__dirname, '../data/leaderboard.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Tambah robux + vouch')
    .addUserOption(o =>
      o.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(o =>
      o.setName('robux').setDescription('Jumlah robux').setRequired(true)),

  async execute(interaction) {

    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('robux');

    const db = JSON.parse(fs.readFileSync(DB));

    if (!db[user.id]) {
      db[user.id] = { robux: 0, vouch: 0 };
    }

    /* 🔥 FIX BUG UTAMA */
    db[user.id].robux = Number(db[user.id].robux) + Number(amount);
    db[user.id].vouch = Number(db[user.id].vouch) + 1;

    fs.writeFileSync(DB, JSON.stringify(db, null, 2));

    await interaction.reply(`✅ ${user} +${amount} Robux & +1 Vouch`);
  }
};