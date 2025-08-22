import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function App() {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'chart'

  // Use useCallback to memoize the function and prevent unnecessary re-renders
  const fetchCryptoData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use environment variable for API base URL
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/cryptos`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure numeric fields are numbers and not string to avoid errors
      const normalizedData = data.map(c => ({
        ...c,
        current_price: Number(c.current_price),
        market_cap: Number(c.market_cap),
        total_volume: Number(c.total_volume),
        price_change_percentage_24h: Number(c.price_change_percentage_24h)
      }));

      setCryptoData(normalizedData);
      setError(null);
      console.log('✅ Successfully fetched crypto data from backend');
    } catch (err) {
      console.error('❌ Error fetching crypto data:', err);
      setError('Failed to load cryptocurrency data. Make sure your backend is running.');
      setCryptoData(getMockData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCryptoData();
  }, [fetchCryptoData]);

  // Handle refresh button click
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchCryptoData();
  };

  // Handle home navigation
  const handleHome = () => {
    setCurrentView('home');
    setSelectedCrypto(null);
    setChartData([]);
  };

  // Fetch real 7-day historical data from CoinGecko
  const fetchChartData = async (cryptoId) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=7`
      );
      if (!response.ok) throw new Error("Failed to fetch chart data");

      const data = await response.json();

      // Map CoinGecko response into chart format
      return data.prices.map(([timestamp, price], index, arr) => {
        const date = new Date(timestamp);
        const prevPrice = index === 0 ? price : arr[index - 1][1];
        const percentageChange = ((price - prevPrice) / prevPrice) * 100;

        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price,
          formattedPrice: formatPrice(price),
          percentageChange,
        };
      });
    } catch (error) {
      console.error("❌ Error fetching chart data:", error);
      return [];
    }
  };

  // Handle crypto click for chart view
  const handleCryptoClick = async (crypto) => {
    setSelectedCrypto(crypto);
    setCurrentView('chart');
    setChartLoading(true);

    try {
      const realChartData = await fetchChartData(crypto.id);
      setChartData(realChartData);
      console.log(`📈 Loaded chart data for ${crypto.name}`);
    } catch (error) {
      setError('Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  };

  // Mock Data as backup 
  const getMockData = () => [
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

  const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };
  const formatVolume = (volume) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${volume.toLocaleString()}`;
  };
  const getPriceChangeClass = (change) => (change >= 0 ? 'text-success' : 'text-danger');

  // Custom tooltip for the chart (real data)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark text-white p-2 rounded shadow">
          <p className="mb-1">{`Date: ${label}`}</p>
          <p className="mb-1">{`Price: ${data.formattedPrice}`}</p>
          <p className="mb-0" style={{color: data.percentageChange >= 0 ? '#28a745' : '#dc3545'}}>
            {`Change: ${data.percentageChange >= 0 ? '+' : ''}${data.percentageChange.toFixed(2)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="App">
      {/* Navigation */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#home" onClick={handleHome} style={{ cursor: 'pointer' }}>
            CryptoTracker
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={handleHome} style={{ cursor: 'pointer' }}>
                Home
              </Nav.Link>
            </Nav>
            <Nav>
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Refreshing...
                  </>
                ) : (
                  '🔄 Refresh'
                )}
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        {currentView === 'home' && (
          <>
            <div className="text-center mb-5">
              <h1 className="display-4 fw-bold text-primary mb-3">Cryptocurrency Market</h1>
              <p className="lead text-muted">Track real-time prices and market data for top cryptocurrencies</p>
              <p className="text-muted small">Click on any cryptocurrency to view its 7-day price chart</p>
            </div>

            {error && <Alert variant="warning">{error}</Alert>}
            {loading && <Spinner animation="border" role="status" variant="primary" className="d-block mx-auto my-5"/>}

            {/* Table for desktop */}
            <div className="d-none d-md-block">
              <Table responsive hover>
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Coin</th>
                    <th>Price</th>
                    <th>24h Change</th>
                    <th>Market Cap</th>
                    <th>Volume (24h)</th>
                  </tr>
                </thead>
                <tbody>
                  {cryptoData.map((crypto, index) => (
                    <tr 
                      key={crypto.id} 
                      onClick={() => handleCryptoClick(crypto)}
                      style={{ cursor: 'pointer' }}
                      className="crypto-row"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img src={crypto.image} alt={crypto.name} width="30" className="me-2" />
                          <span>{crypto.name} ({crypto.symbol})</span>
                        </div>
                      </td>
                      <td>{formatPrice(crypto.current_price)}</td>
                      <td className={`fw-bold ${getPriceChangeClass(crypto.price_change_percentage_24h)}`}>
                        {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                        {crypto.price_change_percentage_24h.toFixed(2)}%
                      </td>
                      <td>{formatMarketCap(crypto.market_cap)}</td>
                      <td>{formatVolume(crypto.total_volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Cards for mobile */}
            <div className="d-md-none">
              {cryptoData.map((crypto) => (
                <Card 
                  key={crypto.id} 
                  className="mb-3 shadow-sm crypto-card" 
                  onClick={() => handleCryptoClick(crypto)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body>
                    <div className="d-flex align-items-center mb-2">
                      <img src={crypto.image} alt={crypto.name} width="40" className="me-2" />
                      <h5 className="mb-0">{crypto.name} ({crypto.symbol})</h5>
                    </div>
                    <p className="mb-1">Price: {formatPrice(crypto.current_price)}</p>
                    <p className={`mb-1 fw-bold ${getPriceChangeClass(crypto.price_change_percentage_24h)}`}>
                      24h: {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                      {crypto.price_change_percentage_24h.toFixed(2)}%
                    </p>
                    <p className="mb-0">Market Cap: {formatMarketCap(crypto.market_cap)}</p>
                    <p className="mb-0">Volume (24h): {formatVolume(crypto.total_volume)}</p>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </>
        )}

        {currentView === 'chart' && selectedCrypto && (
          <>
            <div className="d-flex align-items-center mb-4">
              <Button variant="outline-primary" onClick={handleHome} className="me-3">
                ← Back to Home
              </Button>
              <div className="d-flex align-items-center">
                <img src={selectedCrypto.image} alt={selectedCrypto.name} width="40" className="me-2" />
                <h2 className="mb-0">{selectedCrypto.name} ({selectedCrypto.symbol})</h2>
              </div>
            </div>

            <Card className="mb-4">
              <Card.Body>
                <div className="row">
                  <div className="col-md-3">
                    <h6 className="text-muted mb-1">Current Price</h6>
                    <h4 className="mb-0">{formatPrice(selectedCrypto.current_price)}</h4>
                  </div>
                  <div className="col-md-3">
                    <h6 className="text-muted mb-1">24h Change</h6>
                    <h4 className={`mb-0 ${getPriceChangeClass(selectedCrypto.price_change_percentage_24h)}`}>
                      {selectedCrypto.price_change_percentage_24h >= 0 ? '+' : ''}
                      {selectedCrypto.price_change_percentage_24h.toFixed(2)}%
                    </h4>
                  </div>
                  <div className="col-md-3">
                    <h6 className="text-muted mb-1">Market Cap</h6>
                    <h4 className="mb-0">{formatMarketCap(selectedCrypto.market_cap)}</h4>
                  </div>
                  <div className="col-md-3">
                    <h6 className="text-muted mb-1">Volume (24h)</h6>
                    <h4 className="mb-0">{formatVolume(selectedCrypto.total_volume)}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h5 className="mb-0">7-Day Price Chart</h5>
              </Card.Header>
              <Card.Body>
                {chartLoading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" role="status" variant="primary" />
                    <p className="mt-2 text-muted">Loading chart data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#007bff" 
                        strokeWidth={2}
                        dot={{ fill: '#007bff', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#007bff', strokeWidth: 2 }}
                        name="Price (USD)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                <p className="text-muted small mt-3 text-center">
                  * Chart shows real 7-day historical data from CoinGecko
                </p>
              </Card.Body>
            </Card>
          </>
        )}
      </Container>
    </div>
  );
}

export default App;
