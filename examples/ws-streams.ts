import { BinanceClient } from '../src/client/BinanceClient.js';

async function main() {
  console.log('📡 WebSocket Streams Demo\n');
  
  const client = new BinanceClient();
  
  // Track message count for demo
  let messageCount = 0;
  const maxMessages = 10;
  
  console.log('Connecting to SOLUSDT mark price stream (200ms)...');
  console.log('Will receive', maxMessages, 'updates then disconnect\n');
  
  // Subscribe to mark price updates
  client.futures.ws.onMarkPriceUpdate((data) => {
    if (data.symbol === 'SOLUSDT') {
      messageCount++;
      const markPrice = parseFloat(data.markPrice);
      const indexPrice = parseFloat(data.indexPrice);
      const fundingRate = parseFloat(data.fundingRate) * 100;
      
      console.log(`[${messageCount}] SOLUSDT Mark: $${markPrice.toFixed(2)} | Index: $${indexPrice.toFixed(2)} | Funding: ${fundingRate.toFixed(4)}%`);
      
      if (messageCount >= maxMessages) {
        console.log('\n✅ Received', maxMessages, 'messages. Disconnecting...');
        client.closeAllWebSockets();
        process.exit(0);
      }
    }
  }, 'SOLUSDT', '1s');
  
  // Connect the WebSocket
  client.futures.ws.connect();
  
  console.log('WebSocket connected. Waiting for updates...\n');
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    client.closeAllWebSockets();
    process.exit(0);
  });
  
  // Keep alive for demo duration
  setTimeout(() => {
    console.log('Demo timeout reached');
    client.closeAllWebSockets();
    process.exit(0);
  }, 30000); // 30 second timeout
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
