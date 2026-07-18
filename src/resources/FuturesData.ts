import { HttpClient } from '../client/HttpClient.js';
import {
  FundingRate,
  FundingRateHistorySchema,
  LongShortRatioEntry,
  LongShortRatioSchema,
  OpenInterest,
  OpenInterestHistEntry,
  OpenInterestHistSchema,
  OpenInterestSchema,
  PremiumIndex,
  PremiumIndexSchema,
  TakerLongShortRatioEntry,
  TakerLongShortRatioSchema,
} from '../types/futures.types.js';

export class FuturesData {
  private readonly http: HttpClient;
  private readonly dataHttp: HttpClient;

  constructor() {
    this.http = new HttpClient({ baseURL: 'https://fapi.binance.com/fapi/v1' });
    this.dataHttp = new HttpClient({ baseURL: 'https://fapi.binance.com/futures/data' });
  }

  async fundingRateHistory(
    symbol: string,
    options?: { startTime?: number; endTime?: number; limit?: number },
  ): Promise<FundingRate[]> {
    const data = await this.http.get('/fundingRate', {
      symbol,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit ?? 100,
    });
    return FundingRateHistorySchema.parse(data);
  }

  async premiumIndex(symbol: string): Promise<PremiumIndex> {
    return PremiumIndexSchema.parse(await this.http.get('/premiumIndex', { symbol }));
  }

  async openInterest(symbol: string): Promise<OpenInterest> {
    return OpenInterestSchema.parse(await this.http.get('/openInterest', { symbol }));
  }

  async openInterestHist(symbol: string, period: string, limit = 30): Promise<OpenInterestHistEntry[]> {
    const data = await this.dataHttp.get('/openInterestHist', { symbol, period, limit });
    return OpenInterestHistSchema.parse(data);
  }

  async topLongShortAccountRatio(symbol: string, period: string, limit = 30): Promise<LongShortRatioEntry[]> {
    const data = await this.dataHttp.get('/topLongShortAccountRatio', { symbol, period, limit });
    return LongShortRatioSchema.parse(data);
  }

  async topLongShortPositionRatio(symbol: string, period: string, limit = 30): Promise<LongShortRatioEntry[]> {
    const data = await this.dataHttp.get('/topLongShortPositionRatio', { symbol, period, limit });
    return LongShortRatioSchema.parse(data);
  }

  async globalLongShortAccountRatio(symbol: string, period: string, limit = 30): Promise<LongShortRatioEntry[]> {
    const data = await this.dataHttp.get('/globalLongShortAccountRatio', { symbol, period, limit });
    return LongShortRatioSchema.parse(data);
  }

  async takerLongShortRatio(symbol: string, period: string, limit = 30): Promise<TakerLongShortRatioEntry[]> {
    const data = await this.dataHttp.get('/takerlongshortRatio', { symbol, period, limit });
    return TakerLongShortRatioSchema.parse(data);
  }
}
