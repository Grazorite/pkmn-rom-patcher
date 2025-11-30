// Caching utilities for better performance
export class CacheManager {
    constructor() {
        this.manifestCache = null;
        this.filterCache = new Map();
        this.searchCache = new Map();
        this.maxCacheSize = 100;
    }

    // Cache manifest data
    setManifest(data) {
        this.manifestCache = {
            data,
            timestamp: Date.now()
        };
        
        // Store in localStorage for persistence
        try {
            localStorage.setItem('rom-manifest-cache', JSON.stringify(this.manifestCache));
        } catch (e) {
            console.warn('Failed to cache manifest in localStorage:', e);
        }
    }

    // Get cached manifest if still valid (1 hour)
    getManifest() {
        if (this.manifestCache && Date.now() - this.manifestCache.timestamp < 3600000) {
            return this.manifestCache.data;
        }

        // Try localStorage
        try {
            const cached = localStorage.getItem('rom-manifest-cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 3600000) {
                    this.manifestCache = parsed;
                    return parsed.data;
                }
            }
        } catch (e) {
            console.warn('Failed to load manifest from localStorage:', e);
        }

        return null;
    }

    // Cache search results
    cacheSearch(query, results) {
        if (this.searchCache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
        
        this.searchCache.set(query.toLowerCase(), {
            results,
            timestamp: Date.now()
        });
    }

    // Get cached search results (valid for 5 minutes)
    getCachedSearch(query) {
        const cached = this.searchCache.get(query.toLowerCase());
        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached.results;
        }
        return null;
    }

    // Cache filter combinations
    cacheFilter(filterKey, results) {
        if (this.filterCache.size >= this.maxCacheSize) {
            const firstKey = this.filterCache.keys().next().value;
            this.filterCache.delete(firstKey);
        }
        
        this.filterCache.set(filterKey, {
            results,
            timestamp: Date.now()
        });
    }

    getCachedFilter(filterKey) {
        const cached = this.filterCache.get(filterKey);
        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached.results;
        }
        return null;
    }

    // Generate cache key for filters
    generateFilterKey(filters) {
        return JSON.stringify(Object.keys(filters).sort().reduce((obj, key) => {
            obj[key] = Array.from(filters[key]).sort();
            return obj;
        }, {}));
    }

    // Clear all caches
    clearAll() {
        this.manifestCache = null;
        this.filterCache.clear();
        this.searchCache.clear();
        
        try {
            localStorage.removeItem('rom-manifest-cache');
        } catch (e) {
            console.warn('Failed to clear localStorage cache:', e);
        }
    }

    // Get cache statistics
    getStats() {
        return {
            manifestCached: !!this.manifestCache,
            searchCacheSize: this.searchCache.size,
            filterCacheSize: this.filterCache.size,
            totalMemoryUsage: this.estimateMemoryUsage()
        };
    }

    estimateMemoryUsage() {
        let size = 0;
        
        if (this.manifestCache) {
            size += JSON.stringify(this.manifestCache).length * 2; // rough estimate
        }
        
        for (const [key, value] of this.searchCache) {
            size += (key.length + JSON.stringify(value).length) * 2;
        }
        
        for (const [key, value] of this.filterCache) {
            size += (key.length + JSON.stringify(value).length) * 2;
        }
        
        return size;
    }
}