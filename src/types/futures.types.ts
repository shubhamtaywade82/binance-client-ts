import { z } from 'zod';

export const FundingRateSchema = z.object({
  symbol: z.string(),
  fundingTime: z.number(),
  fundingRate: z.string().transform(Number),
  markPrice: z.string().transform(Number).optional(),
});
export type FundingRate = z.infer<typeof FundingRateSchema>;
export const FundingRateHistorySchema = z.array(FundingRateSchema);

export const PremiumIndexSchema = z.object({
  symbol: z.string(),
  markPrice: z.string().transform(Number),
  indexPrice: z.string().transform(Number),
  estimatedSettlePrice: z.string().transform(Number),
  lastFundingRate: z.string().transform(Number),
  nextFundingTime: z.number(),
  interestRate: z.string().transform(Number),
  time: z.number(),
});
export type PremiumIndex = z.infer<typeof PremiumIndexSchema>;

export const OpenInterestSchema = z.object({
  symbol: z.string(),
  openInterest: z.string().transform(Number),
  time: z.number(),
});
export type OpenInterest = z.infer<typeof OpenInterestSchema>;

export const OpenInterestHistEntrySchema = z.object({
  symbol: z.string(),
  sumOpenInterest: z.string().transform(Number),
  sumOpenInterestValue: z.string().transform(Number),
  timestamp: z.number(),
});
export type OpenInterestHistEntry = z.infer<typeof OpenInterestHistEntrySchema>;
export const OpenInterestHistSchema = z.array(OpenInterestHistEntrySchema);

export const LongShortRatioEntrySchema = z.object({
  symbol: z.string(),
  longShortRatio: z.string().transform(Number),
  longAccount: z.string().transform(Number),
  shortAccount: z.string().transform(Number),
  timestamp: z.number(),
});
export type LongShortRatioEntry = z.infer<typeof LongShortRatioEntrySchema>;
export const LongShortRatioSchema = z.array(LongShortRatioEntrySchema);

export const TakerLongShortRatioEntrySchema = z.object({
  buySellRatio: z.string().transform(Number),
  buyVol: z.string().transform(Number),
  sellVol: z.string().transform(Number),
  timestamp: z.number(),
});
export type TakerLongShortRatioEntry = z.infer<typeof TakerLongShortRatioEntrySchema>;
export const TakerLongShortRatioSchema = z.array(TakerLongShortRatioEntrySchema);
