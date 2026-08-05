# 📦 binance-client-ts

TypeScript client for Binance **Spot + USD-M Futures** — market data, account, trading,
algo orders, user data streams, signed WebSocket API, and a typed **LLM tool layer + MCP
server + agent skills** for AI trading agents.

- **REST**: public market data + signed account/trade (orders, batch, algo, leverage, margin).
- **WebSocket**: market streams (`/public`, `/market`, `/private`), user data stream, and
  request/response **WebSocket API** (`order.place`, `account.balance`, …).
- **zod-validated** responses, **bottleneck** rate limiting, granular error classes.
- **LLM tooling**: 80+ framework-agnostic tools convertible to OpenAI, Anthropic, or MCP formats.
- **MCP server**: `binance-usdm-mcp` (stdio + HTTP health) exposing all tools.
- **Skills**: 7 Binance Skills-Hub skills under `skills/`.

## Install

```bash
npm i binance-client-ts
# dev
npm i -D binance-client-ts@file:./path   # or git+https://github.com/shubhamtaywade82/binance-client-ts
```

## Quick start

```ts
import { BinanceClient } from 'binance-client-ts';

const client = new BinanceClient({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
  testnet: true, // -> testnet.binancefuture.com
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

// WebSocket
client.futures.ws.subscribe(['btcusdt@kline_1m', 'btcusdt@markPrice@1s']);
client.futures.ws.on('message', (stream, payload) => console.log(stream, payload));

// User data stream
await client.startUserStream();
client.futures.wsUser.on('message', (event) => /* ACCOUNT_UPDATE / ORDER_TRADE_UPDATE */);
```


## LLM tools (wire once, use everywhere)

```ts
import { BinanceClient, createFuturesToolkit, toolkitToFormats } from 'binance-client-ts';
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

## Development

const client = new BinanceClient({ apiKey, apiSecret });
const tk = createFuturesToolkit(client);

// OpenAI / Anthropic / raw JSON-schema
const { openai, anthropic, mcp } = toolkitToFormats(tk);

// Call a tool directly
await tk.tools.find((t) => t.name === 'futures_new_order')!.handler(
  { symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quantity: 0.001, newClientOrderId: 'x' },
  { env: 'live', isSigned: true },
);
```

## MCP server

```bash
# stdio (Claude Desktop / Cursor)
npx binance-usdm-mcp

# HTTP health on :PORT
BINANCE_API_KEY=k BINANCE_API_SECRET=s npx binance-usdm-mcp --http
# or
npm run mcp         # stdio
npm run mcp:http    # http
```

## Scripts

| Command | Purpose |
| --------- | --------- |
| `npm run build` | tsup (ESM + CJS + types; MCP externalized) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest (74 unit tests, mocked via msw) |
| `npm run smoke` | live public-endpoint smoke test |
| `npm run mcp` / `npm run mcp:http` | Run the MCP server |

## API surface (endpoints)

See `skills/derivatives-trading-usds/SKILL.md` for the full REST + stream catalogue, including
the 2026 WebSocket URL split (`/public`, `/market`, `/private`).

## License

MIT · Symbols: `BTCUSDT`, `ETHUSDT`, `SOLUSDT`, `XRPUSDT` · Testnet via `testnet.binancefuture.com`.
