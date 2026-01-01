import { useEffect, useRef, useCallback } from 'react';
import { exportDatabase } from '@/lib/database';
import { openDB, IDBPDatabase } from 'idb';

const BACKUP_IDB_NAME = 'SwiftPOS_Backups';
const BACKUP_STORE = 'backups';
const SETTINGS_STORE = 'settings';
const MAX_BACKUPS = 10;

export interface BackupEntry {
  id: string;
  date: Date;
  size: number;
  data: Uint8Array;
}

export interface AutoBackupSettings {
  enabled: boolean;
  intervalMinutes: number;
  lastAutoBackup: string | null;
  nextScheduledBackup: string | null;
}

const defaultSettings: AutoBackupSettings = {
  enabled: false,
  intervalMinutes: 60, // Default 1 hour
  lastAutoBackup: null,
  nextScheduledBackup: null,
};

let backupIdb: IDBPDatabase | null = null;

async function getBackupIDB(): Promise<IDBPDatabase> {
  if (backupIdb) return backupIdb;
  
  backupIdb = await openDB(BACKUP_IDB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(BACKUP_STORE)) {
        const store = database.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
        store.createIndex('date', 'date');
      }
      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE);
      }
    },
  });
  
  return backupIdb;
}

export async function getAutoBackupSettings(): Promise<AutoBackupSettings> {
  try {
    const db = await getBackupIDB();
    const settings = await db.get(SETTINGS_STORE, 'autoBackup');
    return settings || defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function saveAutoBackupSettings(settings: AutoBackupSettings): Promise<void> {
  const db = await getBackupIDB();
  await db.put(SETTINGS_STORE, settings, 'autoBackup');
}

export async function createBackup(): Promise<BackupEntry> {
  const db = await getBackupIDB();
  const data = await exportDatabase();
  
  const entry: BackupEntry = {
    id: `backup_${Date.now()}`,
    date: new Date(),
    size: data.byteLength,
    data: data,
  };
  
  await db.put(BACKUP_STORE, entry);
  
  // Clean up old backups if exceeding max
  const allBackups = await db.getAllFromIndex(BACKUP_STORE, 'date');
  if (allBackups.length > MAX_BACKUPS) {
    const toDelete = allBackups.slice(0, allBackups.length - MAX_BACKUPS);
    for (const backup of toDelete) {
      await db.delete(BACKUP_STORE, backup.id);
    }
  }
  
  return entry;
}

export async function getAllBackups(): Promise<BackupEntry[]> {
  const db = await getBackupIDB();
  const backups = await db.getAllFromIndex(BACKUP_STORE, 'date');
  return backups.reverse(); // Most recent first
}

export async function deleteBackup(id: string): Promise<void> {
  const db = await getBackupIDB();
  await db.delete(BACKUP_STORE, id);
}

export async function downloadBackup(backup: BackupEntry): Promise<void> {
  const blob = new Blob([new Uint8Array(backup.data)], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `swiftpos_backup_${backup.date.toISOString().split('T')[0]}.db`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useAutoBackup(onBackupComplete?: () => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const settingsRef = useRef<AutoBackupSettings>(defaultSettings);

  const performBackup = useCallback(async () => {
    try {
      await createBackup();
      const now = new Date();
      const nextBackup = new Date(now.getTime() + settingsRef.current.intervalMinutes * 60 * 1000);
      
      await saveAutoBackupSettings({
        ...settingsRef.current,
        lastAutoBackup: now.toISOString(),
        nextScheduledBackup: nextBackup.toISOString(),
      });
      
      onBackupComplete?.();
      console.log('Auto-backup completed at', now.toISOString());
    } catch (error) {
      console.error('Auto-backup failed:', error);
    }
  }, [onBackupComplete]);

  const startScheduler = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const settings = await getAutoBackupSettings();
    settingsRef.current = settings;

    if (!settings.enabled) {
      return;
    }

    const intervalMs = settings.intervalMinutes * 60 * 1000;
    
    // Check if we should backup immediately (missed backup)
    if (settings.nextScheduledBackup) {
      const nextBackup = new Date(settings.nextScheduledBackup);
      if (nextBackup <= new Date()) {
        await performBackup();
      }
    }

    intervalRef.current = setInterval(performBackup, intervalMs);
    console.log(`Auto-backup scheduler started: every ${settings.intervalMinutes} minutes`);
  }, [performBackup]);

  const stopScheduler = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Auto-backup scheduler stopped');
    }
  }, []);

  useEffect(() => {
    startScheduler();
    return () => stopScheduler();
  }, [startScheduler, stopScheduler]);

  return {
    restartScheduler: startScheduler,
    stopScheduler,
  };
}
