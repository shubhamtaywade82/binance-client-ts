import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FuturesMarket } from '../../src/resources/FuturesMarket.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('FuturesMarket', () => {
  it('fetches and parses klines from the fapi base URL', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/klines', () =>
        HttpResponse.json([
          [1, '1', '2', '0.5', '1.5', '10', 2, '15', 3, '5', '7.5', '0'],
        ]),
      ),
    );

    const market = new FuturesMarket();
    const klines = await market.klines('SOLUSDT', '15m');
    expect(klines[0]?.close).toBe(1.5);
  });

  it('fetches ticker24hr', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/ticker/24hr', () =>
        HttpResponse.json({
          symbol: 'SOLUSDT', priceChange: '1', priceChangePercent: '1',
          weightedAvgPrice: '100', lastPrice: '101', lastQty: '1',
          openPrice: '100', highPrice: '102', lowPrice: '99',
          volume: '1000', quoteVolume: '100000', openTime: 1, closeTime: 2,
          firstId: 1, lastId: 2, count: 2,
        }),
      ),
    );

    const market = new FuturesMarket();
    const ticker = await market.ticker24hr('SOLUSDT');
    expect(ticker.lastPrice).toBe(101);
  });
});
