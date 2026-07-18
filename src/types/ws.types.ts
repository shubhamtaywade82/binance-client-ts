import { z } from 'zod';

export const WsKlinePayloadSchema = z.object({
  e: z.literal('kline'),
  E: z.number(),
  s: z.string(),
  k: z.object({
    t: z.number(),
    T: z.number(),
    s: z.string(),
    i: z.string(),
    o: z.string().transform(Number),
    c: z.string().transform(Number),
    h: z.string().transform(Number),
    l: z.string().transform(Number),
    v: z.string().transform(Number),
    n: z.number(),
    x: z.boolean(),
    q: z.string().transform(Number),
    V: z.string().transform(Number),
    Q: z.string().transform(Number),
  }),
});
export type WsKlinePayload = z.infer<typeof WsKlinePayloadSchema>;

export const WsAggTradePayloadSchema = z.object({
  e: z.literal('aggTrade'),
  E: z.number(),
  s: z.string(),
  a: z.number(),
  p: z.string().transform(Number),
  q: z.string().transform(Number),
  f: z.number(),
  l: z.number(),
  T: z.number(),
  m: z.boolean(),
});
export type WsAggTradePayload = z.infer<typeof WsAggTradePayloadSchema>;

export const WsTradePayloadSchema = z.object({
  e: z.literal('trade'),
  E: z.number(),
  s: z.string(),
  t: z.number(),
  p: z.string().transform(Number),
  q: z.string().transform(Number),
  T: z.number(),
  m: z.boolean(),
});
export type WsTradePayload = z.infer<typeof WsTradePayloadSchema>;

export const WsDepthUpdatePayloadSchema = z.object({
  e: z.literal('depthUpdate'),
  E: z.number(),
  s: z.string(),
  U: z.number(),
  u: z.number(),
  b: z.array(z.tuple([z.string(), z.string()])),
  a: z.array(z.tuple([z.string(), z.string()])),
});
export type WsDepthUpdatePayload = z.infer<typeof WsDepthUpdatePayloadSchema>;

export const WsTicker24hrPayloadSchema = z.object({
  e: z.literal('24hrTicker'),
  E: z.number(),
  s: z.string(),
  p: z.string().transform(Number),
  P: z.string().transform(Number),
  c: z.string().transform(Number),
  o: z.string().transform(Number),
  h: z.string().transform(Number),
  l: z.string().transform(Number),
  v: z.string().transform(Number),
  q: z.string().transform(Number),
});
export type WsTicker24hrPayload = z.infer<typeof WsTicker24hrPayloadSchema>;

export const WsBookTickerPayloadSchema = z.object({
  u: z.number(),
  s: z.string(),
  b: z.string().transform(Number),
  B: z.string().transform(Number),
  a: z.string().transform(Number),
  A: z.string().transform(Number),
});
export type WsBookTickerPayload = z.infer<typeof WsBookTickerPayloadSchema>;

export const WsMarkPricePayloadSchema = z.object({
  e: z.literal('markPriceUpdate'),
  E: z.number(),
  s: z.string(),
  p: z.string().transform(Number),
  i: z.string().transform(Number),
  P: z.string().transform(Number),
  r: z.string().transform(Number),
  T: z.number(),
});
export type WsMarkPricePayload = z.infer<typeof WsMarkPricePayloadSchema>;

export type WsStreamPayload =
  | WsKlinePayload
  | WsAggTradePayload
  | WsTradePayload
  | WsDepthUpdatePayload
  | WsTicker24hrPayload
  | WsBookTickerPayload
  | WsMarkPricePayload;

export function parseWsPayload(streamName: string, raw: unknown): WsStreamPayload {
  if (streamName.includes('@kline_')) return WsKlinePayloadSchema.parse(raw);
  if (streamName.includes('@aggTrade')) return WsAggTradePayloadSchema.parse(raw);
  if (streamName.includes('@trade')) return WsTradePayloadSchema.parse(raw);
  if (streamName.includes('@depth')) return WsDepthUpdatePayloadSchema.parse(raw);
  if (streamName.includes('@bookTicker')) return WsBookTickerPayloadSchema.parse(raw);
  if (streamName.includes('@markPrice')) return WsMarkPricePayloadSchema.parse(raw);
  if (streamName.includes('@ticker')) return WsTicker24hrPayloadSchema.parse(raw);
  throw new Error(`Unknown WS stream type: ${streamName}`);
}
