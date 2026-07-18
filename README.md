# binance-client-ts

TypeScript client for Binance's **public** REST + WebSocket APIs — Spot and USD-M Futures.
Public market data only: no API keys, no account/order endpoints.

Canonical Binance client for the `trading-workspace` `sdk/` directory (mirrors `sdk/dhanhq-ts`'s
role for DhanHQ). Built for `edge-backtester` (historical data) and any future TS bot/tool that
needs Binance market data.

## Install

Not yet published. Reference via a local path or git URL, e.g.:

```json
{ "dependencies": { "binance-client-ts": "file:../binance-client-ts" } }
```

## Usage

```typescript
import { BinanceClient } from 'binance-client-ts';

const client = new BinanceClient();

// REST
const klines = await client.spot.market.klines('SOLUSDT', '15m', { limit: 500 });
const funding = await client.futures.data.fundingRateHistory('ETHUSDT', { limit: 100 });
const oi = await client.futures.data.openInterest('XRPUSDT');

// WebSocket (combined stream, auto-reconnect)
client.futures.ws.subscribe([
  client.futures.ws.kline('SOLUSDT', '15m'),
  client.futures.ws.markPrice('ETHUSDT', '1s'),
]);
client.futures.ws.on('message', (stream, payload) => console.log(stream, payload));
```

## Scope

- Spot (`api.binance.com`) and USD-M Futures (`fapi.binance.com`) REST: klines, tickers, depth,
  trades, aggTrades, exchangeInfo, avgPrice (spot), funding rate/premium index/open
  interest/long-short ratios (futures).
- Public WS combined streams for both markets: kline, aggTrade, trade, depth, ticker,
  bookTicker, and futures-only markPrice.
- No authenticated endpoints in this version.

## Development

```bash
npm install
npm test        # vitest, HTTP/WS mocked
npm run build    # tsup -> dist/ (ESM + CJS + .d.ts)
npm run smoke    # hits live public Binance endpoints, no keys needed
```
