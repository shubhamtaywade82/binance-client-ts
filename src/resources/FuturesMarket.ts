import { HttpClient } from '../client/HttpClient.js';
import { MarketDataBase } from './MarketDataBase.js';

export class FuturesMarket extends MarketDataBase {
  constructor() {
    super(new HttpClient({ baseURL: 'https://fapi.binance.com/fapi/v1' }));
  }
}
