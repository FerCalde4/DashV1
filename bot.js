require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');

const TOKEN = process.env.TELEGRAM_TOKEN;
const gameName = process.env.TELEGRAM_GAMENAME;
let url = process.env.URL;

const PORT = process.env.PORT || 3000; // Use Heroku's dynamic port or default to 3000

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

// Basic configurations
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'))); // For static assets (optional)

// Matches /start
bot.onText(/\/start/, function onPhotoText(msg) {
  console.log('Start command received from chat ID:', msg.chat.id);
  bot.sendGame(msg.chat.id, gameName);
});

// Handle callback queries
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
  console.log('Callback query received:', callbackQuery);
  bot.answerCallbackQuery(callbackQuery.id, { url });
});

// Render the HTML game
app.get('/', function requestListener(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Bind server to Heroku's dynamic port or default port
app.listen(PORT, function listen() {
  console.log(`Server is listening on port ${PORT}`);
});
