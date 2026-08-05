import { z } from 'zod';
import type { BinanceClient } from '../client/BinanceClient.js';
import type { ToolDefinition } from './types.js';
import { textResult, normalizeSymbol } from './types.js';

const symbol = z.string().min(1).describe('USD-M pair, e.g. BTCUSDT');
const optionalSymbol = z.string().min(1).describe('USD-M pair, e.g. BTCUSDT').optional();
const limit = z.number().int().positive().max(1000).default(100);
const startTime = z.number().int().positive().optional();
const endTime = z.number().int().positive().optional();
const side = z.enum(['BUY', 'SELL']);
const positionSide = z.enum(['BOTH', 'LONG', 'SHORT']).optional();

export const orderParamsSchema = z.object({
  symbol,
  side,
  type: z.enum(['LIMIT', 'MARKET', 'STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET', 'TRAILING_STOP_MARKET']),
  quantity: z.union([z.string(), z.number()]).describe('Order quantity in base asset'),
  price: z.union([z.string(), z.number()]).optional().describe('Required for LIMIT and STOP/TAKE_PROFIT (limit-triggered) types'),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK', 'GTX']).optional(),
  stopPrice: z.union([z.string(), z.number()]).optional().describe('Trigger price for STOP/STOP_MARKET/TAKE_PROFIT/TAKE_PROFIT_MARKET'),
  reduceOnly: z.boolean().optional().describe('true = only reduces the position, never opens'),
  positionSide,
  newClientOrderId: z.string().optional(),
  closePosition: z.boolean().optional().describe('Close the full position on trigger (mutually exclusive with quantity)'),
  newOrderRespType: z.enum(['ACK', 'RESULT']).optional(),
  priceProtect: z.boolean().optional(),
  workingType: z.enum(['MARK_PRICE', 'CONTRACT_PRICE']).optional().describe('Trigger price basis; default CONTRACT_PRICE'),
  callbackRate: z.union([z.string(), z.number()]).optional().describe('Percent callback for TRAILING_STOP_MARKET, e.g. 0.5'),
  activationPrice: z.union([z.string(), z.number()]).optional().describe('Activation price for TRAILING_STOP_MARKET'),
  selfTradePreventionMode: z.enum(['NONE', 'EXPIRE_TAKER', 'EXPIRE_MAKER', 'EXPIRE_BOTH']).optional(),
  goodTillDate: z.number().int().optional().describe('Timestamp when a GTD order expires'),
});

export function tradingTools(client: BinanceClient): ToolDefinition[] {
  const t = client.futures.trading;

  return [
    {
      name: 'futures_new_order',
      description: 'Place a new futures order. Types: LIMIT, MARKET, STOP, STOP_MARKET, TAKE_PROFIT, TAKE_PROFIT_MARKET, TRAILING_STOP_MARKET. Use STOP_MARKET as the take-profit/stop-loss trigger and LIMIT for the actual fill. Signed.',
      inputSchema: orderParamsSchema,
      handler: async (args) => {
        const { newClientOrderId, ...rest } = { ...args, symbol: normalizeSymbol(args.symbol) };
        return textResult(await t.createOrder({ ...rest, clientOrderId: newClientOrderId }));
      },
    },
    {
      name: 'futures_test_order',
      description: 'Validate a new order without submitting it. Returns 200 on success; use to validate fields and margin before real orders. Signed.',
      inputSchema: orderParamsSchema,
      handler: async (args) => {
        const { newClientOrderId, ...rest } = { ...args, symbol: normalizeSymbol(args.symbol) };
        return textResult(await t.createTestOrder({ ...rest, clientOrderId: newClientOrderId }));
      },
    },
    {
      name: 'futures_get_order',
      description: 'Query a specific order by orderId or client order id. Signed.',
      inputSchema: z.object({ symbol, orderId: z.number().int().positive().optional(), origClientOrderId: z.string().optional() }),
      handler: async ({ symbol, orderId, origClientOrderId }) =>
        textResult(await t.getOrder(normalizeSymbol(symbol), { orderId, origClientOrderId })),
    },
    {
      name: 'futures_cancel_order',
      description: 'Cancel a specific open order by orderId or client order id. Signed.',
      inputSchema: z.object({ symbol, orderId: z.number().int().positive().optional(), origClientOrderId: z.string().optional() }),
      handler: async ({ symbol, orderId, origClientOrderId }) =>
        textResult(await t.cancelOrder(normalizeSymbol(symbol), { orderId, origClientOrderId })),
    },
    {
      name: 'futures_get_open_order',
      description: 'Query a current open order (must exist in the open order book). Signed.',
      inputSchema: z.object({ symbol, orderId: z.number().int().positive().optional(), origClientOrderId: z.string().optional() }),
      handler: async ({ symbol, orderId, origClientOrderId }) =>
        textResult(await t.getCurrentOrder(normalizeSymbol(symbol), { orderId, origClientOrderId })),
    },
    {
      name: 'futures_open_orders',
      description: 'Get all current open orders, for one symbol or all symbols. Signed.',
      inputSchema: z.object({ symbol: optionalSymbol }),
      handler: async ({ symbol }) => textResult(await t.getOpenOrders(symbol ? normalizeSymbol(symbol) : undefined)),
    },
    {
      name: 'futures_all_orders',
      description: 'Get historical orders for a symbol with optional time range (last 7 days by default). Signed.',
      inputSchema: z.object({ symbol, orderId: z.number().int().positive().optional(), startTime, endTime, limit }),
      handler: async ({ symbol, orderId, startTime, endTime, limit }) =>
        textResult(await t.getAllOrders(normalizeSymbol(symbol), { orderId, startTime, endTime, limit })),
    },
    {
      name: 'futures_cancel_all_orders',
      description: 'Cancel all open orders for a symbol. Signed.',
      inputSchema: z.object({ symbol }),
      handler: async ({ symbol }) => textResult(await t.cancelAllOpenOrders(normalizeSymbol(symbol))),
    },
    {
      name: 'futures_modify_order',
      description: 'Modify an open order (price/quantity/stopPrice). Cannot modify when position side is BOTH and closePosition is true. Signed.',
      inputSchema: z.object({
        symbol,
        side,
        quantity: z.union([z.string(), z.number()]),
        price: z.union([z.string(), z.number()]).optional(),
        orderId: z.number().int().positive().optional(),
        origClientOrderId: z.string().optional(),
        stopPrice: z.union([z.string(), z.number()]).optional(),
        timeInForce: z.enum(['GTC', 'IOC', 'FOK', 'GTX']).optional(),
        positionSide,
        newClientOrderId: z.string().optional(),
      }),
      handler: async (args) => {
        const { newClientOrderId, ...rest } = { ...args, symbol: normalizeSymbol(args.symbol) };
        return textResult(await t.modifyOrder({ ...rest, clientOrderId: newClientOrderId }));
      },
    },
    {
      name: 'futures_order_modify_history',
      description: 'Get order modification history for a symbol. Signed.',
      inputSchema: z.object({ symbol, startTime, endTime, limit }),
      handler: async ({ symbol, startTime, endTime, limit }) =>
        textResult(await t.getOrderModifyHistory(normalizeSymbol(symbol), { startTime, endTime, limit })),
    },
    {
      name: 'futures_batch_orders',
      description: 'Place up to 5 orders in one request (array of order objects, max 30 per minute per symbol). Signed.',
      inputSchema: z.object({ orders: z.array(orderParamsSchema).min(1).max(5) }),
      handler: async (args) => {
        const mapped = (args.orders as any[]).map((o) => {
          const { newClientOrderId, ...rest } = o;
          return { ...rest, symbol: normalizeSymbol(rest.symbol), clientOrderId: newClientOrderId };
        });
        return textResult(await t.createBatchOrders(mapped as any[]));
      },
    },
    {
      name: 'futures_cancel_batch_orders',
      description: 'Cancel multiple orders at once (up to 10 by orderId list or client order id list). Signed.',
      inputSchema: z.object({
        symbol,
        orderIdList: z.array(z.number().int().positive()).max(10).optional(),
        origClientOrderIdList: z.array(z.string()).max(10).optional(),
      }),
      handler: async ({ symbol, orderIdList, origClientOrderIdList }) =>
        textResult(await t.cancelBatchOrders(normalizeSymbol(symbol), { orderIdList, origClientOrderIdList })),
    },
    {
      name: 'futures_set_leverage',
      description: 'Change initial leverage for a symbol (1-125, within bracket). Signed.',
      inputSchema: z.object({ symbol, leverage: z.number().int().min(1).max(125) }),
      handler: async ({ symbol, leverage }) => textResult(await t.setLeverage(normalizeSymbol(symbol), leverage)),
    },
    {
      name: 'futures_set_margin_type',
      description: 'Change margin type for a symbol: isolated or cross. Only allowed when no open position for the symbol. Signed.',
      inputSchema: z.object({ symbol, marginType: z.enum(['isolated', 'cross']) }),
      handler: async ({ symbol, marginType }) => textResult(await t.setMarginType(normalizeSymbol(symbol), marginType)),
    },
    {
      name: 'futures_modify_position_margin',
      description: 'Add or reduce isolated position margin. marginType: 1 = add margin, 2 = reduce margin. Signed.',
      inputSchema: z.object({ symbol, amount: z.number().positive(), marginType: z.enum(['1', '2']).describe('1 = add margin, 2 = reduce margin') }),
      handler: async ({ symbol, amount, marginType }) => textResult(await t.modifyPositionMargin(normalizeSymbol(symbol), amount, Number(marginType))),
    },
    {
      name: 'futures_countdown_cancel_all',
      description: 'Auto-cancel all open orders for a symbol after countdownTime ms (0 = cancel the countdown). Emergency circuit breaker. Signed.',
      inputSchema: z.object({ symbol, countdownTime: z.number().int().min(100).max(60000) }),
      handler: async ({ symbol, countdownTime }) => textResult(await t.setCountdownCancelAll(normalizeSymbol(symbol), countdownTime)),
    },
    {
      name: 'futures_new_algo_order',
      description: 'Place a conditional algo order (CONDITIONAL or VP). CONDITIONAL supports STOP_MARKET/TAKE_PROFIT_MARKET types with triggerPrice; VP is a volume-participation order with urgency and quantity. Signed.',
      inputSchema: z.object({
        algoType: z.enum(['CONDITIONAL', 'VP']),
        symbol,
        side,
        positionSide,
        type: z.enum(['STOP_MARKET', 'TAKE_PROFIT_MARKET', 'LIMIT']).describe('For CONDITIONAL: STOP_MARKET/TAKE_PROFIT_MARKET. For VP: LIMIT'),
        quantity: z.union([z.string(), z.number()]),
        triggerPrice: z.union([z.string(), z.number()]).optional().describe('Required for CONDITIONAL'),
        price: z.union([z.string(), z.number()]).optional(),
        timeInForce: z.enum(['GTC', 'IOC', 'FOK', 'GTX']).optional(),
        workingType: z.enum(['MARK_PRICE', 'CONTRACT_PRICE']).optional(),
        priceProtect: z.boolean().optional(),
        reduceOnly: z.boolean().optional(),
        closePosition: z.boolean().optional(),
        urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('Required for VP'),
        clientAlgoId: z.string().optional(),
      }),
      handler: async (args) =>
        textResult(await t.createAlgoOrder({ ...args, symbol: normalizeSymbol(args.symbol) })),
    },
    {
      name: 'futures_cancel_algo_order',
      description: 'Cancel an open algo order by algoId or clientAlgoId. Signed.',
      inputSchema: z.object({ symbol, algoId: z.number().int().positive().optional(), clientAlgoId: z.string().optional() }),
      handler: async ({ symbol, algoId, clientAlgoId }) =>
        textResult(await t.cancelAlgoOrder(normalizeSymbol(symbol), { algoId, clientAlgoId })),
    },
    {
      name: 'futures_cancel_all_algo_orders',
      description: 'Cancel all open algo orders for a symbol. Signed.',
      inputSchema: z.object({ symbol }),
      handler: async ({ symbol }) => textResult(await t.cancelAllOpenAlgoOrders(normalizeSymbol(symbol))),
    },
    {
      name: 'futures_get_algo_order',
      description: 'Query an algo order by algoId or clientAlgoId. Signed.',
      inputSchema: z.object({ symbol, algoId: z.number().int().positive().optional(), clientAlgoId: z.string().optional() }),
      handler: async ({ symbol, algoId, clientAlgoId }) =>
        textResult(await t.getAlgoOrder(normalizeSymbol(symbol), { algoId, clientAlgoId })),
    },
    {
      name: 'futures_open_algo_orders',
      description: 'Get all current open algo orders, optionally filtered by symbol. Signed.',
      inputSchema: z.object({ symbol: optionalSymbol }),
      handler: async ({ symbol }) => textResult(await t.getOpenAlgoOrders(symbol ? normalizeSymbol(symbol) : undefined)),
    },
    {
      name: 'futures_all_algo_orders',
      description: 'Get historical algo orders for a symbol with optional time range. Signed.',
      inputSchema: z.object({ symbol, startTime, endTime, limit }),
      handler: async ({ symbol, startTime, endTime, limit }) =>
        textResult(await t.getAllAlgoOrders(normalizeSymbol(symbol), { startTime, endTime, limit })),
    },
    {
      name: 'futures_convert_exchange_info',
      description: 'List asset pairs eligible for futures Convert, optionally filtered by fromAsset/toAsset.',
      inputSchema: z.object({ fromAsset: z.string().optional(), toAsset: z.string().optional() }),
      handler: async ({ fromAsset, toAsset }) => textResult(await t.convertExchangeInfo({ fromAsset, toAsset })),
    },
    {
      name: 'futures_convert_get_quote',
      description: 'Request a Convert quote between two assets (quote expires quickly; accept with futures_convert_accept_quote). Signed.',
      inputSchema: z.object({
        fromAsset: z.string().min(1),
        toAsset: z.string().min(1),
        fromAmount: z.number().positive().optional(),
        toAmount: z.number().positive().optional(),
        validTime: z.enum(['10s', '30s', '1m', '2m']).optional(),
      }),
      handler: async (args) => textResult(await t.convertGetQuote(args)),
    },
    {
      name: 'futures_convert_accept_quote',
      description: 'Accept a previously requested Convert quote by quoteId. Signed.',
      inputSchema: z.object({ quoteId: z.string().min(1) }),
      handler: async ({ quoteId }) => textResult(await t.convertAcceptQuote(quoteId)),
    },
    {
      name: 'futures_convert_order_status',
      description: 'Query the status of a Convert order by orderId or quoteId. Signed.',
      inputSchema: z.object({ orderId: z.string().optional(), quoteId: z.string().optional() }),
      handler: async ({ orderId, quoteId }) => textResult(await t.convertOrderStatus({ orderId, quoteId })),
    },
  ];
}
