import type { BinanceClient } from '../client/BinanceClient.js';
import { accountTools } from './account.tools.js';
import { derivedTools } from './derived.tools.js';
import { marketDataTools } from './market-data.tools.js';
import { tradingTools } from './trading.tools.js';
import { wsTools } from './ws.tools.js';
import type { ToolDefinition } from './types.js';
import { toToolList } from './types.js';

export type { ToolDefinition, ToolContext } from './types.js';
export { toJsonSchema, toOpenAITool, toAnthropicTool, toMCPTool, toToolList, textResult } from './types.js';
export { marketDataTools } from './market-data.tools.js';
export { accountTools } from './account.tools.js';
export { tradingTools } from './trading.tools.js';
export { derivedTools } from './derived.tools.js';
export { wsTools, getBufferedWsEvents, clearBufferedWsEvents } from './ws.tools.js';

export interface FuturesToolkit {
  client: BinanceClient;
  tools: ToolDefinition[];
  market: ToolDefinition[];
  account: ToolDefinition[];
  trading: ToolDefinition[];
  ws: ToolDefinition[];
  /** Composite tools that fan out over several endpoints. */
  derived: ToolDefinition[];
}

export function createFuturesToolkit(client: BinanceClient): FuturesToolkit {
  const market = marketDataTools(client);
  const account = accountTools(client);
  const trading = tradingTools(client);
  const ws = wsTools(client);
  const derived = derivedTools(client);
  return {
    client,
    tools: [...market, ...account, ...trading, ...ws, ...derived],
    market,
    account,
    trading,
    ws,
    derived,
  };
}

export function toolkitToFormats(toolkit: FuturesToolkit): {
  openai: Record<string, unknown>[];
  anthropic: Record<string, unknown>[];
  mcp: Record<string, unknown>[];
} {
  return {
    openai: toToolList(toolkit.tools, 'openai'),
    anthropic: toToolList(toolkit.tools, 'anthropic'),
    mcp: toToolList(toolkit.tools, 'mcp'),
  };
}
