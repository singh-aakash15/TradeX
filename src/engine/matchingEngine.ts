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