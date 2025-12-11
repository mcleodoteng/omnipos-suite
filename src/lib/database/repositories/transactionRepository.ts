import { Transaction, CartItem } from '@/types/pos';
import { getDatabase, persistDatabase } from '../init';

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDatabase();
  const txResults = db.exec(`
    SELECT id, subtotal, tax, discount, total, payment_method, cash_received, change_amount, 
           timestamp, receipt_number, cashier 
    FROM transactions ORDER BY timestamp DESC
  `);
  
  if (!txResults.length) return [];
  
  const transactions: Transaction[] = [];
  
  for (const row of txResults[0].values) {
    const txId = row[0] as string;
    
    // Get items for this transaction
    const itemResults = db.exec(`
      SELECT product_id, product_name, product_price, product_category, product_sku, quantity
      FROM transaction_items WHERE transaction_id = '${txId}'
    `);
    
    const items: CartItem[] = itemResults.length ? itemResults[0].values.map((itemRow: any) => ({
      product: {
        id: itemRow[0],
        name: itemRow[1],
        price: itemRow[2],
        category: itemRow[3],
        sku: itemRow[4],
        stock: 0, // Stock at time of sale doesn't need to be stored
      },
      quantity: itemRow[5],
    })) : [];
    
    transactions.push({
      id: txId,
      items,
      subtotal: row[1] as number,
      tax: row[2] as number,
      discount: row[3] as number,
      total: row[4] as number,
      paymentMethod: row[5] as 'cash' | 'card' | 'mobile',
      cashReceived: row[6] as number | undefined,
      change: row[7] as number | undefined,
      timestamp: new Date(row[8] as string),
      receiptNumber: row[9] as string,
      cashier: row[10] as string,
    });
  }
  
  return transactions;
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
  stmt.bind([id]);
  
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  
  const row = stmt.getAsObject();
  stmt.free();
  
  // Get items
  const itemResults = db.exec(`
    SELECT product_id, product_name, product_price, product_category, product_sku, quantity
    FROM transaction_items WHERE transaction_id = '${id}'
  `);
  
  const items: CartItem[] = itemResults.length ? itemResults[0].values.map((itemRow: any) => ({
    product: {
      id: itemRow[0],
      name: itemRow[1],
      price: itemRow[2],
      category: itemRow[3],
      sku: itemRow[4],
      stock: 0,
    },
    quantity: itemRow[5],
  })) : [];
  
  return {
    id: row.id as string,
    items,
    subtotal: row.subtotal as number,
    tax: row.tax as number,
    discount: row.discount as number,
    total: row.total as number,
    paymentMethod: row.payment_method as 'cash' | 'card' | 'mobile',
    cashReceived: row.cash_received as number | undefined,
    change: row.change_amount as number | undefined,
    timestamp: new Date(row.timestamp as string),
    receiptNumber: row.receipt_number as string,
    cashier: row.cashier as string,
  };
}

export async function createTransaction(transaction: Transaction): Promise<void> {
  const db = await getDatabase();
  
  // Insert transaction
  const txStmt = db.prepare(`
    INSERT INTO transactions (id, subtotal, tax, discount, total, payment_method, cash_received, 
                              change_amount, timestamp, receipt_number, cashier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  txStmt.run([
    transaction.id,
    transaction.subtotal,
    transaction.tax,
    transaction.discount,
    transaction.total,
    transaction.paymentMethod,
    transaction.cashReceived || null,
    transaction.change || null,
    transaction.timestamp.toISOString(),
    transaction.receiptNumber,
    transaction.cashier,
  ]);
  txStmt.free();
  
  // Insert transaction items
  const itemStmt = db.prepare(`
    INSERT INTO transaction_items (transaction_id, product_id, product_name, product_price, 
                                   product_category, product_sku, quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  transaction.items.forEach(item => {
    itemStmt.run([
      transaction.id,
      item.product.id,
      item.product.name,
      item.product.price,
      item.product.category,
      item.product.sku,
      item.quantity,
    ]);
  });
  
  itemStmt.free();
  await persistDatabase();
}

export async function saveAllTransactions(transactions: Transaction[]): Promise<void> {
  const db = await getDatabase();
  
  // Clear existing
  db.run('DELETE FROM transaction_items');
  db.run('DELETE FROM transactions');
  
  for (const tx of transactions) {
    await createTransaction(tx);
  }
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
  const allTransactions = await getAllTransactions();
  return allTransactions.filter(tx => 
    tx.timestamp >= startDate && tx.timestamp <= endDate
  );
}
