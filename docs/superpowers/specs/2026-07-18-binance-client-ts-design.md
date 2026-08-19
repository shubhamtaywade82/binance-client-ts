# binance-sdk — Design Spec

Date: 2026-07-18

## Purpose

Canonical TypeScript client for Binance's **public** REST + WebSocket APIs, covering both
Spot and USD-M Futures. Fills the gap in `sdk/` (which has `dhanhq-ts` for DhanHQ but no
Binance client) and becomes the shared data source for the `edge-backtester` tool (sub-project
2) and any future TS bot/tool in this workspace that needs Binance market data.

No authenticated endpoints (account, orders, trading execution) in this version — public
market data only.

## Non-goals

- No API-key auth, order placement, account/balance endpoints.
- No CoinDCX/Delta — Binance only.
- No bundled trading strategy logic — that lives in `trading-concepts-ts` / `edge-backtester`.

## Package

- Path: `sdk/binance-sdk` (own git repo, sibling to `sdk/dhanhq-ts`).
- npm name: `binance-sdk` (unscoped, matches repo name — same pattern as
  `trading-concepts-ts` itself).
- Build: `tsup` → ESM + CJS + `.d.ts`, `"type": "module"`, `main`/`module`/`types`/`exports`
  fields matching `trading-concepts-ts/package.json`.
- Tests: `vitest` (matches `trading-concepts-ts`, not `dhanhq-ts`'s jest — this repo's author
  is actively using vitest).
- Node >= 18.

## Architecture

```
src/
  client/
    HttpClient.ts        # axios instance + weight-aware rate limiter (bottleneck) + retry/backoff on 429/418
    BinanceClient.ts      # facade: new BinanceClient() -> { spot, futures }
  resources/
    SpotMarket.ts          # klines, ticker/price, ticker/24hr, ticker/bookTicker, depth, trades, aggTrades, exchangeInfo, avgPrice
    FuturesMarket.ts       # same REST shape as SpotMarket, fapi base
    FuturesData.ts         # fundingRate, premiumIndex (mark price), openInterest, openInterestHist,
                             # topLongShortAccountRatio, topLongShortPositionRatio, globalLongShortAccountRatio, takerlongshortRatio
  ws/
    BaseWS.ts               # combined-stream connect, reconnect w/ backoff, heartbeat, typed EventEmitter
    SpotMarketWS.ts          # wss://stream.binance.com:9443
    FuturesMarketWS.ts       # wss://fstream.binance.com
  types/                    # Kline, Ticker24hr, BookTicker, DepthSnapshot, Trade, AggTrade,
                             # FundingRate, PremiumIndex, OpenInterest, LongShortRatio, WS stream payload unions
  errors/
    BinanceApiError.ts       # wraps Binance {code, msg} error body
    RateLimitError.ts
    NetworkError.ts
  index.ts
examples/
scripts/smoke-test.ts        # hits live public endpoints, no keys needed
README.md
```

## REST endpoint coverage

**Spot** (`api.binance.com/api/v3`): `exchangeInfo`, `klines`, `ticker/price`, `ticker/24hr`,
`ticker/bookTicker`, `depth`, `trades`, `aggTrades`, `avgPrice`.

**USD-M Futures** (`fapi.binance.com/fapi/v1` + `/futures/data`): `exchangeInfo`, `klines`,
`ticker/price`, `ticker/24hr`, `ticker/bookTicker`, `depth`, `trades`, `aggTrades`,
`premiumIndex`, `fundingRate`, `openInterest`, `openInterestHist`,
`topLongShortAccountRatio`, `topLongShortPositionRatio`, `globalLongShortAccountRatio`,
`takerlongshortRatio`.

## WS stream coverage

Per market (spot/futures), combined-stream subscribe/unsubscribe for: `kline_<interval>`,
`aggTrade`, `trade`, `depth` (diff + partial book), `ticker` (24hr rolling), `bookTicker`,
and futures-only `markPrice@1s`/`@3s`. One socket per market handles many symbols/streams via
the combined-stream endpoint (`/stream?streams=...`).

## Error handling

- HTTP 4xx/5xx and Binance `{code,msg}` bodies → typed `BinanceApiError`.
- 429/418 → automatic retry with backoff, honoring `Retry-After`.
- WS disconnects → automatic reconnect with exponential backoff; re-subscribes active streams.

## Testing

- vitest unit tests per resource, HTTP mocked with `msw`.
- WS unit tests with a mock socket server.
- `scripts/smoke-test.ts`: manual live-endpoint sanity check (klines, ticker, funding rate, one
  WS kline stream), run via `npm run smoke`.

## Success criteria

- `new BinanceClient()` exposes typed `.spot.*` / `.futures.*` REST methods and
  `.spot.ws` / `.futures.ws` for streaming, all covering the endpoints listed above.
- `npm run build && npm test` green.
- `edge-backtester` (sub-project 2) can pull N months of historical klines for
  SOLUSDT/ETHUSDT/XRPUSDT (spot or futures) through this client with no other HTTP code.
