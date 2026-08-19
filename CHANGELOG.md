# Changelog

All notable changes to `binance-sdk` are documented here.
Format inspired by [Keep a Changelog](https://keepachangelog.com/).

## [3.0.0]

### Changed

- **Breaking:** package renamed from `@shubhamtaywade82/binance-sdk` to
  `@nemesis-oss/binance-sdk`. Update imports accordingly.
- **Breaking:** MCP server binary renamed from `binance-usdm-mcp` to `binance-sdk-mcp`
  (`npx binance-sdk-mcp`); MCP server name changed from `binance-usdm-futures` to `binance-sdk`.
- Added `mcp-config/local-dev.json`, a host config that runs the MCP server from source
  (`npx tsx src/mcp/index.ts`) for local development without publishing first.

## [Unreleased]

### Fixed

- `FuturesData.insuranceFundBalance` now hits the correct `/futures/data/insuranceBalance` endpoint
  (was incorrectly calling `/fapi/v1/insuranceBalance`).
- `FuturesData.blvtInfo` now sends the required `interval` (plus optional `startTime`/`endTime`/`limit`)
  for BLVT NAV klines (`/fapi/v1/lvtKlines`).

### Added

- Full order-book diff-depth market streams: `FuturesMarketWS.depthDiff` (`<symbol>@depth`) and
  `depthDiffSpeed` (`<symbol>@depth@100ms` / `@depth@500ms`); depth payloads now preserve `pu`/`T`.
- All-market rolling-window ticker stream: `FuturesMarketWS.allRollingWindowTickers` (`!ticker_<w>@arr`).
- `WsApi` unsigned/public market-data methods (`time`, `exchangeInfo`, `klines`, `aggTrades`, `trades`,
  `depth`, `avgPrice`, `ticker.price/bookTicker/24hr`) and signed `order.status`, `orderList.*`,
  `account.status/position`, and `userDataStream.start/ping/stop`.
- Full **Spot** support: `client.spot.account` (account info, myTrades, myPreventedMatches,
  commission, rate limits), `client.spot.trading` (orders + OCO order lists + cancelReplace),
  `client.spot.userStream` (spot listenKey), and `client.spot.wsUser` (spot user-data stream).
  Plus spot market REST (`uiKlines`, rolling-window & trading-day tickers) and spot market WS
  (diff-depth, `avgPrice`, rolling-window ticker + all-market variants).
- **Spot LLM tools + MCP + skills**: `spotTools` group (`spot_*` — market data, account, trading,
  OCO, user-data stream) wired into `createFuturesToolkit`; WS-API tools
  (`futures_ws_api_*`) for order/account/position/user-data-stream over the signed WS API;
  `binance://spot/symbols` MCP resource; and `binance-spot-trading` / `binance-spot-market-data` skills.

## [2.2.0] - 2026-08-04

### Added

- **LLM tool layer** (`src/tools/`): 80 framework-agnostic tools (31 market / 22 account / 22 trading / 7 ws / 7 paper),
  with OpenAI / Anthropic / MCP / JSON-schema adapters (`createFuturesToolkit`, `toolkitToFormats`).
- **Paper-trading engine** (`src/tools/paper.tools.ts`): in-memory simulated positions with live pricing, no keys required.
- **MCP server** (`src/mcp/`): `binance-usdm-mcp` binary, stdio + HTTP health transport, auto-registers all 80 tools.
- **AI agent skills**: 7 Binance Skills-Hub skills under `skills/` (`derivatives-trading-usds`,
  `derivatives-trading-usds-streams`, `futures-algo-trading`, `futures-portfolio-margin`,
  plus updated `binance-futures-market-data` / `binance-futures-trading` / `binance-futures-paper-trading`).
- `examples/quickstart.ts`, `examples/ws-streams.ts`, `examples/paper-trading.ts`.
- `.env.example`, `CHANGELOG.md`, GitHub Actions CI workflow.
- Package `bin` entry `binance-usdm-mcp`.

### Dependencies

- Added `@modelcontextprotocol/sdk` ^1.30.0.

## [2.1.0]

- Feature-parity with binance-client-js: orders, batch, algo, modify, leverage,
  margin type, countdown-cancel, full market-data + user data streams, signed WS API.

## [2.0.0]

- TypeScript rewrite with zod-validated responses and typed WebSocket streams.
