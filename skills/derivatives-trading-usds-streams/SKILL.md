---
title: Derivatives Trading (USDS-M Futures) — Real-time Streams
description: >
  Subscribe to live Binance USDⓈ-M futures WebSocket streams (market/public/private),
  read buffered payloads, and open user data streams for real-time account/order updates.
metadata:
  version: 1.0.0
  author: shubhamtaywade82
  category: derivatives-trading
  market: USD-M Futures
  symbols: [BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT]
  auth-required: false
  testnet: true
  realtime: true
license: MIT
---

# USDS-M Futures — Real-time WebSocket Streams

Binance USDⓈ-M futures streams over three base URLs (per the 2026 routing upgrade :
`wss://fstream.binance.com/public`, `/market`, and `/private`).
The SDK (`client.futures.ws`, `client.futures.wsUser`) and the `futures_ws_*` tools handle routing.

## Trigger
Use when the user wants **live market data** — trades, order books, klines, mark prices,
tickers, liquidations — or **real-time private updates** (orders/positions/balances).

## Rules
- Topics are **lowercase** with `@`, e.g. `btcusdt@aggTrade`.
- Symbol-less aggregate topics start with `!`: `!ticker@arr`, `!bookTicker`, `!markPrice@arr`, `!forceOrder@arr`.
- `SUBSCRIBE` is sent after connection opens; the SDK auto-reconnects & re-subscribes.
- Order-book `depth`/`depth20` streams push **deltas** — combine with a snapshot from
  `futures_order_book` to reconstruct the book.
- `@kline_<interval>` and `@markPrice@1s` use update intervals in the suffix.
- User data streams need a `listenKey` (auto-managed via `futures_ws_start_user_stream`;
  keep-alive every 30 min).

## Tools

| Tool | Purpose |
|------|---------|
| `futures_ws_subscribe` | Subscribe to one or more topics. |
| `futures_ws_unsubscribe` | Unsubscribe topics. |
| `futures_ws_subscriptions` | Active subscriptions. |
| `futures_ws_events` | Buffered payloads (aggTrade, kline, depth, markPrice, bookTicker, ticker, forceOrder). |
| `futures_ws_clear_events` | Flush buffer. |
| `futures_ws_start_user_stream` | Start private user-data stream (listenKey + keep-alive). |
| `futures_ws_stop_user_stream` | Stop & invalidate the user-data stream. |

## Stream catalogue (public)

### Trades & Liquidations
- `<symbol>@aggTrade` — aggregate trades (same price+side).
- `<symbol>@trade` — raw trades.
- `<symbol>@forceOrder` — liquidation for one symbol.
- `!forceOrder@arr` — all-symbol liquidations.

### Order Book
- `<symbol>@depth` / `<symbol>@depth@0ms` / `<symbol>@depth@100ms` / `<symbol>@depth@100ms@500ms` — depth deltas.
- `<symbol>@depth20` etc. — snapshot limits (use REST `futures_order_book` for the full snapshot).
- `<symbol>@bookTicker` — top of book (best bid/ask).
- `!bookTicker` — all symbols best bid/ask.

### Mark Price & Index
- `<symbol>@markPrice` / `<symbol>@markPrice@1s` — mark/index/settle price + funding.
- `!markPrice@arr` — all symbols mark price.
- `<symbol>@compositeIndex` — index price constituents (multi-asset indexes).
- `<symbol>@assetIndex` / `!assetIndex@arr` — multi-assets-mode asset index.

### Tickers
- `<symbol>@ticker` — 24h ticker.
- `<symbol>@ticker@1h` / `@4h` / `@1d` — symbol **rolling-window** tickers.
- `<symbol>@miniTicker` — mini (price + 24h change).
- `!ticker@arr` / `!miniTicker@arr` — all-symbol tickers.

### Klines
- `<symbol>@kline_<interval>` — candlesticks (1m…1M).
- `<symbol>@continuousKline_<contractType>_<interval>` — continuous-contract candles (perpetual/current_quarter/next_quarter).
- `<symbol>@markPriceKline_<interval>` / `<symbol>@indexPriceKline_<interval>` — mark/index price candles.

### Contract Info (metadata)
- `!contractInfo` — pushed on listing/settlement/bracket changes.

## Stream catalogue (private — user data, over listenKey)
`ACCOUNT_UPDATE`, `ORDER_TRADE_UPDATE`, `MARGIN_CALL`, `ACCOUNT_CONFIG_UPDATE`, `listenKeyExpired`.

## References
- REST reference: `references/futures-usds.md#user-data-streams`
