// SQLite Database Schema Definitions

export const SCHEMA_SQL = `
-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  barcode TEXT,
  description TEXT,
  cost_price REAL,
  unit TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  icon TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'manager')),
  pin TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  subtotal REAL NOT NULL,
  tax REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'mobile')),
  cash_received REAL,
  change_amount REAL,
  timestamp TEXT NOT NULL,
  receipt_number TEXT NOT NULL UNIQUE,
  cashier TEXT NOT NULL
);

-- Transaction items table (for cart items)
CREATE TABLE IF NOT EXISTS transaction_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_price REAL NOT NULL,
  product_category TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Stock adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  adjustment INTEGER NOT NULL,
  reason TEXT NOT NULL,
  adjusted_by TEXT NOT NULL,
  adjusted_at TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('add', 'remove', 'set', 'sale'))
);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Cash drawer table
CREATE TABLE IF NOT EXISTS cash_drawer (
  id TEXT PRIMARY KEY,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  opening_balance REAL NOT NULL,
  closing_balance REAL,
  cash_sales REAL NOT NULL DEFAULT 0,
  card_sales REAL NOT NULL DEFAULT 0,
  mobile_sales REAL NOT NULL DEFAULT 0,
  expected_cash REAL NOT NULL DEFAULT 0,
  actual_cash REAL,
  difference REAL,
  status TEXT NOT NULL CHECK(status IN ('open', 'closed')),
  opened_by TEXT NOT NULL,
  closed_by TEXT,
  notes TEXT
);

-- Current session table
CREATE TABLE IF NOT EXISTS current_session (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  user_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier ON transactions(cashier);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_date ON stock_adjustments(adjusted_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
`;

export const INITIAL_SETTINGS = {
  storeName: 'SwiftPOS Store',
  storeAddress: '123 Main Street, City, State 12345',
  storePhone: '(555) 123-4567',
  taxRate: '10',
  taxName: 'Sales Tax',
  receiptWidth: '80',
  showLogo: 'true',
  autoPrint: 'false',
  showTaxBreakdown: 'true',
  lowStockAlerts: 'true',
  dailySummary: 'true',
  soundEffects: 'false',
  currency: 'GHS',
  lowStockThreshold: '20',
};
