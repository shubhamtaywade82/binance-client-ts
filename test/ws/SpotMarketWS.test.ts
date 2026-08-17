import { describe, expect, it } from 'vitest';
import { SpotMarketWS } from '../../src/ws/SpotMarketWS.js';

describe('SpotMarketWS', () => {
  it('builds correct stream names', () => {
    const ws = new SpotMarketWS();
    expect(ws.kline('BTCUSDT', '15m')).toBe('btcusdt@kline_15m');
    expect(ws.aggTrade('BTCUSDT')).toBe('btcusdt@aggTrade');
    expect(ws.trade('BTCUSDT')).toBe('btcusdt@trade');
    expect(ws.depth('BTCUSDT')).toBe('btcusdt@depth20');
    expect(ws.depth('BTCUSDT', 5)).toBe('btcusdt@depth5');
    expect(ws.depthDiff('BTCUSDT')).toBe('btcusdt@depth');
    expect(ws.depthDiffSpeed('BTCUSDT', '100ms')).toBe('btcusdt@depth@100ms');
    expect(ws.avgPrice('BTCUSDT')).toBe('btcusdt@avgPrice');
    expect(ws.ticker('BTCUSDT')).toBe('btcusdt@ticker');
    expect(ws.rollingWindowTicker('BTCUSDT', '1h')).toBe('btcusdt@ticker_1h');
    expect(ws.allRollingWindowTickers('1d')).toBe('!ticker_1d@arr');
    expect(ws.miniTicker('BTCUSDT')).toBe('btcusdt@miniTicker');
    expect(ws.bookTicker('BTCUSDT')).toBe('btcusdt@bookTicker');
    ws.close();
  });
});
