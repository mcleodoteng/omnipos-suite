import { useState, useRef } from 'react';
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
  X
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePOS } from '@/contexts/POSContext';
import { exportAllData, importAllData, clearAllData, getStoredCategories, saveCategories } from '@/lib/storage';
import { toast } from 'sonner';
import { CURRENCIES, Category } from '@/types/pos';

export const Settings = () => {
  const { settings, updateSettings, products, transactions } = usePOS();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [newCategory, setNewCategory] = useState('');

  const handleSave = () => {
    updateSettings(localSettings);
    saveCategories(categories);
    toast.success('Settings saved successfully!');
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swiftpos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (importAllData(content)) {
        toast.success('Data imported successfully! Please refresh the page.');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error('Failed to import data. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearAllData();
      toast.success('All data cleared. Refreshing...');
      setTimeout(() => window.location.reload(), 1000);
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

  const storageUsed = () => {
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith('swiftpos_')) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return (total / 1024).toFixed(2);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your POS system</p>
        </div>

        {/* Local Storage Info */}
        <div className="pos-card bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <HardDrive className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Local Storage Mode</h3>
              <p className="text-sm text-muted-foreground">All data is stored locally on this device</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-card">
              <p className="text-muted-foreground">Products</p>
              <p className="text-lg font-bold font-mono-numbers text-foreground">{products.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-card">
              <p className="text-muted-foreground">Transactions</p>
              <p className="text-lg font-bold font-mono-numbers text-foreground">{transactions.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-card">
              <p className="text-muted-foreground">Storage Used</p>
              <p className="text-lg font-bold font-mono-numbers text-foreground">{storageUsed()} KB</p>
            </div>
            <div className="p-3 rounded-lg bg-card">
              <p className="text-muted-foreground">Status</p>
              <p className="text-lg font-bold text-success">Active</p>
            </div>
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

        {/* Data Management */}
        <div className="pos-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-warning/10">
              <Database className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Data Management</h3>
              <p className="text-sm text-muted-foreground">Backup, restore, or clear your data</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4" onClick={handleExport}>
              <div className="text-center">
                <Download className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Export Backup</p>
                <p className="text-xs text-muted-foreground">Download all data as JSON</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4" 
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Import Backup</p>
                <p className="text-xs text-muted-foreground">Restore from JSON file</p>
              </div>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            
            <Button 
              variant="outline" 
              className="h-auto py-4 border-destructive/30 hover:bg-destructive/10 hover:text-destructive" 
              onClick={handleClearData}
            >
              <div className="text-center">
                <Trash2 className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Clear All Data</p>
                <p className="text-xs text-muted-foreground">Reset to default state</p>
              </div>
            </Button>
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
              <Input 
                type="number" 
                value={localSettings.taxRate} 
                onChange={(e) => setLocalSettings(s => ({ ...s, taxRate: parseFloat(e.target.value) || 0 }))}
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