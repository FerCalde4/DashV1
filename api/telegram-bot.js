
// Import the necessary packages
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Debugging logs
console.log('Environment Variables:', process.env);
console.log('TELEGRAM_TOKEN:', process.env.TELEGRAM_TOKEN);
console.log('Game Name:', process.env.TELEGRAM_GAMENAME);
//console.log('URL:', process.env.URL);

// Get the environment variables (from Vercel's environment settings)
const TOKEN = process.env.TELEGRAM_TOKEN;
const gameName = process.env.TELEGRAM_GAMENAME;
const url = "https://fercalde4.github.io/DashV1/";
const urlVercel = "https://dash-v1-teal.vercel.app/";

// Validate environment variables
if (!TOKEN || !gameName || !url) {
  console.error('Missing required environment variables!');
  process.exit(1); // Exit if any variable is undefined
}

let bot;

// Initialize the bot inside the try block
try {
  bot = new TelegramBot(TOKEN);
  
  // Set the webhook URL so Telegram knows where to send the updates
  bot.setWebHook(`${urlVercel}/api/telegram-bot`);  // This will register the webhook with the provided URL

  // Handle the /start command inside the try block
  bot.onText(/\/start/, (msg) => {
    bot.sendGame(msg.chat.id, gameName);
  });

  // Handle callback queries inside the try block
  bot.on('callback_query', (callbackQuery) => {
    bot.answerCallbackQuery(callbackQuery.id, { url });
  });

} catch (error) {
  console.error('Error starting the bot:', error);
  process.exit(1); // Exit if there is an error in bot creation
}

// Define the serverless function handler for Vercel
module.exports = (req, res) => {
  // Send a confirmation response indicating the bot is up and running
  res.status(200).send('Telegram bot is running!');

  // You can also handle specific requests here if needed, but for a bot,
  // the important part is the Telegram Bot API running in the background.
};