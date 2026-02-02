const fs = require("fs");
const path = require("path");

// ========================
// PATH FILE
// ========================

const dataDir = path.join(__dirname, "../data");
const filePath = path.join(dataDir, "leaderboard.json");
const backupPath = path.join(dataDir, "leaderboard.backup.json");

// ========================
// PASTIIN FOLDER + FILE ADA
// ========================

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
}

// ========================
// SAVE FUNCTION
// ========================

function backupNow() {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(backupPath, raw);

    console.log("💾 Auto backup leaderboard saved");
  } catch (err) {
    console.log("❌ Backup error:", err);
  }
}

// ========================
// AUTO BACKUP TIAP 30 DETIK
// ========================

setInterval(backupNow, 30000);

module.exports = backupNow;