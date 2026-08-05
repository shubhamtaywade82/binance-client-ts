import { z } from 'zod';
import type { BinanceClient } from '../client/BinanceClient.js';
import type { ToolDefinition } from './types.js';
import { textResult, normalizeSymbol } from './types.js';

const symbol = z.string().min(1).describe('USD-M pair, e.g. BTCUSDT');

/**
 * Derived tools: each one fans out over several REST endpoints and returns a
 * single answer. They exist so the model does not have to chain primitives and
 * do float arithmetic on tick/step sizes itself.
 */
export function derivedTools(client: BinanceClient): ToolDefinition[] {
  const ops = client.futures.ops;

  return [
    {
      name: 'futures_symbol_rules',
      description:
        'Get the tradeable rules for a symbol in one call: tick size, step size, min/max quantity, market-order lot bounds and minimum notional, flattened out of exchangeInfo filters. Call this before sizing or pricing any order.',
      inputSchema: z.object({ symbol, refresh: z.boolean().default(false).describe('Bypass the 60s cache') }),
      handler: async ({ symbol: s, refresh }) => textResult(await ops.symbolRules(normalizeSymbol(s), { refresh })),
    },
    {
      name: 'futures_quantize',
      description:
        "Round a price to the symbol's tick size and a quantity to its step size, returning exchange-ready strings. Use this instead of rounding numbers yourself — Binance rejects off-tick prices (-1111).",
      inputSchema: z.object({
        symbol,
        price: z.number().positive().optional(),
        quantity: z.number().positive().optional(),
        marketOrder: z.boolean().default(false).describe('Use MARKET_LOT_SIZE bounds instead of LOT_SIZE'),
      }),
      handler: async ({ symbol: s, price, quantity, marketOrder }) =>
        textResult(await ops.quantize(normalizeSymbol(s), { price, quantity, marketOrder })),
    },
    {
      name: 'futures_size_position',
      description:
        'Convert a risk budget into an exchange-ready order quantity. Given a stop price and either riskAmount (quote currency) or riskPct (percent of available balance), returns the quantity rounded down to the symbol step size, plus the notional, required margin and every constraint that failed (min notional, lot bounds, wrong-side stop). Never increases risk to satisfy a minimum — it reports instead.',
      inputSchema: z.object({
        symbol,
        side: z.enum(['BUY', 'SELL']),
        stopPrice: z.number().positive().describe('Protective stop price'),
        entryPrice: z.number().positive().optional().describe('Defaults to current mark price'),
        riskAmount: z.number().positive().optional().describe('Quote-currency amount to risk, e.g. 50 USDT'),
        riskPct: z.number().positive().max(100).optional().describe('Percent of available balance to risk (signed call)'),
        leverage: z.number().int().min(1).max(125).optional().describe('Used to report required margin'),
        marketOrder: z.boolean().default(false),
      }),
      handler: async (args) => textResult(await ops.sizePosition({ ...args, symbol: normalizeSymbol(args.symbol) })),
    },
    {
      name: 'futures_close_position',
      description:
        'Flatten an open position with a reduce-only market order. Reads the current position, derives the closing side from its sign, and automatically uses reduceOnly in one-way mode vs positionSide in hedge mode (Binance rejects the wrong one). Set dryRun to preview the order without sending it. Signed, destructive.',
      inputSchema: z.object({
        symbol,
        positionSide: z.enum(['BOTH', 'LONG', 'SHORT']).optional().describe('Required when hedge mode has both sides open'),
        portion: z.number().positive().max(1).default(1).describe('Fraction of the position to close, e.g. 0.5 for half'),
        dryRun: z.boolean().default(false),
      }),
      handler: async (args) => textResult(await ops.closePosition({ ...args, symbol: normalizeSymbol(args.symbol) })),
    },
    {
      name: 'futures_market_snapshot',
      description:
        'One-call market picture for a symbol: 24h stats, mark/index price with funding, open interest and long/short positioning. Replaces four separate primitive calls; individual feeds degrade to an error field rather than failing the whole snapshot.',
      inputSchema: z.object({
        symbol,
        period: z.enum(['5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d']).default('1h'),
      }),
      handler: async ({ symbol: s, period }) => textResult(await ops.marketSnapshot(normalizeSymbol(s), { period })),
    },
    {
      name: 'futures_account_overview',
      description:
        'One-call account picture: funded balances, open positions only (zero-size entries filtered out), working orders, and totals for unrealized PnL and gross notional. Signed.',
      inputSchema: z.object({}),
      handler: async () => textResult(await ops.accountOverview()),
    },
    {
      name: 'futures_place_bracket_order',
      description:
        'Place an entry order together with its protective stop-loss and optional take-profit, with all prices quantized to the symbol tick. Returns each leg separately; if a protective leg fails the response is flagged protectionComplete=false and the entry is NOT auto-cancelled (it may already have filled). Signed, destructive.',
      inputSchema: z.object({
        symbol,
        side: z.enum(['BUY', 'SELL']),
        quantity: z.union([z.string(), z.number()]),
        entryPrice: z.number().positive().optional().describe('Omit for a MARKET entry'),
        stopLossPrice: z.number().positive(),
        takeProfitPrice: z.number().positive().optional(),
        positionSide: z.enum(['BOTH', 'LONG', 'SHORT']).optional(),
        workingType: z.enum(['MARK_PRICE', 'CONTRACT_PRICE']).default('MARK_PRICE'),
      }),
      handler: async (args) => textResult(await ops.placeBracketOrder({ ...args, symbol: normalizeSymbol(args.symbol) })),
    },
  ];
}
