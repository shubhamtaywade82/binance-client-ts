# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **MCP Server** - Full Model Context Protocol server implementation with 10 trading tools and 2 resources
  - Tools: `get_market_price`, `get_kline_data`, `get_order_book`, `place_order`, `cancel_order`, 
    `get_position`, `update_leverage`, `get_account_info`, `get_funding_rate`, `get_open_interest`, 
    `get_liquidation_orders`
  - Resources: `binance://futures/symbols`, `binance://futures/premium-index`
- **Paper Trading Engine** - Local simulation engine for SOLUSDT, ETHUSDT, XRPUSDT
  - No API keys required
  - Real-time price feeds from Binance
  - Position tracking with unrealized PnL calculation
  - Order history and account management
- **Examples Directory** - Runnable demo scripts
  - `quickstart.ts` - Market data and exchange info demo
  - `ws-streams.ts` - WebSocket mark price streaming demo
  - `paper-trading.ts` - Paper trading engine demonstration
- **CI/CD Pipeline** - GitHub Actions workflow
  - Type checking, build, and test on multiple Node.js versions (18, 20, 22)
  - Automated npm publish on version tags
- **Environment Template** - `.env.example` for configuration

### Changed
- Updated dependencies to support MCP SDK integration

## [2.1.0] - 2026-08-03

### Added
- Full feature parity with binance-client-js
- Zod v4 runtime validation for all responses
- Rate limiting with bottleneck
- Comprehensive error hierarchy (5 error types)
- Auto-reconnect WebSockets with exponential backoff
- Automatic listenKey lifecycle management
- Signed WebSocket API for orders
- Dual ESM + CJS build output
- 74 unit tests with MSW mocks
- Smoke test script for live endpoint validation

### Features
- Spot market data endpoints
- USD-M Futures complete coverage:
  - Market data (tickers, klines, order book, premium index, funding rates)
  - Account management (balance, position risk, margin mode)
  - Trading (place/cancel/modify orders, batch operations)
  - Algo orders (conditional, trigger orders)
  - User data streams with auto keep-alive
- Utility functions: `buildPair`, `parsePair`, `calculateLiquidationPrice`, `nowSeconds`

[Unreleased]: https://github.com/shubhamtaywade82/binance-client-ts/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/shubhamtaywade82/binance-client-ts/releases/tag/v2.1.0
