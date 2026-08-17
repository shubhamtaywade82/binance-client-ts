import { WebSocketServer } from 'ws';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SpotUserWS } from '../../src/ws/SpotUserWS.js';
import { parseSpotUserDataEvent } from '../../src/types/spot.types.js';

describe('parseSpotUserDataEvent', () => {
  it('dispatches on the event type', () => {
    expect(parseSpotUserDataEvent({ e: 'executionReport', s: 'BTCUSDT' }).e).toBe('executionReport');
    expect(parseSpotUserDataEvent({ e: 'balanceUpdate', a: 'USDT' }).e).toBe('balanceUpdate');
    expect(parseSpotUserDataEvent({ e: 'outboundAccountPosition' }).e).toBe('outboundAccountPosition');
    expect(parseSpotUserDataEvent({ e: 'listStatus' }).e).toBe('listStatus');
    expect(() => parseSpotUserDataEvent({ e: 'nope' })).toThrow();
  });
});

describe('SpotUserWS', () => {
  let server: WebSocketServer;
  let port: number;

  beforeEach(async () => {
    server = new WebSocketServer({ port: 0 });
    await new Promise<void>((resolve) => server.once('listening', resolve));
    port = (server.address() as { port: number }).port;
  });

  afterEach(() => server.close());

  it('emits executionReport events', async () => {
    server.on('connection', (socket) => {
      socket.send(JSON.stringify({ e: 'executionReport', s: 'BTCUSDT', E: 1, c: 'c1', S: 'BUY' }));
    });

    const client = new SpotUserWS({ baseUserUrl: `ws://localhost:${port}`, getListenKey: () => 'lk' });
    const received = new Promise<{ s: string }>((resolve) => {
      client.once('executionReport', (event: { s: string }) => resolve(event));
    });
    client.connect();

    const event = await received;
    expect(event.s).toBe('BTCUSDT');
    client.close();
  });

  it('emits error when no listenKey is available', async () => {
    const client = new SpotUserWS({ baseUserUrl: `ws://localhost:${port}`, getListenKey: () => null });
    const received = new Promise<Error>((resolve) => client.once('error', (err: Error) => resolve(err)));
    client.connect();

    const err = await received;
    expect(err.message).toContain('listenKey');
    client.close();
  });
});
