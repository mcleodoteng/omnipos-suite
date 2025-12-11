import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDatabase, exportDatabase, importDatabase } from '@/lib/database';

interface DatabaseContextType {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  exportData: () => Promise<void>;
  importData: (file: File) => Promise<boolean>;
  resetDatabase: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await getDatabase();
        setIsReady(true);
        console.log('SQLite database ready');
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
      } finally {
        setIsLoading(false);
      }
    };

    initDb();
  }, []);

  const exportData = useCallback(async () => {
    try {
      const data = await exportDatabase();
      const blob = new Blob([new Uint8Array(data)], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swiftpos_backup_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      throw err;
    }
  }, []);

  const importData = useCallback(async (file: File): Promise<boolean> => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      await importDatabase(data);
      // Reload the page to reinitialize with new data
      window.location.reload();
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }, []);

  const resetDatabase = useCallback(async () => {
    try {
      // Clear IndexedDB
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }
      // Reload to reinitialize
      window.location.reload();
    } catch (err) {
      console.error('Reset failed:', err);
      throw err;
    }
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        isReady,
        isLoading,
        error,
        exportData,
        importData,
        resetDatabase,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
