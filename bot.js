require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');
// Import the database module
const { query } = require('./db');

const TOKEN = process.env.TELEGRAM_TOKEN;
const gameName = process.env.TELEGRAM_GAMENAME;
let url = process.env.URL;
let urlBackend = process.env.URLBACKEND

const PORT = process.env.PORT || 3000; // Use Heroku's dynamic port or default to 3000
const USE_WEBHOOK = process.env.USE_WEBHOOK === 'true'; // Enable webhook mode via an environment variable

// Bot initialization
let bot;
if (USE_WEBHOOK) {
    const webhookUrl = `${urlBackend}/bot${TOKEN}`;
    bot = new TelegramBot(TOKEN);
    bot.setWebHook(webhookUrl); // Configure webhook
    console.log('Running in webhook mode');
} else {
    bot = new TelegramBot(TOKEN, { polling: true }); // Use polling mode
    console.log('Running in polling mode');
}

const app = express();

// Middleware for parsing JSON data
app.use(express.json());
app.use(express.text()); // Parse plain text bodies

// Enable CORS
app.use(cors()); // Apply CORS middleware

// Basic configurations
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'))); // For static assets (optional)

// Matches /start
bot.onText(/\/start/, function (msg) {
  const userId = msg.chat.id; // Numerical ID (unique)
  const username = msg.chat.username || msg.chat.first_name || msg.chat.last_name || `User#${msg.chat.id}`; // Fallback to "Anonymous" if username is null

  console.log('Start command received from chat ID:', userId, 'Username:', username);

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


// API endpoint to fetch Telegram user info
app.get('/getUserInfo', (req, res) => {
  const userId = req.query.userId;
  if (!userId || userId === undefined) {
    console.log(`[getUserInfo]: Missing userId parameter'`)
    return res.status(400).json({ success: false, error: 'Missing userId parameter' });
  }
  console.log(`[getUserInfo]: userId: ${userId}`)

  bot.getChat(userId)
    .then(chat => {
      console.log(`[getUserInfo]: Full chat object:`, chat); // Log the full object
      console.log(`[getUserInfo]: userId: ${userId}. username: ${chat.username}. first name: ${chat.first_name}. last_name: ${chat.last_name}`)
      let userName;

      // Check each parameter explicitly
      if (chat.username && chat.username !== undefined) {
        userName = chat.username;
      } else if (chat.first_name && chat.first_name !== undefined) {
        userName = chat.first_name;
      } else if (chat.last_name && chat.last_name !== undefined) {
        userName = chat.last_name;
      } else {
        userName = `User#${userId}`; // Fallback to default value
      }
      
      console.log(`[getUserInfo]: response userName: ${userName}`)
      res.json({ success: true, username: userName });
    })
    .catch(err => {
      console.error('Error fetching user info:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch user info' });
    });
});

// API endpoint to submit a score
app.post('/submitScore', async (req, res) => {

  console.log('[Submit Score] - Received body:', req.body);
  const { userId, username, score, web3wallet } = req.body;

  if (!username || username === undefined) {
    username = "Guest"
    console.log(`[Submit Score] Error: Username was null or empty (undefined). New username: ${username}.`);
  }

  if (!userId || !username || score === undefined) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  console.log(`[Submit Score]: userId: ${userId}. username: ${username}. score: ${score}`);

  try {
    // Check if the user already exists
    const existingUser = await query('SELECT * FROM leaderboard WHERE user_id = $1', [userId]);

    if (existingUser.length > 0) {
      // Update the user's score if it's higher than their existing score
      await query(
        `UPDATE leaderboard
         SET score = GREATEST(score, $1), username = $2, web3wallet = $3, created_at = CURRENT_TIMESTAMP
         WHERE user_id = $4`,
        [score, username, web3wallet, userId]
      );
    } else {
      // Insert new user score
      await query(
        `INSERT INTO leaderboard (user_id, username, score, web3wallet)
         VALUES ($1, $2, $3, $4)`,
        [userId, username, score, web3wallet]
      );
    }

    res.json({ success: true, message: 'Score submitted successfully' });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to fetch the leaderboard
app.get('/fetchLeaderboard', async (req, res) => {
  try {
    // Fetch top 10 scores ordered by score descending
    const leaderboard = await query(
      `SELECT user_id, username, score FROM leaderboard
       ORDER BY score DESC, created_at ASC
       LIMIT 25`
    );

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ping route to prevent the server from sleeping
app.get('/ping', (req, res) => {
  res.status(200).send('Server is alive!');
});

// Self-ping to keep the server alive
const PING_INTERVAL = 15 * 60 * 1000; // 15 minutes
setInterval(() => {
  const pingUrl = `${urlBackend}/ping`;
  console.log(`Pinging server to keep alive: ${pingUrl}`);
  
  https.get(pingUrl, (res) => {
    console.log(`Ping status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Error pinging server:', err);
  });
}, PING_INTERVAL);

// Webhook handler to receive updates from Telegram
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);  // Process the incoming update
  res.sendStatus(200);  // Acknowledge Telegram that the update was received
});

// Bind server to Heroku's dynamic port or default port
app.listen(PORT, function () {
  console.log(`Server is listening on port ${PORT}`);
});
