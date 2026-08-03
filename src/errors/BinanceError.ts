export class BinanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BinanceError';
  }
}
