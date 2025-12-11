import { CashDrawer } from '@/types/pos';
import { getDatabase, persistDatabase } from '../init';

export async function getCurrentCashDrawer(): Promise<CashDrawer | null> {
  const db = await getDatabase();
  const results = db.exec(`
    SELECT id, opened_at, closed_at, opening_balance, closing_balance, cash_sales, 
           card_sales, mobile_sales, expected_cash, actual_cash, difference, 
           status, opened_by, closed_by, notes 
    FROM cash_drawer WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1
  `);
  
  if (!results.length || !results[0].values.length) return null;
  
  const row = results[0].values[0];
  return {
    id: row[0] as string,
    openedAt: new Date(row[1] as string),
    closedAt: row[2] ? new Date(row[2] as string) : undefined,
    openingBalance: row[3] as number,
    closingBalance: row[4] as number | undefined,
    cashSales: row[5] as number,
    cardSales: row[6] as number,
    mobileSales: row[7] as number,
    expectedCash: row[8] as number,
    actualCash: row[9] as number | undefined,
    difference: row[10] as number | undefined,
    status: row[11] as 'open' | 'closed',
    openedBy: row[12] as string,
    closedBy: row[13] as string | undefined,
    notes: row[14] as string | undefined,
  };
}

export async function saveCashDrawer(drawer: CashDrawer | null): Promise<void> {
  const db = await getDatabase();
  
  if (!drawer) {
    // Close all open drawers
    db.run("UPDATE cash_drawer SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE status = 'open'");
    await persistDatabase();
    return;
  }
  
  // Check if drawer exists
  const existing = db.exec(`SELECT id FROM cash_drawer WHERE id = '${drawer.id}'`);
  
  if (existing.length && existing[0].values.length) {
    // Update existing
    const stmt = db.prepare(`
      UPDATE cash_drawer SET 
        closed_at = ?, closing_balance = ?, cash_sales = ?, card_sales = ?, mobile_sales = ?,
        expected_cash = ?, actual_cash = ?, difference = ?, status = ?, closed_by = ?, notes = ?
      WHERE id = ?
    `);
    
    stmt.run([
      drawer.closedAt?.toISOString() || null,
      drawer.closingBalance || null,
      drawer.cashSales,
      drawer.cardSales,
      drawer.mobileSales,
      drawer.expectedCash,
      drawer.actualCash || null,
      drawer.difference || null,
      drawer.status,
      drawer.closedBy || null,
      drawer.notes || null,
      drawer.id,
    ]);
    
    stmt.free();
  } else {
    // Insert new
    const stmt = db.prepare(`
      INSERT INTO cash_drawer (id, opened_at, closed_at, opening_balance, closing_balance, 
                               cash_sales, card_sales, mobile_sales, expected_cash, actual_cash,
                               difference, status, opened_by, closed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      drawer.id,
      drawer.openedAt.toISOString(),
      drawer.closedAt?.toISOString() || null,
      drawer.openingBalance,
      drawer.closingBalance || null,
      drawer.cashSales,
      drawer.cardSales,
      drawer.mobileSales,
      drawer.expectedCash,
      drawer.actualCash || null,
      drawer.difference || null,
      drawer.status,
      drawer.openedBy,
      drawer.closedBy || null,
      drawer.notes || null,
    ]);
    
    stmt.free();
  }
  
  await persistDatabase();
}

export async function getAllCashDrawers(): Promise<CashDrawer[]> {
  const db = await getDatabase();
  const results = db.exec(`
    SELECT id, opened_at, closed_at, opening_balance, closing_balance, cash_sales, 
           card_sales, mobile_sales, expected_cash, actual_cash, difference, 
           status, opened_by, closed_by, notes 
    FROM cash_drawer ORDER BY opened_at DESC
  `);
  
  if (!results.length) return [];
  
  return results[0].values.map((row: any) => ({
    id: row[0],
    openedAt: new Date(row[1]),
    closedAt: row[2] ? new Date(row[2]) : undefined,
    openingBalance: row[3],
    closingBalance: row[4] || undefined,
    cashSales: row[5],
    cardSales: row[6],
    mobileSales: row[7],
    expectedCash: row[8],
    actualCash: row[9] || undefined,
    difference: row[10] || undefined,
    status: row[11] as 'open' | 'closed',
    openedBy: row[12],
    closedBy: row[13] || undefined,
    notes: row[14] || undefined,
  }));
}
