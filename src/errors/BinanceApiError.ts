export class BinanceApiError extends Error {
  readonly code: number;
  readonly status: number;

  constructor(message: string, code: number, status: number) {
    super(message);
    this.name = 'BinanceApiError';
    this.code = code;
    this.status = status;
  }
}
