import { BinanceApiError } from './BinanceApiError.js';

export class RateLimitError extends BinanceApiError {
  readonly retryAfterMs?: number;

  constructor(message: string, code: number, status: number, retryAfterMs?: number) {
    super(message, code, status);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}
