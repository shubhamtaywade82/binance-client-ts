---
title: Futures Portfolio Margin (USDS-M)
description: >
  Query classic portfolio-margin account information for USDⓈ-M futures collateral.
  Read-only (get) via GET /fapi/v1/pmAccountInfo; no position/order endpoints here. Authenticated.
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

# Futures Portfolio Margin

Portfolio-margin collateral queries for USDⓈ-M futures.

## Trigger
Use when the user asks for their **portfolio-margin account overview** —
the on-chain-style collateral asset balances used as futures margin.

## Tools
- (No dedicated SDK tool in v2.1.0; use `futures_account` / `futures_balance` for regular
  futures balances, and the underlying SDK method `FuturesData.pmExchangeInfo()` via
  `pm_exchange_info` when the SDK adds it.)

## References
- REST reference: `references/futures-usds.md#portfolio-margin-endpoints`
