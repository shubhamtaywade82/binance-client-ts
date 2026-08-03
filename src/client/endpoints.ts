export type Environment = 'live' | 'testnet' | 'demo';

export interface Endpoints {
  restRoot: string;
  restFapi: string;
  restFuturesData: string;
  wsMarket: string;
  wsUser: string;
  wsApi: string;
}

export function resolveEnvironment(options?: {
  testnet?: boolean;
  demo?: boolean;
  apiBase?: string;
  wsBase?: string;
  wsUserBase?: string;
  wsApiBase?: string;
}): { env: Environment; endpoints: Endpoints } {
  const env: Environment = options?.demo ? 'demo' : options?.testnet ? 'testnet' : 'live';

  const restHost =
    options?.apiBase ??
    (env === 'demo'
      ? 'https://demo-fapi.binance.com'
      : env === 'testnet'
        ? 'https://testnet.binancefuture.com'
        : 'https://fapi.binance.com');

  const wsMarketHost =
    options?.wsBase ??
    (env === 'demo'
      ? 'wss://demo-fstream.binance.com/stream'
      : env === 'testnet'
        ? 'wss://fstream.binancefuture.com/stream'
        : 'wss://fstream.binance.com/stream');

  const wsUserHost =
    options?.wsUserBase ??
    (env === 'demo'
      ? 'wss://demo-fstream.binance.com/ws'
      : env === 'testnet'
        ? 'wss://fstream.binancefuture.com/ws'
        : 'wss://fstream.binance.com/ws');

  const wsApiHost =
    options?.wsApiBase ??
    (env === 'demo'
      ? 'wss://demo-fapi.binance.com/ws-fapi/v1'
      : 'wss://ws-fapi.binance.com/ws-fapi/v1');

  return {
    env,
    endpoints: {
      restRoot: restHost,
      restFapi: `${restHost}/fapi/v1`,
      restFuturesData: `${restHost}/futures/data`,
      wsMarket: wsMarketHost,
      wsUser: wsUserHost,
      wsApi: wsApiHost,
    },
  };
}
