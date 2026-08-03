import { BinanceClient } from '../src/client/BinanceClient.js';

async function main() {
  console.log('🚀 Binance Futures Quickstart Demo\n');
  
  // Initialize client (public endpoints work without API keys)
  const client = new BinanceClient({
    testnet: false, // Set to true for testnet
  });
  
  // Get exchange info
  console.log('📊 Fetching exchange info...');
  const exchangeInfo = await client.futures.market.exchangeInfo();
  console.log('Available symbols:', exchangeInfo.symbols.filter(s => s.status === 'TRADING').length);
  console.log('');
  
  // Get current price for popular pairs
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  console.log('💰 Current Prices:');
  for (const symbol of symbols) {
    try {
      const ticker = await client.futures.market.tickerPrice(symbol);
      console.log(`  ${symbol}: $${parseFloat(ticker.price).toFixed(2)}`);
    } catch (err) {
      console.log(`  ${symbol}: Error fetching price`);
    }
  }
  console.log('');
  
  // Get kline data for SOLUSDT
  console.log('📈 SOLUSDT 1h Klines (last 5):');
  const klines = await client.futures.market.klines('SOLUSDT', '1h', { limit: 5 });
  klines.forEach(k => {
    const open = parseFloat(k[1]);
    const high = parseFloat(k[2]);
    const low = parseFloat(k[3]);
    const close = parseFloat(k[4]);
    const time = new Date(Number(k[0])).toISOString();
    console.log(`  ${time} O:$${open.toFixed(2)} H:$${high.toFixed(2)} L:$${low.toFixed(2)} C:$${close.toFixed(2)}`);
  });
  console.log('');
  
  // Get order book depth
  console.log('📚 SOLUSDT Order Book:');
  const depth = await client.futures.market.depth('SOLUSDT', 5);
  console.log('  Bids:');
  depth.bids.forEach(([price, qty]) => {
    console.log(`    $${parseFloat(price).toFixed(2)} x ${parseFloat(qty).toFixed(2)}`);
  });
  console.log('  Asks:');
  depth.asks.forEach(([price, qty]) => {
    console.log(`    $${parseFloat(price).toFixed(2)} x ${parseFloat(qty).toFixed(2)}`);
  });
  console.log('');
  
  // Get funding rate
  console.log('💸 SOLUSDT Funding Rate:');
  const fundingRates = await client.futures.data.fundingRate({ symbol: 'SOLUSDT', limit: 1 });
  if (fundingRates.length > 0) {
    const fr = fundingRates[0];
    console.log(`  Rate: ${(parseFloat(fr.fundingRate) * 100).toFixed(4)}%`);
    console.log(`  Time: ${new Date(fr.fundingTime).toISOString()}`);
  }
  console.log('');
  
  // Get open interest
  console.log('📊 SOLUSDT Open Interest:');
  const oi = await client.futures.data.openInterest({ symbol: 'SOLUSDT' });
  console.log(`  Open Interest: ${parseFloat(oi.openInterest).toFixed(2)} SOL`);
  console.log(`  Value: $${(parseFloat(oi.openInterest) * parseFloat(oi.price)).toFixed(2)}`);
  console.log('');
  
  console.log('✅ Quickstart demo completed!');
  console.log('\n💡 Note: Trading functions require API keys.');
  console.log('   Set BINANCE_API_KEY and BINANCE_API_SECRET environment variables.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
