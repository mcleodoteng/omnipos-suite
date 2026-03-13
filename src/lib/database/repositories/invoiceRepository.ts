import { Invoice, InvoiceItem } from '@/types/pos';
import { getDatabase, persistDatabase } from '../init';

export async function getAllInvoices(): Promise<Invoice[]> {
  const db = await getDatabase();
  const results = db.exec('SELECT * FROM invoices ORDER BY created_at DESC');
  
  if (!results.length) return [];
  
  const invoices: Invoice[] = results[0].values.map((row: any) => ({
    id: row[0],
    invoiceNumber: row[1],
    clientName: row[2],
    clientEmail: row[3] || undefined,
    clientPhone: row[4] || undefined,
    clientAddress: row[5] || undefined,
    subtotal: row[6],
    tax: row[7],
    taxRate: row[8],
    discount: row[9],
    total: row[10],
    notes: row[11] || undefined,
    status: row[12],
    createdAt: new Date(row[13]),
    dueDate: row[14] ? new Date(row[14]) : undefined,
    createdBy: row[15],
    items: [],
  }));

  // Load items for each invoice
  for (const invoice of invoices) {
    const itemResults = db.exec(
      `SELECT id, description, quantity, unit_price, total FROM invoice_items WHERE invoice_id = '${invoice.id}' ORDER BY rowid`
    );
    if (itemResults.length) {
      invoice.items = itemResults[0].values.map((row: any) => ({
        id: row[0],
        description: row[1],
        quantity: row[2],
        unitPrice: row[3],
        total: row[4],
      }));
    }
  }

  return invoices;
}

export async function createInvoice(invoice: Invoice): Promise<void> {
  const db = await getDatabase();
  
  const stmt = db.prepare(
    `INSERT INTO invoices (id, invoice_number, client_name, client_email, client_phone, client_address, subtotal, tax, tax_rate, discount, total, notes, status, created_at, due_date, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run([
    invoice.id, invoice.invoiceNumber, invoice.clientName,
    invoice.clientEmail || null, invoice.clientPhone || null, invoice.clientAddress || null,
    invoice.subtotal, invoice.tax, invoice.taxRate, invoice.discount, invoice.total,
    invoice.notes || null, invoice.status,
    invoice.createdAt.toISOString(), invoice.dueDate?.toISOString() || null, invoice.createdBy,
  ]);
  stmt.free();

  // Insert items
  const itemStmt = db.prepare(
    'INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const item of invoice.items) {
    itemStmt.run([item.id, invoice.id, item.description, item.quantity, item.unitPrice, item.total]);
  }
  itemStmt.free();

  await persistDatabase();
}

export async function updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
  const db = await getDatabase();
  db.run(`UPDATE invoices SET status = ? WHERE id = ?`, [status, id]);
  await persistDatabase();
}

export async function deleteInvoice(id: string): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
  db.run('DELETE FROM invoices WHERE id = ?', [id]);
  await persistDatabase();
}

export async function getNextInvoiceNumber(): Promise<string> {
  const db = await getDatabase();
  const result = db.exec('SELECT COUNT(*) FROM invoices');
  const count = result.length ? (result[0].values[0][0] as number) : 0;
  return `INV-${String(count + 1).padStart(5, '0')}`;
}
