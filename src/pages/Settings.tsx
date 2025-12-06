import { 
  Store, 
  Printer, 
  Receipt, 
  Bell, 
  Database,
  Palette,
  Info
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export const Settings = () => {
  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your POS system</p>
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
              <Input defaultValue="SwiftPOS Store" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
              <Input defaultValue="(555) 123-4567" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <Input defaultValue="123 Main Street, City, State 12345" className="mt-1" />
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
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Auto-Print Receipts</p>
                <p className="text-sm text-muted-foreground">Automatically print after each sale</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Include Tax Breakdown</p>
                <p className="text-sm text-muted-foreground">Show detailed tax information</p>
              </div>
              <Switch defaultChecked />
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
              <select className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
                <option value="58">58mm</option>
                <option value="80" selected>80mm</option>
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
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Daily Sales Summary</p>
                <p className="text-sm text-muted-foreground">Send end-of-day reports</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Sound Effects</p>
                <p className="text-sm text-muted-foreground">Play sounds for actions</p>
              </div>
              <Switch />
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
              <Input type="number" defaultValue="10" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tax Name</label>
              <Input defaultValue="Sales Tax" className="mt-1" />
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
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            SwiftPOS is an ultramodern point of sale system designed for efficient retail operations.
            Built with love for small businesses.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="pos-primary" size="lg">
            Save Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
