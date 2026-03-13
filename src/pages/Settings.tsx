import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Printer, 
  Receipt, 
  Bell, 
  Database,
  Info,
  Download,
  Upload,
  Trash2,
  Save,
  HardDrive,
  Coins,
  Tags,
  Plus,
  X,
  RefreshCw,
  Calendar,
  Table2,
  Clock,
  Key,
  Timer
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { usePOS } from '@/contexts/POSContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useDatabaseStats } from '@/hooks/useDatabaseStats';
import { getStoredCategories } from '@/lib/storage';
import { toast } from 'sonner';
import { CURRENCIES, Category } from '@/types/pos';
import { AutoBackupSettings } from '@/components/settings/AutoBackupSettings';
import { UserPasswordSettings } from '@/components/settings/UserPasswordSettings';
import { useAutoBackup } from '@/hooks/useAutoBackup';

export const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, products, transactions, refreshData, categories: posCategories, setCategories: setPOSCategories } = usePOS();
  const { exportData, importData, resetDatabase, reloadDatabase } = useDatabase();
  const { stats, isLoading: statsLoading, refetchStats, updateLastBackupDate } = useDatabaseStats();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dbFileInputRef = useRef<HTMLInputElement>(null);
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [categories, setCategories] = useState<Category[]>(() => posCategories.length > 0 ? posCategories : getStoredCategories());
  const [newCategory, setNewCategory] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Auto-backup scheduler
  const { restartScheduler } = useAutoBackup(() => {
    refetchStats();
  });

  const handleSave = () => {
    updateSettings(localSettings);
    saveCategories(categories);
    toast.success('Settings saved successfully!');
  };

  const handleExportDatabase = async () => {
    try {
      setIsExporting(true);
      await exportData();
      updateLastBackupDate();
      toast.success('Database exported successfully!');
    } catch (err) {
      toast.error('Failed to export database');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const success = await importData(file);
      if (success) {
        toast.success('Database imported successfully! Refreshing data...');
        // Reload database and refresh POS data without page reload
        await reloadDatabase();
        await refreshData();
        // Navigate to dashboard to show updated data
        navigate('/');
      } else {
        toast.error('Failed to import database. Invalid file format.');
      }
    } catch (err) {
      toast.error('Failed to import database');
    } finally {
      setIsImporting(false);
      if (dbFileInputRef.current) {
        dbFileInputRef.current.value = '';
      }
    }
  };

  const handleResetDatabase = async () => {
    if (confirm('Are you sure you want to reset the database? This will delete all data and cannot be undone.')) {
      try {
        await resetDatabase();
        toast.success('Database reset. Refreshing...');
      } catch (err) {
        toast.error('Failed to reset database');
      }
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    const exists = categories.some(c => c.name.toLowerCase() === newCategory.toLowerCase());
    if (exists) {
      toast.error('Category already exists');
      return;
    }

    const colors = ['blue', 'green', 'orange', 'purple', 'pink', 'cyan', 'red', 'yellow'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newCat: Category = {
      id: Date.now().toString(),
      name: newCategory.trim(),
      color: randomColor,
    };
    
    setCategories([...categories, newCat]);
    setNewCategory('');
    toast.success(`Category "${newCat.name}" added`);
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat?.name === 'All Items') {
      toast.error('Cannot delete "All Items" category');
      return;
    }
    setCategories(categories.filter(c => c.id !== id));
    toast.success('Category deleted');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your POS system</p>
        </div>

        {/* Database Statistics */}
        <div className="pos-card bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <HardDrive className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">SQLite Database</h3>
                <p className="text-sm text-muted-foreground">Local browser database with IndexedDB persistence</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={refetchStats} disabled={statsLoading}>
              <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div className="p-3 rounded-lg bg-card">
              <p className="text-muted-foreground">Products</p>
              <p className="text-lg font-bold font-mono-numbers text-foreground">{products.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-card">
              <p className="text-muted-foreground">Transactions</p>
              <p className="text-lg font-bold font-mono-numbers text-foreground">{transactions.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-card">
              <p className="text-muted-foreground">Total Records</p>
              <p className="text-lg font-bold font-mono-numbers text-foreground">{stats?.totalRecords ?? '-'}</p>
            </div>
            <div className="p-3 rounded-lg bg-card">
              <p className="text-muted-foreground">Est. Size</p>
              <p className="text-lg font-bold font-mono-numbers text-foreground">
                {stats ? `${stats.totalSizeKB.toFixed(1)} KB` : '-'}
              </p>
            </div>
          </div>

          {/* Table Details */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-border bg-secondary/30">
              <Table2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Table Statistics</span>
            </div>
            <div className="divide-y divide-border max-h-48 overflow-y-auto">
              {stats?.tables.map((table) => (
                <div key={table.name} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="font-mono text-foreground">{table.name}</span>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground">{table.recordCount} records</span>
                    <span className="text-muted-foreground w-16 text-right">{table.sizeEstimate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Backup */}
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Last backup: {formatDate(stats?.lastBackupDate ?? null)}</span>
          </div>
        </div>

        {/* Database Backup & Restore */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-warning/10">
              <Database className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Database Backup & Restore</h3>
              <p className="text-sm text-muted-foreground">Export, import, or reset your SQLite database</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4" 
              onClick={handleExportDatabase}
              disabled={isExporting}
            >
              <div className="text-center">
                {isExporting ? (
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                ) : (
                  <Download className="w-6 h-6 mx-auto mb-2" />
                )}
                <p className="font-medium">Export Database</p>
                <p className="text-xs text-muted-foreground">Download SQLite .db file</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4" 
              onClick={() => dbFileInputRef.current?.click()}
              disabled={isImporting}
            >
              <div className="text-center">
                {isImporting ? (
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                )}
                <p className="font-medium">Import Database</p>
                <p className="text-xs text-muted-foreground">Restore from .db file</p>
              </div>
            </Button>
            <input
              ref={dbFileInputRef}
              type="file"
              accept=".db"
              onChange={handleImportDatabase}
              className="hidden"
            />
            
            <Button 
              variant="outline" 
              className="h-auto py-4 border-destructive/30 hover:bg-destructive/10 hover:text-destructive" 
              onClick={handleResetDatabase}
            >
              <div className="text-center">
                <Trash2 className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Reset Database</p>
                <p className="text-xs text-muted-foreground">Delete all data</p>
              </div>
            </Button>
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-secondary/50 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Importing a database will replace all current data 
              and reload the application. Make sure to export a backup before importing.
            </p>
          </div>
        </div>

        {/* Auto-Backup Scheduling */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Auto-Backup Scheduling</h3>
              <p className="text-sm text-muted-foreground">Automatic periodic backups stored locally</p>
            </div>
          </div>
          
          <AutoBackupSettings onSettingsChange={restartScheduler} />
        </div>

        {/* User PIN Settings */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Key className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Change Your PIN</h3>
              <p className="text-sm text-muted-foreground">Update your login credentials</p>
            </div>
          </div>
          
          <UserPasswordSettings />
        </div>

        {/* Session Timeout Settings */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Timer className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Session Timeout</h3>
              <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Enable Session Timeout</p>
                <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
              </div>
              <Switch 
                checked={localSettings.sessionTimeoutEnabled}
                onCheckedChange={(checked) => setLocalSettings(s => ({ ...s, sessionTimeoutEnabled: checked }))}
              />
            </div>
            
            {localSettings.sessionTimeoutEnabled && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Timeout Duration (minutes)</label>
                <select 
                  className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                  value={localSettings.sessionTimeoutMinutes}
                  onChange={(e) => setLocalSettings(s => ({ ...s, sessionTimeoutMinutes: parseInt(e.target.value) }))}
                >
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
                <p className="mt-2 text-xs text-muted-foreground">
                  A warning will appear 1 minute before automatic logout
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Currency Settings */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-success/10">
              <Coins className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Currency Settings</h3>
              <p className="text-sm text-muted-foreground">Set your preferred system currency</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">System Currency</label>
            <select 
              className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={localSettings.currency}
              onChange={(e) => setLocalSettings(s => ({ ...s, currency: e.target.value }))}
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} - {currency.name} ({currency.code})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              This currency will be used throughout the system for all monetary displays
            </p>
          </div>
        </div>

        {/* Categories Management */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Tags className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Product Categories</h3>
              <p className="text-sm text-muted-foreground">Manage your product categories</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Add Category */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter new category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button variant="pos-primary" onClick={handleAddCategory}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Categories List */}
            <div className="flex flex-wrap gap-2">
              {categories.filter(c => c.name !== 'All Items').map(cat => (
                <div 
                  key={cat.id} 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 group"
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: cat.color === 'blue' ? 'hsl(199, 89%, 48%)' :
                        cat.color === 'green' ? 'hsl(142, 71%, 45%)' :
                        cat.color === 'orange' ? 'hsl(38, 92%, 50%)' :
                        cat.color === 'purple' ? 'hsl(262, 83%, 58%)' :
                        cat.color === 'pink' ? 'hsl(330, 81%, 60%)' :
                        cat.color === 'cyan' ? 'hsl(188, 78%, 45%)' :
                        cat.color === 'red' ? 'hsl(0, 72%, 51%)' :
                        cat.color === 'yellow' ? 'hsl(48, 96%, 53%)' :
                        'hsl(199, 89%, 48%)'
                    }}
                  />
                  <span className="text-sm text-foreground">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Store Information</h3>
              <p className="text-sm text-muted-foreground">Basic details about your store</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Store Name</label>
              <Input 
                value={localSettings.storeName} 
                onChange={(e) => setLocalSettings(s => ({ ...s, storeName: e.target.value }))}
                className="mt-1" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
              <Input 
                value={localSettings.storePhone} 
                onChange={(e) => setLocalSettings(s => ({ ...s, storePhone: e.target.value }))}
                className="mt-1" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <Input 
                value={localSettings.storeAddress} 
                onChange={(e) => setLocalSettings(s => ({ ...s, storeAddress: e.target.value }))}
                className="mt-1" 
              />
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-success/10">
              <Receipt className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Receipt Settings</h3>
              <p className="text-sm text-muted-foreground">Customize your receipt layout</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Show Store Logo</p>
                <p className="text-sm text-muted-foreground">Display logo on printed receipts</p>
              </div>
              <Switch 
                checked={localSettings.showLogo}
                onCheckedChange={(checked) => setLocalSettings(s => ({ ...s, showLogo: checked }))}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Auto-Print Receipts</p>
                <p className="text-sm text-muted-foreground">Automatically print after each sale</p>
              </div>
              <Switch 
                checked={localSettings.autoPrint}
                onCheckedChange={(checked) => setLocalSettings(s => ({ ...s, autoPrint: checked }))}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Include Tax Breakdown</p>
                <p className="text-sm text-muted-foreground">Show detailed tax information</p>
              </div>
              <Switch 
                checked={localSettings.showTaxBreakdown}
                onCheckedChange={(checked) => setLocalSettings(s => ({ ...s, showTaxBreakdown: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Printer Settings */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-warning/10">
              <Printer className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Printer Settings</h3>
              <p className="text-sm text-muted-foreground">Configure thermal printer</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Receipt Width</label>
              <select 
                className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={localSettings.receiptWidth}
                onChange={(e) => setLocalSettings(s => ({ ...s, receiptWidth: e.target.value as '58' | '80' }))}
              >
                <option value="58">58mm</option>
                <option value="80">80mm</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Printer Connection</label>
              <div className="mt-2 p-4 rounded-lg bg-secondary/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-foreground">Browser Print (Default)</span>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-sm text-muted-foreground">Manage alerts and notifications</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">Notify when items are running low</p>
              </div>
              <Switch 
                checked={localSettings.lowStockAlerts}
                onCheckedChange={(checked) => setLocalSettings(s => ({ ...s, lowStockAlerts: checked }))}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Daily Sales Summary</p>
                <p className="text-sm text-muted-foreground">Send end-of-day reports</p>
              </div>
              <Switch 
                checked={localSettings.dailySummary}
                onCheckedChange={(checked) => setLocalSettings(s => ({ ...s, dailySummary: checked }))}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Sound Effects</p>
                <p className="text-sm text-muted-foreground">Play sounds for actions</p>
              </div>
              <Switch 
                checked={localSettings.soundEffects}
                onCheckedChange={(checked) => setLocalSettings(s => ({ ...s, soundEffects: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Tax Configuration</h3>
              <p className="text-sm text-muted-foreground">Set up tax rates</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tax Rate (%)</label>
              <NumberInput 
                min={0}
                allowDecimals={true}
                value={localSettings.taxRate} 
                onChange={(value) => setLocalSettings(s => ({ ...s, taxRate: value }))}
                className="mt-1" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tax Name</label>
              <Input 
                value={localSettings.taxName} 
                onChange={(e) => setLocalSettings(s => ({ ...s, taxName: e.target.value }))}
                className="mt-1" 
              />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-secondary">
              <Info className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">About SwiftPOS</h3>
              <p className="text-sm text-muted-foreground">Version 1.0.0 - Offline Edition</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            SwiftPOS is an ultramodern point of sale system designed for efficient retail operations.
            This offline version stores all data locally on your device, ensuring you can operate
            without an internet connection.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="pos-primary" size="lg" onClick={handleSave}>
            <Save className="w-5 h-5 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;