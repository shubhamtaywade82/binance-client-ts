import { BaseWS } from './BaseWS.js';
import type { KlineInterval } from '../types/market.types.js';

export class SpotMarketWS extends BaseWS {
  constructor() {
    super({ baseStreamUrl: 'wss://stream.binance.com:9443/stream' });
  }

  kline(symbol: string, interval: KlineInterval): string {
    return `${symbol.toLowerCase()}@kline_${interval}`;
  }

  aggTrade(symbol: string): string {
    return `${symbol.toLowerCase()}@aggTrade`;
  }

  trade(symbol: string): string {
    return `${symbol.toLowerCase()}@trade`;
  }

  depth(symbol: string): string {
    return `${symbol.toLowerCase()}@depth`;
  }

  ticker(symbol: string): string {
    return `${symbol.toLowerCase()}@ticker`;
  }

  bookTicker(symbol: string): string {
    return `${symbol.toLowerCase()}@bookTicker`;
  }
}
