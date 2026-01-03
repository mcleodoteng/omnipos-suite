import { User } from '@/types/pos';
import { getDatabase, persistDatabase } from '../init';
import { recordLogin } from './loginHistoryRepository';

export async function getAllUsers(): Promise<User[]> {
  const db = await getDatabase();
  const results = db.exec('SELECT id, name, role, pin, email, phone, avatar_key, created_at, last_login FROM users ORDER BY name');
  
  if (!results.length) return [];
  
  return results[0].values.map((row: any) => ({
    id: row[0],
    name: row[1],
    role: row[2] as 'admin' | 'cashier' | 'manager',
    pin: row[3],
    email: row[4] || undefined,
    phone: row[5] || undefined,
    avatarKey: row[6] || undefined,
    createdAt: row[7] ? new Date(row[7]) : undefined,
    lastLogin: row[8] ? new Date(row[8]) : undefined,
  }));
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as string,
      name: row.name as string,
      role: row.role as 'admin' | 'cashier' | 'manager',
      pin: row.pin as string,
      email: row.email as string | undefined,
      phone: row.phone as string | undefined,
      createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
      lastLogin: row.last_login ? new Date(row.last_login as string) : undefined,
    };
  }
  
  stmt.free();
  return null;
}

export async function getUserByPin(pin: string): Promise<User | null> {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE pin = ?');
  stmt.bind([pin]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as string,
      name: row.name as string,
      role: row.role as 'admin' | 'cashier' | 'manager',
      pin: row.pin as string,
      email: row.email as string | undefined,
      phone: row.phone as string | undefined,
    };
  }
  
  stmt.free();
  return null;
}

export async function createUser(user: User): Promise<void> {
  const db = await getDatabase();
  const stmt = db.prepare(
    'INSERT INTO users (id, name, role, pin, email, phone, avatar_key) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  
  stmt.run([user.id, user.name, user.role, user.pin, user.email || null, user.phone || null, user.avatarKey || null]);
  stmt.free();
  await persistDatabase();
}

export async function updateUser(user: User): Promise<void> {
  const db = await getDatabase();
  const stmt = db.prepare(
    'UPDATE users SET name = ?, role = ?, pin = ?, email = ?, phone = ?, avatar_key = ? WHERE id = ?'
  );
  
  stmt.run([user.name, user.role, user.pin, user.email || null, user.phone || null, user.avatarKey || null, user.id]);
  stmt.free();
  await persistDatabase();
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM users WHERE id = ?', [id]);
  await persistDatabase();
}

export async function updateLastLogin(id: string, userName: string): Promise<void> {
  const db = await getDatabase();
  db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  await recordLogin(id, userName);
  await persistDatabase();
}

export async function saveAllUsers(users: User[]): Promise<void> {
  const db = await getDatabase();
  
  // Clear existing users
  db.run('DELETE FROM users');
  
  // Insert all users
  const stmt = db.prepare(
    'INSERT INTO users (id, name, role, pin, email, phone, avatar_key) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  
  users.forEach(user => {
    stmt.run([user.id, user.name, user.role, user.pin, user.email || null, user.phone || null, user.avatarKey || null]);
  });
  
  stmt.free();
  await persistDatabase();
}

// Current session management
export async function getCurrentUser(): Promise<User | null> {
  const db = await getDatabase();
  const results = db.exec('SELECT user_id FROM current_session WHERE id = 1');
  
  if (!results.length || !results[0].values[0][0]) return null;
  
  const userId = results[0].values[0][0] as string;
  return getUserById(userId);
}

export async function setCurrentUser(user: User | null): Promise<void> {
  const db = await getDatabase();
  db.run('UPDATE current_session SET user_id = ? WHERE id = 1', [user?.id || null]);
  
  if (user) {
    await updateLastLogin(user.id, user.name);
  }
  
  await persistDatabase();
}
