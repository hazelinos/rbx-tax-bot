const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');

const DB_FILE = './leaderboard.json';
const TAX_RATE = 0.7;

/* ================= DB ================= */

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* ================= COMMAND ================= */

module.exports = {

  data: new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Edit leaderboard (+/- robux & vouch)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    /* 1️⃣ ROBUX (+/- langsung) */
    .addIntegerOption(o =>
      o.setName('robux')
        .setDescription('contoh: 500 / -200')
        .setRequired(true))

    /* 2️⃣ VOUCH (+/- langsung) */
    .addIntegerOption(o =>
      o.setName('vouch')
        .setDescription('contoh: 1 / -1')
        .setRequired(true))

    /* 3️⃣ AFTER TAX */
    .addBooleanOption(o =>
      o.setName('after')
        .setDescription('pakai hitungan after tax? (ya/tidak)')
        .setRequired(true))

    /* 4️⃣ USER */
    .addUserOption(o =>
      o.setName('user')
        .setDescription('target user')
        .setRequired(true)),

  async execute(i) {

    let robux = i.options.getInteger('robux');
    let vouch = i.options.getInteger('vouch');
    const after = i.options.getBoolean('after');
    const user = i.options.getUser('user');

    const db = loadDB();

    if (!db[user.id])
      db[user.id] = { robux: 0, vouch: 0 };

    /* AFTER TAX CONVERT */
    if (after && robux > 0)
      robux = Math.ceil(robux / TAX_RATE);

    /* APPLY */
    db[user.id].robux += robux;
    db[user.id].vouch += vouch;

    if (db[user.id].robux < 0) db[user.id].robux = 0;
    if (db[user.id].vouch < 0) db[user.id].vouch = 0;

    saveDB(db);

    await i.reply({
      content:
`✅ Updated

User : <@${user.id}>
Robux: ${robux}
Vouch: ${vouch}
After : ${after ? 'Yes' : 'No'}`,
      ephemeral: true
    });
  }
};