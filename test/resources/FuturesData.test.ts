import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FuturesData } from '../../src/resources/FuturesData.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('FuturesData', () => {
  it('fetches funding rate history', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/fundingRate', () =>
        HttpResponse.json([{ symbol: 'ETHUSDT', fundingTime: 1, fundingRate: '0.0001' }]),
      ),
    );

    const data = new FuturesData();
    const history = await data.fundingRateHistory('ETHUSDT', { limit: 1 });
    expect(history[0]?.fundingRate).toBe(0.0001);
  });

  it('fetches premiumIndex (mark price)', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/premiumIndex', () =>
        HttpResponse.json({
          symbol: 'ETHUSDT', markPrice: '2500', indexPrice: '2499', estimatedSettlePrice: '2500',
          lastFundingRate: '0.0001', nextFundingTime: 1, interestRate: '0.0001', time: 1,
        }),
      ),
    );

    const data = new FuturesData();
    const premium = await data.premiumIndex('ETHUSDT');
    expect(premium.markPrice).toBe(2500);
  });

  it('fetches openInterestHist from the /futures/data base', async () => {
    server.use(
      http.get('https://fapi.binance.com/futures/data/openInterestHist', () =>
        HttpResponse.json([
          { symbol: 'ETHUSDT', sumOpenInterest: '1000', sumOpenInterestValue: '2500000', timestamp: 1 },
        ]),
      ),
    );

    const data = new FuturesData();
    const hist = await data.openInterestHist('ETHUSDT', '5m');
    expect(hist[0]?.sumOpenInterest).toBe(1000);
  });

  it('fetches globalLongShortAccountRatio', async () => {
    server.use(
      http.get('https://fapi.binance.com/futures/data/globalLongShortAccountRatio', () =>
        HttpResponse.json([
          { symbol: 'ETHUSDT', longShortRatio: '1.5', longAccount: '0.6', shortAccount: '0.4', timestamp: 1 },
        ]),
      ),
    );

    const data = new FuturesData();
    const ratio = await data.globalLongShortAccountRatio('ETHUSDT', '5m');
    expect(ratio[0]?.longShortRatio).toBe(1.5);
  });
});
