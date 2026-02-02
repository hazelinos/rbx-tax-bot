/* ===================================================== */
/* ================= AUTO VOUCH FINAL =================== */
/* ===================================================== */

const TAX_RATE = 0.7;
const VOUCH_CHANNEL_ID = '1448898315411259424';

const vouchRegex =
/(vouch|vouc|voc|vos|voch|v0uch|vuch|vouchh|vouhc|v0cuh|cup|vid|vvoch)/i;


/* ---------- DB ---------- */

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}


/* ---------- PARSE NUMBER ---------- */

function parseAmount(text) {
  const match = text.match(/(\d+(?:\.\d+)?k?)/i);
  if (!match) return 1;

  let val = match[1].toLowerCase();

  if (val.includes('k')) return parseFloat(val) * 1000;

  return parseFloat(val);
}


/* ================= ADD VOUCH ================= */

client.on('messageCreate', msg => {
  if (msg.author.bot) return;
  if (msg.channel.id !== VOUCH_CHANNEL_ID) return;

  const text = msg.content.toLowerCase();
  if (!vouchRegex.test(text)) return;

  let amount = parseAmount(text);

  if (text.includes('after'))
    amount = Math.ceil(amount / TAX_RATE);

  const db = loadDB();

  if (!db[msg.author.id]) {
    db[msg.author.id] = {
      robux: 0,
      vouch: 0,
      logs: []
    };
  }

  db[msg.author.id].robux += amount;
  db[msg.author.id].vouch += 1;

  /* 🔥 simpan message id */
  db[msg.author.id].logs.push({
    messageId: msg.id,
    amount
  });

  saveDB(db);

  console.log(`+${amount} robux → ${msg.author.tag}`);
});


/* ================= DELETE = AUTO MINUS ================= */

client.on('messageDelete', msg => {
  if (!msg.author) return;
  if (msg.channel.id !== VOUCH_CHANNEL_ID) return;

  const db = loadDB();
  const user = db[msg.author.id];

  if (!user || !user.logs) return;

  const index = user.logs.findIndex(x => x.messageId === msg.id);
  if (index === -1) return;

  const amount = user.logs[index].amount;

  user.robux -= amount;
  user.vouch -= 1;

  user.logs.splice(index, 1);

  saveDB(db);

  console.log(`-${amount} robux (deleted)`);
});