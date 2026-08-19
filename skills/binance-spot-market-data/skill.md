---
name: binance-spot-market-data
description: "Binance Spot market data + WebSocket streams via binance-sdk. Klines (klines/uiKlines), order book, trades, tickers (24h, book, rolling-window, trading-day), avgPrice, plus diff-depth / avgPrice / rolling-window WS streams."
metadata:
  version: 1.0.0
  package: '@nemesis-oss/binance-sdk'
  mcp: binance-sdk-mcp
---

# Binance Spot — Market Data & Streams

Public, unsigned market data for Binance **Spot** via [`binance-sdk`](https://github.com/shubhamtaywade82/binance-sdk)
(`client.spot.market` REST + `client.spot.ws` streams). Exposed as tools through `binance-sdk-mcp`
or `createFuturesToolkit(...)` (the `spot` group).

## REST Tools (unsigned)

| Tool | Purpose |
| ------ | --------- |
| `spot_ping` / `spot_server_time` | Connectivity / server time. |
| `spot_exchange_info` | Symbol metadata, filters, permissions, status. |
| `spot_ticker_price` | Latest price (single symbol). |
| `spot_ticker_24hr` | 24h change stats (open/high/low/volume/quote volume). |
| `spot_book_ticker` | Best bid/ask. |
| `spot_order_book` | Depth (limits 5/10/20/50/100/500/1000/5000). |
| `spot_recent_trades` | Most recent trades. |
| `spot_historical_trades` | Older trades by `fromId`. |
| `spot_agg_trades` | Aggregate trades in a time window. |
| `spot_klines` / `spot_ui_klines` | Candlesticks (uiKlines is the optimized endpoint). |
| `spot_avg_price` | 5-minute rolling average price. |
| `spot_rolling_window_ticker` | Rolling-window stats (1d/7d/30d); omit symbol for all. |
| `spot_trading_day_ticker` | UTC trading-day open/close/high/low/volume; omit symbol for all. |

## WebSocket Streams

Subscribe via the futures-style stream builders on `client.spot.ws` (topic names are lowercase):

| Stream | Topic |
| -------- | ------- |
| Kline | `<symbol>@kline_<interval>` |
| Aggregate trade | `<symbol>@aggTrade` |
| Trade | `<symbol>@trade` |
| Partial depth | `<symbol>@depth5` / `@depth10` / `@depth20` |
| Diff. depth | `<symbol>@depth` / `<symbol>@depth@100ms` |
| Book ticker | `<symbol>@bookTicker` (all: `!bookTicker`) |
| Ticker (24h) | `<symbol>@ticker` (all: `!ticker@arr`) |
| Mini ticker | `<symbol>@miniTicker` (all: `!miniTicker@arr`) |
| Rolling-window ticker | `<symbol>@ticker_1h` / `@ticker_4h` / `@ticker_1d` / `@ticker_7d` / `@ticker_30d` (all: `!ticker_<w>@arr`) |
| Average price | `<symbol>@avgPrice` |

## Notes

- Depth **diff** streams (`@depth`, `@depth@100ms`) are incremental — apply to a snapshot from
  `spot_order_book` to maintain a local book.
- All-market aggregate topics begin with `!`.
