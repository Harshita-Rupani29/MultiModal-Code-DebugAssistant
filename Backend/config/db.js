require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
pool.on('connect', () => {
  console.log(' Connected to the PostgreSQL database!');
});

pool.on('error', (err, client) => {
    console.error(' Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;