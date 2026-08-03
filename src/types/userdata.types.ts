import { z } from 'zod';

export const ListenKeySchema = z.object({
  listenKey: z.string(),
});
export type ListenKey = z.infer<typeof ListenKeySchema>;

export const UserDataAccountUpdateSchema = z.object({
  e: z.literal('ACCOUNT_UPDATE'),
  E: z.number(),
  T: z.number(),
  a: z.object({
    m: z.string().transform(Number),
    B: z.array(
      z.object({
        a: z.string(),
        wb: z.string().transform(Number),
        cw: z.string().transform(Number),
        bc: z.string().transform(Number),
      }),
    ),
    P: z.array(
      z.object({
        s: z.string(),
        pa: z.string().transform(Number),
        ep: z.string().transform(Number),
        cr: z.string().transform(Number),
        up: z.string().transform(Number),
        mt: z.string(),
        iw: z.string().transform(Number).optional(),
        ps: z.string(),
      }),
    ),
  }),
});
export type UserDataAccountUpdate = z.infer<typeof UserDataAccountUpdateSchema>;

export const UserDataOrderTradeUpdateSchema = z.object({
  e: z.literal('ORDER_TRADE_UPDATE'),
  E: z.number(),
  T: z.number(),
  o: z.object({
    s: z.string(),
    c: z.string(),
    i: z.number(),
    S: z.string(),
    o: z.string(),
    f: z.string(),
    q: z.string().transform(Number),
    p: z.string().transform(Number),
    ap: z.string().transform(Number),
    sp: z.string().transform(Number),
    x: z.string(),
    X: z.string(),
    l: z.string().transform(Number),
    z: z.string().transform(Number),
    L: z.string().transform(Number),
    n: z.string().transform(Number),
    N: z.string(),
    T: z.number(),
    t: z.number(),
    b: z.string().transform(Number),
    a: z.string().transform(Number),
    m: z.boolean(),
    R: z.boolean(),
    wt: z.string(),
    ot: z.string(),
    ps: z.string(),
    cp: z.boolean().optional(),
    AP: z.string().transform(Number).optional(),
    cr: z.string().transform(Number).optional(),
    rp: z.string().transform(Number).optional(),
  }),
});
export type UserDataOrderTradeUpdate = z.infer<typeof UserDataOrderTradeUpdateSchema>;

export const UserDataMarginCallSchema = z.object({
  e: z.literal('MARGIN_CALL'),
  E: z.number(),
  cw: z.string().transform(Number),
  p: z.array(
    z.object({
      s: z.string(),
      ps: z.string(),
      pa: z.string().transform(Number),
      mt: z.string(),
      iw: z.string().transform(Number),
      mp: z.string().transform(Number),
      up: z.string().transform(Number),
      mm: z.string().transform(Number),
    }),
  ),
});
export type UserDataMarginCall = z.infer<typeof UserDataMarginCallSchema>;

export type UserDataEvent = UserDataAccountUpdate | UserDataOrderTradeUpdate | UserDataMarginCall;

export function parseUserDataEvent(raw: unknown): UserDataEvent {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid user-data payload');
  }
  const eventType = (raw as { e?: string }).e;
  if (eventType === 'ACCOUNT_UPDATE') return UserDataAccountUpdateSchema.parse(raw);
  if (eventType === 'ORDER_TRADE_UPDATE') return UserDataOrderTradeUpdateSchema.parse(raw);
  if (eventType === 'MARGIN_CALL') return UserDataMarginCallSchema.parse(raw);
  throw new Error(`Unknown user-data event type: ${eventType}`);
}

export const WsApiResponseSchema = z.object({
  id: z.string(),
  status: z.number(),
  result: z.unknown(),
  error: z
    .object({
      code: z.number(),
      msg: z.string(),
    })
    .optional(),
});
export type WsApiResponse = z.infer<typeof WsApiResponseSchema>;
