import type { BinanceClient } from '../client/BinanceClient.js';
import { accountTools } from './account.tools.js';
import { marketDataTools } from './market-data.tools.js';
import { createPaperContext, type PaperContext, paperTools } from './paper.tools.js';
import { tradingTools } from './trading.tools.js';
import { wsTools } from './ws.tools.js';
import type { ToolDefinition } from './types.js';
import { toToolList } from './types.js';

export type { ToolDefinition, ToolContext } from './types.js';
export { toJsonSchema, toOpenAITool, toAnthropicTool, toMCPTool, toToolList, textResult } from './types.js';
export { marketDataTools } from './market-data.tools.js';
export { accountTools } from './account.tools.js';
export { tradingTools } from './trading.tools.js';
export { wsTools, getBufferedWsEvents, clearBufferedWsEvents } from './ws.tools.js';
export { createPaperContext, paperTools, type PaperState, type PaperPosition, type PaperEvent, type PaperContext } from './paper.tools.js';

export interface FuturesToolkit {
  client: BinanceClient;
  tools: ToolDefinition[];
  market: ToolDefinition[];
  account: ToolDefinition[];
  trading: ToolDefinition[];
  ws: ToolDefinition[];
  paper: ToolDefinition[];
  paperContext: PaperContext;
}

export function createFuturesToolkit(client: BinanceClient): FuturesToolkit {
  const market = marketDataTools(client);
  const account = accountTools(client);
  const trading = tradingTools(client);
  const ws = wsTools(client);
  const paperContext = createPaperContext(client);
  const paper = paperTools(paperContext);
  return {
    client,
    tools: [...market, ...account, ...trading, ...ws, ...paper],
    market,
    account,
    trading,
    ws,
    paper,
    paperContext,
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
