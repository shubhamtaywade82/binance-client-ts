---
name: binance-futures-trading
description: "Place, modify, and cancel Binance USD-M Futures orders and manage positions/leverage/margin mode. Authenticated (signed) trading endpoints. Must ask user to CONFIRM mainnet orders."
metadata:
  version: 1.1.0
  author: shubhamtaywade82
  category: trading
  market: USD-M Futures
  auth-required: true
  symbols: [BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT]
  risk: high
license: MIT
---

# Binance Futures Trading

Execute Binance USDⓈ-M Futures orders and manage positions/leverage via `binance-sdk`
(`client.futures.trading` / `client.futures.account`) and the `futures_*` tools / `binance-sdk-mcp` server.

⚠️ **Mainnet orders require `CONFIRM`.** Never submit a signed order tool until the user
explicitly types `CONFIRM` (or you have explicit allowance). Use `futures_test_order` first
to validate fields and margin.

## Order types
`LIMIT`, `MARKET`, `STOP`, `STOP_MARKET`, `TAKE_PROFIT`, `TAKE_PROFIT_MARKET`, `TRAILING_STOP_MARKET`.

## Trading tools (signed)
`futures_new_order`, `futures_test_order`, `futures_get_order`, `futures_cancel_order`,
`futures_get_open_order`, `futures_open_orders`, `futures_all_orders`, `futures_cancel_all_orders`,
`futures_modify_order`, `futures_order_modify_history`, `futures_batch_orders`,
`futures_cancel_batch_orders`, `futures_set_leverage`, `futures_set_margin_type`,
`futures_modify_position_margin`, `futures_countdown_cancel_all`,
`futures_new_algo_order`, `futures_cancel_algo_order`, `futures_cancel_all_algo_orders`,
`futures_get_algo_order`, `futures_open_algo_orders`, `futures_all_algo_orders`.

## Trading guidance
- Check the symbol via `futures_exchange_info` (TRADING status) before ordering.
- Round price/quantity to the symbol's tick/step size from exchange info.
- For stop triggers, set `workingType=MARK_PRICE` + `priceProtect=true`.
- Confirm margin mode (`isolated`/`cross`) and leverage before sizing.
- `client.futures.ws` gives live fills via the user data stream.
