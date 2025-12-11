// Error boundary for graceful error handling - IIFE pattern
(function() {
    'use strict';
    
    function isManifestError(error) {
        if (!error) return false;
        const message = error.message || error.toString();
        return message.includes('manifest.json') || 
               message.includes('HTTP 503') ||
               message.includes('HTTP 404');
    }
    
    function isSearchError(error) {
        if (!error) return false;
        const message = error.message || error.toString();
        return message.includes('fuse is null') ||
               message.includes('Fuse') ||
               message.includes('search');
    }
    
    function setupGlobalErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
            if (isManifestError(event.reason)) {
                console.warn('Manifest loading failed, continuing without it:', event.reason.message);
                event.preventDefault(); // Prevent console error
            } else if (isSearchError(event.reason)) {
                console.warn('Search functionality degraded, using fallback:', event.reason.message);
                event.preventDefault();
            }
        });

        // Handle general errors
        window.addEventListener('error', function(event) {
            if (isManifestError(event.error)) {
                console.warn('Manifest error handled gracefully:', event.error.message);
                event.preventDefault();
            } else if (isSearchError(event.error)) {
                console.warn('Search error handled gracefully:', event.error.message);
                event.preventDefault();
            }
        });
    }
    
    // Global error boundary utilities
    window.ErrorBoundary = {
        handleAsyncError: function(promise, fallback) {
            fallback = fallback || null;
            return promise.catch(function(error) {
                if (isManifestError(error)) {
                    console.warn('Handled manifest error:', error.message);
                    return fallback;
                }
                throw error; // Re-throw non-manifest errors
            });
        },
        isManifestError: isManifestError
    };
    
    // Initialize immediately
    setupGlobalErrorHandlers();
})();