import { describe, expect, it } from 'vitest';
import {
  floorToStep,
  formatToDecimals,
  roundToStep,
  stepDecimals,
  symbolRulesFrom,
} from '../../src/types/filters.types.js';
import { ExchangeSymbolSchema } from '../../src/types/market.types.js';

const BTCUSDT = ExchangeSymbolSchema.parse({
  symbol: 'BTCUSDT',
  status: 'TRADING',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  pricePrecision: 2,
  quantityPrecision: 3,
  filters: [
    { filterType: 'PRICE_FILTER', minPrice: '556.80', maxPrice: '4529764', tickSize: '0.10' },
    { filterType: 'LOT_SIZE', minQty: '0.001', maxQty: '1000', stepSize: '0.001' },
    { filterType: 'MARKET_LOT_SIZE', minQty: '0.001', maxQty: '120', stepSize: '0.001' },
    { filterType: 'MIN_NOTIONAL', notional: '100' },
  ],
});

describe('stepDecimals', () => {
  it('derives decimals from a padded step string', () => {
    expect(stepDecimals('0.00100000')).toBe(3);
    expect(stepDecimals('0.10')).toBe(1);
    expect(stepDecimals('1')).toBe(0);
    expect(stepDecimals('1.0')).toBe(0);
  });
});

describe('floorToStep', () => {
  it('rounds a quantity down onto the step', () => {
    expect(floorToStep(0.0037, 0.001)).toBe(0.003);
    expect(floorToStep(1.9999, 0.001)).toBe(1.999);
  });

  it('absorbs binary-float error rather than dropping a whole step', () => {
    // 0.3 / 0.1 is 2.9999999999999996 in IEEE-754; a naive floor yields 0.2.
    expect(floorToStep(0.3, 0.1)).toBe(0.3);
    expect(floorToStep(0.7, 0.1)).toBe(0.7);
  });

  it('never rounds up, so sizing cannot exceed the requested risk', () => {
    expect(floorToStep(0.0019999, 0.001)).toBe(0.001);
  });
});

describe('roundToStep', () => {
  it('rounds a price to the nearest tick', () => {
    expect(roundToStep(60000.04, 0.1)).toBe(60000);
    expect(roundToStep(60000.06, 0.1)).toBe(60000.1);
  });
});

describe('formatToDecimals', () => {
  it('emits a fixed-precision string safe to send to Binance', () => {
    expect(formatToDecimals(0.1 + 0.2, 3)).toBe('0.300');
    expect(formatToDecimals(60000, 1)).toBe('60000.0');
  });
});

describe('symbolRulesFrom', () => {
  it('flattens exchangeInfo filters into typed rules', () => {
    const rules = symbolRulesFrom(BTCUSDT);
    expect(rules.tickSize).toBe(0.1);
    expect(rules.tickDecimals).toBe(1);
    expect(rules.stepSize).toBe(0.001);
    expect(rules.stepDecimals).toBe(3);
    expect(rules.minQty).toBe(0.001);
    expect(rules.maxQty).toBe(1000);
    expect(rules.marketMaxQty).toBe(120);
    // USD-M futures spells this `notional`, not spot's `minNotional`.
    expect(rules.minNotional).toBe(100);
  });

  it('falls back to precision fields when filters are absent', () => {
    const sparse = ExchangeSymbolSchema.parse({
      symbol: 'NEWUSDT',
      status: 'TRADING',
      baseAsset: 'NEW',
      quoteAsset: 'USDT',
      pricePrecision: 4,
      quantityPrecision: 1,
    });
    const rules = symbolRulesFrom(sparse);
    expect(rules.tickSize).toBeCloseTo(0.0001);
    expect(rules.stepSize).toBeCloseTo(0.1);
    expect(rules.minNotional).toBe(0);
  });
});
