import { z } from 'zod';

export const KlineIntervalSchema = z.enum([
  '1m', '3m', '5m', '15m', '30m',
  '1h', '2h', '4h', '6h', '8h', '12h',
  '1d', '3d', '1w', '1M',
]);
export type KlineInterval = z.infer<typeof KlineIntervalSchema>;

const RawKlineSchema = z.tuple([
  z.number(), z.string(), z.string(), z.string(), z.string(), z.string(),
  z.number(), z.string(), z.number(), z.string(), z.string(), z.string(),
]);

export const KlineSchema = RawKlineSchema.transform(
  ([openTime, open, high, low, close, volume, closeTime, quoteAssetVolume, trades, takerBuyBaseVolume, takerBuyQuoteVolume]) => ({
    openTime,
    open: Number(open),
    high: Number(high),
    low: Number(low),
    close: Number(close),
    volume: Number(volume),
    closeTime,
    quoteAssetVolume: Number(quoteAssetVolume),
    trades,
    takerBuyBaseVolume: Number(takerBuyBaseVolume),
    takerBuyQuoteVolume: Number(takerBuyQuoteVolume),
  }),
);
export type Kline = z.infer<typeof KlineSchema>;
export const KlinesResponseSchema = z.array(KlineSchema);

export const TickerPriceSchema = z.object({
  symbol: z.string(),
  price: z.string().transform(Number),
  time: z.number().optional(),
});
export type TickerPrice = z.infer<typeof TickerPriceSchema>;

export const Ticker24hrSchema = z.object({
  symbol: z.string(),
  priceChange: z.string().transform(Number),
  priceChangePercent: z.string().transform(Number),
  weightedAvgPrice: z.string().transform(Number),
  lastPrice: z.string().transform(Number),
  lastQty: z.string().transform(Number),
  openPrice: z.string().transform(Number),
  highPrice: z.string().transform(Number),
  lowPrice: z.string().transform(Number),
  volume: z.string().transform(Number),
  quoteVolume: z.string().transform(Number),
  openTime: z.number(),
  closeTime: z.number(),
  firstId: z.number(),
  lastId: z.number(),
  count: z.number(),
});
export type Ticker24hr = z.infer<typeof Ticker24hrSchema>;

export const BookTickerSchema = z.object({
  symbol: z.string(),
  bidPrice: z.string().transform(Number),
  bidQty: z.string().transform(Number),
  askPrice: z.string().transform(Number),
  askQty: z.string().transform(Number),
  time: z.number().optional(),
});
export type BookTicker = z.infer<typeof BookTickerSchema>;

const DepthLevelSchema = z
  .tuple([z.string(), z.string()])
  .transform(([price, qty]) => ({ price: Number(price), qty: Number(qty) }));

export const DepthSnapshotSchema = z.object({
  lastUpdateId: z.number(),
  bids: z.array(DepthLevelSchema),
  asks: z.array(DepthLevelSchema),
});
export type DepthSnapshot = z.infer<typeof DepthSnapshotSchema>;

export const TradeSchema = z.object({
  id: z.number(),
  price: z.string().transform(Number),
  qty: z.string().transform(Number),
  quoteQty: z.string().transform(Number),
  time: z.number(),
  isBuyerMaker: z.boolean(),
});
export type Trade = z.infer<typeof TradeSchema>;
export const TradesResponseSchema = z.array(TradeSchema);

export const AggTradeSchema = z.object({
  a: z.number(),
  p: z.string().transform(Number),
  q: z.string().transform(Number),
  f: z.number(),
  l: z.number(),
  T: z.number(),
  m: z.boolean(),
});
export type AggTrade = z.infer<typeof AggTradeSchema>;
export const AggTradesResponseSchema = z.array(AggTradeSchema);

export const AvgPriceSchema = z.object({
  mins: z.number(),
  price: z.string().transform(Number),
});
export type AvgPrice = z.infer<typeof AvgPriceSchema>;

export const ExchangeSymbolSchema = z
  .object({
    symbol: z.string(),
    status: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
  })
  .loose();
export type ExchangeSymbol = z.infer<typeof ExchangeSymbolSchema>;

export const ExchangeInfoSchema = z
  .object({
    timezone: z.string(),
    serverTime: z.number(),
    symbols: z.array(ExchangeSymbolSchema),
  })
  .loose();
export type ExchangeInfo = z.infer<typeof ExchangeInfoSchema>;
