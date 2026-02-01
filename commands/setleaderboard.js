const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');

const DB_FILE = './leaderboard.json';
const TAX = 0.3;

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
    .setDescription('Setting Leaderboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    /* 1️⃣ robux (+ / -) */
    .addIntegerOption(o =>
      o.setName('robux')
        .setDescription('Jumlah Robux')
        .setRequired(true))

    /* 2️⃣ vouch (+ / -) */
    .addIntegerOption(o =>
      o.setName('vouch')
        .setDescription('Jumlah Vouch')
        .setRequired(true))

    /* 3️⃣ after tax */
    .addStringOption(o =>
      o.setName('after')
        .setDescription('After tax?')
        .addChoices(
          { name: 'Ya', value: 'yes' },
          { name: 'Tidak', value: 'no' }
        )
        .setRequired(true))

    /* 4️⃣ user */
    .addUserOption(o =>
      o.setName('user')
        .setDescription('Target user')
        .setRequired(true)),


  /* ================= EXECUTE ================= */

  async execute(i) {

    const robuxInput = i.options.getInteger('robux');
    const vouchInput = i.options.getInteger('vouch');
    const after = i.options.getString('after') === 'yes';
    const user = i.options.getUser('user');

    const db = loadDB();

    if (!db[user.id])
      db[user.id] = { robux: 0, vouch: 0 };

    let robuxFinal = robuxInput;

    /* 🔵 hitung after tax */
    if (after && robuxInput > 0) {
      robuxFinal = Math.ceil(robuxInput / (1 - TAX));
    }

    /* tambah / kurang otomatis */
    db[user.id].robux += robuxFinal;
    db[user.id].vouch += vouchInput;

    /* jangan minus */
    if (db[user.id].robux < 0) db[user.id].robux = 0;
    if (db[user.id].vouch < 0) db[user.id].vouch = 0;

    saveDB(db);

    /* reply */
    return i.reply(
`✅ Updated

User : <@${user.id}>
Robux : ${robuxFinal}
Vouch : ${vouchInput}
Mode : ${after ? 'After Tax' : 'Normal'}`
    );
  }
};