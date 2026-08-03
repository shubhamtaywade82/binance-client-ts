import { HttpClient } from '../client/HttpClient.js';
import {
  Account,
  AccountSchema,
  ApiTradingStatus,
  ApiTradingStatusSchema,
  Balance,
  BalancesResponseSchema,
  CommissionRate,
  CommissionRateSchema,
  FeeBurnStatus,
  FeeBurnStatusSchema,
  Income,
  IncomeHistoryResponseSchema,
  LeverageBracket,
  LeverageBracketResponseSchema,
  MultiAssetsMargin,
  MultiAssetsMarginSchema,
  PositionMarginHistoryEntry,
  PositionMarginHistorySchema,
  PositionMode,
  PositionModeSchema,
  PositionRisk,
  PositionRiskResponseSchema,
  RateLimitOrder,
  RateLimitOrderResponseSchema,
  UserTrade,
  UserTradesResponseSchema,
} from '../types/account.types.js';

export class FuturesAccount {
  constructor(private readonly http: HttpClient) {}

  async balance(): Promise<Balance[]> {
    return BalancesResponseSchema.parse(await this.http.get('/fapi/v2/balance', undefined, 'signed'));
  }

  async account(): Promise<Account> {
    return AccountSchema.parse(await this.http.get('/fapi/v2/account', undefined, 'signed'));
  }

  async positionRisk(symbol?: string): Promise<PositionRisk[]> {
    const params = symbol ? { symbol } : {};
    return PositionRiskResponseSchema.parse(await this.http.get('/fapi/v2/positionRisk', params, 'signed'));
  }

  async balanceV3(): Promise<Balance[]> {
    return BalancesResponseSchema.parse(await this.http.get('/fapi/v3/balance', undefined, 'signed'));
  }

  async accountV3(): Promise<Account> {
    return AccountSchema.parse(await this.http.get('/fapi/v3/account', undefined, 'signed'));
  }

  async positionRiskV3(symbol?: string): Promise<PositionRisk[]> {
    const params = symbol ? { symbol } : {};
    return PositionRiskResponseSchema.parse(await this.http.get('/fapi/v3/positionRisk', params, 'signed'));
  }

  async incomeHistory(options?: {
    symbol?: string;
    incomeType?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<Income[]> {
    const params = {
      symbol: options?.symbol,
      incomeType: options?.incomeType,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit,
    };
    return IncomeHistoryResponseSchema.parse(await this.http.get('/fapi/v1/income', params, 'signed'));
  }

  async userTrades(options?: {
    symbol?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    fromId?: number;
  }): Promise<UserTrade[]> {
    const params = {
      symbol: options?.symbol,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit,
      fromId: options?.fromId,
    };
    return UserTradesResponseSchema.parse(await this.http.get('/fapi/v1/userTrades', params, 'signed'));
  }

  async leverageBrackets(symbol?: string): Promise<{ symbol: string; brackets: LeverageBracket[] }[]> {
    const params = symbol ? { symbol } : {};
    return LeverageBracketResponseSchema.parse(await this.http.get('/fapi/v1/leverageBracket', params, 'signed'));
  }

  async commissionRate(symbol: string): Promise<CommissionRate> {
    return CommissionRateSchema.parse(await this.http.get('/fapi/v1/commissionRate', { symbol }, 'signed'));
  }

  async multiAssetsMargin(): Promise<MultiAssetsMargin> {
    return MultiAssetsMarginSchema.parse(await this.http.get('/fapi/v1/multiAssetsMargin', undefined, 'signed'));
  }

  async setMultiAssetsMargin(multiAssetsMargin: boolean): Promise<Record<string, unknown>> {
    return this.http.post('/fapi/v1/multiAssetsMargin', { multiAssetsMargin }, 'signed');
  }

  async feeBurnStatus(): Promise<FeeBurnStatus> {
    return FeeBurnStatusSchema.parse(await this.http.get('/fapi/v1/feeBurn', undefined, 'signed'));
  }

  async setFeeBurnStatus(feeBurn: boolean): Promise<Record<string, unknown>> {
    return this.http.post('/fapi/v1/feeBurn', { feeBurn }, 'signed');
  }

  async positionMode(): Promise<PositionMode> {
    return PositionModeSchema.parse(await this.http.get('/fapi/v1/positionSide/dual', undefined, 'signed'));
  }

  async setPositionMode(dualSidePosition: boolean): Promise<Record<string, unknown>> {
    return this.http.post('/fapi/v1/positionSide/dual', { dualSidePosition }, 'signed');
  }

  async apiTradingStatus(): Promise<ApiTradingStatus> {
    return ApiTradingStatusSchema.parse(await this.http.get('/fapi/v1/apiTradingStatus', undefined, 'signed'));
  }

  async positionMarginHistory(options?: {
    symbol: string;
    type?: number;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<PositionMarginHistoryEntry[]> {
    const params = {
      symbol: options?.symbol,
      type: options?.type,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit,
    };
    return PositionMarginHistorySchema.parse(await this.http.get('/fapi/v1/positionMargin/history', params, 'signed'));
  }

  async rateLimitOrder(): Promise<RateLimitOrder[]> {
    return RateLimitOrderResponseSchema.parse(await this.http.get('/fapi/v1/rateLimit/order', undefined, 'signed'));
  }

  async requestOrderDownload(options?: {
    symbol?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<Record<string, unknown>> {
    const params = {
      symbol: options?.symbol,
      startTime: options?.startTime,
      endTime: options?.endTime,
    };
    return this.http.get('/fapi/v1/order/asyn', params, 'signed');
  }

  async getOrderDownloadStatus(downloadId: string): Promise<Record<string, unknown>> {
    return this.http.get('/fapi/v1/order/asyn/id', { downloadId }, 'signed');
  }

  async requestTradeDownload(options?: {
    symbol?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<Record<string, unknown>> {
    const params = {
      symbol: options?.symbol,
      startTime: options?.startTime,
      endTime: options?.endTime,
    };
    return this.http.get('/fapi/v1/trade/asyn', params, 'signed');
  }

  async getTradeDownloadStatus(downloadId: string): Promise<Record<string, unknown>> {
    return this.http.get('/fapi/v1/trade/asyn/id', { downloadId }, 'signed');
  }
}
