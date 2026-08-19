# binance-sdk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `binance-sdk`, a canonical TypeScript client for Binance's public REST + WebSocket APIs (Spot + USD-M Futures), for `sdk/binance-sdk`.

**Architecture:** Facade `BinanceClient` exposing `.spot` (market REST + WS) and `.futures` (market REST + futures-data REST + WS) namespaces. A shared `HttpClient` (axios + bottleneck rate limiting + typed-error retry) backs all REST resources. A shared `BaseWS` (combined-stream `ws` connection with reconnect) backs both market WS clients. Zod schemas validate and coerce every REST/WS response into typed objects (numeric strings → numbers).

**Tech Stack:** TypeScript, axios, bottleneck, ws, zod, tsup (build), vitest + msw (tests).

## Global Constraints

- Package path: `sdk/binance-sdk` (own git repo, already `git init`'d with the design spec committed).
- npm package name: `binance-sdk` (unscoped).
- Public REST + public WS only — no API keys, no account/order endpoints.
- Node >= 18. `"type": "module"`. Build output: ESM + CJS + `.d.ts` via tsup, matching `libraries/trading-concepts-ts`'s `tsup.config.ts` / `tsconfig.json` conventions.
- Tests: vitest, files under `test/**/*.test.ts` (not `tests/`), matching `trading-concepts-ts`.
- Spec: `docs/superpowers/specs/2026-07-18-binance-sdk-design.md`.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/index.ts`
- Test: `test/index.test.ts`

**Interfaces:**
- Produces: `VERSION: string` exported from `src/index.ts` (placeholder proving the build/test toolchain works; later tasks add real exports to this file).

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "binance-sdk",
  "version": "0.1.0",
  "description": "TypeScript client for Binance public REST + WebSocket APIs (Spot + USD-M Futures)",
  "license": "MIT",
  "author": "Shubham Taywade",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/shubhamtaywade82/binance-sdk.git"
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "files": ["dist"],
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "smoke": "tsx scripts/smoke-test.ts"
  },
  "dependencies": {
    "axios": "^1.13.6",
    "bottleneck": "^2.19.5",
    "ws": "^8.18.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/node": "^20.17.14",
    "@types/ws": "^8.5.13",
    "msw": "^2.7.0",
    "tsup": "^8.3.5",
    "tsx": "^4.23.1",
    "typescript": "^5.6.3",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "declaration": true,
    "strict": true,
    "noUncheckedIndexedAccess": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "dist"
  },
  "include": ["src", "test", "scripts"]
}
```

- [ ] **Step 3: Write `tsup.config.ts`**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  target: 'es2020',
});
```

- [ ] **Step 4: Write `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
});
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules/
dist/
*.tsbuildinfo
.env
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: `package-lock.json` created, `node_modules/` populated, no errors.

- [ ] **Step 7: Write the failing test**

`test/index.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { VERSION } from '../src/index.js';

describe('index', () => {
  it('exports a semver VERSION string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
```

- [ ] **Step 8: Run test to verify it fails**

Run: `npx vitest run test/index.test.ts`
Expected: FAIL — `src/index.ts` does not exist / has no export `VERSION`.

- [ ] **Step 9: Write minimal implementation**

`src/index.ts`:

```typescript
export const VERSION = '0.1.0';
```

- [ ] **Step 10: Run test to verify it passes**

Run: `npx vitest run test/index.test.ts`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsup.config.ts vitest.config.ts .gitignore src/index.ts test/index.test.ts
git commit -m "chore: scaffold project (build/test toolchain)"
```

---

### Task 2: Typed errors

**Files:**
- Create: `src/errors/BinanceApiError.ts`
- Create: `src/errors/RateLimitError.ts`
- Create: `src/errors/NetworkError.ts`
- Create: `src/errors/index.ts`
- Test: `test/errors.test.ts`

**Interfaces:**
- Consumes: nothing (foundational).
- Produces: `class BinanceApiError extends Error { code: number; status: number }`, `class RateLimitError extends BinanceApiError { retryAfterMs?: number }`, `class NetworkError extends Error { cause?: unknown }`. Used by `HttpClient` (Task 3).

- [ ] **Step 1: Write the failing test**

`test/errors.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { BinanceApiError, NetworkError, RateLimitError } from '../src/errors/index.js';

describe('errors', () => {
  it('BinanceApiError carries code and status', () => {
    const err = new BinanceApiError('Invalid symbol.', -1121, 400);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Invalid symbol.');
    expect(err.code).toBe(-1121);
    expect(err.status).toBe(400);
    expect(err.name).toBe('BinanceApiError');
  });

  it('RateLimitError is a BinanceApiError with optional retryAfterMs', () => {
    const err = new RateLimitError('Too many requests', -1003, 429, 1000);
    expect(err).toBeInstanceOf(BinanceApiError);
    expect(err.retryAfterMs).toBe(1000);
    expect(err.name).toBe('RateLimitError');
  });

  it('NetworkError wraps the original cause', () => {
    const original = new Error('ECONNRESET');
    const err = new NetworkError('Network failure', original);
    expect(err).toBeInstanceOf(Error);
    expect(err.cause).toBe(original);
    expect(err.name).toBe('NetworkError');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/errors.test.ts`
Expected: FAIL — `src/errors/index.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

`src/errors/BinanceApiError.ts`:

```typescript
export class BinanceApiError extends Error {
  readonly code: number;
  readonly status: number;

  constructor(message: string, code: number, status: number) {
    super(message);
    this.name = 'BinanceApiError';
    this.code = code;
    this.status = status;
  }
}
```

`src/errors/RateLimitError.ts`:

```typescript
import { BinanceApiError } from './BinanceApiError.js';

export class RateLimitError extends BinanceApiError {
  readonly retryAfterMs?: number;

  constructor(message: string, code: number, status: number, retryAfterMs?: number) {
    super(message, code, status);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}
```

`src/errors/NetworkError.ts`:

```typescript
export class NetworkError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}
```

`src/errors/index.ts`:

```typescript
export { BinanceApiError } from './BinanceApiError.js';
export { RateLimitError } from './RateLimitError.js';
export { NetworkError } from './NetworkError.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/errors.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/errors test/errors.test.ts
git commit -m "feat: add typed errors (BinanceApiError, RateLimitError, NetworkError)"
```

---

### Task 3: HttpClient (rate limiting + retry)

**Files:**
- Create: `src/client/HttpClient.ts`
- Test: `test/client/HttpClient.test.ts`

**Interfaces:**
- Consumes: `BinanceApiError`, `RateLimitError`, `NetworkError` from `../errors/index.js` (Task 2).
- Produces: `class HttpClient { constructor(options: HttpClientOptions); get<T>(path: string, params?: Record<string, unknown>): Promise<T> }` where `HttpClientOptions = { baseURL: string; timeoutMs?: number; maxRetries?: number; minTimeMs?: number }`. Used by every REST resource (Tasks 5, 6, 10).

- [ ] **Step 1: Write the failing tests**

`test/client/HttpClient.test.ts`:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { HttpClient } from '../../src/client/HttpClient.js';
import { BinanceApiError, RateLimitError } from '../../src/errors/index.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('HttpClient', () => {
  it('returns parsed JSON on 200', async () => {
    server.use(http.get('https://api.example.com/ping', () => HttpResponse.json({ ok: true })));

    const client = new HttpClient({ baseURL: 'https://api.example.com' });
    await expect(client.get<{ ok: boolean }>('/ping')).resolves.toEqual({ ok: true });
  });

  it('throws BinanceApiError on 4xx with a {code,msg} body', async () => {
    server.use(
      http.get('https://api.example.com/bad', () =>
        HttpResponse.json({ code: -1121, msg: 'Invalid symbol.' }, { status: 400 }),
      ),
    );

    const client = new HttpClient({ baseURL: 'https://api.example.com' });
    await expect(client.get('/bad')).rejects.toThrow(BinanceApiError);
  });

  it('retries on 429 honoring Retry-After, then resolves', async () => {
    // Retry-After: '0' keeps the retry delay real but effectively instant —
    // fake timers don't reliably interleave with msw's Node-level request
    // interception, so real (tiny) delays are used instead.
    let calls = 0;
    server.use(
      http.get('https://api.example.com/limited', () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { code: -1003, msg: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': '0' } },
          );
        }
        return HttpResponse.json({ ok: true });
      }),
    );

    const client = new HttpClient({ baseURL: 'https://api.example.com', maxRetries: 2, minTimeMs: 0 });
    await expect(client.get<{ ok: boolean }>('/limited')).resolves.toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it('throws RateLimitError once retries are exhausted', async () => {
    server.use(
      http.get('https://api.example.com/always-limited', () =>
        HttpResponse.json(
          { code: -1003, msg: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': '0' } },
        ),
      ),
    );

    const client = new HttpClient({
      baseURL: 'https://api.example.com',
      maxRetries: 1,
      minTimeMs: 0,
    });
    await expect(client.get('/always-limited')).rejects.toThrow(RateLimitError);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/client/HttpClient.test.ts`
Expected: FAIL — `src/client/HttpClient.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

`src/client/HttpClient.ts`:

```typescript
import axios, { type AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';
import { BinanceApiError, NetworkError, RateLimitError } from '../errors/index.js';

export interface HttpClientOptions {
  baseURL: string;
  timeoutMs?: number;
  maxRetries?: number;
  minTimeMs?: number;
}

interface BinanceErrorBody {
  code?: number;
  msg?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HttpClient {
  private readonly axios: AxiosInstance;
  private readonly limiter: Bottleneck;
  private readonly maxRetries: number;

  constructor(options: HttpClientOptions) {
    this.axios = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeoutMs ?? 10_000,
    });
    this.limiter = new Bottleneck({ minTime: options.minTimeMs ?? 50 });
    this.maxRetries = options.maxRetries ?? 3;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.limiter.schedule(() => this.requestWithRetry<T>(path, params, 0));
  }

  private async requestWithRetry<T>(
    path: string,
    params: Record<string, unknown> | undefined,
    attempt: number,
  ): Promise<T> {
    try {
      const res = await this.axios.get<T>(path, { params });
      return res.data;
    } catch (err) {
      if (!axios.isAxiosError(err)) {
        throw new NetworkError('Unexpected error calling Binance API', err);
      }

      const status = err.response?.status;
      const body = err.response?.data as BinanceErrorBody | undefined;

      if ((status === 429 || status === 418) && attempt < this.maxRetries) {
        const retryAfterHeader = err.response?.headers['retry-after'];
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 2 ** attempt * 1000;
        await sleep(retryAfterMs);
        return this.requestWithRetry<T>(path, params, attempt + 1);
      }

      if (status === 429 || status === 418) {
        throw new RateLimitError(body?.msg ?? 'Binance rate limit exceeded', body?.code ?? -1, status);
      }

      if (status && body) {
        throw new BinanceApiError(body.msg ?? 'Binance API error', body.code ?? -1, status);
      }

      throw new NetworkError(err.message, err);
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/client/HttpClient.test.ts`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/client/HttpClient.ts test/client/HttpClient.test.ts
git commit -m "feat: add HttpClient with rate limiting and typed-error retry"
```

---

### Task 4: Market types (Spot + Futures shared shapes)

**Files:**
- Create: `src/types/market.types.ts`
- Test: `test/types/market.types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `KlineIntervalSchema`/`KlineInterval`, `KlineSchema`/`Kline`, `KlinesResponseSchema`, `TickerPriceSchema`/`TickerPrice`, `Ticker24hrSchema`/`Ticker24hr`, `BookTickerSchema`/`BookTicker`, `DepthSnapshotSchema`/`DepthSnapshot`, `TradeSchema`/`Trade`, `TradesResponseSchema`, `AggTradeSchema`/`AggTrade`, `AggTradesResponseSchema`, `AvgPriceSchema`/`AvgPrice`, `ExchangeInfoSchema`/`ExchangeInfo`. Used by `MarketDataBase`/`SpotMarket`/`FuturesMarket` (Task 5).

- [ ] **Step 1: Write the failing test**

`test/types/market.types.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  AggTradeSchema,
  AvgPriceSchema,
  BookTickerSchema,
  DepthSnapshotSchema,
  ExchangeInfoSchema,
  KlineSchema,
  Ticker24hrSchema,
  TickerPriceSchema,
  TradeSchema,
} from '../../src/types/market.types.js';

describe('market.types', () => {
  it('parses a raw kline tuple into a typed Kline', () => {
    const raw = [
      1499040000000, '0.01634790', '0.80000000', '0.01575800', '0.01577100',
      '148976.11427815', 1499644799999, '2434.19055334', 308,
      '1756.87402397', '28.46694368', '17928899.62484339',
    ];
    const kline = KlineSchema.parse(raw);
    expect(kline).toEqual({
      openTime: 1499040000000,
      open: 0.0163479,
      high: 0.8,
      low: 0.015758,
      close: 0.015771,
      volume: 148976.11427815,
      closeTime: 1499644799999,
      quoteAssetVolume: 2434.19055334,
      trades: 308,
      takerBuyBaseVolume: 1756.87402397,
      takerBuyQuoteVolume: 28.46694368,
    });
  });

  it('parses ticker/price, coercing price to a number', () => {
    const parsed = TickerPriceSchema.parse({ symbol: 'BTCUSDT', price: '45000.12' });
    expect(parsed.price).toBe(45000.12);
  });

  it('parses ticker/24hr', () => {
    const parsed = Ticker24hrSchema.parse({
      symbol: 'BTCUSDT', priceChange: '100', priceChangePercent: '1.5',
      weightedAvgPrice: '44950', lastPrice: '45000', lastQty: '0.01',
      openPrice: '44900', highPrice: '45500', lowPrice: '44800',
      volume: '1000', quoteVolume: '45000000', openTime: 1, closeTime: 2,
      firstId: 1, lastId: 100, count: 100,
    });
    expect(parsed.lastPrice).toBe(45000);
  });

  it('parses bookTicker', () => {
    const parsed = BookTickerSchema.parse({
      symbol: 'BTCUSDT', bidPrice: '44999', bidQty: '1', askPrice: '45001', askQty: '1',
    });
    expect(parsed.bidPrice).toBe(44999);
  });

  it('parses a depth snapshot into numeric price/qty levels', () => {
    const parsed = DepthSnapshotSchema.parse({
      lastUpdateId: 1,
      bids: [['44999.00', '1.5']],
      asks: [['45001.00', '2.0']],
    });
    expect(parsed.bids[0]).toEqual({ price: 44999, qty: 1.5 });
  });

  it('parses a trade', () => {
    const parsed = TradeSchema.parse({
      id: 1, price: '45000', qty: '0.01', quoteQty: '450', time: 1, isBuyerMaker: true,
    });
    expect(parsed.price).toBe(45000);
  });

  it('parses an aggTrade', () => {
    const parsed = AggTradeSchema.parse({
      a: 1, p: '45000', q: '0.01', f: 1, l: 1, T: 1, m: false,
    });
    expect(parsed.p).toBe(45000);
  });

  it('parses avgPrice', () => {
    const parsed = AvgPriceSchema.parse({ mins: 5, price: '45000' });
    expect(parsed.price).toBe(45000);
  });

  it('parses exchangeInfo, keeping unknown symbol fields via passthrough', () => {
    const parsed = ExchangeInfoSchema.parse({
      timezone: 'UTC',
      serverTime: 1,
      symbols: [{ symbol: 'BTCUSDT', status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'USDT', filters: [] }],
    });
    expect(parsed.symbols[0]?.symbol).toBe('BTCUSDT');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/types/market.types.test.ts`
Expected: FAIL — `src/types/market.types.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

`src/types/market.types.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/types/market.types.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/types/market.types.ts test/types/market.types.test.ts
git commit -m "feat: add market data zod schemas (kline, ticker, depth, trades)"
```

---

### Task 5: SpotMarket / FuturesMarket REST resources

**Files:**
- Create: `src/resources/MarketDataBase.ts`
- Create: `src/resources/SpotMarket.ts`
- Create: `src/resources/FuturesMarket.ts`
- Test: `test/resources/SpotMarket.test.ts`
- Test: `test/resources/FuturesMarket.test.ts`

**Interfaces:**
- Consumes: `HttpClient` (Task 3); all schemas/types from `market.types.ts` (Task 4).
- Produces: `class MarketDataBase { exchangeInfo(); klines(symbol, interval, opts?); tickerPrice(symbol); ticker24hr(symbol); bookTicker(symbol); depth(symbol, limit?); trades(symbol, limit?); aggTrades(symbol, opts?) }`, `class SpotMarket extends MarketDataBase { avgPrice(symbol) }`, `class FuturesMarket extends MarketDataBase {}`. Used by `BinanceClient` (Task 10).

- [ ] **Step 1: Write the failing tests**

`test/resources/SpotMarket.test.ts`:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { SpotMarket } from '../../src/resources/SpotMarket.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SpotMarket', () => {
  it('fetches and parses klines', async () => {
    server.use(
      http.get('https://api.binance.com/api/v3/klines', () =>
        HttpResponse.json([
          [1, '1', '2', '0.5', '1.5', '10', 2, '15', 3, '5', '7.5', '0'],
        ]),
      ),
    );

    const market = new SpotMarket();
    const klines = await market.klines('BTCUSDT', '15m');
    expect(klines[0]?.close).toBe(1.5);
  });

  it('fetches avgPrice (spot-only)', async () => {
    server.use(
      http.get('https://api.binance.com/api/v3/avgPrice', () =>
        HttpResponse.json({ mins: 5, price: '45000' }),
      ),
    );

    const market = new SpotMarket();
    const avg = await market.avgPrice('BTCUSDT');
    expect(avg.price).toBe(45000);
  });
});
```

`test/resources/FuturesMarket.test.ts`:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FuturesMarket } from '../../src/resources/FuturesMarket.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('FuturesMarket', () => {
  it('fetches and parses klines from the fapi base URL', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/klines', () =>
        HttpResponse.json([
          [1, '1', '2', '0.5', '1.5', '10', 2, '15', 3, '5', '7.5', '0'],
        ]),
      ),
    );

    const market = new FuturesMarket();
    const klines = await market.klines('SOLUSDT', '15m');
    expect(klines[0]?.close).toBe(1.5);
  });

  it('fetches ticker24hr', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/ticker/24hr', () =>
        HttpResponse.json({
          symbol: 'SOLUSDT', priceChange: '1', priceChangePercent: '1',
          weightedAvgPrice: '100', lastPrice: '101', lastQty: '1',
          openPrice: '100', highPrice: '102', lowPrice: '99',
          volume: '1000', quoteVolume: '100000', openTime: 1, closeTime: 2,
          firstId: 1, lastId: 2, count: 2,
        }),
      ),
    );

    const market = new FuturesMarket();
    const ticker = await market.ticker24hr('SOLUSDT');
    expect(ticker.lastPrice).toBe(101);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/resources/SpotMarket.test.ts test/resources/FuturesMarket.test.ts`
Expected: FAIL — resource files do not exist.

- [ ] **Step 3: Write minimal implementation**

`src/resources/MarketDataBase.ts`:

```typescript
import type { HttpClient } from '../client/HttpClient.js';
import {
  AggTrade,
  AggTradesResponseSchema,
  BookTicker,
  BookTickerSchema,
  DepthSnapshot,
  DepthSnapshotSchema,
  ExchangeInfo,
  ExchangeInfoSchema,
  Kline,
  KlineInterval,
  KlinesResponseSchema,
  Ticker24hr,
  Ticker24hrSchema,
  TickerPrice,
  TickerPriceSchema,
  Trade,
  TradesResponseSchema,
} from '../types/market.types.js';

export class MarketDataBase {
  constructor(protected readonly http: HttpClient) {}

  async exchangeInfo(): Promise<ExchangeInfo> {
    return ExchangeInfoSchema.parse(await this.http.get('/exchangeInfo'));
  }

  async klines(
    symbol: string,
    interval: KlineInterval,
    options?: { startTime?: number; endTime?: number; limit?: number },
  ): Promise<Kline[]> {
    const data = await this.http.get('/klines', {
      symbol,
      interval,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit ?? 500,
    });
    return KlinesResponseSchema.parse(data);
  }

  async tickerPrice(symbol: string): Promise<TickerPrice> {
    return TickerPriceSchema.parse(await this.http.get('/ticker/price', { symbol }));
  }

  async ticker24hr(symbol: string): Promise<Ticker24hr> {
    return Ticker24hrSchema.parse(await this.http.get('/ticker/24hr', { symbol }));
  }

  async bookTicker(symbol: string): Promise<BookTicker> {
    return BookTickerSchema.parse(await this.http.get('/ticker/bookTicker', { symbol }));
  }

  async depth(symbol: string, limit = 100): Promise<DepthSnapshot> {
    return DepthSnapshotSchema.parse(await this.http.get('/depth', { symbol, limit }));
  }

  async trades(symbol: string, limit = 500): Promise<Trade[]> {
    return TradesResponseSchema.parse(await this.http.get('/trades', { symbol, limit }));
  }

  async aggTrades(
    symbol: string,
    options?: { startTime?: number; endTime?: number; limit?: number },
  ): Promise<AggTrade[]> {
    const data = await this.http.get('/aggTrades', {
      symbol,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit ?? 500,
    });
    return AggTradesResponseSchema.parse(data);
  }
}
```

`src/resources/SpotMarket.ts`:

```typescript
import { HttpClient } from '../client/HttpClient.js';
import { MarketDataBase } from './MarketDataBase.js';
import { AvgPrice, AvgPriceSchema } from '../types/market.types.js';

export class SpotMarket extends MarketDataBase {
  constructor() {
    super(new HttpClient({ baseURL: 'https://api.binance.com/api/v3' }));
  }

  async avgPrice(symbol: string): Promise<AvgPrice> {
    return AvgPriceSchema.parse(await this.http.get('/avgPrice', { symbol }));
  }
}
```

`src/resources/FuturesMarket.ts`:

```typescript
import { HttpClient } from '../client/HttpClient.js';
import { MarketDataBase } from './MarketDataBase.js';

export class FuturesMarket extends MarketDataBase {
  constructor() {
    super(new HttpClient({ baseURL: 'https://fapi.binance.com/fapi/v1' }));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/resources/SpotMarket.test.ts test/resources/FuturesMarket.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/resources/MarketDataBase.ts src/resources/SpotMarket.ts src/resources/FuturesMarket.ts test/resources/SpotMarket.test.ts test/resources/FuturesMarket.test.ts
git commit -m "feat: add SpotMarket/FuturesMarket REST resources"
```

---

### Task 6: Futures-only data (funding, OI, long/short ratios)

**Files:**
- Create: `src/types/futures.types.ts`
- Create: `src/resources/FuturesData.ts`
- Test: `test/resources/FuturesData.test.ts`

**Interfaces:**
- Consumes: `HttpClient` (Task 3).
- Produces: `FundingRateSchema`/`FundingRate`, `PremiumIndexSchema`/`PremiumIndex`, `OpenInterestSchema`/`OpenInterest`, `OpenInterestHistEntrySchema`/`OpenInterestHistEntry`, `LongShortRatioEntrySchema`/`LongShortRatioEntry`, `TakerLongShortRatioEntrySchema`/`TakerLongShortRatioEntry`; `class FuturesData { fundingRateHistory(symbol, opts?); premiumIndex(symbol); openInterest(symbol); openInterestHist(symbol, period, limit?); topLongShortAccountRatio(symbol, period, limit?); topLongShortPositionRatio(symbol, period, limit?); globalLongShortAccountRatio(symbol, period, limit?); takerLongShortRatio(symbol, period, limit?) }`. Used by `BinanceClient` (Task 10).

- [ ] **Step 1: Write the failing test**

`test/resources/FuturesData.test.ts`:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FuturesData } from '../../src/resources/FuturesData.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('FuturesData', () => {
  it('fetches funding rate history', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/fundingRate', () =>
        HttpResponse.json([{ symbol: 'ETHUSDT', fundingTime: 1, fundingRate: '0.0001' }]),
      ),
    );

    const data = new FuturesData();
    const history = await data.fundingRateHistory('ETHUSDT', { limit: 1 });
    expect(history[0]?.fundingRate).toBe(0.0001);
  });

  it('fetches premiumIndex (mark price)', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/premiumIndex', () =>
        HttpResponse.json({
          symbol: 'ETHUSDT', markPrice: '2500', indexPrice: '2499', estimatedSettlePrice: '2500',
          lastFundingRate: '0.0001', nextFundingTime: 1, interestRate: '0.0001', time: 1,
        }),
      ),
    );

    const data = new FuturesData();
    const premium = await data.premiumIndex('ETHUSDT');
    expect(premium.markPrice).toBe(2500);
  });

  it('fetches openInterestHist from the /futures/data base', async () => {
    server.use(
      http.get('https://fapi.binance.com/futures/data/openInterestHist', () =>
        HttpResponse.json([
          { symbol: 'ETHUSDT', sumOpenInterest: '1000', sumOpenInterestValue: '2500000', timestamp: 1 },
        ]),
      ),
    );

    const data = new FuturesData();
    const hist = await data.openInterestHist('ETHUSDT', '5m');
    expect(hist[0]?.sumOpenInterest).toBe(1000);
  });

  it('fetches globalLongShortAccountRatio', async () => {
    server.use(
      http.get('https://fapi.binance.com/futures/data/globalLongShortAccountRatio', () =>
        HttpResponse.json([
          { symbol: 'ETHUSDT', longShortRatio: '1.5', longAccount: '0.6', shortAccount: '0.4', timestamp: 1 },
        ]),
      ),
    );

    const data = new FuturesData();
    const ratio = await data.globalLongShortAccountRatio('ETHUSDT', '5m');
    expect(ratio[0]?.longShortRatio).toBe(1.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/resources/FuturesData.test.ts`
Expected: FAIL — `src/resources/FuturesData.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

`src/types/futures.types.ts`:

```typescript
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
```

`src/resources/FuturesData.ts`:

```typescript
import { HttpClient } from '../client/HttpClient.js';
import {
  FundingRate,
  FundingRateHistorySchema,
  LongShortRatioEntry,
  LongShortRatioSchema,
  OpenInterest,
  OpenInterestHistEntry,
  OpenInterestHistSchema,
  OpenInterestSchema,
  PremiumIndex,
  PremiumIndexSchema,
  TakerLongShortRatioEntry,
  TakerLongShortRatioSchema,
} from '../types/futures.types.js';

export class FuturesData {
  private readonly http: HttpClient;
  private readonly dataHttp: HttpClient;

  constructor() {
    this.http = new HttpClient({ baseURL: 'https://fapi.binance.com/fapi/v1' });
    this.dataHttp = new HttpClient({ baseURL: 'https://fapi.binance.com/futures/data' });
  }

  async fundingRateHistory(
    symbol: string,
    options?: { startTime?: number; endTime?: number; limit?: number },
  ): Promise<FundingRate[]> {
    const data = await this.http.get('/fundingRate', {
      symbol,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit ?? 100,
    });
    return FundingRateHistorySchema.parse(data);
  }

  async premiumIndex(symbol: string): Promise<PremiumIndex> {
    return PremiumIndexSchema.parse(await this.http.get('/premiumIndex', { symbol }));
  }

  async openInterest(symbol: string): Promise<OpenInterest> {
    return OpenInterestSchema.parse(await this.http.get('/openInterest', { symbol }));
  }

  async openInterestHist(symbol: string, period: string, limit = 30): Promise<OpenInterestHistEntry[]> {
    const data = await this.dataHttp.get('/openInterestHist', { symbol, period, limit });
    return OpenInterestHistSchema.parse(data);
  }

  async topLongShortAccountRatio(symbol: string, period: string, limit = 30): Promise<LongShortRatioEntry[]> {
    const data = await this.dataHttp.get('/topLongShortAccountRatio', { symbol, period, limit });
    return LongShortRatioSchema.parse(data);
  }

  async topLongShortPositionRatio(symbol: string, period: string, limit = 30): Promise<LongShortRatioEntry[]> {
    const data = await this.dataHttp.get('/topLongShortPositionRatio', { symbol, period, limit });
    return LongShortRatioSchema.parse(data);
  }

  async globalLongShortAccountRatio(symbol: string, period: string, limit = 30): Promise<LongShortRatioEntry[]> {
    const data = await this.dataHttp.get('/globalLongShortAccountRatio', { symbol, period, limit });
    return LongShortRatioSchema.parse(data);
  }

  async takerLongShortRatio(symbol: string, period: string, limit = 30): Promise<TakerLongShortRatioEntry[]> {
    const data = await this.dataHttp.get('/takerlongshortRatio', { symbol, period, limit });
    return TakerLongShortRatioSchema.parse(data);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/resources/FuturesData.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/types/futures.types.ts src/resources/FuturesData.ts test/resources/FuturesData.test.ts
git commit -m "feat: add FuturesData resource (funding, OI, long/short ratios)"
```

---

### Task 7: WebSocket payload types

**Files:**
- Create: `src/types/ws.types.ts`
- Test: `test/types/ws.types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `WsKlinePayloadSchema`/`WsKlinePayload`, `WsAggTradePayloadSchema`/`WsAggTradePayload`, `WsTradePayloadSchema`/`WsTradePayload`, `WsDepthUpdatePayloadSchema`/`WsDepthUpdatePayload`, `WsTicker24hrPayloadSchema`/`WsTicker24hrPayload`, `WsBookTickerPayloadSchema`/`WsBookTickerPayload`, `WsMarkPricePayloadSchema`/`WsMarkPricePayload`, union type `WsStreamPayload`, and `function parseWsPayload(streamName: string, raw: unknown): WsStreamPayload`. Used by `BaseWS` (Task 8).

- [ ] **Step 1: Write the failing test**

`test/types/ws.types.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { parseWsPayload } from '../../src/types/ws.types.js';

describe('ws.types', () => {
  it('parses a kline stream payload', () => {
    const payload = parseWsPayload('btcusdt@kline_1m', {
      e: 'kline', E: 1, s: 'BTCUSDT',
      k: { t: 1, T: 2, s: 'BTCUSDT', i: '1m', o: '1', c: '2', h: '3', l: '0.5', v: '10', n: 5, x: false, q: '20', V: '5', Q: '10' },
    });
    expect(payload).toMatchObject({ e: 'kline', k: { o: 1, c: 2 } });
  });

  it('parses an aggTrade stream payload', () => {
    const payload = parseWsPayload('ethusdt@aggTrade', {
      e: 'aggTrade', E: 1, s: 'ETHUSDT', a: 1, p: '2500', q: '1', f: 1, l: 1, T: 1, m: false,
    });
    expect(payload).toMatchObject({ e: 'aggTrade', p: 2500 });
  });

  it('parses a markPrice stream payload (futures only)', () => {
    const payload = parseWsPayload('ethusdt@markPrice@1s', {
      e: 'markPriceUpdate', E: 1, s: 'ETHUSDT', p: '2500', i: '2499', P: '2500', r: '0.0001', T: 1,
    });
    expect(payload).toMatchObject({ e: 'markPriceUpdate', p: 2500 });
  });

  it('throws on an unrecognized stream name', () => {
    expect(() => parseWsPayload('ethusdt@unknownStream', {})).toThrow(/Unknown WS stream/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/types/ws.types.test.ts`
Expected: FAIL — `src/types/ws.types.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

`src/types/ws.types.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/types/ws.types.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/types/ws.types.ts test/types/ws.types.test.ts
git commit -m "feat: add WS stream payload zod schemas and dispatcher"
```

---

### Task 8: BaseWS (combined-stream client with reconnect)

**Files:**
- Create: `src/ws/BaseWS.ts`
- Test: `test/ws/BaseWS.test.ts`

**Interfaces:**
- Consumes: `parseWsPayload`, `WsStreamPayload` from `../types/ws.types.js` (Task 7).
- Produces: `class BaseWS extends EventEmitter { constructor(options: { baseStreamUrl: string; reconnectDelayMs?: number; maxReconnectDelayMs?: number }); subscribe(streams: string[]): void; unsubscribe(streams: string[]): void; close(): void }`. Emits `'open'`, `'close'`, `'error'`, `'message'` (args: `stream: string, payload: WsStreamPayload`), and one event per stream name (args: `payload: WsStreamPayload`). Used by `SpotMarketWS`/`FuturesMarketWS` (Task 9).

- [ ] **Step 1: Write the failing tests**

`test/ws/BaseWS.test.ts`:

```typescript
import { WebSocketServer } from 'ws';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BaseWS } from '../../src/ws/BaseWS.js';

describe('BaseWS', () => {
  let server: WebSocketServer;
  let port: number;

  beforeEach(async () => {
    server = new WebSocketServer({ port: 0 });
    await new Promise<void>((resolve) => server.once('listening', resolve));
    port = (server.address() as { port: number }).port;
  });

  afterEach(() => {
    server.close();
  });

  it('emits a parsed payload for a combined-stream kline message', async () => {
    server.on('connection', (socket) => {
      socket.send(
        JSON.stringify({
          stream: 'btcusdt@kline_1m',
          data: {
            e: 'kline', E: 1, s: 'BTCUSDT',
            k: { t: 1, T: 2, s: 'BTCUSDT', i: '1m', o: '1', c: '2', h: '3', l: '0.5', v: '10', n: 5, x: false, q: '20', V: '5', Q: '10' },
          },
        }),
      );
    });

    const client = new BaseWS({ baseStreamUrl: `ws://localhost:${port}/stream` });
    const received = new Promise<{ stream: string; payload: { k: { o: number } } }>((resolve) => {
      client.once('message', (stream: string, payload: { k: { o: number } }) => resolve({ stream, payload }));
    });
    client.subscribe(['btcusdt@kline_1m']);

    const result = await received;
    expect(result.stream).toBe('btcusdt@kline_1m');
    expect(result.payload.k.o).toBe(1);
    client.close();
  });

  it('also emits on the stream-name-specific event', async () => {
    server.on('connection', (socket) => {
      socket.send(
        JSON.stringify({
          stream: 'ethusdt@markPrice@1s',
          data: { e: 'markPriceUpdate', E: 1, s: 'ETHUSDT', p: '2500', i: '2499', P: '2500', r: '0.0001', T: 1 },
        }),
      );
    });

    const client = new BaseWS({ baseStreamUrl: `ws://localhost:${port}/stream` });
    const received = new Promise<{ p: number }>((resolve) => {
      client.once('ethusdt@markPrice@1s', (payload: { p: number }) => resolve(payload));
    });
    client.subscribe(['ethusdt@markPrice@1s']);

    const result = await received;
    expect(result.p).toBe(2500);
    client.close();
  });

  it('reconnects after the server drops the connection', async () => {
    let connections = 0;
    server.on('connection', (socket) => {
      connections += 1;
      if (connections === 1) socket.close();
    });

    const client = new BaseWS({
      baseStreamUrl: `ws://localhost:${port}/stream`,
      reconnectDelayMs: 20,
      maxReconnectDelayMs: 20,
    });
    client.subscribe(['btcusdt@kline_1m']);

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (connections >= 2) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    expect(connections).toBeGreaterThanOrEqual(2);
    client.close();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/ws/BaseWS.test.ts`
Expected: FAIL — `src/ws/BaseWS.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

`src/ws/BaseWS.ts`:

```typescript
import { EventEmitter } from 'node:events';
import WebSocket, { type RawData } from 'ws';
import { parseWsPayload, type WsStreamPayload } from '../types/ws.types.js';

export interface BaseWSOptions {
  baseStreamUrl: string;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}

interface CombinedStreamMessage {
  stream: string;
  data: unknown;
}

export class BaseWS extends EventEmitter {
  private ws: WebSocket | null = null;
  private readonly streams = new Set<string>();
  private reconnectAttempt = 0;
  private closedByUser = false;

  constructor(private readonly options: BaseWSOptions) {
    super();
  }

  subscribe(streams: string[]): void {
    streams.forEach((s) => this.streams.add(s));
    if (this.isOpen()) {
      this.send({ method: 'SUBSCRIBE', params: streams, id: Date.now() });
    } else {
      this.connect();
    }
  }

  unsubscribe(streams: string[]): void {
    streams.forEach((s) => this.streams.delete(s));
    if (this.isOpen()) {
      this.send({ method: 'UNSUBSCRIBE', params: streams, id: Date.now() });
    }
  }

  close(): void {
    this.closedByUser = true;
    this.ws?.close();
  }

  private isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(payload: unknown): void {
    this.ws?.send(JSON.stringify(payload));
  }

  private connect(): void {
    this.closedByUser = false;
    const url = `${this.options.baseStreamUrl}?streams=${[...this.streams].join('/')}`;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      this.reconnectAttempt = 0;
      this.emit('open');
    });

    this.ws.on('message', (raw: RawData) => {
      this.handleMessage(raw.toString());
    });

    this.ws.on('close', () => {
      this.emit('close');
      if (!this.closedByUser) this.scheduleReconnect();
    });

    this.ws.on('error', (err: Error) => {
      this.emit('error', err);
    });
  }

  private handleMessage(raw: string): void {
    let parsed: CombinedStreamMessage;
    try {
      parsed = JSON.parse(raw) as CombinedStreamMessage;
    } catch {
      return;
    }
    if (!parsed.stream || parsed.data === undefined) return;

    try {
      const payload: WsStreamPayload = parseWsPayload(parsed.stream, parsed.data);
      this.emit('message', parsed.stream, payload);
      this.emit(parsed.stream, payload);
    } catch (err) {
      this.emit('error', err);
    }
  }

  private scheduleReconnect(): void {
    const base = this.options.reconnectDelayMs ?? 1000;
    const max = this.options.maxReconnectDelayMs ?? 30_000;
    const delay = Math.min(base * 2 ** this.reconnectAttempt, max);
    this.reconnectAttempt += 1;
    setTimeout(() => {
      if (!this.closedByUser) this.connect();
    }, delay);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/ws/BaseWS.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ws/BaseWS.ts test/ws/BaseWS.test.ts
git commit -m "feat: add BaseWS combined-stream client with reconnect"
```

---

### Task 9: SpotMarketWS / FuturesMarketWS

**Files:**
- Create: `src/ws/SpotMarketWS.ts`
- Create: `src/ws/FuturesMarketWS.ts`
- Test: `test/ws/SpotMarketWS.test.ts`
- Test: `test/ws/FuturesMarketWS.test.ts`

**Interfaces:**
- Consumes: `BaseWS` (Task 8), `KlineInterval` (Task 4).
- Produces: `class SpotMarketWS extends BaseWS { kline(symbol, interval): string; aggTrade(symbol): string; trade(symbol): string; depth(symbol): string; ticker(symbol): string; bookTicker(symbol): string }`, `class FuturesMarketWS extends BaseWS { kline(symbol, interval): string; aggTrade(symbol): string; trade(symbol): string; depth(symbol): string; ticker(symbol): string; markPrice(symbol, updateSpeed?): string; bookTicker(symbol): string }`. Used by `BinanceClient` (Task 10).

- [ ] **Step 1: Write the failing tests**

`test/ws/SpotMarketWS.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { SpotMarketWS } from '../../src/ws/SpotMarketWS.js';

describe('SpotMarketWS', () => {
  it('builds correct stream names', () => {
    const ws = new SpotMarketWS();
    expect(ws.kline('BTCUSDT', '15m')).toBe('btcusdt@kline_15m');
    expect(ws.aggTrade('BTCUSDT')).toBe('btcusdt@aggTrade');
    expect(ws.trade('BTCUSDT')).toBe('btcusdt@trade');
    expect(ws.depth('BTCUSDT')).toBe('btcusdt@depth');
    expect(ws.ticker('BTCUSDT')).toBe('btcusdt@ticker');
    expect(ws.bookTicker('BTCUSDT')).toBe('btcusdt@bookTicker');
    ws.close();
  });
});
```

`test/ws/FuturesMarketWS.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { FuturesMarketWS } from '../../src/ws/FuturesMarketWS.js';

describe('FuturesMarketWS', () => {
  it('builds correct stream names', () => {
    const ws = new FuturesMarketWS();
    expect(ws.kline('SOLUSDT', '5m')).toBe('solusdt@kline_5m');
    expect(ws.aggTrade('SOLUSDT')).toBe('solusdt@aggTrade');
    expect(ws.trade('SOLUSDT')).toBe('solusdt@trade');
    expect(ws.depth('SOLUSDT')).toBe('solusdt@depth');
    expect(ws.ticker('SOLUSDT')).toBe('solusdt@ticker');
    expect(ws.markPrice('SOLUSDT')).toBe('solusdt@markPrice');
    expect(ws.markPrice('SOLUSDT', '1s')).toBe('solusdt@markPrice@1s');
    expect(ws.bookTicker('SOLUSDT')).toBe('solusdt@bookTicker');
    ws.close();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/ws/SpotMarketWS.test.ts test/ws/FuturesMarketWS.test.ts`
Expected: FAIL — files do not exist.

- [ ] **Step 3: Write minimal implementation**

`src/ws/SpotMarketWS.ts`:

```typescript
import { BaseWS } from './BaseWS.js';
import type { KlineInterval } from '../types/market.types.js';

export class SpotMarketWS extends BaseWS {
  constructor() {
    super({ baseStreamUrl: 'wss://stream.binance.com:9443/stream' });
  }

  kline(symbol: string, interval: KlineInterval): string {
    return `${symbol.toLowerCase()}@kline_${interval}`;
  }

  aggTrade(symbol: string): string {
    return `${symbol.toLowerCase()}@aggTrade`;
  }

  trade(symbol: string): string {
    return `${symbol.toLowerCase()}@trade`;
  }

  depth(symbol: string): string {
    return `${symbol.toLowerCase()}@depth`;
  }

  ticker(symbol: string): string {
    return `${symbol.toLowerCase()}@ticker`;
  }

  bookTicker(symbol: string): string {
    return `${symbol.toLowerCase()}@bookTicker`;
  }
}
```

`src/ws/FuturesMarketWS.ts`:

```typescript
import { BaseWS } from './BaseWS.js';
import type { KlineInterval } from '../types/market.types.js';

export class FuturesMarketWS extends BaseWS {
  constructor() {
    super({ baseStreamUrl: 'wss://fstream.binance.com/stream' });
  }

  kline(symbol: string, interval: KlineInterval): string {
    return `${symbol.toLowerCase()}@kline_${interval}`;
  }

  aggTrade(symbol: string): string {
    return `${symbol.toLowerCase()}@aggTrade`;
  }

  trade(symbol: string): string {
    return `${symbol.toLowerCase()}@trade`;
  }

  depth(symbol: string): string {
    return `${symbol.toLowerCase()}@depth`;
  }

  ticker(symbol: string): string {
    return `${symbol.toLowerCase()}@ticker`;
  }

  markPrice(symbol: string, updateSpeed?: '1s'): string {
    return `${symbol.toLowerCase()}@markPrice${updateSpeed === '1s' ? '@1s' : ''}`;
  }

  bookTicker(symbol: string): string {
    return `${symbol.toLowerCase()}@bookTicker`;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/ws/SpotMarketWS.test.ts test/ws/FuturesMarketWS.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ws/SpotMarketWS.ts src/ws/FuturesMarketWS.ts test/ws/SpotMarketWS.test.ts test/ws/FuturesMarketWS.test.ts
git commit -m "feat: add SpotMarketWS/FuturesMarketWS stream-name builders"
```

---

### Task 10: BinanceClient facade + public exports

**Files:**
- Create: `src/client/BinanceClient.ts`
- Modify: `src/index.ts`
- Test: `test/client/BinanceClient.test.ts`

**Interfaces:**
- Consumes: `SpotMarket`, `FuturesMarket` (Task 5); `FuturesData` (Task 6); `SpotMarketWS`, `FuturesMarketWS` (Task 9).
- Produces: `class BinanceClient { spot: { market: SpotMarket; ws: SpotMarketWS }; futures: { market: FuturesMarket; data: FuturesData; ws: FuturesMarketWS } }`. This is the package's main public entry point — everything else is re-exported from `src/index.ts` for consumers (e.g. `edge-backtester`, sub-project 2) to import.

- [ ] **Step 1: Write the failing test**

`test/client/BinanceClient.test.ts`:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BinanceClient } from '../../src/client/BinanceClient.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('BinanceClient', () => {
  it('fetches spot klines through client.spot.market', async () => {
    server.use(
      http.get('https://api.binance.com/api/v3/klines', () =>
        HttpResponse.json([[1, '1', '2', '0.5', '1.5', '10', 2, '15', 3, '5', '7.5', '0']]),
      ),
    );

    const client = new BinanceClient();
    const klines = await client.spot.market.klines('SOLUSDT', '15m');
    expect(klines[0]?.close).toBe(1.5);
  });

  it('fetches futures funding rate through client.futures.data', async () => {
    server.use(
      http.get('https://fapi.binance.com/fapi/v1/fundingRate', () =>
        HttpResponse.json([{ symbol: 'XRPUSDT', fundingTime: 1, fundingRate: '0.0002' }]),
      ),
    );

    const client = new BinanceClient();
    const history = await client.futures.data.fundingRateHistory('XRPUSDT');
    expect(history[0]?.fundingRate).toBe(0.0002);
    client.futures.ws.close();
    client.spot.ws.close();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/client/BinanceClient.test.ts`
Expected: FAIL — `src/client/BinanceClient.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

`src/client/BinanceClient.ts`:

```typescript
import { FuturesData } from '../resources/FuturesData.js';
import { FuturesMarket } from '../resources/FuturesMarket.js';
import { SpotMarket } from '../resources/SpotMarket.js';
import { FuturesMarketWS } from '../ws/FuturesMarketWS.js';
import { SpotMarketWS } from '../ws/SpotMarketWS.js';

export class BinanceClient {
  readonly spot: { market: SpotMarket; ws: SpotMarketWS };
  readonly futures: { market: FuturesMarket; data: FuturesData; ws: FuturesMarketWS };

  constructor() {
    this.spot = { market: new SpotMarket(), ws: new SpotMarketWS() };
    this.futures = { market: new FuturesMarket(), data: new FuturesData(), ws: new FuturesMarketWS() };
  }
}
```

`src/index.ts` (replace the Task-1 placeholder):

```typescript
export const VERSION = '0.1.0';

export { BinanceClient } from './client/BinanceClient.js';
export { HttpClient } from './client/HttpClient.js';
export type { HttpClientOptions } from './client/HttpClient.js';

export { MarketDataBase } from './resources/MarketDataBase.js';
export { SpotMarket } from './resources/SpotMarket.js';
export { FuturesMarket } from './resources/FuturesMarket.js';
export { FuturesData } from './resources/FuturesData.js';

export { BaseWS } from './ws/BaseWS.js';
export type { BaseWSOptions } from './ws/BaseWS.js';
export { SpotMarketWS } from './ws/SpotMarketWS.js';
export { FuturesMarketWS } from './ws/FuturesMarketWS.js';

export * from './types/market.types.js';
export * from './types/futures.types.js';
export * from './types/ws.types.js';
export * from './errors/index.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/client/BinanceClient.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — all tests from Tasks 1-10 green.

- [ ] **Step 6: Commit**

```bash
git add src/client/BinanceClient.ts src/index.ts test/client/BinanceClient.test.ts
git commit -m "feat: add BinanceClient facade and public API surface"
```

---

### Task 11: Smoke script, README, final verification

**Files:**
- Create: `scripts/smoke-test.ts`
- Create: `README.md`

**Interfaces:**
- Consumes: `BinanceClient` from `../src/index.js` (Task 10).
- Produces: nothing consumed by other tasks — this is the terminal task.

- [ ] **Step 1: Write `scripts/smoke-test.ts`**

```typescript
import { BinanceClient } from '../src/index.js';

async function main(): Promise<void> {
  const client = new BinanceClient();

  const klines = await client.spot.market.klines('BTCUSDT', '15m', { limit: 5 });
  console.log(`Spot BTCUSDT klines: ${klines.length} candles, last close ${klines.at(-1)?.close}`);

  const funding = await client.futures.data.fundingRateHistory('BTCUSDT', { limit: 1 });
  console.log(`Futures BTCUSDT last funding rate: ${funding[0]?.fundingRate}`);

  const oi = await client.futures.data.openInterest('BTCUSDT');
  console.log(`Futures BTCUSDT open interest: ${oi.openInterest}`);

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('WS: no message received within 10s (outbound WS may be blocked in this network)');
      resolve();
    }, 10_000);

    client.futures.ws.once('message', (stream: string, payload: unknown) => {
      clearTimeout(timeout);
      console.log(`WS message on ${stream}:`, payload);
      resolve();
    });
    client.futures.ws.subscribe([client.futures.ws.markPrice('BTCUSDT', '1s')]);
  });

  client.futures.ws.close();
  client.spot.ws.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the smoke script against the live Binance API**

Run: `npm run smoke`
Expected: prints spot klines, futures funding rate, futures open interest, then either one WS mark-price message or a 10s WS timeout warning, then exits cleanly (no hang, no unhandled rejection). Requires outbound network access; some sandboxed networks allow REST but block persistent WS delivery — the timeout warning is an acceptable outcome there, not a failure.

- [ ] **Step 3: Write `README.md`**

```markdown
# binance-sdk

TypeScript client for Binance's **public** REST + WebSocket APIs — Spot and USD-M Futures.
Public market data only: no API keys, no account/order endpoints.

Canonical Binance client for the `trading-workspace` `sdk/` directory (mirrors `sdk/dhanhq-ts`'s
role for DhanHQ). Built for `edge-backtester` (historical data) and any future TS bot/tool that
needs Binance market data.

## Install

Not yet published. Reference via a local path or git URL, e.g.:

\`\`\`json
{ "dependencies": { "binance-sdk": "file:../binance-sdk" } }
\`\`\`

## Usage

\`\`\`typescript
import { BinanceClient } from 'binance-sdk';

const client = new BinanceClient();

// REST
const klines = await client.spot.market.klines('SOLUSDT', '15m', { limit: 500 });
const funding = await client.futures.data.fundingRateHistory('ETHUSDT', { limit: 100 });
const oi = await client.futures.data.openInterest('XRPUSDT');

// WebSocket (combined stream, auto-reconnect)
client.futures.ws.subscribe([
  client.futures.ws.kline('SOLUSDT', '15m'),
  client.futures.ws.markPrice('ETHUSDT', '1s'),
]);
client.futures.ws.on('message', (stream, payload) => console.log(stream, payload));
\`\`\`

## Scope

- Spot (`api.binance.com`) and USD-M Futures (`fapi.binance.com`) REST: klines, tickers, depth,
  trades, aggTrades, exchangeInfo, avgPrice (spot), funding rate/premium index/open
  interest/long-short ratios (futures).
- Public WS combined streams for both markets: kline, aggTrade, trade, depth, ticker,
  bookTicker, and futures-only markPrice.
- No authenticated endpoints in this version.

## Development

\`\`\`bash
npm install
npm test        # vitest, HTTP/WS mocked
npm run build    # tsup -> dist/ (ESM + CJS + .d.ts)
npm run smoke    # hits live public Binance endpoints, no keys needed
\`\`\`
```

- [ ] **Step 4: Full verification**

Run: `npm run build && npm run typecheck && npm test`
Expected: build succeeds (`dist/index.js`, `dist/index.cjs`, `dist/index.d.ts` produced), typecheck clean, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke-test.ts README.md
git commit -m "docs: add smoke test script and README"
```
