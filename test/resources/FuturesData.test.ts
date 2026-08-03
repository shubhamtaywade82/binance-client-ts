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

  it('fetches funding info', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/fundingInfo', () =>
        HttpResponse.json([
          { symbol: 'BTCUSDT', adjustedFundingRateCap: '0.05', adjustedFundingRateFloor: '-0.05', fundingIntervalHours: 8, discretion: false },
        ]),
      ),
    );

    const data = new FuturesData();
    const info = await data.fundingInfo();
    expect((info[0] as { symbol: string }).symbol).toBe('BTCUSDT');
  });

  it('fetches asset index', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/assetIndex', () =>
        HttpResponse.json([{ symbol: 'BTCUSD', time: 1, index: '60000', bidBuffer: '1', askBuffer: '1' }]),
      ),
    );

    const data = new FuturesData();
    const idx = await data.assetIndex('BTCUSD');
    expect((idx as { symbol: string }[])[0]?.symbol).toBe('BTCUSD');
  });

  it('fetches basis history from /futures/data', async () => {
    server.use(
      http.get('https://fapi.binance.com/futures/data/basis', () =>
        HttpResponse.json([{ symbol: 'BTCUSDT', pair: 'BTCUSDT', period: '1h', basisRate: '0.01', time: 1 }]),
      ),
    );

    const data = new FuturesData();
    const basis = await data.basis('BTCUSDT', '1h');
    expect((basis[0] as { basisRate: string }).basisRate).toBe('0.01');
  });

  it('fetches force orders', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/forceOrders', () =>
        HttpResponse.json([{ orderId: 1, symbol: 'BTCUSDT', status: 'FILLED' }]),
      ),
    );

    const data = new FuturesData();
    const orders = await data.forceOrders({ symbol: 'BTCUSDT' });
    expect((orders[0] as { orderId: number }).orderId).toBe(1);
  });

  it('fetches delist schedule', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/delistSchedule', () =>
        HttpResponse.json([{ symbol: 'OLDUSDT', deliveryDate: 1 }]),
      ),
    );

    const data = new FuturesData();
    const schedule = await data.delistSchedule('OLDUSDT');
    expect((schedule[0] as { symbol: string }).symbol).toBe('OLDUSDT');
  });

  it('fetches adlQuantile with signed auth', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/adlQuantile', () =>
        HttpResponse.json([{ symbol: 'BTCUSDT', adlQuantile: { LONG: 1, SHORT: 2 } }]),
      ),
    );

    const data = new FuturesData({ apiKey: 'k', apiSecret: 's' });
    const quantile = await data.adlQuantile('BTCUSDT');
    expect((quantile[0] as { symbol: string }).symbol).toBe('BTCUSDT');
  });
});
