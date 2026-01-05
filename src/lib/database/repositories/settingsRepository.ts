import { getDatabase, persistDatabase } from '../init';
import { INITIAL_SETTINGS } from '../schema';

export interface POSSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRate: number;
  taxName: string;
  receiptWidth: '58' | '80';
  showLogo: boolean;
  autoPrint: boolean;
  showTaxBreakdown: boolean;
  lowStockAlerts: boolean;
  dailySummary: boolean;
  soundEffects: boolean;
  currency: string;
  lowStockThreshold: number;
  sessionTimeoutEnabled: boolean;
  sessionTimeoutMinutes: number;
}

const defaultSettings: POSSettings = {
  storeName: 'SwiftPOS Store',
  storeAddress: '123 Main Street, City, State 12345',
  storePhone: '(555) 123-4567',
  taxRate: 10,
  taxName: 'Sales Tax',
  receiptWidth: '80',
  showLogo: true,
  autoPrint: false,
  showTaxBreakdown: true,
  lowStockAlerts: true,
  dailySummary: true,
  soundEffects: false,
  currency: 'GHS',
  lowStockThreshold: 20,
  sessionTimeoutEnabled: true,
  sessionTimeoutMinutes: 15,
};

export async function getSettings(): Promise<POSSettings> {
  const db = await getDatabase();
  const results = db.exec('SELECT key, value FROM settings');
  
  if (!results.length) return defaultSettings;
  
  const settings: Record<string, string> = {};
  results[0].values.forEach((row: any) => {
    settings[row[0]] = row[1];
  });
  
  return {
    storeName: settings.storeName || defaultSettings.storeName,
    storeAddress: settings.storeAddress || defaultSettings.storeAddress,
    storePhone: settings.storePhone || defaultSettings.storePhone,
    taxRate: parseFloat(settings.taxRate) || defaultSettings.taxRate,
    taxName: settings.taxName || defaultSettings.taxName,
    receiptWidth: (settings.receiptWidth as '58' | '80') || defaultSettings.receiptWidth,
    showLogo: settings.showLogo === 'true',
    autoPrint: settings.autoPrint === 'true',
    showTaxBreakdown: settings.showTaxBreakdown !== 'false',
    lowStockAlerts: settings.lowStockAlerts !== 'false',
    dailySummary: settings.dailySummary !== 'false',
    soundEffects: settings.soundEffects === 'true',
    currency: settings.currency || defaultSettings.currency,
    lowStockThreshold: parseInt(settings.lowStockThreshold) || defaultSettings.lowStockThreshold,
    sessionTimeoutEnabled: settings.sessionTimeoutEnabled !== 'false',
    sessionTimeoutMinutes: parseInt(settings.sessionTimeoutMinutes) || defaultSettings.sessionTimeoutMinutes,
  };
}

export async function updateSettings(newSettings: Partial<POSSettings>): Promise<void> {
  const db = await getDatabase();
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
  
  Object.entries(newSettings).forEach(([key, value]) => {
    stmt.run([key, String(value)]);
  });
  
  stmt.free();
  await persistDatabase();
}

export async function saveAllSettings(settings: POSSettings): Promise<void> {
  const db = await getDatabase();
  
  // Clear existing settings
  db.run('DELETE FROM settings');
  
  // Insert all settings
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  
  Object.entries(settings).forEach(([key, value]) => {
    stmt.run([key, String(value)]);
  });
  
  stmt.free();
  await persistDatabase();
}
