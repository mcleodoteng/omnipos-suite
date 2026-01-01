import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/database/init';

export interface DatabaseStats {
  tables: {
    name: string;
    recordCount: number;
    sizeEstimate: string;
  }[];
  totalRecords: number;
  totalSizeKB: number;
  lastBackupDate: string | null;
}

const LAST_BACKUP_KEY = 'swiftpos_last_backup';

export function useDatabaseStats() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = await getDatabase();
      
      const tables = [
        'products',
        'users', 
        'transactions',
        'transaction_items',
        'categories',
        'settings',
        'stock_adjustments',
        'cash_drawer'
      ];

      const tableStats = await Promise.all(
        tables.map(async (tableName) => {
          try {
            const countResult = db.exec(`SELECT COUNT(*) as count FROM ${tableName}`);
            const count = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;
            
            // Estimate size based on record count (rough estimate)
            const sizeEstimate = count * 0.5; // ~0.5KB per record average
            
            return {
              name: tableName,
              recordCount: count,
              sizeEstimate: sizeEstimate < 1 ? `${(sizeEstimate * 1024).toFixed(0)} B` : `${sizeEstimate.toFixed(1)} KB`
            };
          } catch {
            return { name: tableName, recordCount: 0, sizeEstimate: '0 B' };
          }
        })
      );

      const totalRecords = tableStats.reduce((sum, t) => sum + t.recordCount, 0);
      const totalSizeKB = tableStats.reduce((sum, t) => sum + t.recordCount * 0.5, 0);
      
      const lastBackupDate = localStorage.getItem(LAST_BACKUP_KEY);

      setStats({
        tables: tableStats,
        totalRecords,
        totalSizeKB,
        lastBackupDate
      });
    } catch (error) {
      console.error('Failed to fetch database stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLastBackupDate = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_BACKUP_KEY, now);
    setStats(prev => prev ? { ...prev, lastBackupDate: now } : null);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refetchStats: fetchStats, updateLastBackupDate };
}
