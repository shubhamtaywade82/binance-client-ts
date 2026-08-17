import { HttpClient } from '../client/HttpClient.js';
import { MarketDataBase } from './MarketDataBase.js';
import { AvgPrice, AvgPriceSchema, Kline, KlineInterval, KlinesResponseSchema } from '../types/market.types.js';

export class SpotMarket extends MarketDataBase {
  constructor(http?: HttpClient) {
    super(http ?? new HttpClient({ baseURL: 'https://api.binance.com/api/v3' }));
  }

  async avgPrice(symbol: string): Promise<AvgPrice> {
    return AvgPriceSchema.parse(await this.http.get('/avgPrice', { symbol }));
  }

  /** Optimized klines endpoint (`/uiKlines`) with the same response shape as `/klines`. */
  async uiKlines(
    symbol: string,
    interval: KlineInterval,
    options?: { startTime?: number; endTime?: number; limit?: number },
  ): Promise<Kline[]> {
    const data = await this.http.get('/uiKlines', {
      symbol,
      interval,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit ?? 500,
    });
    return KlinesResponseSchema.parse(data);
  }

  /** Rolling window ticker (`/ticker`). Omit `symbol` for all symbols. */
  async rollingWindowTicker(
    symbol?: string,
    windowSize?: '1d' | '7d' | '30d',
  ): Promise<unknown[] | unknown> {
    const params = { symbol, windowSize };
    return this.http.get('/ticker', params);
  }

  /** Trading-day ticker (`/ticker/tradingDay`). Omit `symbol` for all symbols. */
  async tradingDayTicker(
    symbol?: string,
    options?: { timeZone?: string; type?: 'FULL' | 'MINI' },
  ): Promise<unknown[] | unknown> {
    return this.http.get('/ticker/tradingDay', { symbol, ...options });
  }
}
