// db.js
const { Pool } = require('pg');

// Create a new pool with connection parameters
const pool = new Pool({
    user: process.env.PGUSER || 'your_db_user',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'your_db_name',
    password: process.env.PGPASSWORD || 'your_db_password',
    port: process.env.PGPORT || 5432,
    max: 10, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Export the pool for use in other parts of your app
module.exports = pool;
