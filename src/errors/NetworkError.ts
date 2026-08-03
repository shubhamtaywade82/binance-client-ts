import { BinanceError } from './BinanceError.js';

export class NetworkError extends BinanceError {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}
