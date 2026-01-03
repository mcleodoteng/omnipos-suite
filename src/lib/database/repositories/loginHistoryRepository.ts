import { getDatabase, persistDatabase } from '../init';

export interface LoginRecord {
  id: number;
  userId: string;
  userName: string;
  loginAt: Date;
  userAgent?: string;
}

export async function recordLogin(userId: string, userName: string): Promise<void> {
  const db = await getDatabase();
  const userAgent = navigator.userAgent;
  
  db.run(
    'INSERT INTO login_history (user_id, user_name, login_at, user_agent) VALUES (?, ?, ?, ?)',
    [userId, userName, new Date().toISOString(), userAgent]
  );
  
  await persistDatabase();
}

export async function getLoginHistory(limit: number = 100): Promise<LoginRecord[]> {
  const db = await getDatabase();
  const results = db.exec(
    `SELECT id, user_id, user_name, login_at, user_agent 
     FROM login_history 
     ORDER BY login_at DESC 
     LIMIT ?`,
    [limit]
  );
  
  if (!results.length) return [];
  
  return results[0].values.map((row: any) => ({
    id: row[0],
    userId: row[1],
    userName: row[2],
    loginAt: new Date(row[3]),
    userAgent: row[4] || undefined,
  }));
}

export async function getLoginHistoryByUser(userId: string, limit: number = 50): Promise<LoginRecord[]> {
  const db = await getDatabase();
  const results = db.exec(
    `SELECT id, user_id, user_name, login_at, user_agent 
     FROM login_history 
     WHERE user_id = ?
     ORDER BY login_at DESC 
     LIMIT ?`,
    [userId, limit]
  );
  
  if (!results.length) return [];
  
  return results[0].values.map((row: any) => ({
    id: row[0],
    userId: row[1],
    userName: row[2],
    loginAt: new Date(row[3]),
    userAgent: row[4] || undefined,
  }));
}

export async function clearLoginHistory(): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM login_history');
  await persistDatabase();
}
