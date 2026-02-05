/* ================= IMPORT ================= */ 
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js'); 
const fs = require('fs'); 
const path = require('path'); 
const express = require('express'); 
const token = process.env.TOKEN; 
const clientId = process.env.CLIENT_ID; 

/* ================= WEB (ANTI SLEEP) ================= */ 
const app = express(); 
app.get('/', (_, res) => res.send('Bot Alive')); 
app.listen(process.env.PORT || 3000); 

/* ================= CLIENT ================= */ 
const client = new Client({ 
  intents: [ 
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent 
  ] 
}); 
client.commands = new Collection(); 

/* ================================================= */ 
/* ================= DATA SAFE ===================== */ 
/* ================================================= */ 
const DATA_DIR = path.join(__dirname, 'data'); 
const DB_FILE = path.join(DATA_DIR, 'leaderboard.json'); 
const VOUCH_LOG = path.join(DATA_DIR, 'vouchLogs.json'); 
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR); 
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}'); 
if (!fs.existsSync(VOUCH_LOG)) fs.writeFileSync(VOUCH_LOG, '{}'); 

/* ================= JSON HELPERS ================= */ 
const loadJSON = file => JSON.parse(fs.readFileSync(file)); 
const saveJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2)); 

/* ================================================= */ 
/* ================= LOAD COMMANDS ================= */ 
/* ================================================= */ 
const commands = []; 
const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js')); 
for (const file of files) { 
  try { 
    const cmd = require(`./commands/${file}`); 
    if (!cmd?.data?.name) continue; 
    client.commands.set(cmd.data.name, cmd); 
    commands.push(cmd.data.toJSON()); 
    console.log(`✅ Loaded: ${cmd.data.name}`); 
  } catch (err) { 
    console.log(`❌ Error loading ${file}`); 
    console.log(err); 
  } 
} 

/* ================= REGISTER SLASH ================= */ 
const rest = new REST({ version: '10' }).setToken(token); 
(async () => { 
  await rest.put(Routes.applicationCommands(clientId), { body: commands }); 
  console.log('✅ Slash commands registered'); 
})(); 

/* ================= READY ================= */ 
client.once('ready', () => { 
  console.log(`✅ Bot online: ${client.user.tag}`); 
}); 

/* ================= SLASH HANDLER ================= */ 
client.on('interactionCreate', async interaction => { 
  if (!interaction.isChatInputCommand()) return; 
  const cmd = client.commands.get(interaction.commandName); 
  if (!cmd) return; 
  try { 
    await cmd.execute(interaction); 
  } catch (err) { 
    console.log(err); 
    if (!interaction.replied) interaction.reply({ content: 'Error command', ephemeral: true }); 
  } 
}); 

/* ================================================= */ 
/* =============== AUTO VOUCH SYSTEM =============== */ 
/* ================================================= */ 
const TAX_RATE = 0.7; 
const VOUCH_CHANNEL_ID = '1448898315411259424'; 
const vouchRegex = /(vouch|vouc|voc|vos|voch|v0uch|vuch|vouchh|vouhc|v0cuh|cup|vid|vvoch)/i; 

/* ================= PARSE AMOUNT ================= */ 
function parseAmount(text) { 
  const match = text.match(/(\d+(?:\.\d+)?)(k?)/i); 
  if (!match) return 0; 
  let amount = parseFloat(match[1]); 
  if (match[2].toLowerCase() === 'k') amount *= 1000; 
  return Math.floor(amount); 
} 

/* ================= ADD VOUCH ================= */ 
client.on('messageCreate', msg => { 
  if (msg.author.bot) return; 
  if (msg.channel.id !== VOUCH_CHANNEL_ID) return; 
  const text = msg.content.toLowerCase(); 
  if (!vouchRegex.test(text)) return; 

  let amount = parseAmount(text); 
  console.log('Parsed amount:', amount); 

  if (text.includes('after')) { 
    amount = Math.floor(amount / TAX_RATE); 
    console.log('After tax:', amount); 
  } 

  const db = loadJSON(DB_FILE); 
  const logs = loadJSON(VOUCH_LOG); 
  if (!db[msg.author.id]) db[msg.author.id] = { robux: 0, vouch: 0 }; 
  db[msg.author.id].robux += amount; 
  db[msg.author.id].vouch += 1; 
  logs[msg.id] = { user: msg.author.id, robux: amount }; 
  saveJSON(DB_FILE, db); 
  saveJSON(VOUCH_LOG, logs); 
  console.log(`AUTO VOUCH → +${amount}`); 
}); 

/* ================= REMOVE VOUCH ================= */ 
client.on('messageDelete', msg => { 
  if (!msg?.id) return; 
  const logs = loadJSON(VOUCH_LOG); 
  const log = logs[msg.id]; 
  if (!log) return; 
  const db = loadJSON(DB_FILE); 
  if (db[log.user]) { 
    db[log.user].robux -= log.robux; 
    db[log.user].vouch -= 1; 
    if (db[log.user].robux < 0) db[log.user].robux = 0; 
    if (db[log.user].vouch < 0) db[log.user].vouch = 0; 
    saveJSON(DB_FILE, db); 
  } 
  delete logs[msg.id]; 
  saveJSON(VOUCH_LOG, logs); 
  console.log(`REMOVE VOUCH → -${log.robux}`); 
}); 

/* ================= LOGIN ================= */ 
client.login(token);
