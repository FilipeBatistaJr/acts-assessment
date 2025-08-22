const axios = require('axios');
require('dotenv').config();

// Use public CoinGecko API URL if not provided in env
const COINGECKO_API_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

// List of cryptocurrencies to track
const CRYPTO_IDS = ['bitcoin', 'ethereum', 'litecoin', 'cardano', 'solana'];

class CoinGeckoService {
    constructor() {
        this.apiUrl = COINGECKO_API_URL;
        this.requestDelay = 1000;
    }

    // Fetch cryptocurrency data from CoinGecko
    async fetchCryptocurrencies() {
        try {
            console.log('🔄 Fetching cryptocurrency data from CoinGecko...');
            
            const url = `${this.apiUrl}/coins/markets`;
            const params = {
                vs_currency: 'usd',
                ids: CRYPTO_IDS.join(','),
                order: 'market_cap_desc',
                per_page: 10,
                page: 1,
                sparkline: false,
                price_change_percentage: '24h'
            };

            console.log('🌐 Making request to:', url);
            console.log('📊 With params:', params);

            const response = await axios.get(url, { 
                params,
                timeout: 10000 // 10 second timeout
            });
            
            if (response.status !== 200) {
                throw new Error(`CoinGecko API error: ${response.status}`);
            }

            const cryptoData = response.data.map(crypto => ({
                id: crypto.id,
                name: crypto.name,
                symbol: crypto.symbol.toUpperCase(),
                current_price: crypto.current_price || 0,
                market_cap: crypto.market_cap || 0,
                total_volume: crypto.total_volume || 0,
                price_change_percentage_24h: crypto.price_change_percentage_24h || 0,
                image: crypto.image || ''
            }));

            console.log(`✅ Successfully fetched ${cryptoData.length} cryptocurrencies from CoinGecko`);
            return cryptoData;

        } catch (error) {
            console.error('❌ Error fetching from CoinGecko:', error.message);
            
            // Check if it's a network error
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                console.error('🌐 Network connection issue - check your internet connection');
            } else if (error.response) {
                console.error(`🚨 API responded with status: ${error.response.status}`);
                console.error(`📝 Response data:`, error.response.data);
            }
            
            // If API fails, return mock data so app doesn't break
            console.log('🔄 Using fallback mock data...');
            return this.getMockData();
        }
    }

    // Mock data as fallback
    getMockData() {
        console.log('⚠️ Returning mock cryptocurrency data');
        return [
            {
                id: 'bitcoin',
                name: 'Bitcoin',
                symbol: 'BTC',
                current_price: 43250.50,
                market_cap: 847250000000,
                total_volume: 23450000000,
                price_change_percentage_24h: 2.45,
                image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
            },
            {
                id: 'ethereum',
                name: 'Ethereum',
                symbol: 'ETH',
                current_price: 2650.75,
                market_cap: 318750000000,
                total_volume: 15230000000,
                price_change_percentage_24h: -1.23,
                image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
            },
            {
                id: 'litecoin',
                name: 'Litecoin',
                symbol: 'LTC',
                current_price: 72.30,
                market_cap: 5350000000,
                total_volume: 425000000,
                price_change_percentage_24h: 0.87,
                image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png'
            },
            {
                id: 'cardano',
                name: 'Cardano',
                symbol: 'ADA',
                current_price: 0.45,
                market_cap: 15800000000,
                total_volume: 320000000,
                price_change_percentage_24h: 1.15,
                image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png'
            },
            {
                id: 'solana',
                name: 'Solana',
                symbol: 'SOL',
                current_price: 98.50,
                market_cap: 42600000000,
                total_volume: 1250000000,
                price_change_percentage_24h: -0.75,
                image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
            }
        ];
    }

    // Test API connection
    async testConnection() {
        try {
            console.log('🧪 Testing CoinGecko API connection...');
            const response = await axios.get(`${this.apiUrl}/ping`, { timeout: 5000 });
            console.log('✅ CoinGecko API connection successful');
            return true;
        } catch (error) {
            console.error('❌ CoinGecko API connection failed:', error.message);
            console.log('⚠️ Will use mock data as fallback');
            return false;
        }
    }
}

module.exports = CoinGeckoService;