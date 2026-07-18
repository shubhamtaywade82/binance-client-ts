import { BaseWS } from './BaseWS.js';
import type { KlineInterval } from '../types/market.types.js';

export class FuturesMarketWS extends BaseWS {
  constructor() {
    super({ baseStreamUrl: 'wss://fstream.binance.com/stream' });
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

  markPrice(symbol: string, updateSpeed?: '1s'): string {
    return `${symbol.toLowerCase()}@markPrice${updateSpeed === '1s' ? '@1s' : ''}`;
  }

  bookTicker(symbol: string): string {
    return `${symbol.toLowerCase()}@bookTicker`;
  }
}
