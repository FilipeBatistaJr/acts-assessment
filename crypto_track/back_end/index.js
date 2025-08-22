const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

// Import our custom modules
const { 
    initializeDatabase, 
    testConnection, 
    upsertCrypto, 
    getCryptoById,
} = require('./database');
const CoinGeckoService = require('./coinGeckoService');
const redisClient = require('./cache'); // Redis client

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 60; // seconds

// Initialize services
const coinGeckoService = new CoinGeckoService();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // React URL 
    credentials: true
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// -------------------- ROUTES -------------------- //

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'CryptoTracker API is running',
        timestamp: new Date().toISOString()
    });
});

// Get all cryptocurrencies with Redis caching
app.get('/api/cryptos', async (req, res) => {
    try {
        const cacheKey = 'cryptos';
        
        // Check if Redis is connected before using it
        if (redisClient.isOpen) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log('⚡ Returning data from Redis cache');
                    return res.json(JSON.parse(cachedData));
                }
            } catch (redisError) {
                console.error('⚠️ Redis error, proceeding without cache:', redisError.message);
            }
        }

        console.log('🔥 No cache found, fetching from CoinGecko...');
        const cryptoData = await coinGeckoService.fetchCryptocurrencies();

        // Store in Redis (if connected)
        if (redisClient.isOpen) {
            try {
                await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(cryptoData));
            } catch (redisError) {
                console.error('⚠️ Redis cache store error:', redisError.message);
            }
        }

        // Persist into MariaDB
        await Promise.all(cryptoData.map(crypto => upsertCrypto(crypto)));

        res.json(cryptoData);
    } catch (error) {
        console.error('❌ Error fetching cryptocurrencies:', error);
        res.status(500).json({ 
            error: 'Failed to fetch cryptocurrency data',
            details: error.message 
        });
    }
});

// Get specific cryptocurrency by ID
app.get('/api/cryptos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Optional: check Redis first for individual crypto
        const cacheKey = `crypto:${id}`;
        
        if (redisClient.isOpen) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log(`⚡ Returning ${id} from Redis cache`);
                    return res.json(JSON.parse(cachedData));
                }
            } catch (redisError) {
                console.error('⚠️ Redis error, proceeding without cache:', redisError.message);
            }
        }

        const crypto = await getCryptoById(id);

        if (!crypto) {
            return res.status(404).json({ 
                error: 'Cryptocurrency not found',
                id: id 
            });
        }

        // Cache individual crypto (if Redis is connected)
        if (redisClient.isOpen) {
            try {
                await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(crypto));
            } catch (redisError) {
                console.error('⚠️ Redis cache store error:', redisError.message);
            }
        }

        res.json(crypto);
    } catch (error) {
        console.error('❌ Error fetching cryptocurrency by ID:', error);
        res.status(500).json({ 
            error: 'Failed to fetch cryptocurrency',
            details: error.message 
        });
    }
});

// Manual update endpoint (for testing)
app.post('/api/cryptos/update', async (req, res) => {
    try {
        const count = await updateCryptoData();
        res.json({ 
            message: 'Cryptocurrency data updated successfully',
            updatedCount: count
        });
    } catch (error) {
        console.error('❌ Error updating cryptocurrency data:', error);
        res.status(500).json({ 
            error: 'Failed to update cryptocurrency data',
            details: error.message 
        });
    }
});

// -------------------- FUNCTIONS -------------------- //

// Update crypto data: fetch from CoinGecko, update Redis & MariaDB
async function updateCryptoData() {
    try {
        console.log('🔄 Starting cryptocurrency data update...');

        // Fetch data from CoinGecko
        const cryptoData = await coinGeckoService.fetchCryptocurrencies();

        // Update Redis cache (if connected)
        if (redisClient.isOpen) {
            try {
                await redisClient.setEx('cryptos', CACHE_TTL, JSON.stringify(cryptoData));
            } catch (redisError) {
                console.error('⚠️ Redis cache update error:', redisError.message);
            }
        }

        // Persist into MariaDB
        await Promise.all(cryptoData.map(crypto => upsertCrypto(crypto)));

        console.log(`✅ Successfully updated ${cryptoData.length} cryptocurrencies`);
        return cryptoData.length;

    } catch (error) {
        console.error('❌ Error updating crypto data:', error);
        throw error;
    }
}

// -------------------- SERVER INIT -------------------- //

async function startServer() {
    try {
        console.log('🚀 Starting CryptoTracker API Server...');

        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) throw new Error('Database connection failed');

        // Initialize database tables
        await initializeDatabase();

        // Test CoinGecko API
        await coinGeckoService.testConnection();

        // Wait for Redis connection (with timeout)
        let redisConnected = false;
        if (redisClient.isOpen) {
            redisConnected = true;
            console.log('✅ Redis connection verified');
        } else {
            console.log('⚠️ Redis not connected, continuing without cache');
        }

        // Initial data fetch
        console.log('🔥 Fetching initial cryptocurrency data...');
        await updateCryptoData();

        // Schedule automatic updates every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            console.log('⏰ Scheduled update: Fetching latest cryptocurrency data...');
            try {
                await updateCryptoData();
            } catch (error) {
                console.error('❌ Scheduled update failed:', error);
            }
        });

        console.log('📅 Scheduled automatic updates every 5 minutes');

        // Start the server
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`🔗 API endpoint: http://localhost:${PORT}/api/cryptos`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
            console.log(`📊 Cryptocurrency data ready! (Redis: ${redisConnected ? 'enabled' : 'disabled'})`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Shutdown
process.on('SIGTERM', async () => { 
    console.log('🛑 SIGTERM received, shutting down...'); 
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
    process.exit(0); 
});

process.on('SIGINT', async () => { 
    console.log('🛑 SIGINT received, shutting down...'); 
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
    process.exit(0); 
});

// Start the server
startServer();