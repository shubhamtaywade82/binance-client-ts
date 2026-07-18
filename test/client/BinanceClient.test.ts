import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BinanceClient } from '../../src/client/BinanceClient.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('BinanceClient', () => {
  it('fetches spot klines through client.spot.market', async () => {
    server.use(
      http.get('https://api.binance.com/api/v3/klines', () =>
        HttpResponse.json([[1, '1', '2', '0.5', '1.5', '10', 2, '15', 3, '5', '7.5', '0']]),
      ),
    );

    const client = new BinanceClient();
    const klines = await client.spot.market.klines('SOLUSDT', '15m');
    expect(klines[0]?.close).toBe(1.5);
    client.futures.ws.close();
    client.spot.ws.close();
  });

  it('fetches futures funding rate through client.futures.data', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/fundingRate', () =>
        HttpResponse.json([{ symbol: 'XRPUSDT', fundingTime: 1, fundingRate: '0.0002' }]),
      ),
    );

    const client = new BinanceClient();
    const history = await client.futures.data.fundingRateHistory('XRPUSDT');
    expect(history[0]?.fundingRate).toBe(0.0002);
    client.futures.ws.close();
    client.spot.ws.close();
  });
});
