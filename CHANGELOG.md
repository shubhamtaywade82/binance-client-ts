# Changelog

All notable changes to `binance-client-ts` are documented here.
Format inspired by [Keep a Changelog](https://keepachangelog.com/).

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
