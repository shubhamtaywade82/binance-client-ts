import { z } from 'zod';
import type { BinanceClient } from '../client/BinanceClient.js';
import type { ToolDefinition } from './types.js';
import { textResult } from './types.js';

interface WsBuffer {
  subscriptions: Set<string>;
  events: { stream: string; payload: unknown; ts: number }[];
}

const buffers = new Map<BinanceClient, WsBuffer>();
const MAX_BUFFER = 500;

function bufferFor(client: BinanceClient): WsBuffer {
  let buffer = buffers.get(client);
  if (!buffer) {
    buffer = { subscriptions: new Set(), events: [] };
    buffers.set(client, buffer);
    client.futures.ws.on('message', (stream: string, payload: unknown) => {
      buffer!.events.push({ stream, payload, ts: Date.now() });
      if (buffer!.events.length > MAX_BUFFER) buffer!.events.splice(0, buffer!.events.length - MAX_BUFFER);
    });
  }
  return buffer;
}

export function getBufferedWsEvents(client: BinanceClient, limit = 50): unknown[] {
  return bufferFor(client).events.slice(-limit);
}

export function clearBufferedWsEvents(client: BinanceClient): void {
  bufferFor(client).events = [];
}

export function wsTools(client: BinanceClient): ToolDefinition[] {
  const buffer = bufferFor(client);

  return [
    {
      name: 'futures_ws_subscribe',
      description:
        'Subscribe to real-time market data streams. Topic format: <symbol>@<stream>, e.g. btcusdt@aggTrade, btcusdt@kline_1m, btcusdt@depth20, btcusdt@markPrice@1s, btcusdt@bookTicker, btcusdt@ticker, btcusdt@miniTicker, btcusdt@forceOrder, or all-market topics !ticker@arr, !bookTicker, !markPrice@arr, !forceOrder@arr, !miniTicker@arr. Multiple topics can be passed at once.',
      inputSchema: z.object({
        topics: z.array(z.string().min(1)).min(1).describe('Stream topics, e.g. ["btcusdt@aggTrade", "btcusdt@kline_1m"]'),
      }),
      handler: async ({ topics }) => {
        const normalized = topics.map((t: string) => t.trim().toLowerCase());
        client.futures.ws.subscribe(normalized);
        normalized.forEach((t: string) => buffer.subscriptions.add(t));
        return textResult({ subscribed: normalized, active: [...buffer.subscriptions] });
      },
    },
    {
      name: 'futures_ws_unsubscribe',
      description: 'Unsubscribe from previously subscribed market data streams.',
      inputSchema: z.object({ topics: z.array(z.string().min(1)).min(1) }),
      handler: async ({ topics }) => {
        const normalized = topics.map((t: string) => t.trim().toLowerCase());
        client.futures.ws.unsubscribe(normalized);
        normalized.forEach((t: string) => buffer.subscriptions.delete(t));
        return textResult({ unsubscribed: normalized, active: [...buffer.subscriptions] });
      },
    },
    {
      name: 'futures_ws_subscriptions',
      description: 'List the currently subscribed WebSocket market streams for this client.',
      inputSchema: z.object({}),
      handler: async () => textResult({ active: [...buffer.subscriptions] }),
    },
    {
      name: 'futures_ws_events',
      description:
        'Read the buffered real-time payloads received since the last read for the subscribed streams (aggregate trades, klines, depth deltas, mark price, book tickers, tickers, force orders). Payloads are parsed; depth deltas must be applied to a snapshot from futures_order_book.',
      inputSchema: z.object({ limit: z.number().int().min(1).max(200).default(50) }),
      handler: async ({ limit }) => textResult(getBufferedWsEvents(client, limit)),
    },
    {
      name: 'futures_ws_clear_events',
      description: 'Clear the buffered WebSocket events so the next read only returns new payloads.',
      inputSchema: z.object({}),
      handler: async () => {
        clearBufferedWsEvents(client);
        return textResult({ cleared: true });
      },
    },
    {
      name: 'futures_ws_start_user_stream',
      description:
        'Start the user data stream: creates a listenKey, connects the private WebSocket, and begins a 30-minute keep-alive. Emits private events (ACCOUNT_UPDATE, ORDER_TRADE_UPDATE, MARGIN_CALL, ACCOUNT_CONFIG_UPDATE, listenKeyExpired) that the application can consume from the client.',
      inputSchema: z.object({}),
      handler: async () => textResult({ listenKey: await client.startUserStream() }),
    },
    {
      name: 'futures_ws_stop_user_stream',
      description: 'Stop the user data stream: closes the private WebSocket and invalidates the listenKey.',
      inputSchema: z.object({}),
      handler: async () => {
        client.closeUserStream();
        return textResult({ stopped: true });
      },
    },
  ];
}
