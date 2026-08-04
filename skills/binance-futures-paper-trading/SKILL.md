---
name: binance-futures-paper-trading
description: "Risk-free paper trading on Binance USD-M Futures using live market prices (no API keys required). Track balance, open/close positions, and realized PnL in memory."
metadata:
  version: 1.1.0
  author: shubhamtaywade82
  category: paper-trading
  market: USD-M Futures
  auth-required: false
  symbols: [BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT]
license: MIT
---

# Binance Futures Paper Trading

Simulate orders with real market prices without touching API credentials.
Uses `futures_ticker_price` for live pricing; all state is held in-memory per client process.

## Tools (no keys required)
`paper_init` — reset balance/positions/history (default 10,000 USDT).
`paper_balance` — show cash balance + open positions.
`paper_open_position` — open a paper LONG/SHORT at live price (or a fixed price).
`paper_close_position` — close by `id` or `symbol`; realizes PnL at live price.
`paper_positions` — open positions marked-to-market with unrealized PnL.
`paper_history` — all open/close events.
`paper_summary` — quick balance + position count.

## Guidance
- Initialize with `paper_init` first, then `paper_open_position` with `side`, `quantity`.
- `paper_close_position` accepts either `id` (from the open event) or `symbol`.
- Paper equity is **not persisted** across process restarts.
