/**
 * Format Selection Components Index
 * 
 * Registers all format selection components and initializes the format adapter registry.
 */

import './FormatSelector';
import './CompatibilityMatrix';

// Import and register format adapters
import { formatAdapterRegistry } from '@/domain/formats/FormatAdapterRegistry';
import { FantasyGroundsAdapter } from '@/domain/formats/adapters/FantasyGroundsAdapter';
import { FoundryVTTAdapter } from '@/domain/formats/adapters/FoundryVTTAdapter';
// import { Roll20Adapter } from '@/domain/formats/adapters/Roll20Adapter';
// import { GenericJSONAdapter } from '@/domain/formats/adapters/GenericJSONAdapter';

/**
 * Initialize format adapters
 */
export function initializeFormatAdapters(): void {
  console.log('🔧 Initializing format adapters...');
  
  try {
    // Register all available format adapters
    formatAdapterRegistry.register(new FantasyGroundsAdapter());
    formatAdapterRegistry.register(new FoundryVTTAdapter());
    // formatAdapterRegistry.register(new Roll20Adapter()); // Hidden - not fully implemented
    // formatAdapterRegistry.register(new GenericJSONAdapter()); // Hidden - not fully implemented
    
    const registeredFormats = formatAdapterRegistry.getAllFormatMetadata();
    console.log('✅ Format adapters initialized:', {
      count: registeredFormats.length,
      formats: registeredFormats.map(f => ({ id: f.id, name: f.name, version: f.version }))
    });
    
    // Make registry available globally for debugging
    (window as any).formatAdapterRegistry = formatAdapterRegistry;
    
  } catch (error) {
    console.error('❌ Failed to initialize format adapters:', error);
  }
}

/**
 * Get format compatibility summary for debugging
 */
export function getFormatCompatibilitySummary(): any {
  const formats = formatAdapterRegistry.getAllFormatMetadata();
  
  return {
    totalFormats: formats.length,
    availableFormats: formats.map(format => ({
      id: format.id,
      name: format.name,
      description: format.description,
      fileExtension: format.fileExtension,
      version: format.version,
      website: format.website
    })),
    registrySize: formatAdapterRegistry.size()
  };
}

// Auto-initialize adapters when module is imported
initializeFormatAdapters();

export { formatAdapterRegistry };