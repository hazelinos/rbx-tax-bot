const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dataPath = path.join(dataDir, 'leaderboard.json');

/* ================= AUTO CREATE ================= */

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, '{}');
  console.log('📁 leaderboard.json dibuat otomatis');
}

/* ================= AUTO BACKUP ================= */

setInterval(() => {
  const backupPath = path.join(
    dataDir,
    `leaderboard-backup-${Date.now()}.json`
  );

  fs.copyFileSync(dataPath, backupPath);

  console.log('💾 Auto backup leaderboard saved');
}, 30000); // 30 detik