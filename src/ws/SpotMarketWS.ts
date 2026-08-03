import { BaseWS } from './BaseWS.js';
import type { KlineInterval } from '../types/market.types.js';

export class SpotMarketWS extends BaseWS {
  constructor(baseStreamUrl = 'wss://stream.binance.com:9443/stream') {
    super({ baseStreamUrl });
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

  depth(symbol: string, level: 5 | 10 | 20 = 20): string {
    return `${symbol.toLowerCase()}@depth${level}`;
  }

  ticker(symbol: string): string {
    return `${symbol.toLowerCase()}@ticker`;
  }

  miniTicker(symbol: string): string {
    return `${symbol.toLowerCase()}@miniTicker`;
  }

  allMarketTickers(): string {
    return '!ticker@arr';
  }

  allMiniTickers(): string {
    return '!miniTicker@arr';
  }

  bookTicker(symbol: string): string {
    return `${symbol.toLowerCase()}@bookTicker`;
  }

  allBookTickers(): string {
    return '!bookTicker';
  }
}
