---
title: Derivatives Trading (USDS-M Futures)
description: >
  Trade Binance USDⓈ-M perpetual and quarterly futures with the binance-client-ts SDK.
  Full order lifecycle (market/limit/stop/stop-market/TP/SL/trailing), positions, leverage,
  margin mode, batch orders, and algo (conditional/VP) orders. Authenticated (signed) endpoints.
metadata:
  version: 1.0.0
  author: shubhamtaywade82
  category: derivatives-trading
  market: USD-M Futures
  symbols: [BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT]
  auth-required: true
  testnet: true
  risk: high
license: MIT
---

# Derivatives Trading — USDS-M Futures

Trade Binance USDⓈ-M Futures (perpetual & quarterly) via the `binance-client-ts` SDK
(`client.futures.trading` / `client.futures.account`), exposed to LLM agents as the
`futures_*` tools and via the `binance-usdm-mcp` MCP server.

## Trigger
Use when the user wants to **place, modify, cancel, or query orders or positions**,
or change **leverage / margin mode / position mode** on Binance USD-M futures.

## Authentication
- Requires `BINANCE_API_KEY` + `BINANCE_API_SECRET`.
- Use `testnet: true` (or `BINANCE_TESTNET=true`) for paper testing on `testnet.binancefuture.com`.
- **⚠️ Safety — mainnet orders require `CONFIRM`**: never submit a real order until the user types `CONFIRM`.

## Tools (signed, TRADE)

| Tool | Alias | Endpoint | Notes |
|------|-------|----------|-------|
| `futures_new_order` | new-order | `POST /fapi/v1/order` | Types: LIMIT, MARKET, STOP, STOP_MARKET, TAKE_PROFIT, TAKE_PROFIT_MARKET, TRAILING_STOP_MARKET. `newOrderRespType=RESULT` returns fills. |
| `futures_test_order` | order-test | `POST /fapi/v1/order/test` | Validate without submitting. |
| `futures_get_order` | query-order | `GET /fapi/v1/order` | By `orderId` or `origClientOrderId`. |
| `futures_cancel_order` | cancel-order | `DELETE /fapi/v1/order` | By `orderId` or `origClientOrderId`. |
| `futures_get_open_order` | open-order | `GET /fapi/v1/openOrder` | Current open order. |
| `futures_open_orders` | open-orders | `GET /fapi/v1/openOrders` | All open (one symbol or all). |
| `futures_all_orders` | all-orders | `GET /fapi/v1/allOrders` | Historical (7-day window). |
| `futures_cancel_all_orders` | cancel-all | `DELETE /fapi/v1/allOpenOrders` | Kill all for a symbol. |
| `futures_modify_order` | modify-order | `PUT /fapi/v1/order` | Price/quantity/stop amendment. |
| `futures_order_modify_history` | modify-history | `GET /fapi/v1/orderAmendment` | Edit history. |
| `futures_batch_orders` | batch-orders | `POST /fapi/v1/batchOrders` | Up to 5 orders atomic (max 30/min/symbol). |
| `futures_cancel_batch_orders` | batch-cancel | `DELETE /fapi/v1/batchOrders` | Cancel by id/client-id list. |
| `futures_set_leverage` | set-leverage | `POST /fapi/v1/leverage` | 1–125 (within bracket). |
| `futures_set_margin_type` | margin-type | `POST /fapi/v1/marginType` | `isolated`/`cross` (close positions first). |
| `futures_modify_position_margin` | position-margin | `POST /fapi/v1/positionMargin` | `marginType` 1=add, 2=reduce (isolated only). |
| `futures_countdown_cancel_all` | countdown-cancel | `POST /fapi/v1/countdownCancelAll` | Circuit-breaker, 100–60000 ms. |
| `futures_new_algo_order` | algo-order | `POST /fapi/v1/algoOrder` | CONDITIONAL (stop/TP) or VP volumes. |
| `futures_cancel_algo_order` | cancel-algo | `DELETE /fapi/v1/algoOrder` | — |
| `futures_cancel_all_algo_orders` | cancel-all-algo | `DELETE /fapi/v1/algoOpenOrders` | — |
| `futures_get_algo_order` | query-algo | `GET /fapi/v1/algoOrder` | — |
| `futures_open_algo_orders` | open-algos | `GET /fapi/v1/openAlgoOrders` | — |
| `futures_all_algo_orders` | all-algos | `GET /fapi/v1/allAlgoOrders` | — |

### Order type guidance
- **Stop-loss / take-profit triggers** → use `STOP_MARKET` and `TAKE_PROFIT_MARKET` with
  `workingType=MARK_PRICE` + `priceProtect=true` to avoid premature wicks.
- **Trailing stop** → `TRAILING_STOP_MARKET` with `callbackRate` (e.g. `0.5` = 0.5%).
- **Close a position** → set `reduceOnly: true`; pair with the correct `positionSide`.
- Always confirm margin mode (`isolated`/`cross`) and leverage **before** sizing.

## Helpers
- `BinanceClient.buildPair('BTC','USDT')` → `BTCUSDT`; `parsePair` to split.
- Fetch `futures_exchange_info` → filters (step/tick size, max qty) before rounding prices/quantities.

## References
- REST reference: `references/futures-usds.md`
- Streams reference: `references/futures-usds-streams.md`
