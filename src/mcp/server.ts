import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BinanceClient } from '../client/BinanceClient.js';
import { createFuturesToolkit } from '../tools/index.js';

export function createBinanceMcpServer(client: BinanceClient): McpServer {
  const server = new McpServer({ name: 'binance-usdm-futures', version: '2.1.0' });
  const toolkit = createFuturesToolkit(client);

  toolkit.tools.forEach((tool) => {
    server.registerTool(tool.name, { description: tool.description, inputSchema: tool.inputSchema }, async (args) => ({
      content: [{ type: 'text', text: String(await tool.handler(args, { env: 'live', isSigned: true })) }],
    }));
  });

  return server;
}
