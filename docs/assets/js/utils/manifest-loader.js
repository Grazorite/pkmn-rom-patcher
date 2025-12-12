// Centralized manifest loading with error handling
export class ManifestLoader {
    constructor() {
        this.cache = null;
        this.loading = null;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async load(options = {}) {
        // Return cached data if valid
        if (this.cache && this.isCacheValid()) {
            return this.cache.data;
        }

        // Return existing promise if already loading
        if (this.loading) {
            return this.loading;
        }

        // Start loading
        this.loading = this.loadWithRetry(options);
        
        try {
            const data = await this.loading;
            this.cache = {
                data,
                timestamp: Date.now()
            };
            this.retryCount = 0;
            return data;
        } catch (error) {
            this.loading = null;
            throw error;
        }
    }

    async loadWithRetry(options = {}) {
        const paths = this.getManifestPaths();
        
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            for (const path of paths) {
                try {
                    const response = await fetch(path, {
                        cache: attempt === 0 ? 'default' : 'no-cache'
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        return Array.isArray(data) ? data : [];
                    }
                    
                    // Skip 503 errors (service worker issues) and try next path
                    if (response.status === 503) {
                        console.warn(`Manifest 503 error for ${path}, trying next path`);
                        continue;
                    }
                } catch (error) {
                    console.warn(`Manifest load attempt ${attempt + 1} failed for ${path}:`, error.message);
                }
            }
            
            // Wait before retry (exponential backoff)
            if (attempt < this.maxRetries) {
                await this.delay(Math.pow(2, attempt) * 500); // Reduced delay
            }
        }
        
        // All attempts failed - throw error instead of returning empty array
        throw new Error('HTTP 503: Service worker manifest loading failed');
    }

    getManifestPaths() {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isLocal
            ? ['/docs/manifest.json', './manifest.json', '../manifest.json']
            : ['../manifest.json'];
    }

    isCacheValid() {
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        return this.cache && 
               this.cache.timestamp && 
               (Date.now() - this.cache.timestamp) < CACHE_DURATION;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearCache() {
        this.cache = null;
        this.loading = null;
        this.retryCount = 0;
    }
}

export const manifestLoader = new ManifestLoader();