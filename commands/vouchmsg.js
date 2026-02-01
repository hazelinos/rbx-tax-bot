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

/* ================= PARSE ================= */

function parseRobux(text) {
  const match = text.match(/(\d+(?:\.\d+)?k?)/i);
  if (!match) return 0;

  let val = match[1].toLowerCase();

  if (val.includes('k')) return parseFloat(val) * 1000;
  return parseFloat(val);
}

/* ================= COMMAND ================= */

module.exports = {

  data: new SlashCommandBuilder()
    .setName('vouchmsg')
    .setDescription('Admin only • Ambil robux dari message ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('id')
        .setDescription('message id')
        .setRequired(true)
    ),

  async execute(i) {

    /* ✅ PRIVATE */
    await i.deferReply({ ephemeral: true });

    const id = i.options.getString('id');

    try {

      const msg = await i.channel.messages.fetch(id);

      const content = msg.content.toLowerCase();

      let robux = parseRobux(content);

      if (!robux)
        return i.editReply('❌ Tidak ada angka robux di message');

      /* AFTER tax support */
      if (content.includes('after'))
        robux = Math.ceil(robux / (1 - TAX));

      const db = loadDB();

      if (!db[msg.author.id])
        db[msg.author.id] = { robux: 0, vouch: 0 };

      db[msg.author.id].robux += robux;
      db[msg.author.id].vouch += 1;

      saveDB(db);

      return i.editReply(
        `✅ Added ${robux.toLocaleString('id-ID')} robux + 1 vouch\nUser: <@${msg.author.id}>`
      );

    } catch {
      return i.editReply('❌ Message tidak ditemukan / beda channel');
    }
  }
};