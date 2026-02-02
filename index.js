// ============================================
// DISCORD BOT FINAL STABLE VERSION (RAILWAY SAFE)
// ============================================

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");


// ============================================
// CLIENT
// ============================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});


// ============================================
// FILE PATH
// ============================================

const dataDir = path.join(__dirname, "data");
const leaderboardPath = path.join(dataDir, "leaderboard.json");


// ============================================
// AUTO CREATE FILE/FOLDER (ANTI RESET)
// ============================================

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

if (!fs.existsSync(leaderboardPath)) {
  fs.writeFileSync(leaderboardPath, JSON.stringify({}, null, 2));
}


// ============================================
// LOAD DATA
// ============================================

let leaderboard = JSON.parse(fs.readFileSync(leaderboardPath));

function saveData() {
  fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2));
}


// ============================================
// AUTO BACKUP TIAP 30 DETIK
// ============================================

setInterval(() => {
  saveData();
  console.log("💾 Auto backup leaderboard saved");
}, 30000);


// ============================================
// WIB TIME
// ============================================

function getWIB() {
  return new Date().toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit"
  });
}


// ============================================
// READY
// ============================================

client.once("ready", () => {
  console.log(`✅ Login sebagai ${client.user.tag}`);
});


// ============================================
// MESSAGE COMMAND
// ============================================

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const args = msg.content.split(" ");


  // ============================================
  // !add @user robux vouch
  // ============================================

  if (args[0] === "!add") {

    const user = msg.mentions.users.first();
    const robux = parseInt(args[2]) || 0;
    const vouch = parseInt(args[3]) || 0;

    if (!user) return msg.reply("Tag user dulu bro.");

    if (!leaderboard[user.id]) {
      leaderboard[user.id] = {
        robux: 0,
        vouch: 0
      };
    }

    leaderboard[user.id].robux += robux;
    leaderboard[user.id].vouch += vouch;

    saveData();

    msg.reply("✅ Data berhasil ditambah!");
  }


  // ============================================
  // !leaderboard
  // ============================================

  if (args[0] === "!leaderboard") {

    const sorted = Object.entries(leaderboard)
      .sort((a, b) => b[1].robux - a[1].robux);

    if (sorted.length === 0)
      return msg.reply("Belum ada data");

    let text = "";
    let i = 1;

    for (const [id, data] of sorted.slice(0, 10)) {
      const user = await client.users.fetch(id);

      text += `${i}. @${user.username} • ${data.robux} Robux • ${data.vouch} Vouch\n`;
      i++;
    }

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle("━━━ ✦ Top Spend Robux & Vouch ✦ ━━━")
      .setDescription(text)
      .setFooter({
        text: `Nice Blox • Page 1/1 | Today ${getWIB()}`
      });

    msg.channel.send({ embeds: [embed] });
  }
});


// ============================================
// LOGIN (Railway pakai Variables)
// ============================================

client.login(process.env.TOKEN);