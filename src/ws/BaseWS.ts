import { EventEmitter } from 'node:events';
import WebSocket, { type RawData } from 'ws';
import { parseWsPayload, type WsStreamPayload } from '../types/ws.types.js';

export interface BaseWSOptions {
  baseStreamUrl: string;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}

interface CombinedStreamMessage {
  stream: string;
  data: unknown;
}

export class BaseWS extends EventEmitter {
  private ws: WebSocket | null = null;
  private readonly streams = new Set<string>();
  private reconnectAttempt = 0;
  private closedByUser = false;

  constructor(private readonly options: BaseWSOptions) {
    super();
  }

  subscribe(streams: string[]): void {
    streams.forEach((s) => this.streams.add(s));
    if (this.isOpen()) {
      this.send({ method: 'SUBSCRIBE', params: streams, id: Date.now() });
    } else {
      this.connect();
    }
  }

  unsubscribe(streams: string[]): void {
    streams.forEach((s) => this.streams.delete(s));
    if (this.isOpen()) {
      this.send({ method: 'UNSUBSCRIBE', params: streams, id: Date.now() });
    }
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

  private isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(payload: unknown): void {
    this.ws?.send(JSON.stringify(payload));
  }

  private connect(): void {
    this.closedByUser = false;
    const url = `${this.options.baseStreamUrl}?streams=${[...this.streams].join('/')}`;
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

  private handleMessage(raw: string): void {
    let parsed: CombinedStreamMessage;
    try {
      parsed = JSON.parse(raw) as CombinedStreamMessage;
    } catch {
      return;
    }
    if (!parsed.stream || parsed.data === undefined) return;

    try {
      const payload: WsStreamPayload = parseWsPayload(parsed.stream, parsed.data);
      this.emit('message', parsed.stream, payload);
      this.emit(parsed.stream, payload);
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
