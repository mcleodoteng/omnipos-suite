import { useState, useEffect } from 'react';
import { Clock, Play, Pause, Trash2, Download, Archive, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAutoBackupSettings,
  saveAutoBackupSettings,
  createBackup,
  getAllBackups,
  deleteBackup,
  downloadBackup,
  AutoBackupSettings as BackupSettings,
  BackupEntry,
} from '@/hooks/useAutoBackup';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AutoBackupSettingsProps {
  onSettingsChange?: () => void;
}

const INTERVAL_OPTIONS = [
  { value: '15', label: 'Every 15 minutes' },
  { value: '30', label: 'Every 30 minutes' },
  { value: '60', label: 'Every hour' },
  { value: '120', label: 'Every 2 hours' },
  { value: '360', label: 'Every 6 hours' },
  { value: '720', label: 'Every 12 hours' },
  { value: '1440', label: 'Every 24 hours' },
];

export function AutoBackupSettings({ onSettingsChange }: AutoBackupSettingsProps) {
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedSettings, loadedBackups] = await Promise.all([
        getAutoBackupSettings(),
        getAllBackups(),
      ]);
      setSettings(loadedSettings);
      setBackups(loadedBackups);
    } catch (error) {
      console.error('Failed to load backup settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!settings) return;
    
    const newSettings: BackupSettings = {
      ...settings,
      enabled,
      nextScheduledBackup: enabled 
        ? new Date(Date.now() + settings.intervalMinutes * 60 * 1000).toISOString()
        : null,
    };
    
    await saveAutoBackupSettings(newSettings);
    setSettings(newSettings);
    onSettingsChange?.();
    toast.success(enabled ? 'Auto-backup enabled' : 'Auto-backup disabled');
  };

  const handleIntervalChange = async (value: string) => {
    if (!settings) return;
    
    const intervalMinutes = parseInt(value, 10);
    const newSettings: BackupSettings = {
      ...settings,
      intervalMinutes,
      nextScheduledBackup: settings.enabled
        ? new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString()
        : null,
    };
    
    await saveAutoBackupSettings(newSettings);
    setSettings(newSettings);
    onSettingsChange?.();
    toast.success(`Backup interval updated to ${INTERVAL_OPTIONS.find(o => o.value === value)?.label}`);
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await createBackup();
      await loadData();
      toast.success('Manual backup created successfully');
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const [deleteConfirmBackupId, setDeleteConfirmBackupId] = useState<string | null>(null);

  const handleDeleteBackup = async (id: string) => {
    try {
      await deleteBackup(id);
      setBackups(backups.filter(b => b.id !== id));
      toast.success('Backup deleted');
    } catch (error) {
      toast.error('Failed to delete backup');
    }
    setDeleteConfirmBackupId(null);
  };

  const handleDownloadBackup = async (backup: BackupEntry) => {
    try {
      await downloadBackup(backup);
      toast.success('Backup downloaded');
    } catch (error) {
      toast.error('Failed to download backup');
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Backup Toggle */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div className="flex items-center gap-3">
          {settings.enabled ? (
            <Play className="w-5 h-5 text-success" />
          ) : (
            <Pause className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium text-foreground">Automatic Backups</p>
            <p className="text-sm text-muted-foreground">
              {settings.enabled 
                ? `Next backup: ${settings.nextScheduledBackup ? formatDate(settings.nextScheduledBackup) : 'Soon'}`
                : 'Backups are currently disabled'}
            </p>
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={handleToggleEnabled}
        />
      </div>

      {/* Backup Interval */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Backup Frequency</label>
        <Select
          value={settings.intervalMinutes.toString()}
          onValueChange={handleIntervalChange}
          disabled={!settings.enabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTERVAL_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Manual Backup Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleCreateBackup}
        disabled={isCreatingBackup}
      >
        {isCreatingBackup ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Archive className="w-4 h-4 mr-2" />
        )}
        Create Manual Backup
      </Button>

      {/* Backup History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">Backup History</h4>
          <span className="text-xs text-muted-foreground">{backups.length} / 10 backups</span>
        </div>

        {backups.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm bg-secondary/30 rounded-lg">
            No backups yet. Create your first backup above.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {backups.map(backup => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg group"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(backup.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatSize(backup.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadBackup(backup)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmBackupId(backup.id)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-secondary/50 text-sm">
        <p className="text-muted-foreground">
          <strong className="text-foreground">Note:</strong> Automatic backups are stored locally in your browser. 
          Up to 10 backups are kept; older ones are automatically deleted.
        </p>
      </div>

      <AlertDialog open={!!deleteConfirmBackupId} onOpenChange={() => setDeleteConfirmBackupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmBackupId && handleDeleteBackup(deleteConfirmBackupId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
