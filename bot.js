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

// Middleware for parsing JSON data
app.use(express.json());

// Basic configurations
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'))); // For static assets (optional)

// Matches /start
bot.onText(/\/start/, function (msg) {
  const userId = msg.chat.id; // Numerical ID (unique)
  const username = msg.chat.username || "Anonymous"; // Fallback to "Anonymous" if username is null

  console.log('Start command received from chat ID:', userId);
  console.log('Username:', username);

  // const gameUrlWithParams = `${url}?userId=${userId}&username=${encodeURIComponent(username)}`;

  bot.sendGame(msg.chat.id, gameName, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Play Game", callback_game: {} }] // Correct way to send a game
      ]
    }
  }).catch(err => console.error("Error sending game:", err));
});


// Handle callback queries (for when users interact with the game link)
bot.on('callback_query', function (callbackQuery) {
  console.log('Callback query received:', callbackQuery);
  const gameUrlWithUserId = `${url}?userId=${callbackQuery.from.id}`;
  bot.answerCallbackQuery(callbackQuery.id, { url: gameUrlWithUserId });
});

// Render the HTML game
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to submit a score
app.post('/submitScore', async (req, res) => {
  const { userId, score } = req.body;

  if (!userId || !score) {
    return res.status(400).json({ success: false, error: 'Missing userId or score' });
  }

  try {
    const response = await bot.setGameScore(userId, score, { chat_id: userId });
    console.log('Score submitted:', response);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to fetch the leaderboard
app.get('/leaderboard', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }

  try {
    // Fetch the high scores from the Telegram bot
    const response = await bot.getGameHighScores({ user_id: userId });

    // Now, fetch the username for each player in the leaderboard
    const leaderboard = await Promise.all(response.map(async (scoreEntry) => {
      const user = await bot.getChat(scoreEntry.user_id);  // Fetch the user's chat information
      return {
        rank: scoreEntry.position,  // Optional: position can be set manually if needed
        userId: scoreEntry.user_id,
        username: user.username,  // Get the username from the chat data
        score: scoreEntry.score,
      };
    }));

    console.log('Leaderboard fetched:', leaderboard);
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bind server to Heroku's dynamic port or default port
app.listen(PORT, function () {
  console.log(`Server is listening on port ${PORT}`);
});
