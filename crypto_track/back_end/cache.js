const redis = require('redis');
require('dotenv').config();

const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';

const client = redis.createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
    },
    // Add retry strategy for older Redis versions
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('❌ Redis server refused connection');
            return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('❌ Redis retry time exhausted');
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 3) {
            console.error('❌ Redis connection attempts exceeded');
            return undefined; // Stop retrying
        }
        // Reconnect after
        return Math.min(options.attempt * 100, 3000);
    }
});

// Error handling
client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
    // Don't exit the process, just log the error
});

client.on('connect', () => {
    console.log('🔗 Redis client connecting...');
});

client.on('ready', () => {
    console.log('✅ Redis client ready');
});

client.on('end', () => {
    console.log('🔚 Redis connection ended');
});

client.on('reconnecting', () => {
    console.log('🔄 Redis client reconnecting...');
});

// Connect with proper error handling
async function connectRedis() {
    try {
        await client.connect();
        console.log('✅ Redis connected successfully');
    } catch (err) {
        console.error('❌ Redis connection failed:', err.message);
        console.log('⚠️ Application will continue without Redis caching');
        // Don't throw error - let app continue without Redis
    }
}

// Call connection
connectRedis();

module.exports = client;