# binance-client-ts

TypeScript client for Binance — **Spot + USD-M Futures**, REST + WebSocket, public market data
and authenticated trading, with zod-validated typed responses.

Canonical Binance client for the `trading-workspace` `sdk/` directory (mirrors `sdk/dhanhq-ts`'s
role for DhanHQ). Feature-parity with `binance-client-js` (REST + WS), with typed schemas.

## Install

Not yet published. Reference via a local path or git URL, e.g.:

```json
{ "dependencies": { "binance-client-ts": "file:../binance-client-ts" } }
```

## Usage

```typescript
import { BinanceClient } from 'binance-client-ts';

const client = new BinanceClient({
  apiKey: 'YOUR_API_KEY',      // only needed for authenticated endpoints
  apiSecret: 'YOUR_API_SECRET',
  testnet: true,               // or demo: true; defaults to live
});

// Public market data (no keys needed)
const klines = await client.spot.market.klines('SOLUSDT', '15m', { limit: 500 });
const funding = await client.futures.data.fundingRateHistory('ETHUSDT', { limit: 100 });
const oi = await client.futures.data.openInterest('XRPUSDT');

// Authenticated account
const balance = await client.futures.account.balance();
const positions = await client.futures.account.positionRisk();

// Trading
const order = await client.futures.trading.createOrder({
  symbol: 'BTCUSDT',
  side: 'BUY',
  type: 'LIMIT',
  quantity: 0.01,
  price: 60000,
  timeInForce: 'GTC',
});
await client.futures.trading.cancelOrder('BTCUSDT', { orderId: order.orderId });

// Market WebSocket (combined stream, auto-reconnect)
client.futures.ws.subscribe([
  client.futures.ws.kline('SOLUSDT', '15m'),
  client.futures.ws.markPrice('ETHUSDT', '1s'),
]);
client.futures.ws.on('message', (stream, payload) => console.log(stream, payload));

// User data stream (listenKey lifecycle managed automatically)
const listenKey = await client.startUserStream();
client.futures.wsUser.on('ORDER_TRADE_UPDATE', (event) => console.log(event.o));
client.futures.wsUser.on('ACCOUNT_UPDATE', (event) => console.log(event.a));
client.closeUserStream();
```

## API Surface

### Spot (`client.spot`)
- `market` — public REST (klines, tickers, depth, trades, aggTrades, exchangeInfo, avgPrice)
- `ws` — market WebSocket streams

### Futures (`client.futures`)
- `market` — public REST market data (klines, tickers, depth, trades, aggTrades, exchangeInfo)
- `data` — futures analytics (funding rate, premium index, open interest, long/short ratios)
- `account` — authenticated account endpoints (balance v2/v3, account v2/v3, positionRisk v2/v3,
  income, userTrades, commission, leverage brackets, position mode, multi-assets margin, fee burn,
  API trading status, position margin history, rate limit orders, data downloads)
- `trading` — order lifecycle (create/test/get/cancel/modify, open/all orders, batch orders,
  algo orders, order-modify history, leverage/margin/countdown-cancel config)
- `userStream` — listenKey lifecycle (create / keep-alive / close)
- `ws` — market WebSocket streams (kline, continuous/index/mark klines, aggTrade, trade, depth,
  ticker, rolling-window ticker, mark price, book ticker, mini ticker, liquidations, composite
  index, asset index + all-market/arr variants)
- `wsUser` — user data stream (ACCOUNT_UPDATE, ORDER_TRADE_UPDATE, MARGIN_CALL; auto-reconnect)
- `wsApi` — signed WebSocket API (order.place/cancel/modify, algoOrder.place/cancel)

### Client options
`apiKey`, `apiSecret`, `testnet`, `demo`, `recvWindow`, `apiBase`, `wsBase`, `wsUserBase`,
`wsApiBase`, `timeoutMs`, `maxRetries`, `retryBaseDelayMs`, `retryMaxDelayMs`.

### Errors
`BinanceError` base, `BinanceAuthError`, `BinanceApiError` (code + status), `RateLimitError`,
`NetworkError`.

## Development

```bash
npm install
npm test        # vitest, HTTP/WS mocked
npm run typecheck
npm run build   # tsup -> dist/ (ESM + CJS + .d.ts)
npm run smoke   # hits live public Binance endpoints, no keys needed
```
