// Import the necessary packages
const TelegramBot = require('node-telegram-bot-api');

// Get the environment variables (from Vercel's environment settings)
const TOKEN = process.env.TELEGRAM_TOKEN;
const gameName = process.env.TELEGRAM_GAMENAME;
const url = process.env.URL;

// Create a new Telegram bot instance
const bot = new TelegramBot(TOKEN, { polling: true });

// Handle the /start command
bot.onText(/\/start/, (msg) => {
  bot.sendGame(msg.chat.id, gameName);
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  bot.answerCallbackQuery(callbackQuery.id, { url });
});

// Define the serverless function handler for Vercel
module.exports = (req, res) => {
  // Send a confirmation response indicating the bot is up and running
  res.status(200).send('Telegram bot is running!');

  // You can also handle specific requests here if needed, but for a bot,
  // the important part is the Telegram Bot API running in the background.
};
