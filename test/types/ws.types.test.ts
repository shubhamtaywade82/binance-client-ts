import { describe, expect, it } from 'vitest';
import { parseWsPayload } from '../../src/types/ws.types.js';

describe('ws.types', () => {
  it('parses a kline stream payload', () => {
    const payload = parseWsPayload('btcusdt@kline_1m', {
      e: 'kline', E: 1, s: 'BTCUSDT',
      k: { t: 1, T: 2, s: 'BTCUSDT', i: '1m', o: '1', c: '2', h: '3', l: '0.5', v: '10', n: 5, x: false, q: '20', V: '5', Q: '10' },
    });
    expect(payload).toMatchObject({ e: 'kline', k: { o: 1, c: 2 } });
  });

  it('parses an aggTrade stream payload', () => {
    const payload = parseWsPayload('ethusdt@aggTrade', {
      e: 'aggTrade', E: 1, s: 'ETHUSDT', a: 1, p: '2500', q: '1', f: 1, l: 1, T: 1, m: false,
    });
    expect(payload).toMatchObject({ e: 'aggTrade', p: 2500 });
  });

  it('parses a markPrice stream payload (futures only)', () => {
    const payload = parseWsPayload('ethusdt@markPrice@1s', {
      e: 'markPriceUpdate', E: 1, s: 'ETHUSDT', p: '2500', i: '2499', P: '2500', r: '0.0001', T: 1,
    });
    expect(payload).toMatchObject({ e: 'markPriceUpdate', p: 2500 });
  });

  it('throws on an unrecognized stream name', () => {
    expect(() => parseWsPayload('ethusdt@unknownStream', {})).toThrow(/Unknown WS stream/);
  });
});
