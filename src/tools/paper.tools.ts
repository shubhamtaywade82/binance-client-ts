import { z } from 'zod';
import type { BinanceClient } from '../client/BinanceClient.js';
import type { ToolDefinition } from './types.js';
import { textResult, normalizeSymbol } from './types.js';

export interface PaperState {
  balance: number;
  positions: PaperPosition[];
  history: PaperEvent[];
}

export interface PaperPosition {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  openedAt: string;
}

export interface PaperEvent extends PaperPosition {
  type: 'open' | 'close';
  exitPrice?: number;
  realizedPnl?: number;
  closedAt?: string;
}

export interface PaperContext {
  state: PaperState;
  client: BinanceClient;
}

export function createPaperContext(client: BinanceClient, initialState: Partial<PaperState> = {}): PaperContext {
  return {
    client,
    state: { balance: initialState.balance ?? 10000, positions: initialState.positions ?? [], history: initialState.history ?? [] },
  };
}

function pnl(position: PaperPosition, price: number): number {
  const direction = position.side === 'LONG' ? 1 : -1;
  return (price - position.entryPrice) * position.quantity * direction;
}

export function paperTools(ctx: PaperContext): ToolDefinition[] {
  const s = ctx.state;
  const t = ctx.client.futures.market;

  return [
    {
      name: 'paper_init',
      description: 'Initialize paper-trading state (reset balances, positions, history). No API keys required.',
      inputSchema: z.object({ balance: z.number().positive().default(10000).describe('Starting USDT balance') }),
      handler: async ({ balance }) => {
        s.balance = balance;
        s.positions = [];
        s.history = [];
        return textResult(s);
      },
    },
    {
      name: 'paper_balance',
      description: 'Get current paper-trading balance and open-position equity (uses live market prices if an open position exists). No API keys required.',
      inputSchema: z.object({}),
      handler: async () => textResult(s),
    },
    {
      name: 'paper_open_position',
      description: 'Open an in-memory paper position at the live ticker price (or a fixed price). No API keys required.',
      inputSchema: z.object({
        symbol: z.string().min(1).describe('USD-M pair, e.g. BTCUSDT'),
        side: z.enum(['LONG', 'SHORT']),
        quantity: z.number().positive(),
        price: z.number().positive().optional().describe('If omitted, uses live ticker price'),
      }),
      handler: async ({ symbol, side, quantity, price }) => {
        const sym = normalizeSymbol(symbol);
        const market = price ?? Number((await t.tickerPrice(sym)).price);
        const position: PaperPosition = { id: Date.now().toString(), symbol: sym, side, quantity, entryPrice: market, openedAt: new Date().toISOString() };
        s.positions.push(position);
        s.history.push({ type: 'open', ...position });
        return textResult(position);
      },
    },
    {
      name: 'paper_close_position',
      description: 'Close a paper position by id (or symbol) and realize PnL at the live/last price.',
      inputSchema: z.object({
        id: z.string().optional().describe('Position id from paper_open_position'),
        symbol: z.string().min(1).optional().describe('Close the position for this symbol'),
        price: z.number().positive().optional().describe('If omitted, uses live ticker price'),
      }),
      handler: async ({ id, symbol, price }) => {
        const idx = s.positions.findIndex((p) => (id ? p.id === id : normalizeSymbol(p.symbol) === normalizeSymbol(symbol ?? '')));
        if (idx === -1) throw new Error('paper position not found');
        const position = s.positions[idx];
        const market = price ?? Number((await t.tickerPrice(position.symbol)).price);
        const realizedPnl = pnl(position, market);
        s.balance += realizedPnl;
        const closed: PaperEvent = { type: 'close', ...position, exitPrice: market, realizedPnl, closedAt: new Date().toISOString() };
        s.positions.splice(idx, 1);
        s.history.push(closed);
        return textResult(closed);
      },
    },
    {
      name: 'paper_positions',
      description: 'List open paper positions with live unrealized PnL (marked to market).',
      inputSchema: z.object({}),
      handler: async () => {
        const out = await Promise.all(
          s.positions.map(async (p) => {
            const price = Number((await t.tickerPrice(p.symbol)).price);
            return { ...p, markPrice: price, unrealizedPnl: pnl(p, price) };
          }),
        );
        return textResult(out);
      },
    },
    {
      name: 'paper_history',
      description: 'List paper-trading history of open/close events with realized PnL.',
      inputSchema: z.object({}),
      handler: async () => textResult(s.history),
    },
    {
      name: 'paper_summary',
      description: 'Summarize paper-trading state: balance, open positions, trade count.',
      inputSchema: z.object({}),
      handler: async () =>
        textResult({ balance: s.balance, openPositions: s.positions.length, trades: s.history.length }),
    },
  ];
}
