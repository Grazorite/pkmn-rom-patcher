// Universal page transition system
(function() {
    'use strict';
    
    let loadingOverlay = null;
    let preloadCache = new Set();
    
    function createLoadingOverlay() {
        if (loadingOverlay) return loadingOverlay;
        
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'page-loading-overlay';
        loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(loadingOverlay);
        return loadingOverlay;
    }
    
    function showLoading() {
        const overlay = createLoadingOverlay();
        overlay.classList.remove('hidden');
        return overlay;
    }
    
    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                if (loadingOverlay && loadingOverlay.parentNode) {
                    loadingOverlay.parentNode.removeChild(loadingOverlay);
                    loadingOverlay = null;
                }
            }, 300);
        }
    }
    
    function initPageTransitions() {
        // Add transition container class to main content
        const container = document.querySelector('.app-container') || document.body;
        container.classList.add('page-transition-container');
        
        // Initialize content reveal
        setTimeout(() => {
            container.classList.add('loaded');
            
            // Stagger sidebar and content loading
            const sidebar = document.querySelector('.nav-sidebar');
            if (sidebar) {
                sidebar.classList.add('loaded');
            }
            
            setTimeout(() => {
                const header = document.querySelector('.app-header');
                if (header) header.classList.add('loaded');
                
                setTimeout(() => {
                    const layout = document.querySelector('.app-layout');
                    if (layout) layout.classList.add('loaded');
                    
                    hideLoading();
                }, 100);
            }, 100);
        }, 50);
    }
    
    function preloadPage(url) {
        if (preloadCache.has(url)) return;
        preloadCache.add(url);
        
        // Preload critical resources for the target page
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }
    
    function setupNavigationPreloading() {
        // Preload on hover
        document.addEventListener('mouseover', function(e) {
            const link = e.target.closest('a[href]');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                preloadPage(link.href);
            }
        });
        
        // Show loading on navigation
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href]');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                showLoading();
            }
        });
    }
    
    // Global page transition utilities
    window.PageTransitions = {
        init: initPageTransitions,
        showLoading: showLoading,
        hideLoading: hideLoading,
        preloadPage: preloadPage
    };
    
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initPageTransitions();
            setupNavigationPreloading();
        });
    } else {
        initPageTransitions();
        setupNavigationPreloading();
    }
})();