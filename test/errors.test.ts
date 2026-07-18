import { describe, expect, it } from 'vitest';
import { BinanceApiError, NetworkError, RateLimitError } from '../src/errors/index.js';

describe('errors', () => {
  it('BinanceApiError carries code and status', () => {
    const err = new BinanceApiError('Invalid symbol.', -1121, 400);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Invalid symbol.');
    expect(err.code).toBe(-1121);
    expect(err.status).toBe(400);
    expect(err.name).toBe('BinanceApiError');
  });

  it('RateLimitError is a BinanceApiError with optional retryAfterMs', () => {
    const err = new RateLimitError('Too many requests', -1003, 429, 1000);
    expect(err).toBeInstanceOf(BinanceApiError);
    expect(err.retryAfterMs).toBe(1000);
    expect(err.name).toBe('RateLimitError');
  });

  it('NetworkError wraps the original cause', () => {
    const original = new Error('ECONNRESET');
    const err = new NetworkError('Network failure', original);
    expect(err).toBeInstanceOf(Error);
    expect(err.cause).toBe(original);
    expect(err.name).toBe('NetworkError');
  });
});
