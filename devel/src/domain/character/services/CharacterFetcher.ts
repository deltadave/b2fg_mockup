/**
 * CharacterFetcher Service
 * 
 * Handles fetching character data from D&D Beyond API with proper error handling,
 * validation, and retry logic. Designed to replace legacy fetch logic from app.js.
 */

export interface CharacterData {
  id: number;
  name: string;
  race?: any;
  classes?: any[];
  stats?: any[];
  bonusStats?: any[];
  modifiers?: any;
  inventory?: any[];
  spells?: any;
  [key: string]: any;
}

export interface FetchResult {
  success: boolean;
  data?: CharacterData;
  error?: string;
  statusCode?: number;
}

export interface CharacterValidation {
  valid: boolean;
  sanitized?: string;
  error?: string;
}

export class CharacterFetcher {
  private readonly PROXY_URL = 'https://uakari-indigo.fly.dev/';
  private readonly DNDBEYOND_API_BASE = 'https://character-service.dndbeyond.com/character/v5/character/';
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  /**
   * Validate and sanitize character ID input
   * Migrated from legacy validateCharacterID() function
   */
  validateCharacterID(input: string): CharacterValidation {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: 'Character ID is required' };
    }

    const trimmed = input.trim();
    
    // Extract ID from D&D Beyond URL
    const urlMatch = trimmed.match(/dndbeyond\.com\/characters\/(\d+)/);
    if (urlMatch) {
      return { valid: true, sanitized: urlMatch[1] };
    }

    // Validate direct character ID (digits only)
    const idMatch = trimmed.match(/^\d+$/);
    if (idMatch) {
      return { valid: true, sanitized: trimmed };
    }

    return { 
      valid: false, 
      error: 'Invalid format. Use character ID or D&D Beyond character URL' 
    };
  }

  /**
   * Fetch character data from D&D Beyond API
   * Replaces legacy fetch logic from app.js lines 88-140
   */
  async fetchCharacter(characterId: string): Promise<FetchResult> {
    // Validate input
    const validation = this.validateCharacterID(characterId);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const sanitizedId = validation.sanitized!;
    console.log('Fetching character data for ID:', sanitizedId);

    // Construct URL with proxy
    const fetchUrl = `${this.PROXY_URL}${this.DNDBEYOND_API_BASE}${sanitizedId}`;
    console.log('Fetch URL:', fetchUrl);

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`Fetch attempt ${attempt}/${this.MAX_RETRIES}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'https://www.dndbeyond.com',
            'X-Requested-With': 'XMLHttpRequest'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorMsg = this.getErrorMessage(response.status);
          return { 
            success: false, 
            error: errorMsg,
            statusCode: response.status
          };
        }

        // Parse JSON response
        let apiResponse;
        try {
          apiResponse = await response.json();
        } catch (jsonError) {
          return { 
            success: false, 
            error: `JSON parsing error: ${(jsonError as Error).message}` 
          };
        }

        // Handle proxy wrapper format: {success: true, data: {...}}
        let characterData: CharacterData;
        if (apiResponse.success && apiResponse.data) {
          characterData = apiResponse.data;
        } else if (apiResponse.id && apiResponse.name) {
          // Direct character data format
          characterData = apiResponse;
        } else {
          return { 
            success: false, 
            error: 'Invalid response format from D&D Beyond API' 
          };
        }

        // Validate response structure
        if (!this.isValidCharacterData(characterData)) {
          return { 
            success: false, 
            error: 'Invalid character data received from D&D Beyond' 
          };
        }

        console.log('Character data fetched successfully:', characterData.name);
        return { success: true, data: characterData };

      } catch (error) {
        lastError = error as Error;
        console.warn(`Fetch attempt ${attempt} failed:`, error);

        // Don't retry on certain error types
        if (this.isNonRetryableError(error as Error)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const errorMessage = this.formatFinalError(lastError);
    return { success: false, error: errorMessage };
  }

  /**
   * Get user-friendly error message for HTTP status codes
   */
  private getErrorMessage(status: number): string {
    switch (status) {
      case 401:
        return 'Character not found or not public. Ensure character visibility is set to Public.';
      case 403:
        return 'Access denied. Character must be set to Public visibility.';
      case 404:
        return 'Character not found. Please check the character ID.';
      case 429:
        return 'Rate limit exceeded. Please wait before trying again.';
      case 500:
      case 502:
      case 503:
        return 'D&D Beyond server error. Please try again later.';
      default:
        return `Unable to fetch character data (Error ${status}). Please try again.`;
    }
  }

  /**
   * Validate that the response contains required character data
   */
  private isValidCharacterData(data: any): data is CharacterData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.id === 'number' &&
      typeof data.name === 'string' &&
      data.name.length > 0
    );
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    return (
      error.name === 'AbortError' ||
      error.message.includes('401') ||
      error.message.includes('403') ||
      error.message.includes('404')
    );
  }

  /**
   * Format final error message for user display
   */
  private formatFinalError(error: Error | null): string {
    if (!error) {
      return 'Unknown error occurred while fetching character data';
    }

    if (error.name === 'AbortError') {
      return 'Request timed out. Please check your connection and try again.';
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Network error. Please check your internet connection and try again.';
    }

    if (error.message.includes('CORS')) {
      return 'CORS error. The proxy service may be temporarily unavailable.';
    }

    return `Network error: ${error.message}. Please try again.`;
  }

  /**
   * Check if the service is available (health check)
   */
  async checkServiceHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.PROXY_URL, {
        method: 'HEAD',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('Proxy service health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance for immediate use
export const characterFetcher = new CharacterFetcher();