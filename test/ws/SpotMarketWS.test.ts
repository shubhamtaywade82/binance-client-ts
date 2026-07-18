import { describe, expect, it } from 'vitest';
import { SpotMarketWS } from '../../src/ws/SpotMarketWS.js';

describe('SpotMarketWS', () => {
  it('builds correct stream names', () => {
    const ws = new SpotMarketWS();
    expect(ws.kline('BTCUSDT', '15m')).toBe('btcusdt@kline_15m');
    expect(ws.aggTrade('BTCUSDT')).toBe('btcusdt@aggTrade');
    expect(ws.trade('BTCUSDT')).toBe('btcusdt@trade');
    expect(ws.depth('BTCUSDT')).toBe('btcusdt@depth');
    expect(ws.ticker('BTCUSDT')).toBe('btcusdt@ticker');
    expect(ws.bookTicker('BTCUSDT')).toBe('btcusdt@bookTicker');
    ws.close();
  });
});
