import { z } from 'zod';

export const OrderSchema = z.object({
  orderId: z.number(),
  symbol: z.string(),
  status: z.string(),
  clientOrderId: z.string(),
  price: z.string().transform(Number),
  avgPrice: z.string().transform(Number),
  origQty: z.string().transform(Number),
  executedQty: z.string().transform(Number),
  cumQuote: z.string().transform(Number),
  type: z.string(),
  reduceOnly: z.boolean(),
  side: z.string(),
  positionSide: z.string(),
  stopPrice: z.string().transform(Number).optional(),
  closePosition: z.boolean().optional(),
  timeInForce: z.string().optional(),
  origType: z.string().optional(),
  time: z.number(),
  updateTime: z.number(),
  workingType: z.string().optional(),
  priceProtect: z.boolean().optional(),
});
export type Order = z.infer<typeof OrderSchema>;
export const OrderResponseSchema = OrderSchema;
export const OrdersResponseSchema = z.array(OrderSchema);

export const CreateOrderParamsSchema = z.object({
  symbol: z.string(),
  side: z.enum(['BUY', 'SELL']),
  type: z.string(),
  quantity: z.union([z.string(), z.number()]).optional(),
  price: z.union([z.string(), z.number()]).optional(),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK', 'GTX']).optional(),
  stopPrice: z.union([z.string(), z.number()]).optional(),
  reduceOnly: z.boolean().optional(),
  positionSide: z.enum(['BOTH', 'LONG', 'SHORT']).optional(),
  clientOrderId: z.string().optional(),
  closePosition: z.boolean().optional(),
  newOrderRespType: z.enum(['ACK', 'RESULT']).optional(),
  priceProtect: z.boolean().optional(),
  workingType: z.enum(['MARK_PRICE', 'CONTRACT_PRICE']).optional(),
  callbackRate: z.union([z.string(), z.number()]).optional(),
});
export type CreateOrderParams = z.infer<typeof CreateOrderParamsSchema>;

export const ModifyOrderParamsSchema = CreateOrderParamsSchema.extend({
  orderId: z.number().optional(),
  origClientOrderId: z.string().optional(),
  origType: z.string().optional(),
});
export type ModifyOrderParams = z.infer<typeof ModifyOrderParamsSchema>;

export const AlgoOrderSchema = z.object({
  algoId: z.number(),
  symbol: z.string(),
  side: z.string(),
  positionSide: z.string(),
  totalQty: z.string().transform(Number).optional(),
  executedQty: z.string().transform(Number).optional(),
  executedAmt: z.string().transform(Number).optional(),
  avgPrice: z.string().transform(Number).optional(),
  clientAlgoId: z.string().optional(),
  bookTime: z.number().optional(),
  endTime: z.number().optional(),
  algoStatus: z.string().optional(),
  algoType: z.string().optional(),
  urgency: z.string().optional(),
});
export type AlgoOrder = z.infer<typeof AlgoOrderSchema>;
export const AlgoOrderResponseSchema = AlgoOrderSchema;
export const AlgoOrdersResponseSchema = z.array(AlgoOrderSchema);

export const BatchOrdersItemSchema = z.object({
  orderId: z.number(),
  symbol: z.string(),
  status: z.string(),
  clientOrderId: z.string(),
  price: z.string().transform(Number),
  avgPrice: z.string().transform(Number),
  origQty: z.string().transform(Number),
  executedQty: z.string().transform(Number),
  cumQuote: z.string().transform(Number),
  type: z.string(),
  reduceOnly: z.boolean(),
  side: z.string(),
  positionSide: z.string(),
  time: z.number(),
  updateTime: z.number(),
});
export type BatchOrdersItem = z.infer<typeof BatchOrdersItemSchema>;
export const BatchOrdersResponseSchema = z.array(BatchOrdersItemSchema);

export const OrderModifyHistoryEntrySchema = z.object({
  orderId: z.number(),
  symbol: z.string(),
  status: z.string(),
  clientOrderId: z.string(),
  price: z.string().transform(Number),
  avgPrice: z.string().transform(Number),
  origQty: z.string().transform(Number),
  executedQty: z.string().transform(Number),
  cumQuote: z.string().transform(Number),
  type: z.string(),
  reduceOnly: z.boolean(),
  side: z.string(),
  positionSide: z.string(),
  origType: z.string().optional(),
  stopPrice: z.string().transform(Number).optional(),
  updateTime: z.number(),
});
export type OrderModifyHistoryEntry = z.infer<typeof OrderModifyHistoryEntrySchema>;
export const OrderModifyHistorySchema = z.array(OrderModifyHistoryEntrySchema);

export const LeverageChangeSchema = z.object({
  leverage: z.number(),
  maxNotionalValue: z.union([z.string(), z.number()]),
  symbol: z.string(),
});
export type LeverageChange = z.infer<typeof LeverageChangeSchema>;

export const MarginTypeChangeSchema = z.object({
  code: z.number(),
  msg: z.string(),
});
export type MarginTypeChange = z.infer<typeof MarginTypeChangeSchema>;

export const PositionMarginChangeSchema = z.object({
  amount: z.number(),
  code: z.number(),
  msg: z.string(),
  type: z.number(),
});
export type PositionMarginChange = z.infer<typeof PositionMarginChangeSchema>;

export const CountdownCancelAllSchema = z.object({
  symbol: z.string(),
  countdownTime: z.number(),
});
export type CountdownCancelAll = z.infer<typeof CountdownCancelAllSchema>;

export const NewOrderAckSchema = z.object({
  orderId: z.number(),
  symbol: z.string(),
  status: z.string(),
  clientOrderId: z.string(),
  price: z.string(),
  avgPrice: z.string(),
  origQty: z.string(),
  executedQty: z.string(),
  cumQuote: z.string(),
  type: z.string(),
  reduceOnly: z.boolean(),
  side: z.string(),
  positionSide: z.string(),
  timeInForce: z.string().optional(),
  time: z.number(),
  updateTime: z.number(),
  workingType: z.string().optional(),
  origType: z.string().optional(),
  closePosition: z.boolean().optional(),
});
export type NewOrderAck = z.infer<typeof NewOrderAckSchema>;
