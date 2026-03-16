import initSqlJs, { Database } from 'sql.js';
import { openDB, IDBPDatabase } from 'idb';
import { SCHEMA_SQL, INITIAL_SETTINGS } from './schema';
import { products as defaultProducts, categories as defaultCategories, users as defaultUsers } from '@/data/mockData';

const DB_NAME = 'swiftpos_db';
const IDB_NAME = 'SwiftPOS_IndexedDB';
const IDB_STORE = 'database';

let db: Database | null = null;
let idb: IDBPDatabase | null = null;
let initPromise: Promise<Database> | null = null;

// Initialize IndexedDB for persistence
async function getIDB(): Promise<IDBPDatabase> {
  if (idb) return idb;
  
  idb = await openDB(IDB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(IDB_STORE)) {
        database.createObjectStore(IDB_STORE);
      }
    },
  });
  
  return idb;
}

// Save database to IndexedDB
export async function persistDatabase(): Promise<void> {
  if (!db) return;
  
  try {
    const data = db.export();
    const indexedDB = await getIDB();
    await indexedDB.put(IDB_STORE, data, DB_NAME);
  } catch (error) {
    // Persistence error - silent
  }
}

// Load database from IndexedDB
async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  try {
    const indexedDB = await getIDB();
    const data = await indexedDB.get(IDB_STORE, DB_NAME);
    return data || null;
  } catch (error) {
    return null;
  }
}

// Run database migrations for schema updates
function runMigrations(database: Database): void {
  // Check if avatar_key column exists in users table
  const usersTableInfo = database.exec("PRAGMA table_info(users)");
  if (usersTableInfo.length > 0) {
    const columns = usersTableInfo[0].values.map((row: any) => row[1]);
    if (!columns.includes('avatar_key')) {
      database.run('ALTER TABLE users ADD COLUMN avatar_key TEXT');
    }
  }

  // Check if login_history table exists
  const tables = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='login_history'");
  if (tables.length === 0 || tables[0].values.length === 0) {
    database.run(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        login_at TEXT NOT NULL,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  // Check if invoices table exists
  const invoicesTables = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'");
  if (invoicesTables.length === 0 || invoicesTables[0].values.length === 0) {
    database.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        client_name TEXT NOT NULL,
        client_email TEXT,
        client_phone TEXT,
        client_address TEXT,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        tax_rate REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        notes TEXT,
        status TEXT NOT NULL CHECK(status IN ('draft', 'sent', 'paid', 'cancelled')),
        created_at TEXT NOT NULL,
        due_date TEXT,
        created_by TEXT NOT NULL
      )
    `);
    database.run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL,
        description TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      )
    `);
    database.run('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)');
    database.run('CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id)');
  }
}

// Initialize database with schema and seed data
function initializeDatabase(database: Database): void {
  // Create tables
  database.run(SCHEMA_SQL);
  
  // Run migrations for existing databases
  runMigrations(database);
  
  // Check if we need to seed data
  const productCount = database.exec('SELECT COUNT(*) FROM products')[0];
  const hasProducts = productCount && productCount.values[0][0] as number > 0;
  
  if (!hasProducts) {
    // Seed initial data
    
    // Seed categories
    const catStmt = database.prepare(
      'INSERT OR IGNORE INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?)'
    );
    defaultCategories.forEach(cat => {
      catStmt.run([cat.id, cat.name, cat.color, cat.icon || null]);
    });
    catStmt.free();
    
    // Seed products
    const prodStmt = database.prepare(
      `INSERT OR IGNORE INTO products 
       (id, name, price, category, sku, stock, image, barcode, description, cost_price, unit) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    defaultProducts.forEach(prod => {
      prodStmt.run([
        prod.id, prod.name, prod.price, prod.category, prod.sku, prod.stock,
        prod.image || null, prod.barcode || null, prod.description || null,
        prod.costPrice || null, prod.unit || null
      ]);
    });
    prodStmt.free();
    
    // Seed users
    const userStmt = database.prepare(
      'INSERT OR IGNORE INTO users (id, name, role, pin, email, phone) VALUES (?, ?, ?, ?, ?, ?)'
    );
    defaultUsers.forEach(user => {
      userStmt.run([user.id, user.name, user.role, user.pin, user.email || null, user.phone || null]);
    });
    userStmt.free();
    
    // Seed settings
    const settingsStmt = database.prepare(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
    );
    Object.entries(INITIAL_SETTINGS).forEach(([key, value]) => {
      settingsStmt.run([key, value]);
    });
    settingsStmt.free();
    
    // Initialize session table
    database.run('INSERT OR IGNORE INTO current_session (id, user_id) VALUES (1, NULL)');
    
    // Database seeded
  }
}

// Get database instance
export async function getDatabase(): Promise<Database> {
  if (db) return db;
  
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    // Initializing SQLite database
    
    // Initialize sql.js with WASM
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
    
    // Try to load existing database from IndexedDB
    const existingData = await loadFromIndexedDB();
    
    if (existingData) {
      db = new SQL.Database(existingData);
    } else {
      db = new SQL.Database();
    }
    
    // Initialize schema and seed data
    initializeDatabase(db);
    
    // Persist after initialization
    await persistDatabase();
    
    return db;
  })();
  
  return initPromise;
}

// Export database as binary for backup
export async function exportDatabase(): Promise<Uint8Array> {
  const database = await getDatabase();
  return database.export();
}

// Import database from binary
export async function importDatabase(data: Uint8Array): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  });
  
  // Close existing database
  if (db) {
    db.close();
  }
  
  // Create new database from imported data
  db = new SQL.Database(data);
  
  // Run migrations on imported database to ensure schema is up to date
  runMigrations(db);
  
  // Persist the imported database
  await persistDatabase();
  
  // Reset init promise so future getDatabase calls use this instance
  initPromise = Promise.resolve(db);
  
  console.log('Database imported successfully');
}

// Close database connection
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    initPromise = null;
  }
}

// Reset database but keep admin user
export async function resetDatabaseKeepAdmin(): Promise<void> {
  const database = await getDatabase();
  
  // Delete all data from tables except keeping admin user
  database.run('DELETE FROM transaction_items');
  database.run('DELETE FROM transactions');
  database.run('DELETE FROM stock_adjustments');
  database.run('DELETE FROM invoice_items');
  database.run('DELETE FROM invoices');
  database.run('DELETE FROM cash_drawer');
  database.run('DELETE FROM login_history');
  database.run('DELETE FROM products');
  database.run('DELETE FROM categories');
  // Delete all non-admin users
  database.run("DELETE FROM users WHERE role != 'admin'");
  // Reset session
  database.run('UPDATE current_session SET user_id = NULL WHERE id = 1');
  
  // Re-seed default settings
  const { INITIAL_SETTINGS } = await import('./schema');
  const settingsStmt = database.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  Object.entries(INITIAL_SETTINGS).forEach(([key, value]) => {
    settingsStmt.run([key, value]);
  });
  settingsStmt.free();
  
  // Persist the cleaned database
  await persistDatabase();
}
