import { EventEmitter } from 'node:events';
import WebSocket, { type RawData } from 'ws';
import { parseSpotUserDataEvent, type SpotUserDataEvent } from '../types/spot.types.js';

export interface SpotUserWSOptions {
  baseUserUrl: string;
  getListenKey: () => string | null;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}

export class SpotUserWS extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private closedByUser = false;

  constructor(private readonly options: SpotUserWSOptions) {
    super();
  }

  connect(): void {
    const listenKey = this.options.getListenKey();
    if (!listenKey) {
      this.emit('error', new Error('No spot listenKey available for user data stream'));
      return;
    }
    this.closedByUser = false;
    const url = `${this.options.baseUserUrl}/${listenKey}`;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      this.reconnectAttempt = 0;
      this.emit('open');
    });

    this.ws.on('message', (raw: RawData) => {
      this.handleMessage(raw.toString());
    });

    this.ws.on('close', () => {
      this.emit('close');
      if (!this.closedByUser) this.scheduleReconnect();
    });

    this.ws.on('error', (err: Error) => {
      this.emit('error', err);
    });
  }

  close(): void {
    this.closedByUser = true;
    this.ws?.close();
  }

  reconnect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.close();
    this.reconnectAttempt = 0;
    if (!this.closedByUser) this.connect();
  }

  resetReconnectAttempts(): void {
    this.reconnectAttempt = 0;
  }

  private handleMessage(raw: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    try {
      const event: SpotUserDataEvent = parseSpotUserDataEvent(parsed);
      this.emit(event.e, event);
      this.emit('userData', event);
    } catch (err) {
      this.emit('error', err);
    }
  }

  private scheduleReconnect(): void {
    const base = this.options.reconnectDelayMs ?? 1000;
    const max = this.options.maxReconnectDelayMs ?? 30_000;
    const delay = Math.min(base * 2 ** this.reconnectAttempt, max);
    this.reconnectAttempt += 1;
    setTimeout(() => {
      if (!this.closedByUser) this.connect();
    }, delay);
  }
}
