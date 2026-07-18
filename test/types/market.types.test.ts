import { describe, expect, it } from 'vitest';
import {
  AggTradeSchema,
  AvgPriceSchema,
  BookTickerSchema,
  DepthSnapshotSchema,
  ExchangeInfoSchema,
  KlineSchema,
  Ticker24hrSchema,
  TickerPriceSchema,
  TradeSchema,
} from '../../src/types/market.types.js';

describe('market.types', () => {
  it('parses a raw kline tuple into a typed Kline', () => {
    const raw = [
      1499040000000, '0.01634790', '0.80000000', '0.01575800', '0.01577100',
      '148976.11427815', 1499644799999, '2434.19055334', 308,
      '1756.87402397', '28.46694368', '17928899.62484339',
    ];
    const kline = KlineSchema.parse(raw);
    expect(kline).toEqual({
      openTime: 1499040000000,
      open: 0.0163479,
      high: 0.8,
      low: 0.015758,
      close: 0.015771,
      volume: 148976.11427815,
      closeTime: 1499644799999,
      quoteAssetVolume: 2434.19055334,
      trades: 308,
      takerBuyBaseVolume: 1756.87402397,
      takerBuyQuoteVolume: 28.46694368,
    });
  });

  it('parses ticker/price, coercing price to a number', () => {
    const parsed = TickerPriceSchema.parse({ symbol: 'BTCUSDT', price: '45000.12' });
    expect(parsed.price).toBe(45000.12);
  });

  it('parses ticker/24hr', () => {
    const parsed = Ticker24hrSchema.parse({
      symbol: 'BTCUSDT', priceChange: '100', priceChangePercent: '1.5',
      weightedAvgPrice: '44950', lastPrice: '45000', lastQty: '0.01',
      openPrice: '44900', highPrice: '45500', lowPrice: '44800',
      volume: '1000', quoteVolume: '45000000', openTime: 1, closeTime: 2,
      firstId: 1, lastId: 100, count: 100,
    });
    expect(parsed.lastPrice).toBe(45000);
  });

  it('parses bookTicker', () => {
    const parsed = BookTickerSchema.parse({
      symbol: 'BTCUSDT', bidPrice: '44999', bidQty: '1', askPrice: '45001', askQty: '1',
    });
    expect(parsed.bidPrice).toBe(44999);
  });

  it('parses a depth snapshot into numeric price/qty levels', () => {
    const parsed = DepthSnapshotSchema.parse({
      lastUpdateId: 1,
      bids: [['44999.00', '1.5']],
      asks: [['45001.00', '2.0']],
    });
    expect(parsed.bids[0]).toEqual({ price: 44999, qty: 1.5 });
  });

  it('parses a trade', () => {
    const parsed = TradeSchema.parse({
      id: 1, price: '45000', qty: '0.01', quoteQty: '450', time: 1, isBuyerMaker: true,
    });
    expect(parsed.price).toBe(45000);
  });

  it('parses an aggTrade', () => {
    const parsed = AggTradeSchema.parse({
      a: 1, p: '45000', q: '0.01', f: 1, l: 1, T: 1, m: false,
    });
    expect(parsed.p).toBe(45000);
  });

  it('parses avgPrice', () => {
    const parsed = AvgPriceSchema.parse({ mins: 5, price: '45000' });
    expect(parsed.price).toBe(45000);
  });

  it('parses exchangeInfo, keeping unknown symbol fields via passthrough', () => {
    const parsed = ExchangeInfoSchema.parse({
      timezone: 'UTC',
      serverTime: 1,
      symbols: [{ symbol: 'BTCUSDT', status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'USDT', filters: [] }],
    });
    expect(parsed.symbols[0]?.symbol).toBe('BTCUSDT');
  });
});
