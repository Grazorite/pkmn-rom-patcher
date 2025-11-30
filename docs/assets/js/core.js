// Core initialization for all pages
(function() {
    'use strict';
    
    // Initialize dark mode as default
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
    
    // Global initialization function
    window.initApp = function() {
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Initialize navigation
        if (typeof window.initNavigation === 'function') {
            window.initNavigation();
        }
    };
    
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initApp);
    } else {
        window.initApp();
    }
})();