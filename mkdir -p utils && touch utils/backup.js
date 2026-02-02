const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "leaderboard.json");

// pastiin folder data ada
if (!fs.existsSync(path.join(__dirname, "..", "data"))) {
  fs.mkdirSync(path.join(__dirname, "..", "data"));
}

// kalau file belum ada → bikin kosong
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({ users: {} }, null, 2));
}

let cache = JSON.parse(fs.readFileSync(dataPath, "utf8"));

/*
========================
SAVE FUNCTION
========================
*/
function saveData() {
  fs.writeFileSync(dataPath, JSON.stringify(cache, null, 2);
}

/*
========================
AUTO BACKUP TIAP 30 DETIK
========================
*/
setInterval(() => {
  saveData();
  console.log("💾 Auto backup leaderboard...");
}, 30000);


/*
========================
EXPORT
========================
*/
module.exports = {
  data: cache,
  saveData
};