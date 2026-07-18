import { describe, expect, it } from 'vitest';
import { FuturesMarketWS } from '../../src/ws/FuturesMarketWS.js';

describe('FuturesMarketWS', () => {
  it('builds correct stream names', () => {
    const ws = new FuturesMarketWS();
    expect(ws.kline('SOLUSDT', '5m')).toBe('solusdt@kline_5m');
    expect(ws.aggTrade('SOLUSDT')).toBe('solusdt@aggTrade');
    expect(ws.trade('SOLUSDT')).toBe('solusdt@trade');
    expect(ws.depth('SOLUSDT')).toBe('solusdt@depth');
    expect(ws.ticker('SOLUSDT')).toBe('solusdt@ticker');
    expect(ws.markPrice('SOLUSDT')).toBe('solusdt@markPrice');
    expect(ws.markPrice('SOLUSDT', '1s')).toBe('solusdt@markPrice@1s');
    expect(ws.bookTicker('SOLUSDT')).toBe('solusdt@bookTicker');
    ws.close();
  });
});
