const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');

/* ================= CONFIG ================= */

// ⭐ GANTI INI DENGAN CHANNEL VOUCH LU
const VOUCH_CHANNEL_ID = '1448898315411259424';

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

/* ================= REGEX (typo banyak) ================= */

const vouchRegex =
/(vouch|vouc|voc|voch|v0uch|vuch|vouchh|vouhc|v0cuh|\+vouch|\+voc|\+v)/i;

function parseRobux(text) {
  const match = text.match(/(\d+(?:\.\d+)?k?)/i);
  if (!match) return null;

  let val = match[1].toLowerCase();

  if (val.includes('k')) return parseFloat(val) * 1000;

  return parseFloat(val);
}

/* ================= COMMAND ================= */

module.exports = {

  data: new SlashCommandBuilder()
    .setName('vouchmsg')
    .setDescription('Ambil vouch dari message ID (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('id')
        .setDescription('Message ID')
        .setRequired(true)
    ),

  async execute(i) {

    await i.deferReply({ ephemeral: true });

    try {

      const messageId = i.options.getString('id');

      /* ⭐ AUTO CHANNEL FETCH */
      const channel = await i.client.channels.fetch(VOUCH_CHANNEL_ID);

      if (!channel)
        return i.editReply('❌ Channel vouch tidak ditemukan');

      const msg = await channel.messages.fetch(messageId);

      if (!msg)
        return i.editReply('❌ Message tidak ditemukan');

      const content = msg.content.toLowerCase();

      if (!vouchRegex.test(content))
        return i.editReply('❌ Bukan message vouch');

      const amount = parseRobux(content);

      if (!amount)
        return i.editReply('❌ Tidak ada angka robux terdeteksi');

      let robux = amount;

      if (content.includes('after'))
        robux = Math.ceil(amount / (1 - TAX));

      const db = loadDB();

      if (!db[msg.author.id])
        db[msg.author.id] = { robux: 0, vouch: 0 };

      db[msg.author.id].robux += robux;
      db[msg.author.id].vouch += 1;

      saveDB(db);

      return i.editReply(
        `✅ Berhasil tambah\nUser: <@${msg.author.id}>\nRobux: ${robux}\nVouch: +1`
      );

    } catch (err) {
      console.log(err);
      return i.editReply('❌ Gagal ambil message');
    }
  }
};