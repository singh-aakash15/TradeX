import { v4 as uuidv4 } from 'uuid';
import { Order, OrderSide, OrderType, OrderStatus, Trade, MatchResult, OrderBookDepth } from './types';
import { OrderBook } from './orderBook';
export class MatchingEngine {
    // Har stock symbol ki apni ek OrderBook hoti hai (e.g. 'RELIANCE' -> OrderBook)
    private books: Map<string, OrderBook> = new Map();
    /**
     * Symbol ke liye OrderBook return karta hai (agar nahi hai toh nayi bana deta hai)
     */
    public getOrderBook(symbol: string): OrderBook {
        let book = this.books.get(symbol);
        if (!book) {
            book = new OrderBook(symbol);
            this.books.set(symbol, book);
        }
        return book;
    }
