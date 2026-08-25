

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum OrderType {
  LIMIT = 'LIMIT',   // User decides price (waits in orderbook if not matched)
  MARKET = 'MARKET'  // Executes immediately at best available current price
}

export enum OrderStatus {
  OPEN = 'OPEN',                         // Resting in orderbook, 0 shares filled
  PARTIALLY_FILLED = 'PARTIALLY_FILLED', // Some shares filled, remaining resting in book
  FILLED = 'FILLED',                     // 100% shares matched & completed
  CANCELLED = 'CANCELLED',               // Cancelled by user or expired
  REJECTED = 'REJECTED'                  // Risk check failed (e.g. insufficient funds)
}

export interface Order {
  id: string;                // Unique UUID for the order
  userId: string;            // Trader's User ID
  symbol: string;            // Stock symbol, e.g., 'RELIANCE', 'TCS'
  side: OrderSide;           // BUY or SELL
  type: OrderType;           // LIMIT or MARKET
  price: number;             // Price per share (0 for MARKET orders)
  quantity: number;          // Total quantity to buy/sell
  filledQuantity: number;    // How many shares have matched so far
  status: OrderStatus;       // Current lifecycle state of the order
  createdAt: number;         // Unix timestamp (ms) - crucial for Time Priority!
  idempotencyKey?: string;   // Prevents duplicate submissions on network retries
}

export interface Trade {
  id: string;                // Unique UUID for the executed trade
  symbol: string;            // Stock symbol
  buyOrderId: string;        // Buyer's Order ID
  sellOrderId: string;       // Seller's Order ID
  buyerId: string;           // Buyer's User ID
  sellerId: string;          // Seller's User ID
  price: number;             // Execution price (Maker's price)
  quantity: number;          // Executed share quantity
  totalAmount: number;       // price * quantity
  executedAt: number;        // Execution Unix timestamp (ms)
}

export interface PriceLevel {
  price: number;             // Price at this level
  totalQuantity: number;     // Total aggregated shares available at this price
  orderCount: number;        // Number of orders resting at this price level
}

export interface OrderBookDepth {
  symbol: string;            // Stock symbol
  bids: PriceLevel[];        // Sorted BUY levels (Highest price on top)
  asks: PriceLevel[];        // Sorted SELL levels (Lowest price on top)
  timestamp: number;         // Snapshot timestamp
  lastTradedPrice?: number;  // Last execution price
}

export interface MatchResult {
  trades: Trade[];           // All trades generated in this matching cycle
  order: Order;              // The incoming taker order with updated status
  makerOrdersUpdated: Order[]; // Existing maker orders in the book that were filled/partially filled
}
