---
name: binance-futures-market-data
description: "Use for read-only Binance USD-M Futures market data analysis, including prices, 24h tickers, order books, trades, klines, funding, mark price, open interest, and long/short ratios. Also covers live WebSocket streams. No trading/auth required for public endpoints."
metadata:
  version: 1.1.0
  author: shubhamtaywade82
  category: market-data
  market: USD-M Futures
  auth-required: false
  symbols: [BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT]
license: MIT
---

# Binance Futures Market Data

Read-only Binance USDⓈ-M Futures market data via `binance-sdk`
(`client.futures.market` / `client.futures.data`) and the `futures_*` tools / `binance-sdk-mcp` server.

- Symbols are uppercase USD-M pairs, e.g. `BTCUSDT`, `ETHUSDT`, `SOLUSDT`, `XRPUSDT`.
- For live data, combine the REST ticker with a WebSocket subscription (`futures_ws_events`).
- Order-book queries: use `futures_order_book` for a snapshot; `futures_ws_events` depth deltas must be applied to it.
- Intervals: `1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 3d 1w 1M`.

## Public REST tools (no keys)
`futures_ping`, `futures_server_time`, `futures_exchange_info`, `futures_ticker_price` / `futures_ticker_price_v2`,
`futures_ticker_24hr`, `futures_book_ticker` / `futures_book_ticker_v2`, `futures_order_book`,
`futures_recent_trades`, `futures_historical_trades`, `futures_agg_trades`, `futures_klines`,
`futures_continuous_klines`, `futures_index_price_klines`, `futures_mark_price_klines`,
`futures_trading_day_ticker`, `futures_mark_price`, `futures_funding_rate_history`,
`futures_funding_info`, `futures_open_interest`, `futures_open_interest_hist`,
`futures_top_long_short_account_ratio`, `futures_top_long_short_position_ratio`,
`futures_global_long_short_ratio`, `futures_taker_long_short_ratio`, `futures_basis`,
`futures_asset_index`, `futures_composite_index_info`, `futures_insurance_balance`,
`futures_index_price_constituents`.

## Live streams
Subscribe with `futures_ws_subscribe` (lowercase topics, e.g. `btcusdt@aggTrade`,
`btcusdt@kline_1m`, `btcusdt@depth20`, `btcusdt@markPrice@1s`, `btcusdt@bookTicker`,
`!ticker@arr`, `!markPrice@arr`, `!forceOrder@arr`), then read via `futures_ws_events`.
