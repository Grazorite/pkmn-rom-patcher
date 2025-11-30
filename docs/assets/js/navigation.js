// Global Navigation Handler
(function() {
    'use strict';
    
    function initNavigation() {
        const navToggle = document.getElementById('navToggle');
        const navSidebar = document.getElementById('navSidebar');
        
        if (!navToggle || !navSidebar) return;
        
        // Remove any existing listeners
        navToggle.replaceWith(navToggle.cloneNode(true));
        const newNavToggle = document.getElementById('navToggle');
        
        // Add click handler
        newNavToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navSidebar.classList.toggle('open');
        });
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!navSidebar.contains(e.target) && navSidebar.classList.contains('open')) {
                navSidebar.classList.remove('open');
            }
        });
        
        // Prevent sidebar clicks from closing
        navSidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigation);
    } else {
        initNavigation();
    }
    
    // Export for manual initialization
    window.initNavigation = initNavigation;
})();