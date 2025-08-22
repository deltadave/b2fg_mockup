/**
 * File Uploader Component
 * 
 * Alpine.js component for secure file upload and processing with drag & drop support.
 * Integrates with FileProcessor service for comprehensive validation and security.
 */

import Alpine from 'alpinejs';
import { fileProcessor, FileProcessResult } from '@/domain/input/services/FileProcessor';

export interface FileUploaderData {
  // Upload state
  isDragging: boolean;
  isProcessing: boolean;
  uploadProgress: number;
  currentStep: string;
  
  // File data
  selectedFile: File | null;
  fileName: string;
  fileSize: string;
  fileType: string;
  
  // Results
  processResult: FileProcessResult | null;
  showValidationDetails: boolean;
  
  // Methods
  init(): void;
  handleDragOver(event: DragEvent): void;
  handleDragEnter(event: DragEvent): void;
  handleDragLeave(event: DragEvent): void;
  handleDrop(event: DragEvent): void;
  handleFileSelect(event: Event): void;
  processFile(file: File): Promise<void>;
  clearFile(): void;
  formatFileSize(bytes: number): string;
  getFileIcon(type: string): string;
  getValidationIcon(isValid: boolean): string;
  downloadProcessedFile(): void;
  showHelp(): void;
  delay(ms: number): Promise<void>;
}

// Alpine.js file uploader component
Alpine.data('fileUploader', (): FileUploaderData => ({
  // Upload state
  isDragging: false,
  isProcessing: false,
  uploadProgress: 0,
  currentStep: '',
  
  // File data
  selectedFile: null,
  fileName: '',
  fileSize: '',
  fileType: '',
  
  // Results
  processResult: null,
  showValidationDetails: false,
  
  init() {
    console.log('📁 File Uploader component initialized');
    
    // Listen for file drops on the entire document to prevent default browser behavior
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  },

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  },

  handleDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  },

  handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Only stop dragging if we're leaving the drop zone completely
    if (!event.currentTarget || !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
      this.isDragging = false;
    }
  },

  async handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      await this.processFile(file);
    }
  },

  async handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      await this.processFile(file);
    }
  },

  async processFile(file: File) {
    try {
      // Clear previous results
      this.processResult = null;
      this.selectedFile = file;
      this.fileName = file.name;
      this.fileSize = this.formatFileSize(file.size);
      this.fileType = file.type || 'unknown';
      
      this.isProcessing = true;
      this.uploadProgress = 0;
      this.currentStep = 'Validating file...';
      
      console.log('📁 Processing file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Step 1: Initial validation
      this.currentStep = 'Validating file properties...';
      this.uploadProgress = 20;
      await this.delay(200);

      // Step 2: Security scanning
      this.currentStep = 'Running security checks...';
      this.uploadProgress = 40;
      await this.delay(300);

      // Step 3: Content processing
      this.currentStep = 'Processing file content...';
      this.uploadProgress = 60;
      await this.delay(200);

      // Step 4: Parse character data
      this.currentStep = 'Parsing character data...';
      this.uploadProgress = 80;

      // Process file with FileProcessor service
      const result = await fileProcessor.processFile(file);
      this.processResult = result;

      // Step 5: Complete
      this.currentStep = 'Processing complete!';
      this.uploadProgress = 100;
      await this.delay(300);

      const notifications = Alpine.store('notifications');
      
      if (result.success && result.characterData) {
        // Success - dispatch character data event
        const characterDataEvent = new CustomEvent('characterDataLoaded', {
          detail: {
            characterData: result.characterData,
            sourceType: result.sourceType,
            filename: result.filename,
            fromFile: true
          }
        });
        document.dispatchEvent(characterDataEvent);

        // Store in conversion results for download
        const conversionResults = Alpine.store('conversionResults');
        if (result.sourceType === 'fantasy-grounds-xml') {
          // For XML files, we might want to display them directly or convert them back to D&D Beyond format
          notifications.addInfo(`📄 Fantasy Grounds XML file loaded: ${result.characterData.name}`);
        } else {
          // For JSON files, proceed with normal conversion
          notifications.addSuccess(`📁 Character file loaded successfully: ${result.characterData.name}`);
        }

        console.log('✅ File processed successfully:', {
          character: result.characterData.name,
          source: result.sourceType,
          filename: result.filename
        });
      } else {
        // Error handling
        const errorMessage = result.errors ? result.errors.join('; ') : 'Unknown error';
        notifications.addError(`❌ File processing failed: ${errorMessage}`);
        
        console.error('❌ File processing failed:', result.errors);
      }

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          notifications.addWarning(`⚠️ ${warning}`);
        });
      }

    } catch (error) {
      console.error('File processing error:', error);
      
      const notifications = Alpine.store('notifications');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      notifications.addError(`File processing failed: ${errorMessage}`);
      
      this.currentStep = 'Error occurred';
      this.uploadProgress = 0;
      this.processResult = {
        success: false,
        errors: [errorMessage]
      };
    } finally {
      this.isProcessing = false;
    }
  },

  clearFile() {
    this.selectedFile = null;
    this.fileName = '';
    this.fileSize = '';
    this.fileType = '';
    this.processResult = null;
    this.uploadProgress = 0;
    this.currentStep = '';
    this.showValidationDetails = false;
    
    // Clear file input
    const fileInput = document.querySelector('#file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    console.log('📁 File uploader cleared');
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileIcon(type: string): string {
    if (type.includes('json')) return '📋';
    if (type.includes('xml')) return '📄';
    return '📁';
  },

  getValidationIcon(isValid: boolean): string {
    return isValid ? '✅' : '❌';
  },

  async downloadProcessedFile() {
    if (!this.processResult?.success || !this.processResult.characterData) {
      const notifications = Alpine.store('notifications');
      notifications.addError('No processed file available for download');
      return;
    }

    try {
      // Use the existing character converter facade to convert to Fantasy Grounds XML
      const facade = (window as any).characterConverterFacade;
      if (!facade) {
        throw new Error('CharacterConverterFacade not available');
      }

      const notifications = Alpine.store('notifications');
      notifications.addInfo('🔄 Converting character to Fantasy Grounds XML...');

      // Convert the processed character data to Fantasy Grounds XML
      const result = await facade.convertCharacterData(this.processResult.characterData);
      
      if (!result.success || !result.xml) {
        throw new Error(result.error || 'Failed to convert character to XML');
      }

      // Create downloadable XML file
      const blob = new Blob([result.xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      const characterName = this.processResult.characterData.name || 'character';
      const characterId = this.processResult.characterData.id || 'unknown';
      const sanitizedName = characterName.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizedName}_${characterId}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notifications.addSuccess(`✅ Fantasy Grounds XML downloaded: ${characterName}`);
      
      // Also store the result in the conversion results store for consistency
      const conversionResults = Alpine.store('conversionResults');
      conversionResults.setResult(result.xml, characterName);
      
    } catch (error) {
      console.error('XML conversion/download error:', error);
      const notifications = Alpine.store('notifications');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      notifications.addError(`Failed to convert to Fantasy Grounds XML: ${errorMessage}`);
    }
  },

  showHelp() {
    const notifications = Alpine.store('notifications');
    notifications.addInfo(`
      📁 <strong>File Upload Help:</strong><br>
      • Supported formats: JSON (.json), XML (.xml)<br>
      • Maximum file size: 5MB<br>
      • Drag & drop or click to select files<br>
      • Files are processed with comprehensive security validation<br>
      • D&D Beyond JSON and Fantasy Grounds XML formats supported
    `);
  },

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}));

console.log('📁 File Uploader component registered');