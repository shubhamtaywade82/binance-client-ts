# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Paper trading engine (`PaperTradingEngine`) — simulates USD-M fills against live public
  prices, with margin locked at the requested leverage and released pro-rata on close.
  Works for any tradeable symbol.
- MCP resources on the server: `binance://futures/symbols` and `binance://futures/premium-index`.
  Hosts can attach these to context without the model calling a tool first.
- GitHub Actions CI: typecheck, build and test across Node 18/20/22, plus a tag-triggered
  npm publish job.
- `examples/` — `quickstart.ts`, `ws-streams.ts`, `paper-trading.ts`. Included in `tsconfig`
  so they are typechecked in CI and cannot drift from the API.

### Changed
- `tsconfig.json` `include` now covers `examples`.

## [2.1.0]

### Added
- Composite operations layer (`client.futures.ops`) over the single-endpoint resources:
  `symbolRules`, `quantize`, `sizePosition`, `closePosition`, `marketSnapshot`,
  `accountOverview`, `placeBracketOrder`, plus 7 matching LLM/MCP tools.
- Typed symbol filters (`symbolRulesFrom`, `floorToStep`, `roundToStep`) flattening the
  `exchangeInfo` filters array into tick/step/notional rules, so callers no longer do
  float arithmetic on price and quantity precision.
- REST endpoints: `premiumIndexKlines`, `rpiDepth`, `deliveryPrice`, `symbolAdlRisk`,
  `accountConfig`, `pmAccountInfo`, income-history download (request + status), and the
  four Convert endpoints.
- `futures_adl_quantile` and `futures_force_orders` tools, which the skill documented but
  which were never registered.
- Order parameters `activationPrice`, `selfTradePreventionMode`, `goodTillDate`, and
  `timeInForce: 'GTD'`.

### Fixed
- `insuranceFundBalance()` called `/fapi/v1/insuranceFundBalance`; the real path is
  `/fapi/v1/insuranceBalance`.
- `symbolConfig()` and `forceOrders()` are USER_DATA endpoints but were sent unsigned,
  so they failed authentication against the live API.

### Removed
- `quantitativeRules()`, a broken duplicate of `apiTradingStatus()` that pointed at an
  endpoint which does not exist.

## [2.0.0]

### Added
- LLM tool layer (`createFuturesToolkit`) with OpenAI / Anthropic / MCP schema adapters,
  and an MCP server binary (`binance-usdm-mcp`).
- Full parity with the JS client: auth, trading, account, futures-data, WS user streams
  and the signed WS API.
