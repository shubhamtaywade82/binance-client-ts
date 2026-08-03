import { z } from 'zod';

export const BalanceSchema = z.object({
  accountAlias: z.string(),
  asset: z.string(),
  balance: z.string().transform(Number),
  crossWalletBalance: z.string().transform(Number),
  crossUnPnl: z.string().transform(Number),
  availableBalance: z.string().transform(Number),
  maxWithdrawAmount: z.string().transform(Number),
  marginAvailable: z.boolean(),
  updateTime: z.number(),
});
export type Balance = z.infer<typeof BalanceSchema>;
export const BalancesResponseSchema = z.array(BalanceSchema);

export const PositionRiskSchema = z.object({
  symbol: z.string(),
  positionAmt: z.string().transform(Number),
  entryPrice: z.string().transform(Number),
  markPrice: z.string().transform(Number),
  unRealizedProfit: z.string().transform(Number),
  liquidationPrice: z.string().transform(Number),
  leverage: z.string().transform(Number),
  marginType: z.enum(['isolated', 'cross']),
  positionSide: z.string(),
  isolatedWallet: z.string().transform(Number).optional(),
  isolatedMargin: z.string().transform(Number).optional(),
  notional: z.string().transform(Number),
  updateTime: z.number().optional(),
});
export type PositionRisk = z.infer<typeof PositionRiskSchema>;
export const PositionRiskResponseSchema = z.array(PositionRiskSchema);

export const AccountAssetSchema = z.object({
  asset: z.string(),
  walletBalance: z.string().transform(Number),
  unrealizedProfit: z.string().transform(Number),
  marginBalance: z.string().transform(Number),
  maintMargin: z.string().transform(Number),
  initialMargin: z.string().transform(Number),
  positionInitialMargin: z.string().transform(Number),
  openOrderInitialMargin: z.string().transform(Number),
  crossWalletBalance: z.string().transform(Number),
  crossUnPnl: z.string().transform(Number),
  availableBalance: z.string().transform(Number),
  maxWithdrawAmount: z.string().transform(Number),
  marginAvailable: z.boolean().optional(),
  updateTime: z.number(),
});
export type AccountAsset = z.infer<typeof AccountAssetSchema>;

export const AccountPositionSchema = z.object({
  symbol: z.string(),
  positionAmt: z.string().transform(Number),
  initialMargin: z.string().transform(Number),
  maintMargin: z.string().transform(Number),
  unrealizedProfit: z.string().transform(Number),
  positionInitialMargin: z.string().transform(Number),
  openOrderInitialMargin: z.string().transform(Number),
  leverage: z.string().transform(Number),
  isolated: z.boolean(),
  entryPrice: z.string().transform(Number),
  positionSide: z.string(),
  positionNotional: z.string().transform(Number),
  isolatedWallet: z.string().transform(Number).optional(),
  isolatedMargin: z.string().transform(Number).optional(),
  notional: z.string().transform(Number).optional(),
});
export type AccountPosition = z.infer<typeof AccountPositionSchema>;

export const AccountSchema = z.object({
  feeTier: z.number(),
  canTrade: z.boolean(),
  canDeposit: z.boolean(),
  canWithdraw: z.boolean(),
  updateTime: z.number(),
  totalInitialMargin: z.string().transform(Number),
  totalMaintMargin: z.string().transform(Number),
  totalWalletBalance: z.string().transform(Number),
  totalUnrealizedProfit: z.string().transform(Number),
  totalMarginBalance: z.string().transform(Number),
  totalPositionInitialMargin: z.string().transform(Number),
  totalOpenOrderInitialMargin: z.string().transform(Number),
  totalCrossWalletBalance: z.string().transform(Number),
  totalCrossUnPnl: z.string().transform(Number),
  availableBalance: z.string().transform(Number),
  maxWithdrawAmount: z.string().transform(Number),
  assets: z.array(AccountAssetSchema),
  positions: z.array(AccountPositionSchema),
});
export type Account = z.infer<typeof AccountSchema>;

export const IncomeSchema = z.object({
  symbol: z.string().optional(),
  incomeType: z.string(),
  income: z.string().transform(Number),
  asset: z.string(),
  time: z.number(),
  info: z.string().optional(),
  tranId: z.number(),
  tradeId: z.string().optional(),
});
export type Income = z.infer<typeof IncomeSchema>;
export const IncomeHistoryResponseSchema = z.array(IncomeSchema);

export const UserTradeSchema = z.object({
  buyer: z.boolean(),
  commission: z.string().transform(Number),
  commissionAsset: z.string(),
  id: z.number(),
  maker: z.boolean(),
  orderId: z.number(),
  price: z.string().transform(Number),
  qty: z.string().transform(Number),
  quoteQty: z.string().transform(Number),
  realizedPnl: z.string().transform(Number),
  side: z.string(),
  positionSide: z.string(),
  symbol: z.string(),
  time: z.number(),
});
export type UserTrade = z.infer<typeof UserTradeSchema>;
export const UserTradesResponseSchema = z.array(UserTradeSchema);

export const CommissionRateSchema = z.object({
  symbol: z.string(),
  makerCommissionRate: z.string().transform(Number),
  takerCommissionRate: z.string().transform(Number),
});
export type CommissionRate = z.infer<typeof CommissionRateSchema>;

export const LeverageBracketSchema = z.object({
  symbol: z.string().optional(),
  bracketNotional: z.string().transform(Number).optional(),
  bracket: z.number().optional(),
  maxLeverage: z.number().optional(),
  maintMarginRatio: z.string().transform(Number).optional(),
  cum: z.string().transform(Number).optional(),
});
export type LeverageBracket = z.infer<typeof LeverageBracketSchema>;
export const LeverageBracketResponseSchema = z.array(
  z.object({
    symbol: z.string(),
    brackets: z.array(LeverageBracketSchema),
  }),
);

export const PositionModeSchema = z.object({
  dualSidePosition: z.boolean(),
});
export type PositionMode = z.infer<typeof PositionModeSchema>;

export const MultiAssetsMarginSchema = z.object({
  multiAssetsMargin: z.boolean(),
});
export type MultiAssetsMargin = z.infer<typeof MultiAssetsMarginSchema>;

export const FeeBurnStatusSchema = z.object({
  feeBurn: z.boolean(),
});
export type FeeBurnStatus = z.infer<typeof FeeBurnStatusSchema>;

export const PositionMarginHistoryEntrySchema = z.object({
  amount: z.string().transform(Number),
  asset: z.string(),
  symbol: z.string(),
  time: z.number(),
  type: z.number(),
  positionSide: z.string(),
});
export type PositionMarginHistoryEntry = z.infer<typeof PositionMarginHistoryEntrySchema>;
export const PositionMarginHistorySchema = z.array(PositionMarginHistoryEntrySchema);

export const ApiTradingStatusSchema = z.object({
  isLocked: z.boolean(),
  plannedRecoverTime: z.number(),
  updateTime: z.number(),
  triggerCondition: z.record(z.string(), z.number()).optional(),
  indicators: z.record(z.string(), z.unknown()).optional(),
});
export type ApiTradingStatus = z.infer<typeof ApiTradingStatusSchema>;

export const RateLimitOrderSchema = z.object({
  rateLimitType: z.string(),
  interval: z.string(),
  intervalNum: z.number(),
  limit: z.number(),
  count: z.number(),
});
export type RateLimitOrder = z.infer<typeof RateLimitOrderSchema>;
export const RateLimitOrderResponseSchema = z.array(RateLimitOrderSchema);
