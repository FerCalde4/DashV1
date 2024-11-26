const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Heroku Postgres connection URL
  ssl: {
    rejectUnauthorized: false, // For Heroku's managed databases
  },
});

// Function to execute queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { query };
