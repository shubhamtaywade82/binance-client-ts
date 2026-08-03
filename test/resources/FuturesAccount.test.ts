import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FuturesAccount } from '../../src/resources/FuturesAccount.js';
import { HttpClient } from '../../src/client/HttpClient.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function account(apiKey = 'k', apiSecret = 's'): FuturesAccount {
  return new FuturesAccount(new HttpClient({ baseURL: 'https://fapi.binance.com', apiKey, apiSecret }));
}

describe('FuturesAccount', () => {
  it('fetches balance', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v2/balance', () =>
        HttpResponse.json([
          {
            accountAlias: 'a', asset: 'USDT', balance: '100', crossWalletBalance: '90',
            crossUnPnl: '1', availableBalance: '91', maxWithdrawAmount: '90', marginAvailable: true, updateTime: 1,
          },
        ]),
      ),
    );

    const balances = await account().balance();
    expect(balances[0]?.balance).toBe(100);
    expect(balances[0]?.asset).toBe('USDT');
  });

  it('fetches position risk', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v2/positionRisk', () =>
        HttpResponse.json([
          {
            symbol: 'BTCUSDT', positionAmt: '0.5', entryPrice: '60000', markPrice: '61000',
            unRealizedProfit: '500', liquidationPrice: '0', leverage: '10', marginType: 'isolated',
            positionSide: 'BOTH', notional: '30500', updateTime: 1,
          },
        ]),
      ),
    );

    const risks = await account().positionRisk('BTCUSDT');
    expect(risks[0]?.unRealizedProfit).toBe(500);
  });

  it('fetches income history', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/income', () =>
        HttpResponse.json([{ incomeType: 'FUNDING_FEE', income: '0.5', asset: 'USDT', time: 1, tranId: 1 }]),
      ),
    );

    const history = await account().incomeHistory({ symbol: 'BTCUSDT' });
    expect(history[0]?.income).toBe(0.5);
  });

  it('fetches commission rate', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/commissionRate', () =>
        HttpResponse.json({ symbol: 'BTCUSDT', makerCommissionRate: '0.0002', takerCommissionRate: '0.0004' }),
      ),
    );

    const rate = await account().commissionRate('BTCUSDT');
    expect(rate.takerCommissionRate).toBe(0.0004);
  });

  it('fetches position mode', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/positionSide/dual', () =>
        HttpResponse.json({ dualSidePosition: true }),
      ),
    );

    const mode = await account().positionMode();
    expect(mode.dualSidePosition).toBe(true);
  });

  it('requests order download', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/order/asyn', () =>
        HttpResponse.json({ downloadId: 'd1' }),
      ),
    );

    const res = await account().requestOrderDownload({ symbol: 'BTCUSDT' });
    expect(res.downloadId).toBe('d1');
  });
});
