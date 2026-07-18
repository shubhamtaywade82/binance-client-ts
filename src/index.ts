export const VERSION = '0.1.0';

export { BinanceClient } from './client/BinanceClient.js';
export { HttpClient } from './client/HttpClient.js';
export type { HttpClientOptions } from './client/HttpClient.js';

export { MarketDataBase } from './resources/MarketDataBase.js';
export { SpotMarket } from './resources/SpotMarket.js';
export { FuturesMarket } from './resources/FuturesMarket.js';
export { FuturesData } from './resources/FuturesData.js';

export { BaseWS } from './ws/BaseWS.js';
export type { BaseWSOptions } from './ws/BaseWS.js';
export { SpotMarketWS } from './ws/SpotMarketWS.js';
export { FuturesMarketWS } from './ws/FuturesMarketWS.js';

export * from './types/market.types.js';
export * from './types/futures.types.js';
export * from './types/ws.types.js';
export * from './errors/index.js';
