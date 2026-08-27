import { v4 as uuidv4 } from 'uuid';
import { Order, OrderSide, OrderType, OrderStatus, Trade, MatchResult, OrderBookDepth } from './types';
import { OrderBook } from './orderBook';
export class MatchingEngine {
    private books: Map<string, OrderBook> = new Map();

    public getOrderBook(symbol: string): OrderBook {
        let book = this.books.get(symbol);
        if (!book) {
            book = new OrderBook(symbol);
            this.books.set(symbol, book);
        }
        return book;
    }
    public processOrder(order: Order): MatchResult {
        const book = this.getOrderBook(order.symbol);
        if (order.type === OrderType.LIMIT) {
            return this.matchLimitOrder(book, order);
        } else {
            return this.matchMarketOrder(book, order);
        }
    }
    /**
      * Continuous Double Auction matching algorithm for LIMIT orders
      */
    private matchLimitOrder(book: OrderBook, takerOrder: Order): MatchResult {
        const trades: Trade[] = [];
        const makerOrdersUpdated: Order[] = [];
        // Loop until the incoming taker order is fully filled
        while (takerOrder.filledQuantity < takerOrder.quantity) {
            const remainingTakerQty = takerOrder.quantity - takerOrder.filledQuantity;
            // 1. Inspect the best opposing resting order
            const bestOpponent = takerOrder.side === OrderSide.BUY
                ? book.getBestAsk()   // Buyer matches against lowest Ask
                : book.getBestBid();  // Seller matches against highest Bid
            if (!bestOpponent) break; // No counter-party available in the book
            // 2. Price Compatibility Check:
            // BUY: Must not pay more than limit price (bestAsk <= buyerLimitPrice)
            if (takerOrder.side === OrderSide.BUY && bestOpponent.price > takerOrder.price) {
                break;
            }
            // SELL: Must not sell for less than limit price (bestBid >= sellerLimitPrice)
            if (takerOrder.side === OrderSide.SELL && bestOpponent.price < takerOrder.price) {
                break;
            }
            // 3. Self-Trade Prevention (STP): Disallow same user trading with themselves
            if (bestOpponent.userId === takerOrder.userId) {
                break;
            }
            // 4. Execute the match and generate Trade event
            const matchResult = this.executeMatch(book, takerOrder, bestOpponent, remainingTakerQty);
            trades.push(matchResult.trade);
            makerOrdersUpdated.push(matchResult.updatedMakerOrder);
        }

        // 5. Update lifecycle status of the incoming taker order
        if (takerOrder.filledQuantity === takerOrder.quantity) {
            takerOrder.status = OrderStatus.FILLED;
        } else if (takerOrder.filledQuantity > 0) {
            takerOrder.status = OrderStatus.PARTIALLY_FILLED;
            // Place the remaining unfilled portion into the book for future matches
            book.addOrder(takerOrder);
        } else {
            takerOrder.status = OrderStatus.OPEN;
            book.addOrder(takerOrder);
        }
        return {
            trades,
            order: takerOrder,
            makerOrdersUpdated
        };
    }


