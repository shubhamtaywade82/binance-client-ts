import { HttpClient } from './HttpClient.js';
import { resolveEnvironment } from './endpoints.js';
import { FuturesData } from '../resources/FuturesData.js';
import { FuturesMarket } from '../resources/FuturesMarket.js';
import { SpotMarket } from '../resources/SpotMarket.js';
import { FuturesAccount } from '../resources/FuturesAccount.js';
import { FuturesTrading } from '../resources/FuturesTrading.js';
import { FuturesOps } from '../resources/FuturesOps.js';
import { UserDataStream } from '../resources/UserDataStream.js';
import { FuturesMarketWS } from '../ws/FuturesMarketWS.js';
import { SpotMarketWS } from '../ws/SpotMarketWS.js';
import { FuturesUserWS } from '../ws/FuturesUserWS.js';
import { WsApi } from '../ws/WsApi.js';

export interface BinanceClientOptions {
  apiKey?: string;
  apiSecret?: string;
  testnet?: boolean;
  demo?: boolean;
  recvWindow?: number;
  apiBase?: string;
  wsBase?: string;
  wsUserBase?: string;
  wsApiBase?: string;
  timeoutMs?: number;
  maxRetries?: number;
  rateLimitTokensPerSecond?: number;
  rateLimitMaxTokens?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
}

export class BinanceClient {
  readonly spot: { market: SpotMarket; ws: SpotMarketWS };
  readonly futures: {
    market: FuturesMarket;
    data: FuturesData;
    account: FuturesAccount;
    trading: FuturesTrading;
    ops: FuturesOps;
    userStream: UserDataStream;
    ws: FuturesMarketWS;
    wsUser: FuturesUserWS;
    wsApi: WsApi;
  };

  private readonly authHttp: HttpClient;
  private listenKeyValue: string | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  static nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  static buildPair(base: string, target: string): string {
    return `${base}${target}`.toUpperCase();
  }

  static parsePair(pair: string): { base: string; target: string } | null {
    const match = pair.match(/^([A-Z0-9]+)(USDT|USDC|BUSD|BTC|ETH|BNB)$/);
    if (!match) return null;
    return { base: match[1] as string, target: match[2] as string };
  }

  static calculateLiquidationPrice(entryPrice: number, leverage: number, side: 'buy' | 'sell', mm = 0.005): number {
    const dir = side === 'buy' ? 1 : -1;
    return dir === 1
      ? entryPrice * (1 - 1 / leverage + mm)
      : entryPrice * (1 + 1 / leverage - mm);
  }

  constructor(options: BinanceClientOptions = {}) {
    const { endpoints } = resolveEnvironment(options);
    const httpOptions = {
      apiKey: options.apiKey,
      apiSecret: options.apiSecret,
      recvWindow: options.recvWindow ?? 5000,
      timeoutMs: options.timeoutMs ?? 15_000,
      maxRetries: options.maxRetries ?? 3,
      retryBaseDelayMs: options.retryBaseDelayMs,
      retryMaxDelayMs: options.retryMaxDelayMs,
    };

    this.authHttp = new HttpClient({ baseURL: endpoints.restRoot, ...httpOptions });

    this.spot = {
      market: new SpotMarket(),
      ws: new SpotMarketWS(),
    };

    const futuresMarket = new FuturesMarket(
      new HttpClient({ baseURL: endpoints.restFapi, ...httpOptions }),
      endpoints.restRoot,
    );
    const futuresData = new FuturesData({
      restFapi: endpoints.restFapi,
      restFuturesData: endpoints.restFuturesData,
      ...httpOptions,
    });
    const futuresAccount = new FuturesAccount(this.authHttp);
    const futuresTrading = new FuturesTrading(this.authHttp);

    this.futures = {
      market: futuresMarket,
      data: futuresData,
      account: futuresAccount,
      trading: futuresTrading,
      ops: new FuturesOps(futuresMarket, futuresData, futuresAccount, futuresTrading),
      userStream: new UserDataStream(this.authHttp),
      ws: new FuturesMarketWS(endpoints.wsMarket),
      wsUser: new FuturesUserWS({
        baseUserUrl: endpoints.wsUser,
        getListenKey: () => this.listenKeyValue,
      }),
      wsApi: new WsApi({
        baseUrl: endpoints.wsApi,
        apiKey: options.apiKey,
        apiSecret: options.apiSecret,
        recvWindow: options.recvWindow,
      }),
    };
  }

  async startUserStream(): Promise<string> {
    const { listenKey } = await this.futures.userStream.createListenKey();
    this.listenKeyValue = listenKey;
    this.keepAliveInterval = setInterval(() => {
      this.futures.userStream.keepAliveListenKey().catch(() => {
        /* listenKey keep-alive failures are retried on the next tick */
      });
    }, 30 * 60 * 1000);
    this.futures.wsUser.connect();
    return listenKey;
  }

  closeUserStream(): void {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = null;
    this.futures.wsUser.close();
    this.futures.userStream.closeListenKey().catch(() => {
      /* best-effort cleanup */
    });
    this.listenKeyValue = null;
  }

  closeAllWebSockets(): void {
    this.futures.ws.close();
    this.futures.wsUser.close();
    this.spot.ws.close();
    this.closeUserStream();
  }

  reconnectWebSocket(target: 'ws' | 'wsUser' | 'spot'): void {
    if (target === 'ws') this.futures.ws.reconnect();
    else if (target === 'wsUser') this.futures.wsUser.reconnect();
    else this.spot.ws.reconnect();
  }

  resetReconnectAttempts(): void {
    this.futures.ws.resetReconnectAttempts();
    this.futures.wsUser.resetReconnectAttempts();
    this.spot.ws.resetReconnectAttempts();
  }
}
