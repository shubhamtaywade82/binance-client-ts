import { FuturesData } from '../resources/FuturesData.js';
import { FuturesMarket } from '../resources/FuturesMarket.js';
import { SpotMarket } from '../resources/SpotMarket.js';
import { FuturesMarketWS } from '../ws/FuturesMarketWS.js';
import { SpotMarketWS } from '../ws/SpotMarketWS.js';

export class BinanceClient {
  readonly spot: { market: SpotMarket; ws: SpotMarketWS };
  readonly futures: { market: FuturesMarket; data: FuturesData; ws: FuturesMarketWS };

  constructor() {
    this.spot = { market: new SpotMarket(), ws: new SpotMarketWS() };
    this.futures = { market: new FuturesMarket(), data: new FuturesData(), ws: new FuturesMarketWS() };
  }
}
