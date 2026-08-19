# binance-sdk

TypeScript SDK for Binance — **Spot + USD-M Futures**, REST + WebSocket, public market data
and authenticated trading, with zod-validated typed responses.

Canonical Binance client for the `trading-workspace` `sdk/` directory (mirrors `sdk/dhanhq-ts`'s
role for DhanHQ). Feature-parity with `binance-client-js` (REST + WS), with typed schemas.

## Install

```bash
npm install @nemesis-oss/binance-sdk
```

## Usage

```typescript
import { BinanceClient } from '@nemesis-oss/binance-sdk';

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

// Spot account + trading
const spotAccount = await client.spot.account.account();
const spotOrder = await client.spot.trading.createOrder({
  symbol: 'BTCUSDT',
  side: 'BUY',
  type: 'LIMIT',
  quantity: '0.001',
  price: '60000',
  timeInForce: 'GTC',
});
await client.spot.trading.cancelOrder('BTCUSDT', { orderId: spotOrder.orderId });

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

// Spot user data stream
await client.startSpotUserStream();
client.spot.wsUser.on('executionReport', (event) => console.log(event.s));
client.closeSpotUserStream();
```

## API Surface

### Spot (`client.spot`)

- `market` — public REST (klines + uiKlines, tickers incl. rolling-window & trading-day, depth,
  trades, aggTrades, exchangeInfo, avgPrice)
- `account` — authenticated account (account info, myTrades, myPreventedMatches, commission, rate limits)
- `trading` — order lifecycle (create/test/get/cancel, open/all orders, cancelReplace, OCO order lists)
- `userStream` — listenKey lifecycle (create / keep-alive / close)
- `ws` — market WebSocket streams (kline, trade, aggTrade, depth incl. diff-depth, ticker incl.
  rolling-window, bookTicker, miniTicker, avgPrice + all-market/arr variants)
- `wsUser` — spot user data stream (executionReport, outboundAccountPosition, balanceUpdate, listStatus)

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
- `ws` — market WebSocket streams (kline, continuous/index/mark klines, aggTrade, trade, depth
  incl. full order-book diff-depth, ticker, rolling-window ticker + all-market variant, mark price,
  book ticker, mini ticker, liquidations, composite index, asset index + all-market/arr variants)
- `wsUser` — user data stream (ACCOUNT_UPDATE, ORDER_TRADE_UPDATE, MARGIN_CALL; auto-reconnect)
- `wsApi` — WebSocket API: signed trading (order.place/cancel/modify/status, algoOrder.place/cancel,
  orderList.place/cancel/status, account.status/position, userDataStream.start/ping/stop) and public
  market data (time, exchangeInfo, klines, aggTrades, trades, depth, avgPrice,
  ticker.price/bookTicker/24hr)

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
import { PaperTradingEngine } from '@nemesis-oss/binance-sdk';

const engine = new PaperTradingEngine({ initialBalance: 10_000 });
await engine.placeOrder({ symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quantity: 0.05, leverage: 5 });
await engine.updatePositions();               // re-mark against live prices
const close = await engine.placeOrder({ symbol: 'BTCUSDT', side: 'SELL', type: 'MARKET', quantity: 0.05 });
console.log(close.realizedPnl, engine.getAccountInfo().balance);
```

## LLM Tools & MCP

The SDK ships a framework-agnostic tool layer plus an MCP server, so any function-calling agent
(OpenAI, Anthropic/Claude, MCP hosts) can drive the client.

```ts
import { BinanceClient, createFuturesToolkit, toolkitToFormats } from '@nemesis-oss/binance-sdk';
const tk = createFuturesToolkit(new BinanceClient({ apiKey, apiSecret, testnet }));
const { openai, anthropic, mcp } = toolkitToFormats(tk); // tool schemas per format
```

- **Tool groups**: `market`, `account`, `trading` (USD-M futures), `spot` (Spot), `ws`
  (streams + WS API), `derived` (composites like size/close/bracket), `paper`.
- **MCP server**: `npx binance-sdk-mcp` (stdio) auto-registers every tool plus reference
  resources (`binance://futures/symbols`, `binance://futures/premium-index`, `binance://spot/symbols`).
  For local development against source instead of the published package, point your MCP host at
  `mcp-config/local-dev.json` (runs `npx tsx src/mcp/index.ts` directly).
- **Agent skills**: Markdown skills under `skills/` — futures trading / market-data / algo /
  portfolio-margin, plus spot trading / market-data — for Skills-Hub-style agents.

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
