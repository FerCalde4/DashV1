// /api/telegram-bot.js
const TelegramBot = require('node-telegram-bot-api');

// Get environment variables from Vercel
const TOKEN = process.env.TELEGRAM_TOKEN;
const gameName = process.env.TELEGRAM_GAMENAME;
const url = process.env.URL;

const bot = new TelegramBot(TOKEN, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendGame(msg.chat.id, gameName);
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  bot.answerCallbackQuery(callbackQuery.id, { url });
});

module.exports = (req, res) => {
  // Respond with a success message (this is required for serverless functions)
  res.status(200).send('Telegram Bot is running!');
};
