import { createHmac, randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import { NetworkError } from '../errors/index.js';
import type { WsApiResponse } from '../types/userdata.types.js';

export interface WsApiOptions {
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  recvWindow?: number;
  timeoutMs?: number;
}

interface WsApiRequestParams {
  id?: string;
  [key: string]: unknown;
}

function buildQueryString(data: Record<string, unknown>): string {
  return Object.entries(data)
    .filter(([, val]) => val !== undefined && val !== null)
    .map(([key, val]) => `${key}=${encodeURIComponent(String(val))}`)
    .join('&');
}

export class WsApi {
  constructor(private readonly options: WsApiOptions) {}

  async request(method: string, params: WsApiRequestParams = {}): Promise<WsApiResponse> {
    const { apiKey, apiSecret } = this.options;
    if (!apiKey || !apiSecret) {
      throw new Error('API key and secret required for WebSocket API requests');
    }
    const { id = randomUUID(), ...methodParams } = params;
    const requestParams: Record<string, unknown> = {
      ...methodParams,
      apiKey,
      timestamp: Date.now(),
      recvWindow: this.options.recvWindow ?? 5000,
    };
    const queryString = buildQueryString(requestParams);
    requestParams.signature = createHmac('sha256', apiSecret).update(queryString).digest('hex');

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.options.baseUrl);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new NetworkError(`WebSocket API request timed out: ${method}`));
      }, this.options.timeoutMs ?? 15_000);

      ws.on('open', () => ws.send(JSON.stringify({ id, method, params: requestParams })));
      ws.on('message', (raw: Buffer) => {
        clearTimeout(timeout);
        ws.close();
        try {
          const parsed = JSON.parse(raw.toString()) as WsApiResponse;
          if (parsed.status >= 400) {
            reject(new Error(parsed.error?.msg ?? `WebSocket API error: ${method}`));
          } else {
            resolve(parsed);
          }
        } catch (err) {
          reject(new NetworkError('Invalid WebSocket API JSON payload', err));
        }
      });
      ws.on('error', (err: Error) => {
        clearTimeout(timeout);
        reject(new NetworkError(err.message, err));
      });
    });
  }

  placeOrder(params: Record<string, unknown>): Promise<WsApiResponse> {
    return this.request('order.place', params);
  }

  cancelOrder(params: Record<string, unknown>): Promise<WsApiResponse> {
    return this.request('order.cancel', params);
  }

  modifyOrder(params: Record<string, unknown>): Promise<WsApiResponse> {
    return this.request('order.modify', params);
  }

  placeAlgoOrder(params: Record<string, unknown>): Promise<WsApiResponse> {
    return this.request('algoOrder.place', params);
  }

  cancelAlgoOrder(params: Record<string, unknown>): Promise<WsApiResponse> {
    return this.request('algoOrder.cancel', params);
  }
}
