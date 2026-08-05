# USDS-M Futures REST API reference

Base URLs:
- **Live**: `https://fapi.binance.com`
- **Testnet**: `https://testnet.binancefuture.com`
- **Demo**: `https://demo-fapi.binance.com`

Weight limit: **2400 weight / minute** (per IP). Orders: **1200 orders / 10s** per UID +
300 orders per 10s per UID. Read `X-MBX-USED-WEIGHT-1M` and `X-MBX-ORDER-COUNT-10S` headers.
WebSocket API (`wss://ws-fapi.binance.com/ws-fapi/v1`) has **separate** 2400 weight/min and
300 orders/10s limits; order counts are shared with REST.

`signed` = HMAC-SHA256, requires `X-MBX-APIKEY` + `timestamp` (`recvWindow` ≤ 60000ms, default 5000).

## Market Data (public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /fapi/v1/ping | ❌ | Test connectivity. |
| GET | /fapi/v1/time | ❌ | Server time (ms). |
| GET | /fapi/v1/exchangeInfo | ❌ | Symbol metadata, filters, contract types, delivery dates. |
| GET | /fapi/v1/depth | ❌ | Order book depth (limit 5/10/20/50/100/500/1000/5000). |
| GET | /fapi/v1/trades | ❌ | Recent trades list. |
| GET | /fapi/v1/historicalTrades | ❌ | Older trades (MARKET_DATA key, weight 5/100). |
| GET | /fapi/v1/aggTrades | ❌ | Compressed/aggregate trades. |
| GET | /fapi/v1/klines | ❌ | Candlesticks (interval 1m…1M, max 1500). |
| GET | /fapi/v1/continuousKlines | ❌ | Continuous-contract klines (pair + contractType). |
| GET | /fapi/v1/indexPriceKlines | ❌ | Index price klines (pair). |
| GET | /fapi/v1/markPriceKlines | ❌ | Mark price klines. |
| GET | /fapi/v1/tradingDayTicker | ❌ | Trading-day ticker stats. |
| GET | /fapi/v1/ticker/bookTicker | ❌ | Best bid/ask (all symbols). |
| GET | /fapi/v2/ticker/bookTicker | ❌ | Best bid/ask v2 (all symbols). |
| GET | /fapi/v1/ticker/price | ❌ | Latest price (single). |
| GET | /fapi/v2/ticker/price | ❌ | Latest price v2 (single or all). |
| GET | /fapi/v1/ticker/24hr | ❌ | 24h price change stats. |
| GET | /fapi/v1/premiumIndex | ❌ | Mark price + index + settle + funding for one or all. |
| GET | /fapi/v1/fundingRate | ❌ | Historical funding rates. |
| GET | /fapi/v1/fundingInfo | ❌ | Funding cap/floor/interval config. |
| GET | /fapi/v1/openInterest | ❌ | Current open interest (single). |
| GET | /fapi/v1/assetIndex | ❌ | Multi-assets-mode asset index. |
| GET | /fapi/v1/indexInfo | ❌ | Composite-index symbol info. |
| GET | /fapi/v1/symbolAdlRisk | ❌ | ADL risk for a symbol. |
| GET | /fapi/v1/constituents | ❌ | Index price constituents. |
| GET | /fapi/v1/insuranceBalance | ❌ | Insurance fund balance (symbol optional). |
| GET | /fapi/v1/rpiDepth | ❌ | RPI order book (risk-protected). |
| GET | /futures/data/basis | ❌ | Basis (spot-futures spread). |
| GET | /futures/data/openInterestHist | ❌ | Open-interest statistics (period). |
| GET | /futures/data/topLongShortAccountRatio | ❌ | Top trader L/S accounts. |
| GET | /futures/data/topLongShortPositionRatio | ❌ | Top trader L/S positions. |
| GET | /futures/data/globalLongShortAccountRatio | ❌ | Global L/S accounts. |
| GET | /futures/data/takerlongshortRatio | ❌ | Taker buy/sell volume ratio. |
| GET | /fapi/v1/tradingSchedule | ❌ | Trading schedule. |
| GET | /fapi/v1/symbolConfig | ✅ | Symbol configuration (signed). |
| GET | /fapi/v1/apiTradingStatus | ✅ | Futures trading-rule indicators (signed). |
| GET | /fapi/v1/feeBurn | ✅ | BNB fee-burn status (signed). |
| GET | /fapi/v1/multiAssetsMargin | ✅ | Multi-assets mode (signed). |
| GET | /fapi/v1/positionSide/dual | ✅ | Position mode (signed). |
| GET | /fapi/v1/leverageBracket | ✅ | Notional/leverage brackets (signed). |
| GET | /fapi/v1/commissionRate | ✅ | User commission rate (signed). |
| GET | /fapi/v1/rateLimit/order | ✅ | User order rate limit (signed). |
| GET | /fapi/v1/delistSchedule | ✅ | Delisting schedule. |

## Account (signed, USER_DATA)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /fapi/v2/account | Account info v2 (balances + positions). |
| GET | /fapi/v3/account | Account info v3 (preferred). |
| GET | /fapi/v2/balance | Balance v2. |
| GET | /fapi/v3/balance | Balance v3 (preferred). |
| GET | /fapi/v2/positionRisk | Position risk v2. |
| GET | /fapi/v3/positionRisk | Position risk v3 (preferred). |
| GET | /fapi/v1/accountConfig | Account configuration. |
| GET | /fapi/v1/income | Income history (TRANSFER, REALIZED_PNL, FUNDING_FEE, COMMISSION,…). |
| GET | /fapi/v1/userTrades | Account trade list. |
| GET | /fapi/v1/positionMargin/history | Isolated position-margin change history. |
| GET | /fapi/v1/order/asyn | Request order-history download id. |
| GET | /fapi/v1/order/asyn/id | Order-history download link by id. |
| GET | /fapi/v1/trade/asyn | Request trade-history download id. |
| GET | /fapi/v1/trade/asyn/id | Trade-history download link by id. |
| GET | /fapi/v1/income/asyn | Request income-history download id. |
| GET | /fapi/v1/income/asyn/id | Income-history download link by id. |
| POST | /fapi/v1/feeBurn | Toggle BNB fee burn. |
| POST | /fapi/v1/multiAssetsMargin | Enable/disable multi-assets mode. |
| POST | /fapi/v1/positionSide/dual | Change position mode (one-way/hedge). |
| POST | /fapi/v1/leverage | Change initial leverage. |
| POST | /fapi/v1/marginType | Change margin type (isolated/cross). |
| POST | /fapi/v1/positionMargin | Modify isolated position margin (type 1/2). |
| POST | /fapi/v1/countdownCancelAll | Auto-cancel all after N ms. |
| DELETE | /fapi/v1/listenKey | Close user data stream. |

## Trading (signed, TRADE)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /fapi/v1/order | New order (LIMIT/MARKET/STOP/STOP_MARKET/TAKE_PROFIT/TAKE_PROFIT_MARKET/TRAILING_STOP_MARKET). |
| POST | /fapi/v1/order/test | Test order validation. |
| POST | /fapi/v1/batchOrders | Place multiple orders (≤5, ≤30/min/symbol). |
| POST | /fapi/v1/algoOrder | New algo order (CONDITIONAL / VP). |
| POST | /fapi/v1/countdownCancelAll | Auto-cancel all open orders (circuit breaker). |
| PUT | /fapi/v1/order | Modify an existing order. |
| PUT | /fapi/v1/batchOrders | Modify multiple orders. |
| DELETE | /fapi/v1/order | Cancel an order. |
| DELETE | /fapi/v1/allOpenOrders | Cancel all open orders for a symbol. |
| DELETE | /fapi/v1/batchOrders | Cancel multiple orders. |
| DELETE | /fapi/v1/algoOrder | Cancel an algo order. |
| DELETE | /fapi/v1/algoOpenOrders | Cancel all open algo orders. |
| GET | /fapi/v1/order | Query an order. |
| GET | /fapi/v1/openOrder | Current open order. |
| GET | /fapi/v1/openOrders | All open orders (one symbol or all). |
| GET | /fapi/v1/allOrders | Historical orders (7-day window). |
| GET | /fapi/v1/algoOrder | Query an algo order. |
| GET | /fapi/v1/openAlgoOrders | Current open algo orders. |
| GET | /fapi/v1/allAlgoOrders | Historical algo orders. |
| GET | /fapi/v1/orderAmendment | Order modify history. |
| GET | /fapi/v1/adlQuantile | Position ADL quantile estimation. |
| GET | /fapi/v1/forceOrders | User force orders (liquidations/ADL). |
| POST | /fapi/v1/stock/contract | Futures TradFi perps contract. |

## User Data Streams

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /fapi/v1/listenKey | Start user data stream (returns `listenKey`). |
| PUT | /fapi/v1/listenKey | Keep-alive (every 30 min recommended). |
| DELETE | /fapi/v1/listenKey | Close user data stream. |

## WebSocket API (request/response, signed where noted)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `session.logon` | — | ✅ | Authenticate session (HMAC/RSA/Ed25519). |
| `session.status` | — | ✅ | Session status. |
| `session.logout` | — | ✅ | Logout. |
| `session.login` | — | ✅ | Login. |
| `depth` | — | ❌ | Order book. |
| `trades.recent` | — | ❌ | Recent trades. |
| `trades.historical` | — | ❌ | Historical trades (MARKET_DATA). |
| `trades.aggregate` | — | ❌ | Aggregate trades. |
| `klines` | — | ❌ | Candlesticks. |
| `avgPrice` | — | ❌ | Rolling average price. |
| `executionRules` | — | ❌ | Price-range rules. |
| `referencePrice` | — | ❌ | Reference price. |
| `referencePriceCalculation` | — | ❌ | Reference price calculation. |
| `ticker.tradingDay` | — | ❌ | Trading-day ticker. |
| `ticker` | — | ❌ | 24h ticker. |
| `ticker.price` | — | ❌ | Symbol price. |
| `ticker.book` | — | ❌ | Best bid/ask. |
| `order.place` | — | ✅ | New order. |
| `order.test` | — | ✅ | Test order. |
| `order.status` | — | ✅ | Order status. |
| `order.cancel` | — | ✅ | Cancel order. |
| `order.cancelReplace` | — | ✅ | Cancel/replace. |
| `order.amend.keepPriority` | — | ✅ | Amend with priority. |
| `openOrders.status` | — | ✅ | Open orders. |
| `openOrders.cancelAll` | — | ✅ | Cancel all open orders. |
| `orderList.place` / OCO/OTO/OTOCO | — | ✅ | Order lists. |
| `sor.order.place` | — | ✅ | SOR smart routing order. |
| `sor.order.test` | — | ✅ | SOR order test. |
| `account.status` | — | ✅ | Account status. |
| `account.balance` | — | ✅ | Account balance. |
| `account.position` (v2) | — | ✅ | Position info. |
| `account.position` (v3) | — | ✅ | Position info. |
| `account.commission` | — | ✅ | Commission rate. |
| `account.rateLimits.orders` | — | ✅ | Order rate limits. |
| `myTrades` | — | ✅ | Account trades. |
| `myPreventedMatches` | — | ✅ | Prevented matches. |
| `myAllocations` | — | ✅ | Allocations. |
| `allOrders` | — | ✅ | All orders. |
| `allOrderLists` | — | ✅ | All order lists. |
| `position.margin` (history) | — | ✅ | Position margin history. |
| `futures.algoOrder.place` | — | ✅ | New algo order. |
| `futures.algoOrder.cancel` | — | ✅ | Cancel algo order. |
| `userDataStream.start` | — | ✅ | Subscribe to user data (WS API). |
| `userDataStream.subscribe` | — | ✅ | Subscribe to user data stream. |
| `userDataStream.unsubscribe` | — | ✅ | Unsubscribe. |
| `userDataStream.ping` | — | ✅ | Ping user data stream. |
