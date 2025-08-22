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
  showHelp(): void;
  delay(ms: number): Promise<void>;
  $dispatch?: (event: string, detail: any) => void;
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
        // Step 6: Convert to Fantasy Grounds XML automatically (like character ID input)
        this.currentStep = 'Converting to Fantasy Grounds XML...';
        this.uploadProgress = 90;
        await this.delay(200);

        try {
          const facade = (window as any).characterConverterFacade;
          if (!facade) {
            throw new Error('CharacterConverterFacade not available');
          }

          // Convert the processed character data to Fantasy Grounds XML
          const conversionResult = await facade.convertCharacterData(result.characterData);
          
          if (!conversionResult.success || !conversionResult.xml) {
            throw new Error(conversionResult.error || 'Failed to convert character to XML');
          }

          // Step 7: Store result (same as character ID input)
          this.currentStep = 'Complete!';
          this.uploadProgress = 100;
          await this.delay(300);

          const characterName = result.characterData.name || 'Unknown Character';
          const characterId = result.characterData.id || 'unknown';
          const conversionResults = Alpine.store('conversionResults');
          conversionResults.setResult(conversionResult.xml, characterName, characterId);

          // Dispatch character data event (same as character ID input, without fromFile flag)
          const characterDataEvent = new CustomEvent('characterDataLoaded', {
            detail: {
              characterData: result.characterData,
              xml: conversionResult.xml,
              characterName: characterName
            }
          });
          document.dispatchEvent(characterDataEvent);

          // Dispatch Alpine event to parent component
          if (this.$dispatch) {
            console.log('📁 Dispatching file-converted event to parent');
            this.$dispatch('file-converted', {
              characterData: result.characterData,
              xml: conversionResult.xml,
              characterName: characterName,
              characterId: `file_${result.characterData.id || Date.now()}`
            });
          } else {
            console.log('📁 $dispatch not available, trying direct access');
            
            // Fallback: directly update the parent enhanced converter component
            const converterElement = document.querySelector('[x-data*="enhancedCharacterConverter"]');
            if (converterElement && (converterElement as any)._x_dataStack) {
              const converterData = (converterElement as any)._x_dataStack[0];
              if (converterData) {
                console.log('📁 Directly updating parent converter component');
                converterData.characterId = `file_${result.characterData.id || Date.now()}`;
                converterData.isValidId = true;
                converterData.isConverting = false;
                converterData.progress = 100;
                converterData.currentStep = 'File conversion complete!';
                converterData.characterData = result.characterData;
              }
            }
          }

          notifications.addSuccess(`📁 Character "${characterName}" converted successfully!`);

          console.log('✅ File processed and converted successfully:', {
            character: result.characterData.name,
            source: result.sourceType,
            filename: result.filename
          });

        } catch (conversionError) {
          console.error('❌ XML conversion failed:', conversionError);
          const errorMessage = conversionError instanceof Error ? conversionError.message : 'Conversion failed';
          notifications.addError(`❌ File processed but conversion failed: ${errorMessage}`);
          
          this.currentStep = 'Conversion error';
          this.uploadProgress = 80; // Partial success
        }
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