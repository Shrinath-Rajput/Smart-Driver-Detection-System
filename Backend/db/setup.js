const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "drowsiness_detection",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

// Create Database Pool
const pool = mysql.createPool(dbConfig);

// Initialize Database Schema
async function initializeDatabase() {
    const connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
    });

    try {
        // Create database if not exists
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``
        );
        console.log(`✓ Database '${dbConfig.database}' ready`);

        // Read schema file
        const schemaPath = path.join(__dirname, "schema.sql");
        const schema = fs.readFileSync(schemaPath, "utf8");

        // Split and execute schema statements
        const statements = schema
            .split(";")
            .filter((stmt) => stmt.trim().length > 0);

        for (const statement of statements) {
            await connection.query(statement);
        }

        // Ensure required columns exist (add migrations for existing DBs)
        try {
            const [colRows] = await connection.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                [dbConfig.database, 'driver_status', 'alarm_active']
            );

            if (colRows.length === 0) {
                await connection.query(
                    `ALTER TABLE \`${dbConfig.database}\`.driver_status ADD COLUMN alarm_active BOOLEAN DEFAULT FALSE`
                );
                console.log("✓ Added missing column 'alarm_active' to driver_status");
            }
        } catch (err) {
            console.warn('Could not verify/add migration columns:', err.message);
        }

        console.log("✓ Database schema initialized");
    } catch (error) {
        console.error("Database initialization error:", error);
    } finally {
        await connection.end();
    }
}

// Export pool and initialization
module.exports = {
    pool,
    initializeDatabase,
    execute: (sql, values) => pool.execute(sql, values),
    query: (sql, values) => pool.query(sql, values),
};
