import Alpine from 'alpinejs';

interface Feature {
  name: string;
  status: 'completed' | 'in_progress' | 'pending';
  description: string;
}

interface FeatureStatusData {
  features: Feature[];
  getOverallProgress(): number;
  getStatusColor(status: string): string;
  getStatusIcon(status: string): string;
}

Alpine.data('featureStatus', (): FeatureStatusData => ({
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
      status: 'in_progress',
      description: 'Decoupled service architecture'
    },
    {
      name: 'Legacy Integration',
      status: 'pending',
      description: 'Bridge between old and new code'
    },
    {
      name: 'Character Parser',
      status: 'pending',
      description: 'Extract and modernize parsing logic'
    },
    {
      name: 'Error Handling',
      status: 'pending',
      description: 'Comprehensive error management'
    },
    {
      name: 'Performance Metrics',
      status: 'pending',
      description: 'Conversion performance tracking'
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