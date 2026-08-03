import { PaperTradingEngine } from '../src/paper/PaperTradingEngine.js';

async function main() {
  console.log('📄 Starting Paper Trading Demo\n');
  
  const engine = new PaperTradingEngine(10000); // $10,000 initial balance
  
  // Show supported symbols
  const symbols = await engine.getSupportedSymbols();
  console.log('Supported symbols:', symbols.join(', '));
  console.log('');
  
  // Get initial account info
  let account = engine.getAccountInfo();
  console.log('Initial Balance: $' + account.balance.toFixed(2));
  console.log('Available Balance: $' + account.availableBalance.toFixed(2));
  console.log('');
  
  // Place a BUY order for SOLUSDT
  console.log('📈 Placing BUY order: 10 SOLUSDT at market price...');
  const buyOrder = await engine.placeOrder({
    symbol: 'SOLUSDT',
    side: 'BUY',
    type: 'MARKET',
    quantity: 10,
    leverage: 5,
  });
  console.log('Order filled:', {
    orderId: buyOrder.orderId,
    symbol: buyOrder.symbol,
    side: buyOrder.side,
    quantity: buyOrder.quantity,
    avgFillPrice: buyOrder.avgFillPrice,
  });
  console.log('');
  
  // Update positions with latest prices
  await engine.updatePositions();
  account = engine.getAccountInfo();
  console.log('Account after BUY:');
  console.log('  Balance: $' + account.balance.toFixed(2));
  console.log('  Available: $' + account.availableBalance.toFixed(2));
  console.log('  Unrealized PnL: $' + account.unrealizedPnl.toFixed(2));
  console.log('');
  
  // Show position
  const solPosition = engine.getPosition('SOLUSDT');
  if (solPosition) {
    console.log('SOLUSDT Position:');
    console.log('  Side:', solPosition.side);
    console.log('  Quantity:', solPosition.quantity);
    console.log('  Entry Price: $' + solPosition.entryPrice.toFixed(2));
    console.log('  Leverage:', solPosition.leverage + 'x');
    console.log('  Unrealized PnL: $' + solPosition.unrealizedPnl.toFixed(2));
    console.log('');
  }
  
  // Place a SELL order to close half the position
  console.log('📉 Placing SELL order: 5 SOLUSDT to close half position...');
  const sellOrder = await engine.placeOrder({
    symbol: 'SOLUSDT',
    side: 'SELL',
    type: 'MARKET',
    quantity: 5,
  });
  console.log('Order filled:', {
    orderId: sellOrder.orderId,
    quantity: sellOrder.quantity,
    avgFillPrice: sellOrder.avgFillPrice,
  });
  console.log('');
  
  // Update and show final state
  await engine.updatePositions();
  account = engine.getAccountInfo();
  
  console.log('Final Account State:');
  console.log('  Balance: $' + account.balance.toFixed(2));
  console.log('  Available: $' + account.availableBalance.toFixed(2));
  console.log('  Total Wallet: $' + account.totalWalletBalance.toFixed(2));
  console.log('  Unrealized PnL: $' + account.unrealizedPnl.toFixed(2));
  console.log('');
  
  // Show order history
  const orders = engine.getOrderHistory();
  console.log('Order History (' + orders.length + ' orders):');
  orders.forEach(order => {
    console.log(`  #${order.orderId} ${order.side} ${order.quantity} ${order.symbol} @ $${order.avgFillPrice?.toFixed(2)} [${order.status}]`);
  });
  
  console.log('\n✅ Paper trading demo completed!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
