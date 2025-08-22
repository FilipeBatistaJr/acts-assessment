# Crypto Tracker App

A full-stack cryptocurrency tracker built with React (frontend), Node.js/Express (backend), MariaDB (database), and Redis (cache).  
This project demonstrates API integration, caching, and database persistence.

# 🚀 Features
- Frontend built in React with Bootstrap for responsive UI.  
- Displays a list of cryptocurrencies (Bitcoin, Ethereum, Litecoin, etc.) with price, market cap, and 24h volume. 
- Interactive Chart View for selected Crypto Currencies
- Responsive Design for Mobile and Desktop
- Hover effect, gradients, and modern UI styling for better UX.
- Loading spinners and error handling alerts on frontend. 
- Backend built in Node.js/Express, connected to MariaDB.  
- External API integration with CoinGecko for real-time crypto data.  
- Redis caching to reduce API calls (60s expiry).  
- Data is persisted into MariaDB for historical logging.
- Real-time updates with Redis ensure the front end reflects data without manual refresh.

# 📂 Project Structure

crypto-tracker/
│── backend/
│   ├── .env.example
│   ├── cache.js
│   ├── coinGeckoService.js
│   ├── database.js
│   ├── index.js
│   ├── package.json
│── frontend/
│   ├── src/
│   ├── App.css
│   ├── App.js
│  ├── .env
│  ├── .package.json
│── README.md

# ⚙️ Installation & Setup

# 1. Clone Repository
(In Terminal):

git clone [https://github.com/FilipeBatistaJr/acts-assessment/tree/main/crypto_track]
cd crypto-tracker

# 2️. Install Dependencies

# Backend Depends:
(In Terminal):

cd back_end
npm install express mariadb axios redis cors dotenv

# Frontend Depends:
(In Terminal):

cd front_end
npm install react react-dom axios bootstrap react-bootstrap recharts

# 3️. Setup MariaDB Database
Run MariaDB and create a database:

CREATE DATABASE crypto_tracker;
USE crypto_tracker;

CREATE TABLE cryptos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  symbol VARCHAR(255),
  price DECIMAL(18,8),
  market_cap BIGINT,
  volume_24h BIGINT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

Update "back_end/.env" with your DB credentials:

DB_HOST=localhost
DB_USER=root (in my instance filipe)
DB_PASSWORD=your_password (in my instance password123)
DB_NAME=crypto_tracker
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# 4️. Install and Run Redis
Since I am running on a Windows 8.1 machine I had to 
Install Redis version 3.0.508 (old) to get Redis to work
So since you are most likely running on a newer machine
I would recommend using Docker.

# 5️. Start Backend
(In Terminal):

cd back_end
node index.js

Backend runs on: "http://localhost:5000"

# 6️. Start Frontend
(In Terminal):

cd front_end
npm start
Frontend runs on: "http://localhost:3000"

# ? Testing the Project
- Navigate to "http://localhost:3000" in your browser.  
- You should see a list of cryptocurrencies with price, market cap, and 24h volume.  
- Data is cached in Redis (60s expiry).  
- Every new fetch persists data into MariaDB.

# 📜 Assessment Requirements Checklist

# ✅ Task 1 - React App
- [x] React frontend with Bootstrap styling  
- [x] Displays crypto list with price, market cap, 24h volume  
- [x] Responsive and navigable

# ✅ Task 2 - Node.js API + MariaDB
- [x] Express backend with RESTful endpoint `/api/cryptos`  
- [x] MariaDB integration for persistence  
- [x] External API (CoinGecko) for real-time data

# ✅ Task 3 - Redis Cache
- [x] Redis used as smart cache (60s TTL)  
- [x] Cache hit returns data instantly  
- [x] Cache miss fetches fresh data → updates Redis → saves to MariaDB

# 👤 Author
Filipe Batista 
Built for assessment purposes.
