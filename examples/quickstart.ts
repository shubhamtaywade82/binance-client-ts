/**
 * Public market data, then a risk-sized order plan.
 *
 * Run: npx tsx examples/quickstart.ts
 * No API keys are needed for the public section; the account section is skipped
 * unless BINANCE_API_KEY / BINANCE_API_SECRET are set.
 */
import { BinanceClient } from '../src/index.js';

async function main(): Promise<void> {
  const client = new BinanceClient({
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
    testnet: process.env.BINANCE_TESTNET === 'true',
  });

  // --- Public market data -------------------------------------------------
  const ticker = await client.futures.market.tickerPrice('BTCUSDT');
  console.log(`BTCUSDT last price: ${ticker.price}`);

  // Klines are parsed into named fields, not raw arrays.
  const klines = await client.futures.market.klines('BTCUSDT', '1h', { limit: 5 });
  for (const k of klines) {
    console.log(
      `${new Date(k.openTime).toISOString()}  O ${k.open}  H ${k.high}  L ${k.low}  C ${k.close}  V ${k.volume}`,
    );
  }

  // One call instead of four separate market-data requests.
  const snapshot = await client.futures.ops.marketSnapshot('BTCUSDT');
  console.log('snapshot:', JSON.stringify(snapshot, null, 2));

  // --- Symbol rules and sizing -------------------------------------------
  const rules = await client.futures.ops.symbolRules('BTCUSDT');
  console.log(
    `tick ${rules.tickSize}  step ${rules.stepSize}  minNotional ${rules.minNotional}  status ${rules.status}`,
  );

  // Turn a risk budget into an exchange-ready quantity rather than rounding by hand.
  const sizing = await client.futures.ops.sizePosition({
    symbol: 'BTCUSDT',
    side: 'BUY',
    stopPrice: ticker.price * 0.99,
    riskAmount: 50,
    leverage: 5,
  });
  console.log(`quantity ${sizing.quantityStr}  notional ${sizing.notional.toFixed(2)}  ok=${sizing.ok}`);
  if (!sizing.ok) console.log('blocked by:', sizing.reasons);

  // --- Authenticated section ---------------------------------------------
  if (!process.env.BINANCE_API_KEY) {
    console.log('\nSet BINANCE_API_KEY / BINANCE_API_SECRET to see the account section.');
    return;
  }

  const overview = await client.futures.ops.accountOverview();
  console.log('account:', JSON.stringify(overview, null, 2));

  // Nothing below is sent — validate the order server-side without placing it.
  if (sizing.ok) {
    await client.futures.trading.createTestOrder({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: sizing.quantityStr,
    });
    console.log('test order accepted (nothing was placed)');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
