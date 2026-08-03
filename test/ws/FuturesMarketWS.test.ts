import { describe, expect, it } from 'vitest';
import { FuturesMarketWS } from '../../src/ws/FuturesMarketWS.js';

describe('FuturesMarketWS', () => {
  it('builds correct stream names', () => {
    const ws = new FuturesMarketWS();
    expect(ws.kline('SOLUSDT', '5m')).toBe('solusdt@kline_5m');
    expect(ws.aggTrade('SOLUSDT')).toBe('solusdt@aggTrade');
    expect(ws.trade('SOLUSDT')).toBe('solusdt@trade');
    expect(ws.depth('SOLUSDT')).toBe('solusdt@depth20');
    expect(ws.depth('SOLUSDT', 5)).toBe('solusdt@depth5');
    expect(ws.ticker('SOLUSDT')).toBe('solusdt@ticker');
    expect(ws.continuousKline('SOLUSDT', 'perpetual', '5m')).toBe('solusdt@continuousKline_perpetual_5m');
    expect(ws.rollingWindowTicker('SOLUSDT', '4h')).toBe('solusdt@ticker_4h');
    expect(ws.allMarketTickers()).toBe('!ticker@arr');
    expect(ws.allBookTickers()).toBe('!bookTicker');
    expect(ws.markPrice('SOLUSDT')).toBe('solusdt@markPrice@3s');
    expect(ws.markPrice('SOLUSDT', '1s')).toBe('solusdt@markPrice@1s');
    expect(ws.allMarkPrices()).toBe('!markPrice@arr');
    expect(ws.liquidationOrder('SOLUSDT')).toBe('solusdt@forceOrder');
    expect(ws.allLiquidationOrders()).toBe('!forceOrder@arr');
    expect(ws.compositeIndex('SOLUSDT')).toBe('solusdt@compositeIndex');
    expect(ws.assetIndex('SOLUSDT')).toBe('solusdt@assetIndex');
    expect(ws.allAssetIndices()).toBe('!assetIndex@arr');
    expect(ws.bookTicker('SOLUSDT')).toBe('solusdt@bookTicker');
    ws.close();
  });
});
