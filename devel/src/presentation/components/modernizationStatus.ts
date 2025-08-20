import Alpine from 'alpinejs';

interface Feature {
  name: string;
  status: 'completed' | 'in_progress' | 'pending';
  description: string;
}

interface ModernizationStatusData {
  showStatus: boolean;
  features: Feature[];
  getOverallProgress(): number;
  getStatusColor(status: string): string;
  getStatusIcon(status: string): string;
}

Alpine.data('modernizationStatus', (): ModernizationStatusData => ({
  showStatus: false,
  
  features: [
    {
      name: 'Build System',
      status: 'completed',
      description: 'TypeScript + Vite + Tailwind CSS'
    },
    {
      name: 'Feature Flags',
      status: 'completed',
      description: 'Runtime feature toggles with admin panel'
    },
    {
      name: 'Alpine.js Framework',
      status: 'completed',
      description: 'Modern reactive UI components'
    },
    {
      name: 'Character Converter',
      status: 'in_progress',
      description: 'Modern replacement for legacy converter'
    },
    {
      name: 'Dependency Injection',
      status: 'completed',
      description: 'Decoupled service architecture with IoC container'
    },
    {
      name: 'Character Parser',
      status: 'completed',
      description: 'Modernized parsing with services and level scaling'
    },
    {
      name: 'Error Handling',
      status: 'completed',
      description: 'Comprehensive error management and validation'
    },
    {
      name: 'Performance Metrics',
      status: 'completed',
      description: 'Conversion performance tracking and optimization'
    }
  ],

  getOverallProgress(): number {
    const completed = this.features.filter(f => f.status === 'completed').length;
    const inProgress = this.features.filter(f => f.status === 'in_progress').length;
    
    // Weight: completed = 1, in_progress = 0.5, pending = 0
    const totalProgress = completed + (inProgress * 0.5);
    const percentage = Math.round((totalProgress / this.features.length) * 100);
    
    return percentage;
  },

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-yellow-400';
      case 'pending':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  },

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'fas fa-check';
      case 'in_progress':
        return 'fas fa-clock';
      case 'pending':
        return 'fas fa-times';
      default:
        return 'fas fa-question';
    }
  }
}));

// Add keyboard shortcut listener for Ctrl+Shift+M
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'M') {
    event.preventDefault();
    // Get the Alpine data for modernizationStatus and toggle it
    const element = document.querySelector('[x-data*="modernizationStatus"]');
    if (element) {
      const alpineData = Alpine.$data(element) as ModernizationStatusData;
      alpineData.showStatus = !alpineData.showStatus;
    }
  }
});