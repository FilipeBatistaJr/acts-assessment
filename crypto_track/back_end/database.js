const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool (for better performance)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize database tables
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        
        // Create cryptocurrencies table if it doesn't exist already
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS cryptocurrencies (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                symbol VARCHAR(10) NOT NULL,
                current_price DECIMAL(20, 8) NOT NULL,
                market_cap BIGINT,
                total_volume BIGINT,
                price_change_percentage_24h DECIMAL(10, 4),
                image VARCHAR(500),
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        await connection.execute(createTableQuery);
        console.log('✅ Database table "cryptocurrencies" created/verified');
        connection.release();
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        throw error;
    }
}

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Insert or update cryptocurrency data
async function upsertCrypto(cryptoData) {
    try {
        const connection = await pool.getConnection();
        
        const query = `
            INSERT INTO cryptocurrencies 
            (id, name, symbol, current_price, market_cap, total_volume, price_change_percentage_24h, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            current_price = VALUES(current_price),
            market_cap = VALUES(market_cap),
            total_volume = VALUES(total_volume),
            price_change_percentage_24h = VALUES(price_change_percentage_24h),
            image = VALUES(image),
            last_updated = CURRENT_TIMESTAMP
        `;
        
        const values = [
            cryptoData.id,
            cryptoData.name,
            cryptoData.symbol,
            cryptoData.current_price || 0,
            cryptoData.market_cap || 0,
            cryptoData.total_volume || 0,
            cryptoData.price_change_percentage_24h || 0,
            cryptoData.image
        ];
        
        await connection.execute(query, values);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error upserting crypto data:', error.message);
        throw error;
    }
}

// Get all cryptocurrencies from database
async function getAllCryptos() {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM cryptocurrencies ORDER BY market_cap DESC');
        connection.release();

        // Convert DECIMAL/BIGINT strings to numbers to avoid errors
        return rows.map(r => ({
            ...r,
            current_price: Number(r.current_price),
            market_cap: Number(r.market_cap),
            total_volume: Number(r.total_volume),
            price_change_percentage_24h: Number(r.price_change_percentage_24h)
        }));
    } catch (error) {
        console.error('❌ Error fetching crypto data:', error.message);
        throw error;
    }
}


//  Get specific cryptocurrency by its ID
async function getCryptoById(id) {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM cryptocurrencies WHERE id = ?', [id]);
        connection.release();

        if (!rows[0]) return null;

        const crypto = rows[0];
        // Convert DECIMAL/BIGINT strings to numbers to avoid errors
        return {
            ...crypto,
            current_price: Number(crypto.current_price),
            market_cap: Number(crypto.market_cap),
            total_volume: Number(crypto.total_volume),
            price_change_percentage_24h: Number(crypto.price_change_percentage_24h)
        };
    } catch (error) {
        console.error('❌ Error fetching crypto by ID:', error.message);
        throw error;
    }
}

module.exports = {
    pool,
    initializeDatabase,
    testConnection,
    upsertCrypto,
    getAllCryptos,
    getCryptoById
};