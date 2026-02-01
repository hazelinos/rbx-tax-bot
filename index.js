/* ================= AUTO VOUCH FINAL ================= */

const fs2 = require('fs');

const DB_FILE = './leaderboard.json';
const TAX_RATE = 0.7; // 30% tax

const vouchRegex =
/(vouch|vouc|voc|vos|voch|v0uch|vuch|vouchh|vouhc|v0cuh|cup|vid|vvoch)/i;

function loadDB() {
  if (!fs2.existsSync(DB_FILE)) return {};
  return JSON.parse(fs2.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs2.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  const text = msg.content.toLowerCase();

  /* harus ada kata vouch/typo */
  if (!vouchRegex.test(text)) return;

  /* ambil angka */
  const match = text.match(/(\d+(?:k)?)/i);
  if (!match) return;

  let amount = match[1].toLowerCase();

  /* support 1k */
  if (amount.includes('k'))
    amount = parseFloat(amount) * 1000;
  else
    amount = parseInt(amount);

  if (!amount || amount < 1 || amount > 10000000) return;

  /* ONLY after yang dihitung pajak */
  if (/after|aftr|afer|fter/i.test(text)) {
    amount = Math.ceil(amount / TAX_RATE);
  }

  /* selain after (termasuk kosong/before) = normal */

  const db = loadDB();

  if (!db[msg.author.id])
    db[msg.author.id] = { robux: 0, vouch: 0 };

  db[msg.author.id].robux += amount;
  db[msg.author.id].vouch += 1;

  saveDB(db);

  console.log(`AUTO VOUCH → ${msg.author.username} +${amount}`);
});