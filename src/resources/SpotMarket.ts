import { HttpClient } from '../client/HttpClient.js';
import { MarketDataBase } from './MarketDataBase.js';
import { AvgPrice, AvgPriceSchema } from '../types/market.types.js';

export class SpotMarket extends MarketDataBase {
  constructor() {
    super(new HttpClient({ baseURL: 'https://api.binance.com/api/v3' }));
  }

  async avgPrice(symbol: string): Promise<AvgPrice> {
    return AvgPriceSchema.parse(await this.http.get('/avgPrice', { symbol }));
  }
}
