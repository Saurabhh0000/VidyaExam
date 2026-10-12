
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

// Log database connection errors
pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error:", err.message);
});

// Test the database connection
async function testConnection() {
    try {
        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        console.log(
            "PostgreSQL connected successfully:",
            result.rows[0].current_time
        );
    } catch (err) {
        console.error(
            "PostgreSQL connection failed:",
            err.message
        );
    }
}

module.exports = { pool, testConnection };
