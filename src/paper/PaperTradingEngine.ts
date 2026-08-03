import { FuturesMarket } from '../resources/FuturesMarket.js';

export interface PaperPosition {
  symbol: string;
  side: 'LONG' | 'SHORT' | 'NONE';
  entryPrice: number;
  quantity: number;
  leverage: number;
  unrealizedPnl: number;
  marginType: 'ISOLATED' | 'CROSSED';
  openedAt: number;
}

export interface PaperOrder {
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: 'NEW' | 'FILLED' | 'CANCELED' | 'REJECTED';
  filledQuantity: number;
  avgFillPrice?: number;
  createdAt: number;
}

export interface PaperAccount {
  balance: number;
  availableBalance: number;
  totalWalletBalance: number;
  unrealizedPnl: number;
  positions: Record<string, PaperPosition>;
  orders: PaperOrder[];
}

export class PaperTradingEngine {
  private account: PaperAccount;
  private market: FuturesMarket;
  private orderIdCounter = 1000000;
  private readonly supportedSymbols = ['SOLUSDT', 'ETHUSDT', 'XRPUSDT'];

  constructor(initialBalance: number = 10000) {
    this.market = new FuturesMarket();
    
    this.account = {
      balance: initialBalance,
      availableBalance: initialBalance,
      totalWalletBalance: initialBalance,
      unrealizedPnl: 0,
      positions: {},
      orders: [],
    };

    for (const symbol of this.supportedSymbols) {
      this.account.positions[symbol] = {
        symbol,
        side: 'NONE',
        entryPrice: 0,
        quantity: 0,
        leverage: 1,
        unrealizedPnl: 0,
        marginType: 'CROSSED',
        openedAt: 0,
      };
    }
  }

  async getMarketPrice(symbol: string): Promise<number> {
    if (!this.supportedSymbols.includes(symbol)) {
      throw new Error(`Symbol ${symbol} not supported. Supported: ${this.supportedSymbols.join(', ')}`);
    }
    const ticker = await this.market.tickerPrice(symbol);
    return parseFloat(ticker.price);
  }

  async placeOrder(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity: number;
    price?: number;
    leverage?: number;
  }): Promise<PaperOrder> {
    const { symbol, side, type, quantity, price, leverage = 1 } = params;

    if (!this.supportedSymbols.includes(symbol)) {
      throw new Error(`Symbol ${symbol} not supported`);
    }
    if (quantity <= 0) throw new Error('Quantity must be positive');
    if (leverage < 1 || leverage > 125) throw new Error('Leverage must be 1-125');

    const currentPrice = await this.getMarketPrice(symbol);
    const orderPrice = type === 'MARKET' ? currentPrice : price;
    if (!orderPrice) throw new Error('Price required for LIMIT orders');

    const position = this.account.positions[symbol];
    const notionalValue = quantity * orderPrice;
    const requiredMargin = notionalValue / leverage;

    const isClosing = 
      (side === 'SELL' && position.side === 'LONG') ||
      (side === 'BUY' && position.side === 'SHORT');

    if (!isClosing && requiredMargin > this.account.availableBalance) {
      throw new Error(`Insufficient balance. Required: ${requiredMargin.toFixed(2)}, Available: ${this.account.availableBalance.toFixed(2)}`);
    }

    const order: PaperOrder = {
      orderId: ++this.orderIdCounter,
      symbol,
      side,
      type,
      quantity,
      price: orderPrice,
      status: 'FILLED',
      filledQuantity: quantity,
      avgFillPrice: orderPrice,
      createdAt: Date.now(),
    };

    this.executeTrade(order, currentPrice);
    this.account.orders.push(order);
    return order;
  }

  private executeTrade(order: PaperOrder, currentPrice: number) {
    const position = this.account.positions[order.symbol];
    
    if (order.side === 'BUY') {
      if (position.side === 'NONE' || position.side === 'LONG') {
        const totalQty = position.quantity + order.quantity;
        const totalCost = (position.entryPrice * position.quantity) + (order.avgFillPrice! * order.quantity);
        position.entryPrice = totalQty > 0 ? totalCost / totalQty : order.avgFillPrice!;
        position.quantity = totalQty;
        position.side = 'LONG';
        position.openedAt = Date.now();
        this.account.availableBalance -= (order.quantity * order.avgFillPrice!) / position.leverage;
      } else {
        position.quantity -= order.quantity;
        if (position.quantity <= 0) {
          position.quantity = 0;
          position.side = 'NONE';
          position.entryPrice = 0;
        }
        this.account.balance += this.calculatePnl(order, position);
      }
    } else {
      if (position.side === 'NONE' || position.side === 'SHORT') {
        const totalQty = position.quantity + order.quantity;
        const totalCost = (position.entryPrice * position.quantity) + (order.avgFillPrice! * order.quantity);
        position.entryPrice = totalQty > 0 ? totalCost / totalQty : order.avgFillPrice!;
        position.quantity = totalQty;
        position.side = 'SHORT';
        position.openedAt = Date.now();
        this.account.availableBalance -= (order.quantity * order.avgFillPrice!) / position.leverage;
      } else {
        position.quantity -= order.quantity;
        if (position.quantity <= 0) {
          position.quantity = 0;
          position.side = 'NONE';
          position.entryPrice = 0;
        }
        this.account.balance += this.calculatePnl(order, position);
      }
    }

    this.updateUnrealizedPnl(order.symbol, currentPrice);
  }

  private calculatePnl(order: PaperOrder, position: PaperPosition): number {
    if (position.side === 'NONE') return 0;
    const closeQty = Math.min(order.quantity, position.quantity);
    const priceDiff = order.avgFillPrice! - position.entryPrice;
    return position.side === 'LONG' ? priceDiff * closeQty : -priceDiff * closeQty;
  }

  private updateUnrealizedPnl(symbol: string, currentPrice: number) {
    const position = this.account.positions[symbol];
    if (position.side === 'NONE' || position.quantity === 0) {
      position.unrealizedPnl = 0;
      return;
    }
    const priceDiff = currentPrice - position.entryPrice;
    position.unrealizedPnl = position.side === 'LONG' 
      ? priceDiff * position.quantity 
      : -priceDiff * position.quantity;
  }

  async updatePositions() {
    for (const symbol of this.supportedSymbols) {
      try {
        const price = await this.getMarketPrice(symbol);
        this.updateUnrealizedPnl(symbol, price);
      } catch { /* skip */ }
    }
    this.account.unrealizedPnl = Object.values(this.account.positions).reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
    this.account.totalWalletBalance = this.account.balance + this.account.unrealizedPnl;
  }

  getAccountInfo(): PaperAccount {
    return { ...this.account };
  }

  getPosition(symbol: string): PaperPosition | undefined {
    return this.account.positions[symbol];
  }

  getAllPositions(): Record<string, PaperPosition> {
    return { ...this.account.positions };
  }

  getOrderHistory(symbol?: string): PaperOrder[] {
    if (symbol) return this.account.orders.filter(o => o.symbol === symbol);
    return [...this.account.orders];
  }

  async getSupportedSymbols(): Promise<string[]> {
    return [...this.supportedSymbols];
  }
}
