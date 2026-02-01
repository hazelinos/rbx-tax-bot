const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

const DB_FILE = './leaderboard.json';

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

module.exports = {

  data: new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Admin add/remove leaderboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('mode')
        .addChoices(
          { name: '+', value: '+' },
          { name: '-', value: '-' }
        )
        .setRequired(true))
    .addUserOption(o =>
      o.setName('user').setRequired(true))
    .addIntegerOption(o =>
      o.setName('robux').setRequired(true))
    .addIntegerOption(o =>
      o.setName('vouch').setRequired(true)),

  async execute(i) {

    const mode = i.options.getString('mode');
    const user = i.options.getUser('user');
    const robux = i.options.getInteger('robux');
    const vouch = i.options.getInteger('vouch');

    const db = loadDB();

    if (!db[user.id]) db[user.id] = { robux: 0, vouch: 0 };

    if (mode === '+') {
      db[user.id].robux += robux;
      db[user.id].vouch += vouch;
    } else {
      db[user.id].robux -= robux;
      db[user.id].vouch -= vouch;

      if (db[user.id].robux < 0) db[user.id].robux = 0;
      if (db[user.id].vouch < 0) db[user.id].vouch = 0;
    }

    saveDB(db);

    i.reply('✅ Updated');
  }
};