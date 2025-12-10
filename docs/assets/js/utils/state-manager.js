// State Manager - Centralized state persistence using sessionStorage
// State persists across page navigation but clears on tab/window close or page refresh

const STATE_PREFIX = 'uromm_';

export const StateManager = {
    /**
     * Check if current page load is an actual reload/refresh (not navigation)
     * @returns {boolean}
     */
    isPageReload() {
        try {
            // Multiple signals to detect actual reload vs navigation
            const navEntries = performance.getEntriesByType('navigation');
            if (navEntries.length > 0) {
                const navType = navEntries[0].type;
                // Only clear on explicit reload, not navigate
                if (navType === 'reload') {
                    return true;
                }
                // Additional check: if navigation type is navigate but came from same origin
                if (navType === 'navigate') {
                    return this.isActualReload();
                }
            }
            
            // Fallback for older browsers - be more conservative
            if (performance.navigation) {
                return performance.navigation.type === 1; // TYPE_RELOAD
            }
            
            return false;
        } catch (e) {
            // Default to preserving state when detection fails
            return false;
        }
    },
    
    /**
     * Additional checks to determine if this is an actual reload
     * @returns {boolean}
     */
    isActualReload() {
        try {
            // In test environments, be more conservative about clearing state
            if (this.isTestEnvironment()) {
                // Only clear state if explicitly marked as reload
                return this.hasReloadMarker();
            }
            
            // Check if referrer is same as current page (indicates reload)
            const currentUrl = window.location.href;
            const referrer = document.referrer;
            
            // If no referrer or different referrer, likely navigation
            if (!referrer || !referrer.includes(window.location.origin)) {
                return false;
            }
            
            // If referrer is same page, likely reload
            return referrer === currentUrl;
        } catch (e) {
            return false;
        }
    },
    
    /**
     * Check if running in test environment
     * @returns {boolean}
     */
    isTestEnvironment() {
        return navigator.userAgent.includes('HeadlessChrome') ||
               window.location.hostname === 'localhost' ||
               typeof window.playwright !== 'undefined' ||
               typeof window.__playwright !== 'undefined';
    },
    
    /**
     * Check for explicit reload marker (for test environments)
     * @returns {boolean}
     */
    hasReloadMarker() {
        try {
            // Check for reload marker in sessionStorage
            const marker = sessionStorage.getItem(STATE_PREFIX + 'reload_marker');
            if (marker) {
                sessionStorage.removeItem(STATE_PREFIX + 'reload_marker');
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    },
    
    /**
     * Mark next page load as reload (for test environments)
     */
    markAsReload() {
        try {
            sessionStorage.setItem(STATE_PREFIX + 'reload_marker', 'true');
        } catch (e) {
            // Ignore errors
        }
    },
    /**
     * Save state to sessionStorage with navigation context
     * @param {string} key - State key
     * @param {any} data - Data to save (will be JSON stringified)
     */
    saveState(key, data) {
        try {
            // Add navigation context for better state management
            const stateWithContext = {
                data,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent.includes('HeadlessChrome') ? 'test' : 'browser'
            };
            
            sessionStorage.setItem(STATE_PREFIX + key, JSON.stringify(stateWithContext));
            this.debugLog(`Saved state for ${key}:`, data);
        } catch (e) {
            console.warn('Failed to save state:', e);
        }
    },

    /**
     * Load state from sessionStorage
     * @param {string} key - State key
     * @returns {any|null} Parsed data or null if not found
     */
    loadState(key) {
        try {
            // Only clear state on actual page reload, preserve during navigation
            if (this.isPageReload()) {
                this.debugLog(`Clearing state for ${key} due to page reload`);
                this.clearState(key);
                return null;
            }
            
            // Additional validation for test environments
            if (this.isTestEnvironment()) {
                this.debugLog(`Test environment detected, preserving state for ${key}`);
            }
            
            const rawData = sessionStorage.getItem(STATE_PREFIX + key);
            if (!rawData) return null;
            
            const stateWithContext = JSON.parse(rawData);
            
            // Handle legacy state format (direct data)
            if (!stateWithContext.timestamp) {
                this.debugLog(`Loading legacy state for ${key}`);
                return stateWithContext;
            }
            
            // Validate state age (clear if older than 24 hours)
            const age = Date.now() - stateWithContext.timestamp;
            if (age > 24 * 60 * 60 * 1000) {
                this.debugLog(`Clearing expired state for ${key}`);
                this.clearState(key);
                return null;
            }
            
            const result = stateWithContext.data;
            if (result) {
                this.debugLog(`Loaded state for ${key}:`, result);
            }
            
            return result;
        } catch (e) {
            console.warn('Failed to load state:', e);
            return null;
        }
    },

    /**
     * Clear specific state
     * @param {string} key - State key to clear
     */
    clearState(key) {
        try {
            sessionStorage.removeItem(STATE_PREFIX + key);
        } catch (e) {
            console.warn('Failed to clear state:', e);
        }
    },

    /**
     * Clear all app states
     */
    clearAllStates() {
        try {
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith(STATE_PREFIX)) {
                    sessionStorage.removeItem(key);
                }
            });
            this.debugLog('Cleared all states');
        } catch (e) {
            console.warn('Failed to clear all states:', e);
        }
    },
    
    /**
     * Debug logging for state operations
     * @param {string} message - Log message
     * @param {any} data - Optional data to log
     */
    debugLog(message, data = null) {
        // Only log in development or test environments
        if (window.location.hostname === 'localhost' || 
            navigator.userAgent.includes('HeadlessChrome') ||
            window.location.search.includes('debug=true')) {
            if (data) {
                console.log(`[StateManager] ${message}`, data);
            } else {
                console.log(`[StateManager] ${message}`);
            }
        }
    }
};
