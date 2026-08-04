import { BinanceClient } from '../src/index.js';

async function main(): Promise<void> {
  const client = new BinanceClient();

  const pairs = ['SOLUSDT', 'ETHUSDT', 'XRPUSDT'];
  for (const symbol of pairs) {
    const p = await client.futures.market.tickerPrice(symbol);
    console.log(`${symbol} price: ${p.price}`);
  }

  const klines = await client.futures.market.klines('SOLUSDT', '15m', { limit: 5 });
  console.log(`SOLUSDT klines: ${klines.length} candles, last close ${klines.at(-1)?.close}`);

  const oi = await client.futures.data.openInterest('SOLUSDT');
  console.log(`SOLUSDT open interest: ${oi.openInterest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
