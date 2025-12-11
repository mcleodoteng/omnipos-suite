import { Category } from '@/types/pos';
import { getDatabase, persistDatabase } from '../init';

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const results = db.exec('SELECT id, name, color, icon FROM categories ORDER BY name');
  
  if (!results.length) return [];
  
  return results[0].values.map((row: any) => ({
    id: row[0],
    name: row[1],
    color: row[2],
    icon: row[3] || undefined,
  }));
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
  stmt.bind([id]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as string,
      name: row.name as string,
      color: row.color as string,
      icon: row.icon as string | undefined,
    };
  }
  
  stmt.free();
  return null;
}

export async function createCategory(category: Category): Promise<void> {
  const db = await getDatabase();
  const stmt = db.prepare('INSERT INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?)');
  stmt.run([category.id, category.name, category.color, category.icon || null]);
  stmt.free();
  await persistDatabase();
}

export async function updateCategory(category: Category): Promise<void> {
  const db = await getDatabase();
  const stmt = db.prepare('UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?');
  stmt.run([category.name, category.color, category.icon || null, category.id]);
  stmt.free();
  await persistDatabase();
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM categories WHERE id = ?', [id]);
  await persistDatabase();
}

export async function saveAllCategories(categories: Category[]): Promise<void> {
  const db = await getDatabase();
  
  // Clear existing categories
  db.run('DELETE FROM categories');
  
  // Insert all categories
  const stmt = db.prepare('INSERT INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?)');
  
  categories.forEach(cat => {
    stmt.run([cat.id, cat.name, cat.color, cat.icon || null]);
  });
  
  stmt.free();
  await persistDatabase();
}
