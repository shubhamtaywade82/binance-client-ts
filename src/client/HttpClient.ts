import axios, { type AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';
import { BinanceApiError, NetworkError, RateLimitError } from '../errors/index.js';

export interface HttpClientOptions {
  baseURL: string;
  timeoutMs?: number;
  maxRetries?: number;
  minTimeMs?: number;
}

interface BinanceErrorBody {
  code?: number;
  msg?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HttpClient {
  private readonly axios: AxiosInstance;
  private readonly limiter: Bottleneck;
  private readonly maxRetries: number;

  constructor(options: HttpClientOptions) {
    this.axios = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeoutMs ?? 10_000,
    });
    this.limiter = new Bottleneck({ minTime: options.minTimeMs ?? 50 });
    this.maxRetries = options.maxRetries ?? 3;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.limiter.schedule(() => this.requestWithRetry<T>(path, params, 0));
  }

  private async requestWithRetry<T>(
    path: string,
    params: Record<string, unknown> | undefined,
    attempt: number,
  ): Promise<T> {
    try {
      const res = await this.axios.get<T>(path, { params });
      return res.data;
    } catch (err) {
      if (!axios.isAxiosError(err)) {
        throw new NetworkError('Unexpected error calling Binance API', err);
      }

      const status = err.response?.status;
      const body = err.response?.data as BinanceErrorBody | undefined;

      if ((status === 429 || status === 418) && attempt < this.maxRetries) {
        const retryAfterHeader = err.response?.headers['retry-after'];
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 2 ** attempt * 1000;
        await sleep(retryAfterMs);
        return this.requestWithRetry<T>(path, params, attempt + 1);
      }

      if (status === 429 || status === 418) {
        throw new RateLimitError(body?.msg ?? 'Binance rate limit exceeded', body?.code ?? -1, status);
      }

      if (status && body) {
        throw new BinanceApiError(body.msg ?? 'Binance API error', body.code ?? -1, status);
      }

      throw new NetworkError(err.message, err);
    }
  }
}
