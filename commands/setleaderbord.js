const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const DB = path.join(__dirname, '../data/leaderboard.json');

const TAX = 0.7; // 70% receive (30% tax)

/* ================= DB ================= */

function loadDB() {
  if (!fs.existsSync(DB)) fs.writeFileSync(DB, '{}');
  return JSON.parse(fs.readFileSync(DB));
}

function saveDB(db) {
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

/* ================= COMMAND ================= */

module.exports = {

  data: new SlashCommandBuilder()
    .setName('setleaderboard')
    .setDescription('Admin edit leaderboard (+ / -)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addIntegerOption(o =>
      o.setName('robux')
        .setDescription('Jumlah robux (+ / -)')
        .setRequired(true))

    .addIntegerOption(o =>
      o.setName('vouch')
        .setDescription('Jumlah vouch (+ / -)')
        .setRequired(true))

    .addStringOption(o =>
      o.setName('jenis')
        .setDescription('before atau after tax')
        .addChoices(
          { name: 'Before Tax', value: 'before' },
          { name: 'After Tax', value: 'after' }
        )
        .setRequired(true))

    .addUserOption(o =>
      o.setName('user')
        .setDescription('Target user')
        .setRequired(true)),

  async execute(interaction) {

    await interaction.deferReply({ ephemeral: true });

    const robuxInput = interaction.options.getInteger('robux');
    const vouchInput = interaction.options.getInteger('vouch');
    const jenis = interaction.options.getString('jenis');
    const user = interaction.options.getUser('user');

    let robux = robuxInput;

    /* ================= TAX LOGIC ================= */

    if (jenis === 'after') {
      const sign = Math.sign(robux);
      robux = Math.ceil(Math.abs(robux) / TAX) * sign;
    }

    /* ================= SAVE ================= */

    const db = loadDB();

    if (!db[user.id]) {
      db[user.id] = { robux: 0, vouch: 0 };
    }

    db[user.id].robux += robux;
    db[user.id].vouch += vouchInput;

    /* anti minus */
    if (db[user.id].robux < 0) db[user.id].robux = 0;
    if (db[user.id].vouch < 0) db[user.id].vouch = 0;

    saveDB(db);

    /* ================= REPLY ================= */

    return interaction.editReply(
`✅ Update

Robux : ${robux > 0 ? '+' : ''}${robux}
Vouch : ${vouchInput > 0 ? '+' : ''}${vouchInput}
Jenis : ${jenis}
User  : ${user}`
    );
  }
};