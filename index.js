// ==================================================
// IMPORT
// ==================================================

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const express = require("express");


// ==================================================
// 🌐 RAILWAY KEEP ALIVE (ANTI SLEEP)
// ==================================================

const app = express();

app.get("/", (req, res) => res.send("Bot Alive"));

app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Web server running");
});


// ==================================================
// CLIENT
// ==================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // 🔥 WAJIB buat auto vouch
  ]
});

client.commands = new Collection();


// ==================================================
// 📁 DATA FOLDER (ANTI RESET)
// ==================================================

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "leaderboard.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");


// ==================================================
// LOAD COMMAND FILES (SLASH)
// ==================================================

const commands = [];

const commandFiles = fs
  .readdirSync("./commands")
  .filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}


// ==================================================
// 🔥 REGISTER SLASH KE DISCORD (BIAR MUNCUL)
// ==================================================

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error(err);
  }
})();


// ==================================================
// READY
// ==================================================

client.once("clientReady", () => {
  console.log(`✅ Login sebagai ${client.user.tag}`);
});


// ==================================================
// SLASH HANDLER
// ==================================================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Error command",
        ephemeral: true
      });
    }
  }
});


// ==================================================
// 🔥 AUTO VOUCH SYSTEM (FINAL FIXED)
// ==================================================

const TAX_RATE = 0.7;

/* channel khusus vouch */
const VOUCH_CHANNEL_ID = "1448898315411259424";

/* banyak typo tetap kebaca */
const vouchRegex =
/(vouch|vouc|voc|vos|voch|v0uch|vuch|vouchh|vouhc|v0cuh|cup|vid|vvoch)/i;


function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function parseAmount(text) {
  const match = text.match(/(\d+(?:\.\d+)?k?)/i);

  if (!match) return 1; // cuma "vouch" doang = 1

  let val = match[1].toLowerCase();

  if (val.includes("k")) return parseFloat(val) * 1000;

  return parseFloat(val);
}


client.on("messageCreate", msg => {

  if (msg.author.bot) return;

  /* 🔥 hanya channel vouch */
  if (msg.channel.id !== VOUCH_CHANNEL_ID) return;

  const text = msg.content.toLowerCase();

  if (!vouchRegex.test(text)) return;

  let amount = parseAmount(text);

  /* after tax */
  if (text.includes("after")) {
    amount = Math.ceil(amount / TAX_RATE);
  }

  const db = loadDB();

  if (!db[msg.author.id]) {
    db[msg.author.id] = { robux: 0, vouch: 0 };
  }

  db[msg.author.id].robux += amount;
  db[msg.author.id].vouch += 1;

  saveDB(db);

  console.log(`AUTO VOUCH → ${msg.author.tag} +${amount}`);
});


// ==================================================
// 💾 AUTO BACKUP 30 DETIK
// ==================================================

setInterval(() => {
  const db = loadDB();
  saveDB(db);
  console.log("💾 Auto backup saved");
}, 30000);


// ==================================================
// LOGIN
// ==================================================

client.login(process.env.TOKEN);