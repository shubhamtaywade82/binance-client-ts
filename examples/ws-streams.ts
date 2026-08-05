/**
 * Real-time market streams over the combined WebSocket endpoint.
 *
 * Run: npx tsx examples/ws-streams.ts
 * No API keys are needed — these are public streams. Ctrl-C to stop.
 */
import { BinanceClient } from '../src/index.js';

async function main(): Promise<void> {
  const client = new BinanceClient();
  const ws = client.futures.ws;

  // Stream names are built by helpers so the topic format stays correct.
  ws.subscribe([
    ws.kline('BTCUSDT', '1m'),
    ws.aggTrade('BTCUSDT'),
    ws.markPrice('ETHUSDT', '1s'),
    ws.bookTicker('SOLUSDT'),
  ]);

  ws.on('open', () => console.log('connected'));
  ws.on('error', (error: Error) => console.error('ws error:', error.message));
  ws.on('close', () => console.log('disconnected'));

  ws.on('message', (stream: string, payload: unknown) => {
    const data = payload as Record<string, unknown>;
    if (stream.includes('@kline')) {
      const k = data.k as Record<string, unknown>;
      console.log(`kline ${data.s} close=${k.c} closed=${k.x}`);
    } else if (stream.includes('@aggTrade')) {
      console.log(`trade ${data.s} price=${data.p} qty=${data.q}`);
    } else if (stream.includes('@markPrice')) {
      console.log(`mark  ${data.s} price=${data.p} funding=${data.r}`);
    } else if (stream.includes('@bookTicker')) {
      console.log(`book  ${data.s} bid=${data.b} ask=${data.a}`);
    }
  });

  const shutdown = (): void => {
    console.log('\nclosing…');
    client.closeAllWebSockets();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
