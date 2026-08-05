/**
 * Paper trading against live prices — nothing is ever sent to the exchange.
 *
 * Run: npx tsx examples/paper-trading.ts
 * No API keys are needed; prices come from the public market endpoints.
 */
import { PaperTradingEngine } from '../src/index.js';

function money(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

async function main(): Promise<void> {
  const engine = new PaperTradingEngine({ initialBalance: 10_000 });
  const symbol = 'BTCUSDT';

  const entryPrice = await engine.getMarketPrice(symbol);
  console.log(`${symbol} mark price: ${entryPrice}`);

  // Open a 5x long. Margin locked is notional / leverage, not the full notional.
  const open = await engine.placeOrder({
    symbol,
    side: 'BUY',
    type: 'MARKET',
    quantity: 0.05,
    leverage: 5,
  });
  console.log(`opened  #${open.orderId}  ${open.side} ${open.quantity} @ ${open.avgFillPrice}`);

  const position = engine.getPosition(symbol);
  console.log(`position ${position?.side} qty=${position?.quantity} margin=${position?.margin.toFixed(2)}`);

  let account = engine.getAccountInfo();
  console.log(`balance ${account.balance.toFixed(2)}  available ${account.availableBalance.toFixed(2)}`);

  // Re-mark against the live price; balance does not move until something closes.
  await engine.updatePositions();
  account = engine.getAccountInfo();
  console.log(`unrealized ${money(account.unrealizedPnl)}  equity ${account.totalWalletBalance.toFixed(2)}`);

  // Close half, then the rest — margin is released pro-rata each time.
  const half = await engine.placeOrder({ symbol, side: 'SELL', type: 'MARKET', quantity: 0.025 });
  console.log(`closed half  realized ${money(half.realizedPnl)}`);

  const rest = await engine.placeOrder({ symbol, side: 'SELL', type: 'MARKET', quantity: 0.025 });
  console.log(`closed rest  realized ${money(rest.realizedPnl)}`);

  account = engine.getAccountInfo();
  console.log(
    `\nfinal  balance ${account.balance.toFixed(2)}  ` +
      `realized ${money(account.realizedPnl)}  ` +
      `available ${account.availableBalance.toFixed(2)}  ` +
      `open positions ${engine.getOpenPositions().length}`,
  );
  console.log(`orders placed: ${engine.getOrderHistory().length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
