---
title: Futures Algo Trading (USDS-M)
description: >
  Place conditional (TP/SL trigger) and volume-participation (VP) algo orders on Binance USDⓈ-M
  futures via POST /fapi/v1/algoOrder. Authenticated (signed).
metadata:
  version: 1.0.0
  author: shubhamtaywade82
  category: derivatives-trading
  market: USD-M Futures
  symbols: [BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT]
  auth-required: true
  testnet: true
license: MIT
---

# Futures Algo Trading — USDS-M

Conditional and volume-participation algo orders executed through the `futures_*` algo tools.

## Trigger
Use when the user wants **take-profit / stop-loss triggers** or **volume-participation**
algos instead of plain market/limit orders.

## Tools

| Tool | Endpoint | Notes |
|------|----------|-------|
| `futures_new_algo_order` | `POST /fapi/v1/algoOrder` | `algoType`: CONDITIONAL or VP. |
| `futures_cancel_algo_order` | `DELETE /fapi/v1/algoOrder` | By `algoId` or `clientAlgoId`. |
| `futures_cancel_all_algo_orders` | `DELETE /fapi/v1/algoOpenOrders` | All algo orders for a symbol. |
| `futures_get_algo_order` | `GET /fapi/v1/algoOrder` | Query one. |
| `futures_open_algo_orders` | `GET /fapi/v1/openAlgoOrders` | Open algos. |
| `futures_all_algo_orders` | `GET /fapi/v1/allAlgoOrders` | History. |

## Algo types
- **CONDITIONAL** — a trigger order: `type` is `STOP_MARKET` or `TAKE_PROFIT_MARKET`,
  with `triggerPrice`, `quantity`, optional `price` (limit on fill), `workingType=MARK_PRICE`,
  `priceProtect`, `reduceOnly`. Use to open a TP/SL bracket leg.
- **VP (Volume Participation)** — `type=LIMIT`, `urgency` (LOW/MEDIUM/HIGH),
  `quantity`. Fills passively by matching market volume at a participation rate.

## Guidance
- A complete bracket = one entry order + a conditional TP algo + a conditional SL algo
  (or a `place_bracket` helper when supported by the host).
- Conditional triggers accept `stopPrice`/`priceProtect`; always pair with the correct `positionSide`.

## References
- REST reference: `references/futures-usds.md#algo-orders`
