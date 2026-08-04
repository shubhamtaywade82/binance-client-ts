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

// Market data (no keys needed if public-only)
const price = await client.futures.market.tickerPrice('BTCUSDT');
const book = await client.futures.market.depth('BTCUSDT', 100);

// Trading (signed)
await client.futures.trading.createOrder({
  symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT',
  quantity: 0.001, price: '50000', timeInForce: 'GTC',
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
|---------|---------|
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