// /api/telegram-bot.js
const TelegramBot = require('../node_modules/node-telegram-bot-api');

// Get environment variables from Vercel
const TOKEN = process.env.TELEGRAM_TOKEN;
const gameName = process.env.TELEGRAM_GAMENAME;
const url = process.env.URL;

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

// Basic configurations
app.set('view engine', 'ejs');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendGame(msg.chat.id, gameName);
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  bot.answerCallbackQuery(callbackQuery.id, { url });
});

// Render the HTML game
app.get('/', function requestListener(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = (req, res) => {
  // Respond with a success message (this is required for serverless functions)
  res.status(200).send('Telegram Bot is running!');
};
