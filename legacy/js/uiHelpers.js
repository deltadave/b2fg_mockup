/*jshint esversion: 6 */
/*
 * UI Helpers Module
 * 
 * Contains user interface utility functions for the D&D character converter.
 * Handles file downloads, user notifications, input validation, and other
 * UI-related functionality with security best practices.
 * 
 * Functions:
 * - invokeSaveAsDialog() - Cross-browser file download functionality
 * - showSecureNotification() - Secure user notification system
 * - validateCharacterID() - Character ID input validation and sanitization
 * 
 * Dependencies:
 * - Requires fixQuote() from utilities.js for message sanitization
 */

// =============================================================================
// FILE DOWNLOAD UTILITIES
// =============================================================================

/**
 * Cross-browser file download functionality with fallbacks for older browsers
 * @param {Blob} file - The file blob to download
 * @param {string} fileName - Optional filename (will generate random if not provided)
 * @returns {void} - Initiates file download
 */
function invokeSaveAsDialog(file, fileName) {
    if (!file) {
        throw 'Blob object is required.';
    }

    if (!file.type) {
        file.type = 'video/webm';
    }

    var fileExtension = file.type.split('/')[1];

    if (fileName && fileName.indexOf('.') !== -1) {
        var splitted = fileName.split('.');
        fileName = splitted[0];
        fileExtension = splitted[1];
    }

    var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        return navigator.msSaveOrOpenBlob(file, fileFullName);
    } else if (typeof navigator.msSaveBlob !== 'undefined') {
        return navigator.msSaveBlob(file, fileFullName);
    }

    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(file);
    hyperlink.target = '_blank';
    hyperlink.download = fileFullName;

    if (!!navigator.mozGetUserMedia) {
        hyperlink.onclick = function() {
            (document.body || document.documentElement).removeChild(hyperlink);
        };
        (document.body || document.documentElement).appendChild(hyperlink);
    }

    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    hyperlink.dispatchEvent(evt);

    if (!navigator.mozGetUserMedia) {
        URL.revokeObjectURL(hyperlink.href);
    }
}

// =============================================================================
// USER NOTIFICATION SYSTEM
// =============================================================================

/**
 * Secure user notification system to replace alert() calls
 * Creates styled notification toasts with auto-removal and XSS protection
 * @param {string} message - Message to display (will be sanitized)
 * @param {string} type - Notification type ('error', 'success', 'info')
 * @param {number} duration - How long to show notification in milliseconds (default 5000)
 * @returns {HTMLElement} - The created notification element
 */
function showSecureNotification(message, type = 'error', duration = 5000) {
    // Sanitize the message to prevent XSS
    const sanitizedMessage = fixQuote(message);
    
    // Create notification element with secure content
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        max-width: 400px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        background-color: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
    `;
    
    // Use textContent to prevent XSS (never innerHTML)
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);
    
    return notification;
}

// =============================================================================
// INPUT VALIDATION UTILITIES
// =============================================================================

/**
 * Secure character ID validation to prevent injection attacks
 * Validates and sanitizes D&D Beyond character ID input
 * @param {string|number} characterId - Character ID to validate
 * @returns {Object} - Validation result with valid, error, and sanitized properties
 */
function validateCharacterID(characterId) {
    // Enhanced security validation for character ID input
    if (characterId == null || characterId === undefined || characterId === "") {
        return { valid: false, error: 'Character ID is required', sanitized: '' };
    }
    
    // Convert to string and remove all whitespace
    const cleanId = String(characterId).trim().replace(/\s/g, '');
    
    // Validate length (reasonable limits)
    if (cleanId.length === 0) {
        return { valid: false, error: 'Character ID cannot be empty', sanitized: '' };
    }
    
    if (cleanId.length > 20) {
        return { valid: false, error: 'Character ID is too long (max 20 characters)', sanitized: '' };
    }
    
    // Strict validation: only allow digits
    if (!/^\d+$/.test(cleanId)) {
        return { valid: false, error: 'Character ID must contain only numbers', sanitized: '' };
    }
    
    // Additional validation: reasonable range
    const numericId = parseInt(cleanId, 10);
    if (numericId <= 0 || numericId > 999999999) {
        return { valid: false, error: 'Character ID must be a positive number less than 999,999,999', sanitized: '' };
    }
    
    // Return validated and sanitized ID
    return { valid: true, error: null, sanitized: String(numericId) };
}

// =============================================================================
// GLOBAL EXPORTS FOR BROWSER COMPATIBILITY
// =============================================================================

// Make all UI helper functions globally available for use by other scripts
if (typeof window !== 'undefined') {
    // File download functions
    window.invokeSaveAsDialog = invokeSaveAsDialog;
    
    // User notification functions
    window.showSecureNotification = showSecureNotification;
    
    // Input validation functions
    window.validateCharacterID = validateCharacterID;
}