import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BinanceClient } from '../client/BinanceClient.js';

export class McpServer {
  private server: Server;
  private client: BinanceClient;

  constructor(options: { apiKey?: string; apiSecret?: string; testnet?: boolean } = {}) {
    this.client = new BinanceClient({
      apiKey: options.apiKey,
      apiSecret: options.apiSecret,
      testnet: options.testnet ?? false,
    });

    this.server = new Server(
      {
        name: 'binance-futures-mcp',
        version: '2.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_market_price',
          description: 'Get current market price for a trading pair',
          inputSchema: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'] },
        },
        {
          name: 'get_kline_data',
          description: 'Get candlestick/kline data for a trading pair',
          inputSchema: { 
            type: 'object', 
            properties: { 
              symbol: { type: 'string' },
              interval: { type: 'string', enum: ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'] },
              limit: { type: 'number', default: 100 }
            }, 
            required: ['symbol', 'interval'] 
          },
        },
        {
          name: 'get_order_book',
          description: 'Get order book depth for a trading pair',
          inputSchema: { 
            type: 'object', 
            properties: { 
              symbol: { type: 'string' },
              limit: { type: 'number', default: 100 }
            }, 
            required: ['symbol'] 
          },
        },
        {
          name: 'place_order',
          description: 'Place a futures order (requires API keys)',
          inputSchema: { 
            type: 'object', 
            properties: { 
              symbol: { type: 'string' },
              side: { type: 'string', enum: ['BUY', 'SELL'] },
              type: { type: 'string', enum: ['LIMIT', 'MARKET', 'STOP', 'TAKE_PROFIT', 'STOP_MARKET', 'TAKE_PROFIT_MARKET'] },
              quantity: { type: 'number' },
              price: { type: 'number' },
              stopPrice: { type: 'number' },
              timeInForce: { type: 'string', enum: ['GTC', 'IOC', 'FOK'], default: 'GTC' },
              leverage: { type: 'number', minimum: 1, maximum: 125 }
            }, 
            required: ['symbol', 'side', 'type', 'quantity'] 
          },
        },
        {
          name: 'cancel_order',
          description: 'Cancel an existing order (requires API keys)',
          inputSchema: { 
            type: 'object', 
            properties: { 
              symbol: { type: 'string' },
              orderId: { type: 'number' },
              origClientOrderId: { type: 'string' }
            }, 
            required: ['symbol'] 
          },
        },
        {
          name: 'get_position',
          description: 'Get current position(s) information (requires API keys)',
          inputSchema: { 
            type: 'object', 
            properties: { 
              symbol: { type: 'string' }
            }
          },
        },
        {
          name: 'update_leverage',
          description: 'Update leverage for a position (requires API keys)',
          inputSchema: { 
            type: 'object', 
            properties: { 
              symbol: { type: 'string' },
              leverage: { type: 'number', minimum: 1, maximum: 125 }
            }, 
            required: ['symbol', 'leverage'] 
          },
        },
        {
          name: 'get_account_info',
          description: 'Get account balance and margin information (requires API keys)',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'get_funding_rate',
          description: 'Get funding rate history for a trading pair',
          inputSchema: { 
            type: 'object', 
            properties: { 
              symbol: { type: 'string' },
              limit: { type: 'number', default: 100 }
            }, 
            required: ['symbol'] 
          },
        },
        {
          name: 'get_open_interest',
          description: 'Get open interest statistics for a trading pair',
          inputSchema: { 
            type: 'object', 
            properties: { 
              symbol: { type: 'string' }
            }, 
            required: ['symbol'] 
          },
        },
        {
          name: 'get_liquidation_orders',
          description: 'Get recent liquidation orders (force orders)',
          inputSchema: { 
            type: 'object', 
            properties: { 
              symbol: { type: 'string' },
              startTime: { type: 'number' },
              endTime: { type: 'number' },
              limit: { type: 'number', default: 100 }
            }
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_market_price': {
            const symbol = String(args.symbol);
            const result = await this.client.futures.market.tickerPrice(symbol);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          case 'get_kline_data': {
            const symbol = String(args.symbol);
            const interval = String(args.interval);
            const limit = Number(args.limit ?? 100);
            const result = await this.client.futures.market.klines({
              symbol,
              interval: interval as any,
              limit,
            });
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          case 'get_order_book': {
            const symbol = String(args.symbol);
            const limit = Number(args.limit ?? 100);
            const result = await this.client.futures.market.depth({
              symbol,
              limit,
            });
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          case 'place_order': {
            const params: any = {
              symbol: String(args.symbol),
              side: args.side,
              type: args.type,
              quantity: String(args.quantity),
            };
            if (args.price) params.price = String(args.price);
            if (args.stopPrice) params.stopPrice = String(args.stopPrice);
            if (args.timeInForce) params.timeInForce = args.timeInForce;
            
            const result = await this.client.futures.trading.createOrder(params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          case 'cancel_order': {
            const symbol = String(args.symbol);
            const options: any = {};
            if (args.orderId) options.orderId = Number(args.orderId);
            if (args.origClientOrderId) options.origClientOrderId = String(args.origClientOrderId);
            
            const result = await this.client.futures.trading.cancelOrder(symbol, options);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          case 'get_position': {
            const symbol = args.symbol ? String(args.symbol) : undefined;
            const result = await this.client.futures.account.positionRisk(symbol);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          case 'update_leverage': {
            const symbol = String(args.symbol);
            const leverage = Number(args.leverage);
            const result = await this.client.futures.trading.setLeverage(symbol, leverage);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          case 'get_account_info': {
            const result = await this.client.futures.account.balance();
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          case 'get_funding_rate': {
            const symbol = String(args.symbol);
            const limit = Number(args.limit ?? 100);
            const result = await this.client.futures.data.fundingRateHistory(symbol, { limit });
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          case 'get_open_interest': {
            const symbol = String(args.symbol);
            const result = await this.client.futures.data.openInterest(symbol);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          case 'get_liquidation_orders': {
            const symbol = args.symbol ? String(args.symbol) : undefined;
            const startTime = args.startTime ? Number(args.startTime) : undefined;
            const endTime = args.endTime ? Number(args.endTime) : undefined;
            const limit = Number(args.limit ?? 100);
            
            // Use forceOrders endpoint for liquidation data
            const result = await this.client.futures.data.forceOrders({
              symbol,
              startTime,
              endTime,
              limit,
            });
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return { content: [{ type: 'text', text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'binance://futures/symbols',
          name: 'Futures Trading Symbols',
          description: 'List of all available USD-M futures trading symbols',
          mimeType: 'application/json',
        },
        {
          uri: 'binance://futures/premium-index',
          name: 'Premium Index',
          description: 'Current premium index for all trading pairs',
          mimeType: 'application/json',
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === 'binance://futures/symbols') {
        const result = await this.client.futures.market.exchangeInfo();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(result.symbols.map((s: any) => ({
                symbol: s.symbol,
                status: s.status,
                baseAsset: s.baseAsset,
                quoteAsset: s.quoteAsset,
                minNotional: s.minNotional,
              })), null, 2),
            },
          ],
        };
      }

      if (uri === 'binance://futures/premium-index') {
        // Get all symbols and fetch premium index for each
        const exchangeInfo = await this.client.futures.market.exchangeInfo();
        const symbols = exchangeInfo.symbols.filter((s: any) => s.status === 'TRADING').slice(0, 20);
        const results: any[] = [];
        
        for (const sym of symbols) {
          try {
            const premium = await this.client.futures.data.premiumIndex(sym.symbol);
            results.push(premium);
          } catch {
            // Skip if fetch fails
          }
        }
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Binance Futures MCP Server running on stdio');
  }

  async close() {
    await this.server.close();
    this.client.closeAllWebSockets();
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;
  const testnet = process.env.BINANCE_TESTNET === 'true';

  const server = new McpServer({ apiKey, apiSecret, testnet });
  
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  server.run().catch((err) => {
    console.error('Failed to start MCP server:', err);
    process.exit(1);
  });
}
