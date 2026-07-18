import type { HttpClient } from '../client/HttpClient.js';
import {
  AggTrade,
  AggTradesResponseSchema,
  BookTicker,
  BookTickerSchema,
  DepthSnapshot,
  DepthSnapshotSchema,
  ExchangeInfo,
  ExchangeInfoSchema,
  Kline,
  KlineInterval,
  KlinesResponseSchema,
  Ticker24hr,
  Ticker24hrSchema,
  TickerPrice,
  TickerPriceSchema,
  Trade,
  TradesResponseSchema,
} from '../types/market.types.js';

export class MarketDataBase {
  constructor(protected readonly http: HttpClient) {}

  async exchangeInfo(): Promise<ExchangeInfo> {
    return ExchangeInfoSchema.parse(await this.http.get('/exchangeInfo'));
  }

  async klines(
    symbol: string,
    interval: KlineInterval,
    options?: { startTime?: number; endTime?: number; limit?: number },
  ): Promise<Kline[]> {
    const data = await this.http.get('/klines', {
      symbol,
      interval,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit ?? 500,
    });
    return KlinesResponseSchema.parse(data);
  }

  async tickerPrice(symbol: string): Promise<TickerPrice> {
    return TickerPriceSchema.parse(await this.http.get('/ticker/price', { symbol }));
  }

  async ticker24hr(symbol: string): Promise<Ticker24hr> {
    return Ticker24hrSchema.parse(await this.http.get('/ticker/24hr', { symbol }));
  }

  async bookTicker(symbol: string): Promise<BookTicker> {
    return BookTickerSchema.parse(await this.http.get('/ticker/bookTicker', { symbol }));
  }

  async depth(symbol: string, limit = 100): Promise<DepthSnapshot> {
    return DepthSnapshotSchema.parse(await this.http.get('/depth', { symbol, limit }));
  }

  async trades(symbol: string, limit = 500): Promise<Trade[]> {
    return TradesResponseSchema.parse(await this.http.get('/trades', { symbol, limit }));
  }

  async aggTrades(
    symbol: string,
    options?: { startTime?: number; endTime?: number; limit?: number },
  ): Promise<AggTrade[]> {
    const data = await this.http.get('/aggTrades', {
      symbol,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit ?? 500,
    });
    return AggTradesResponseSchema.parse(data);
  }
}
