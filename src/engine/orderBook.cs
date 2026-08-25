

import { Order, OrderSide, OrderBookDepth, PriceLevel } from './types';

export class OrderBook {
  public symbol: string;
  // Bids: Sorted by Price DESC, then by createdAt ASC (Highest buyer first)
  private bids: Order[] = [];
  // Asks: Sorted by Price ASC, then by createdAt ASC (Lowest seller first)
  private asks: Order[] = [];
  public lastTradedPrice: number = 0;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  /**
   * Adds an unfilled limit order into the book in O(log N) sorted position
   */
  public addOrder(order: Order): void {
    if (order.side === OrderSide.BUY) {
      this.insertSorted(this.bids, order, OrderSide.BUY);
    } else {
      this.insertSorted(this.asks, order, OrderSide.SELL);
    }
  }

  /**
   * Cancels and removes an order from the book by orderId
   */
  public cancelOrder(orderId: string): Order | null {
    let index = this.bids.findIndex(o => o.id === orderId);
    if (index !== -1) {
      const [cancelled] = this.bids.splice(index, 1);
      return cancelled;
    }
    index = this.asks.findIndex(o => o.id === orderId);
    if (index !== -1) {
      const [cancelled] = this.asks.splice(index, 1);
      return cancelled;
    }
    return null;
  }

  // Peek best available buyer / seller without removing
  public getBestBid(): Order | null {
    return this.bids.length > 0 ? this.bids[0] : null;
  }

  public getBestAsk(): Order | null {
    return this.asks.length > 0 ? this.asks[0] : null;
  }

  // Remove best buyer / seller after full execution
  public removeBestBid(): Order | null {
    return this.bids.shift() || null;
  }

  public removeBestAsk(): Order | null {
    return this.asks.shift() || null;
  }

  public getBids(): Order[] {
    return [...this.bids];
  }

  public getAsks(): Order[] {
    return [...this.asks];
  }

  /**
   * Aggregates orders by price level to produce Level-2 Market Depth (e.g. Top 10 Bids & Asks)
   */
  public getDepth(limit: number = 10): OrderBookDepth {
    return {
      symbol: this.symbol,
      bids: this.aggregateLevels(this.bids, limit),
      asks: this.aggregateLevels(this.asks, limit),
      timestamp: Date.now(),
      lastTradedPrice: this.lastTradedPrice || undefined
    };
  }

  /**
   * Helper: Groups individual orders having the same price into a single PriceLevel
   */
  private aggregateLevels(orders: Order[], limit: number): PriceLevel[] {
    const levelMap = new Map<number, { totalQuantity: number; orderCount: number }>();
    
    for (const order of orders) {
      const remaining = order.quantity - order.filledQuantity;
      if (remaining <= 0) continue;

      const existing = levelMap.get(order.price) || { totalQuantity: 0, orderCount: 0 };
      existing.totalQuantity += remaining;
      existing.orderCount += 1;
      levelMap.set(order.price, existing);

      if (levelMap.size >= limit * 2) break; // Optimization: avoid scanning large books
    }

    const levels: PriceLevel[] = [];
    for (const [price, stats] of levelMap.entries()) {
      levels.push({
        price,
        totalQuantity: stats.totalQuantity,
        orderCount: stats.orderCount
      });
      if (levels.length >= limit) break;
    }

    return levels;
  }

  /**
   * Binary Search Insertion (O(log N)) ensuring Price-Time Priority
   */
  private insertSorted(list: Order[], order: Order, side: OrderSide): void {
    let low = 0;
    let high = list.length;

    while (low < high) {
      const mid = (low + high) >>> 1; // Bitwise unsigned right shift for fast mid calculation
      const midOrder = list[mid];

      let isHigherPriority = false;
      if (side === OrderSide.BUY) {
        // BUY: Higher price wins; if same price, earlier timestamp (FIFO) wins
        if (order.price > midOrder.price) {
          isHigherPriority = true;
        } else if (order.price === midOrder.price && order.createdAt < midOrder.createdAt) {
          isHigherPriority = true;
        }
      } else {
        // SELL: Lower price wins; if same price, earlier timestamp (FIFO) wins
        if (order.price < midOrder.price) {
          isHigherPriority = true;
        } else if (order.price === midOrder.price && order.createdAt < midOrder.createdAt) {
          isHigherPriority = true;
        }
      }

      if (isHigherPriority) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }

    list.splice(low, 0, order);
  }
}
