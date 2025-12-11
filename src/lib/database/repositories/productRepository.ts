import { Product } from '@/types/pos';
import { getDatabase, persistDatabase } from '../init';

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDatabase();
  const results = db.exec(`
    SELECT id, name, price, category, sku, stock, image, barcode, description, cost_price, unit 
    FROM products ORDER BY name
  `);
  
  if (!results.length) return [];
  
  return results[0].values.map((row: any) => ({
    id: row[0],
    name: row[1],
    price: row[2],
    category: row[3],
    sku: row[4],
    stock: row[5],
    image: row[6] || undefined,
    barcode: row[7] || undefined,
    description: row[8] || undefined,
    costPrice: row[9] || undefined,
    unit: row[10] || undefined,
  }));
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
  stmt.bind([id]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as string,
      name: row.name as string,
      price: row.price as number,
      category: row.category as string,
      sku: row.sku as string,
      stock: row.stock as number,
      image: row.image as string | undefined,
      barcode: row.barcode as string | undefined,
      description: row.description as string | undefined,
      costPrice: row.cost_price as number | undefined,
      unit: row.unit as string | undefined,
    };
  }
  
  stmt.free();
  return null;
}

export async function createProduct(product: Product): Promise<void> {
  const db = await getDatabase();
  const stmt = db.prepare(`
    INSERT INTO products (id, name, price, category, sku, stock, image, barcode, description, cost_price, unit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run([
    product.id,
    product.name,
    product.price,
    product.category,
    product.sku,
    product.stock,
    product.image || null,
    product.barcode || null,
    product.description || null,
    product.costPrice || null,
    product.unit || null,
  ]);
  
  stmt.free();
  await persistDatabase();
}

export async function updateProduct(product: Product): Promise<void> {
  const db = await getDatabase();
  const stmt = db.prepare(`
    UPDATE products 
    SET name = ?, price = ?, category = ?, sku = ?, stock = ?, 
        image = ?, barcode = ?, description = ?, cost_price = ?, unit = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run([
    product.name,
    product.price,
    product.category,
    product.sku,
    product.stock,
    product.image || null,
    product.barcode || null,
    product.description || null,
    product.costPrice || null,
    product.unit || null,
    product.id,
  ]);
  
  stmt.free();
  await persistDatabase();
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM products WHERE id = ?', [id]);
  await persistDatabase();
}

export async function updateProductStock(id: string, newStock: number): Promise<void> {
  const db = await getDatabase();
  db.run('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, id]);
  await persistDatabase();
}

export async function saveAllProducts(products: Product[]): Promise<void> {
  const db = await getDatabase();
  
  // Clear existing products
  db.run('DELETE FROM products');
  
  // Insert all products
  const stmt = db.prepare(`
    INSERT INTO products (id, name, price, category, sku, stock, image, barcode, description, cost_price, unit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  products.forEach(product => {
    stmt.run([
      product.id,
      product.name,
      product.price,
      product.category,
      product.sku,
      product.stock,
      product.image || null,
      product.barcode || null,
      product.description || null,
      product.costPrice || null,
      product.unit || null,
    ]);
  });
  
  stmt.free();
  await persistDatabase();
}
