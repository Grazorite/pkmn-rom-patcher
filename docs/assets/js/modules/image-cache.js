// Image caching module
export class ImageCache {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
    }

    async loadImage(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(url, img);
                this.loadingPromises.delete(url);
                resolve(img);
            };
            img.onerror = () => {
                this.loadingPromises.delete(url);
                reject(new Error(`Failed to load image: ${url}`));
            };
            img.src = url;
        });

        this.loadingPromises.set(url, promise);
        return promise;
    }

    preloadImages(urls) {
        return Promise.allSettled(urls.map(url => this.loadImage(url)));
    }

    getCachedImage(url) {
        return this.cache.get(url);
    }

    clearCache() {
        this.cache.clear();
        this.loadingPromises.clear();
    }
}

// Global image cache instance
export const imageCache = new ImageCache();