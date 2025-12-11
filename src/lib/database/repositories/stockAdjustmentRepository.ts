import { StockAdjustment } from '@/types/pos';
import { getDatabase, persistDatabase } from '../init';

export async function getAllStockAdjustments(): Promise<StockAdjustment[]> {
  const db = await getDatabase();
  const results = db.exec(`
    SELECT id, product_id, product_name, previous_stock, new_stock, adjustment, 
           reason, adjusted_by, adjusted_at, type 
    FROM stock_adjustments ORDER BY adjusted_at DESC
  `);
  
  if (!results.length) return [];
  
  return results[0].values.map((row: any) => ({
    id: row[0],
    productId: row[1],
    productName: row[2],
    previousStock: row[3],
    newStock: row[4],
    adjustment: row[5],
    reason: row[6],
    adjustedBy: row[7],
    adjustedAt: new Date(row[8]),
    type: row[9] as 'add' | 'remove' | 'set' | 'sale',
  }));
}

export async function getStockAdjustmentsByProduct(productId: string): Promise<StockAdjustment[]> {
  const db = await getDatabase();
  const stmt = db.prepare(`
    SELECT id, product_id, product_name, previous_stock, new_stock, adjustment, 
           reason, adjusted_by, adjusted_at, type 
    FROM stock_adjustments WHERE product_id = ? ORDER BY adjusted_at DESC
  `);
  stmt.bind([productId]);
  
  const adjustments: StockAdjustment[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    adjustments.push({
      id: row.id as string,
      productId: row.product_id as string,
      productName: row.product_name as string,
      previousStock: row.previous_stock as number,
      newStock: row.new_stock as number,
      adjustment: row.adjustment as number,
      reason: row.reason as string,
      adjustedBy: row.adjusted_by as string,
      adjustedAt: new Date(row.adjusted_at as string),
      type: row.type as 'add' | 'remove' | 'set' | 'sale',
    });
  }
  
  stmt.free();
  return adjustments;
}

export async function createStockAdjustment(adjustment: Omit<StockAdjustment, 'id' | 'adjustedAt'>): Promise<StockAdjustment> {
  const db = await getDatabase();
  
  const newAdjustment: StockAdjustment = {
    ...adjustment,
    id: Date.now().toString(),
    adjustedAt: new Date(),
  };
  
  const stmt = db.prepare(`
    INSERT INTO stock_adjustments (id, product_id, product_name, previous_stock, new_stock, 
                                   adjustment, reason, adjusted_by, adjusted_at, type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run([
    newAdjustment.id,
    newAdjustment.productId,
    newAdjustment.productName,
    newAdjustment.previousStock,
    newAdjustment.newStock,
    newAdjustment.adjustment,
    newAdjustment.reason,
    newAdjustment.adjustedBy,
    newAdjustment.adjustedAt.toISOString(),
    newAdjustment.type,
  ]);
  
  stmt.free();
  await persistDatabase();
  
  return newAdjustment;
}

export async function clearStockAdjustments(): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM stock_adjustments');
  await persistDatabase();
}

export async function getStockAdjustmentsByDateRange(startDate: Date, endDate: Date): Promise<StockAdjustment[]> {
  const allAdjustments = await getAllStockAdjustments();
  return allAdjustments.filter(adj => 
    adj.adjustedAt >= startDate && adj.adjustedAt <= endDate
  );
}
