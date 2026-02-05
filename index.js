const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const app = express();
app.get('/', (_, res) => res.send('Bot Alive'));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'leaderboard.json');
const VOUCH_LOG = path.join(DATA_DIR, 'vouchLogs.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}');
if (!fs.existsSync(VOUCH_LOG)) fs.writeFileSync(VOUCH_LOG, '{}');

const loadJSON = file => JSON.parse(fs.readFileSync(file));
const saveJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

const TAX_RATE = 0.7;
const VOUCH_CHANNEL_ID = '1448898315411259424';
const vouchRegex = /(vouch|vouc|voc|vos|voch|v0uch|vuch|vouchh|vouhc|v0cuh|cup|vid|vvoch)/i;
const afterRegex = /(after|aft|aftr|af|atf)/i;
const beforeRegex = /(before|bef|befr|bfr)/i;

function parseAmount(text) {
  const match = text.match(/(\d+(?:\.\d+)?)(k?)/i);
  if (!match) return 0;
  let amount = parseFloat(match[1]);
  if (match[2].toLowerCase() === 'k') amount *= 1000;
  return Math.floor(amount);
}

client.on('messageCreate', msg => {
  if (msg.author.bot) return;
  if (msg.channel.id !== VOUCH_CHANNEL_ID) return;
  const text = msg.content.toLowerCase();
  if (!vouchRegex.test(text)) return;

  let amount = parseAmount(text);
  if (afterRegex.test(text)) {
    amount = Math.floor(amount / TAX_RATE);
  } else if (beforeRegex.test(text)) {
    amount = Math.floor(amount * TAX_RATE);
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

client.login(token);
