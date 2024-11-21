// export const config = {
//   maxDuration:60,
// };

// Import the necessary packages
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Debugging logs
console.log('TELEGRAM_TOKEN:', process.env.TELEGRAM_TOKEN);
console.log('Game Name:', process.env.TELEGRAM_GAMENAME);
// console.log('URL:', process.env.URL);

// Get the environment variables (from Vercel's environment settings)
const TOKEN = process.env.TELEGRAM_TOKEN;
const gameName = process.env.TELEGRAM_GAMENAME;
const url = 'https://fercalde4.github.io/DashV1/'; // Your game URL
const urlVercel = 'https://dash-v1-teal.vercel.app/'; // Your Vercel URL

// Validate environment variables
if (!TOKEN || !gameName || !url) {
  console.error('Missing required environment variables!');
  process.exit(1); // Exit if any variable is undefined
}

let bot;

const initializeBot = async () => {
  try {
    bot = new TelegramBot(TOKEN, { polling: false }); // Set polling to false when using webhooks
    
    // Set the webhook URL so Telegram knows where to send the updates
    const response = await bot.setWebHook(`${urlVercel}/api/telegram-bot`);
    console.log('Webhook set successfully:', response);

    // Handle the /start command
    bot.onText(/\/start/, (msg) => {
      console.log('start received:', msg);
      bot.sendGame(msg.chat.id, gameName);
    });

    // Handle callback queries
    bot.on('callback_query', (callbackQuery) => {
      console.log('callback_query:', callbackQuery, ". url: ", url);
      bot.answerCallbackQuery(callbackQuery.id, { url });
    });
 
  } catch (error) {
    console.error('Error starting the bot:', error);
    process.exit(1); // Exit if there is an error in bot creation
  }
};

// Initialize the bot asynchronously
initializeBot();

 // Define the serverless function handler for Vercel
 // With this:
module.exports = {
  config: {
    maxDuration: 60,
  },
};
 module.exports = (req, res) => {
  // Send a confirmation response indicating the bot is up and running
  res.status(200).send('Telegram bot is running!');

  // Your webhook handling is done by TelegramBot library automatically when it receives updates
};