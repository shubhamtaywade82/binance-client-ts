import { z } from 'zod';
import type { BinanceClient } from '../client/BinanceClient.js';
import type { ToolDefinition } from './types.js';
import { textResult, normalizeSymbol } from './types.js';

const optionalSymbol = z.string().min(1).describe('USD-M pair, e.g. BTCUSDT').optional();
const limit = z.number().int().positive().max(1000).default(100);
const startTime = z.number().int().positive().optional();
const endTime = z.number().int().positive().optional();

export function accountTools(client: BinanceClient): ToolDefinition[] {
  const a = client.futures.account;

  return [
    {
      name: 'futures_balance',
      description: 'Get futures account balances (v3): asset, wallet balance, unrealized profit, margin balance, available balance (signed).',
      inputSchema: z.object({}),
      handler: async () => textResult(await a.balanceV3()),
    },
    {
      name: 'futures_account',
      description: 'Get full account information (v3): total wallet/margin balance, unrealized profit, available balance, assets & positions (signed).',
      inputSchema: z.object({}),
      handler: async () => textResult(await a.accountV3()),
    },
    {
      name: 'futures_balance_v2',
      description: 'Get futures account balance (v2 legacy) per asset (signed).',
      inputSchema: z.object({}),
      handler: async () => textResult(await a.balance()),
    },
    {
      name: 'futures_account_v2',
      description: 'Get futures account information (v2 legacy) (signed).',
      inputSchema: z.object({}),
      handler: async () => textResult(await a.account()),
    },
    {
      name: 'futures_position_risk',
      description: 'Get current open positions (v3): symbol, side, size, entry price, mark price, liquidation price, leverage, unrealized PnL, margin (signed).',
      inputSchema: z.object({ symbol: optionalSymbol }),
      handler: async ({ symbol }) => textResult(await a.positionRiskV3(symbol ? normalizeSymbol(symbol) : undefined)),
    },
    {
      name: 'futures_income_history',
      description: 'Get futures income history (realized PnL, funding fees, commissions, transfers, insurance clearing). incomeType examples: TRANSFER, REALIZED_PNL, FUNDING_FEE, COMMISSION, INSURANCE_CLEAR, REFERRAL_KICKBACK (signed).',
      inputSchema: z.object({ symbol: optionalSymbol, incomeType: z.string().optional().describe('e.g. TRANSFER, REALIZED_PNL, FUNDING_FEE, COMMISSION'), startTime, endTime, limit: limit.default(100) }),
      handler: async ({ symbol, incomeType, startTime, endTime, limit }) =>
        textResult(await a.incomeHistory({ symbol: symbol ? normalizeSymbol(symbol) : undefined, incomeType, startTime, endTime, limit: Number(limit) })),
    },
    {
      name: 'futures_user_trades',
      description: 'Get account trade list (filled trades) for a symbol with optional time range (signed).',
      inputSchema: z.object({ symbol: z.string().min(1).describe('USD-M pair, e.g. BTCUSDT'), startTime, endTime, limit: limit.default(100), fromId: z.number().int().positive().optional() }),
      handler: async ({ symbol, startTime, endTime, limit, fromId }) =>
        textResult(await a.userTrades({ symbol: normalizeSymbol(symbol), startTime, endTime, limit: Number(limit), fromId })),
    },
    {
      name: 'futures_leverage_brackets',
      description: 'Get notional and leverage brackets for one symbol or all: tier caps, maintenance margin rate, max leverage (signed).',
      inputSchema: z.object({ symbol: optionalSymbol }),
      handler: async ({ symbol }) => textResult(await a.leverageBrackets(symbol ? normalizeSymbol(symbol) : undefined)),
    },
    {
      name: 'futures_commission_rate',
      description: 'Get user commission rate (taker & maker fee) for a symbol (signed).',
      inputSchema: z.object({ symbol: z.string().min(1).describe('USD-M pair, e.g. ETHUSDT') }),
      handler: async ({ symbol }) => textResult(await a.commissionRate(normalizeSymbol(symbol))),
    },
    {
      name: 'futures_multi_assets_mode',
      description: 'Get current multi-assets margin mode status (signed).',
      inputSchema: z.object({}),
      handler: async () => textResult(await a.multiAssetsMargin()),
    },
    {
      name: 'futures_set_multi_assets_mode',
      description: 'Enable or disable multi-assets mode (signed; 7-day cooldown between toggles).',
      inputSchema: z.object({ enabled: z.boolean().describe('true to enable, false to disable') }),
      handler: async ({ enabled }) => textResult(await a.setMultiAssetsMargin(enabled)),
    },
    {
      name: 'futures_fee_burn_status',
      description: 'Get BNB fee burn status for futures trades (signed).',
      inputSchema: z.object({}),
      handler: async () => textResult(await a.feeBurnStatus()),
    },
    {
      name: 'futures_set_fee_burn',
      description: 'Toggle BNB fee burn on futures trades (signed).',
      inputSchema: z.object({ enabled: z.boolean().describe('true to enable fee burn') }),
      handler: async ({ enabled }) => textResult(await a.setFeeBurnStatus(enabled)),
    },
    {
      name: 'futures_position_mode',
      description: 'Get current position mode: one-way (BOTH) or hedge mode (LONG/SHORT) (signed).',
      inputSchema: z.object({}),
      handler: async () => textResult(await a.positionMode()),
    },
    {
      name: 'futures_set_position_mode',
      description: 'Change position mode: hedgeMode true = dual side (hedge), false = one-way (signed; 30-day cooldown).',
      inputSchema: z.object({ hedgeMode: z.boolean().describe('true = hedge mode, false = one-way') }),
      handler: async ({ hedgeMode }) => textResult(await a.setPositionMode(hedgeMode)),
    },
    {
      name: 'futures_api_trading_status',
      description: 'Get futures trading quantitative rules indicators and disable intervals (signed).',
      inputSchema: z.object({}),
      handler: async () => textResult(await a.apiTradingStatus()),
    },
    {
      name: 'futures_position_margin_history',
      description: 'Get isolated position margin change history. type: 1 = add margin, 2 = reduce margin (signed).',
      inputSchema: z.object({ symbol: z.string().min(1).describe('USD-M pair, e.g. BTCUSDT'), type: z.enum(['1', '2']).describe('1 = add margin, 2 = reduce margin'), startTime, endTime, limit: limit.default(50) }),
      handler: async ({ symbol, type, startTime, endTime, limit }) =>
        textResult(await a.positionMarginHistory({ symbol: normalizeSymbol(symbol), type: Number(type), startTime, endTime, limit: Number(limit) })),
    },
    {
      name: 'futures_rate_limit_order',
      description: 'Query the current user order rate limit usage (signed).',
      inputSchema: z.object({}),
      handler: async () => textResult(await a.rateLimitOrder()),
    },
    {
      name: 'futures_request_order_download',
      description: 'Request a futures order-history download (async, 7-day window). Returns a downloadId (signed).',
      inputSchema: z.object({ symbol: optionalSymbol, startTime, endTime }),
      handler: async ({ symbol, startTime, endTime }) =>
        textResult(await a.requestOrderDownload({ symbol: symbol ? normalizeSymbol(symbol) : undefined, startTime, endTime })),
    },
    {
      name: 'futures_order_download_status',
      description: 'Get the futures order-history download link by downloadId (signed).',
      inputSchema: z.object({ downloadId: z.string().min(1) }),
      handler: async ({ downloadId }) => textResult(await a.getOrderDownloadStatus(downloadId)),
    },
    {
      name: 'futures_request_trade_download',
      description: 'Request a futures trade-history download (async, 7-day window). Returns a downloadId (signed).',
      inputSchema: z.object({ symbol: optionalSymbol, startTime, endTime }),
      handler: async ({ symbol, startTime, endTime }) =>
        textResult(await a.requestTradeDownload({ symbol: symbol ? normalizeSymbol(symbol) : undefined, startTime, endTime })),
    },
    {
      name: 'futures_trade_download_status',
      description: 'Get the futures trade-history download link by downloadId (signed).',
      inputSchema: z.object({ downloadId: z.string().min(1) }),
      handler: async ({ downloadId }) => textResult(await a.getTradeDownloadStatus(downloadId)),
    },
  ];
}
