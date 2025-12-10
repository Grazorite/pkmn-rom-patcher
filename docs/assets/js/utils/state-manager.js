// State Manager - Centralized state persistence using sessionStorage
// State persists across page navigation but clears on tab/window close or page refresh

const STATE_PREFIX = 'uromm_';

export const StateManager = {
    /**
     * Check if current page load is a reload/refresh
     * @returns {boolean}
     */
    isPageReload() {
        try {
            const navEntries = performance.getEntriesByType('navigation');
            if (navEntries.length > 0) {
                return navEntries[0].type === 'reload';
            }
            // Fallback for older browsers
            return performance.navigation && performance.navigation.type === 1;
        } catch (e) {
            return false;
        }
    },
    /**
     * Save state to sessionStorage
     * @param {string} key - State key
     * @param {any} data - Data to save (will be JSON stringified)
     */
    saveState(key, data) {
        try {
            sessionStorage.setItem(STATE_PREFIX + key, JSON.stringify(data));
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
            // Clear state on page reload/refresh
            if (this.isPageReload()) {
                this.clearState(key);
                return null;
            }
            
            const data = sessionStorage.getItem(STATE_PREFIX + key);
            return data ? JSON.parse(data) : null;
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
        } catch (e) {
            console.warn('Failed to clear all states:', e);
        }
    }
};
