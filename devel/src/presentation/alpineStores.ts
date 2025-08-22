import Alpine from 'alpinejs';

// Conversion Results Store
interface ConversionResultsStore {
  result: string | null;
  filename: string;
  characterName: string;
  convertedAt: Date | null;
  hasResult: boolean;
  resultSize: string;
  setResult(xml: string, characterName?: string, characterId?: string): void;
  clearResult(): void;
  downloadXML(): boolean;
}

Alpine.store('conversionResults', {
  result: null as string | null,
  filename: '',
  characterName: '',
  convertedAt: null as Date | null,

  get hasResult(): boolean {
    return this.result !== null && this.result.trim().length > 0;
  },

  get resultSize(): string {
    if (!this.result) return '0 KB';
    const bytes = new Blob([this.result]).size;
    const kb = Math.round(bytes / 1024 * 100) / 100;
    return `${kb} KB`;
  },

  setResult(xml: string, characterName: string = 'Unknown Character', characterId?: string): void {
    this.result = xml;
    this.characterName = characterName;
    this.convertedAt = new Date();
    
    // Use new naming format: charactername_characterID.xml
    const sanitizedName = characterName.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (characterId) {
      this.filename = `${sanitizedName}_${characterId}.xml`;
    } else {
      this.filename = `${sanitizedName}_character.xml`;
    }
    
    console.log('Conversion result set:', { characterName, characterId, filename: this.filename, size: this.resultSize });
  },

  clearResult(): void {
    this.result = null;
    this.filename = '';
    this.characterName = '';
    this.convertedAt = null;
    console.log('Conversion result cleared');
  },

  downloadXML(): boolean {
    if (!this.hasResult) {
      console.warn('No conversion result to download');
      return false;
    }

    try {
      // Create blob and download
      const blob = new Blob([this.result!], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = this.filename || 'character.xml';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      URL.revokeObjectURL(url);
      
      console.log('XML file downloaded:', this.filename);
      return true;
    } catch (error) {
      console.error('Failed to download XML:', error);
      return false;
    }
  }
} as ConversionResultsStore);

// Notifications Store
interface NotificationItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  autoDismiss: boolean;
}

interface NotificationsStore {
  items: NotificationItem[];
  hasNotifications: boolean;
  add(message: string, type: NotificationItem['type'], autoDismiss?: boolean): NotificationItem;
  addSuccess(message: string, autoDismiss?: boolean): NotificationItem;
  addError(message: string, autoDismiss?: boolean): NotificationItem;
  addWarning(message: string, autoDismiss?: boolean): NotificationItem;
  addInfo(message: string, autoDismiss?: boolean): NotificationItem;
  remove(id: string): void;
  clear(): void;
}

Alpine.store('notifications', {
  items: [] as NotificationItem[],

  get hasNotifications(): boolean {
    return this.items.length > 0;
  },

  add(message: string, type: NotificationItem['type'], autoDismiss: boolean = true): NotificationItem {
    const notification: NotificationItem = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: new Date(),
      autoDismiss
    };

    this.items.push(notification);
    console.log('Notification added:', notification);

    // Auto-dismiss after 5 seconds for success/info, 8 seconds for warnings, no auto-dismiss for errors
    if (autoDismiss) {
      const dismissTime = type === 'error' ? 0 : type === 'warning' ? 8000 : 5000;
      if (dismissTime > 0) {
        setTimeout(() => {
          this.remove(notification.id);
        }, dismissTime);
      }
    }

    return notification;
  },

  addSuccess(message: string, autoDismiss: boolean = true): NotificationItem {
    return this.add(message, 'success', autoDismiss);
  },

  addError(message: string, autoDismiss: boolean = false): NotificationItem {
    return this.add(message, 'error', autoDismiss);
  },

  addWarning(message: string, autoDismiss: boolean = true): NotificationItem {
    return this.add(message, 'warning', autoDismiss);
  },

  addInfo(message: string, autoDismiss: boolean = true): NotificationItem {
    return this.add(message, 'info', autoDismiss);
  },

  remove(id: string): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      console.log('Notification removed:', id);
    }
  },

  clear(): void {
    this.items = [];
    console.log('All notifications cleared');
  }
} as NotificationsStore);