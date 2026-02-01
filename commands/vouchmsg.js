const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');

const DB_FILE = './leaderboard.json';

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* 🔥 FIX PARSER (ambil angka dekat robux doang) */
function parseRobux(text) {
  const match = text.toLowerCase()
    .match(/(\d+(?:[.,]\d+)?)\s*(robux|rbx|r\$|r)/i);

  if (!match) return null;

  return Number(match[1].replace(/[.,]/g, ''));
}

module.exports = {

  data: new SlashCommandBuilder()
    .setName('vouchmsg')
    .setDescription('Tambah vouch dari message id')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('id')
        .setDescription('message id')
        .setRequired(true)
    ),

  async execute(i) {

    await i.deferReply({ ephemeral: true });

    const id = i.options.getString('id');

    try {

      /* 🔥 AUTO CHANNEL */
      const channel = i.channel;

      const msg = await channel.messages.fetch(id);

      const robux = parseRobux(msg.content);

      if (!robux)
        return i.editReply('❌ Tidak ada angka robux terdeteksi');

      const db = loadDB();

      if (!db[msg.author.id])
        db[msg.author.id] = { robux: 0, vouch: 0 };

      db[msg.author.id].robux += robux;
      db[msg.author.id].vouch += 1;

      saveDB(db);

      i.editReply(
`✅ Berhasil tambah
User: <@${msg.author.id}>
Robux: ${robux}
Vouch: +1`
      );

    } catch {
      i.editReply('❌ Message tidak ditemukan / beda channel');
    }
  }
};