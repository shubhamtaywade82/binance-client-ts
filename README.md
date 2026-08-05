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

// Composite ops — sizing/rounding handled for you
const sizing = await client.futures.ops.sizePosition({
  symbol: 'BTCUSDT',
  side: 'BUY',
  stopPrice: 59000,
  riskAmount: 100,   // or riskPct: 1
  leverage: 10,
});
if (sizing.ok) {
  await client.futures.ops.placeBracketOrder({
    symbol: 'BTCUSDT',
    side: 'BUY',
    quantity: sizing.quantityStr,
    stopLossPrice: 59000,
    takeProfitPrice: 63000,
  });
}
await client.futures.ops.closePosition({ symbol: 'BTCUSDT' });

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
- `market` — public REST market data (klines incl. continuous/index/mark/premium-index variants,
  tickers, depth incl. RPI depth, trades, aggTrades, exchangeInfo)
- `data` — futures analytics (funding rate, premium index, open interest, long/short ratios, basis,
  delivery price, insurance fund balance, ADL risk, force orders, index constituents, delist schedule)
- `account` — authenticated account endpoints (balance v2/v3, account v2/v3, positionRisk v2/v3,
  account config, income, userTrades, commission, leverage brackets, position mode, multi-assets
  margin, fee burn, API trading status, portfolio margin account info, position margin history,
  rate limit orders, order/trade/income data downloads)
- `trading` — order lifecycle (create/test/get/cancel/modify, open/all orders, batch orders,
  algo orders, order-modify history, leverage/margin/countdown-cancel config, Convert
  quote/accept/status)
- `ops` — composite operations layered over the above: `symbolRules` (typed tick/step/notional
  filters), `quantize`, `sizePosition` (risk-based sizing), `closePosition`, `marketSnapshot`,
  `accountOverview`, `placeBracketOrder`
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

### Paper trading

Simulates fills against live public prices — nothing is sent to the exchange. Margin is locked
at the requested leverage and released pro-rata as a position is reduced.

```typescript
import { PaperTradingEngine } from 'binance-client-ts';

const engine = new PaperTradingEngine({ initialBalance: 10_000 });
await engine.placeOrder({ symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quantity: 0.05, leverage: 5 });
await engine.updatePositions();               // re-mark against live prices
const close = await engine.placeOrder({ symbol: 'BTCUSDT', side: 'SELL', type: 'MARKET', quantity: 0.05 });
console.log(close.realizedPnl, engine.getAccountInfo().balance);
```

## Examples

```bash
npx tsx examples/quickstart.ts      # market data, symbol rules, risk-based sizing
npx tsx examples/ws-streams.ts      # live kline / trade / mark-price / book streams
npx tsx examples/paper-trading.ts   # simulated position lifecycle
```

## Development

```bash
npm install
npm test        # vitest, HTTP/WS mocked
npm run typecheck
npm run build   # tsup -> dist/ (ESM + CJS + .d.ts)
npm run smoke   # hits live public Binance endpoints, no keys needed
```

CI runs typecheck, build and tests on Node 18/20/22; pushing a `v*` tag publishes to npm.
