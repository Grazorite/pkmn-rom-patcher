// Just-in-time resource loader
export class ResourceLoader {
    constructor() {
        this.loadedResources = new Set();
        this.loadingPromises = new Map();
    }

    async loadScript(url, options = {}) {
        if (this.loadedResources.has(url)) {
            return Promise.resolve();
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            
            if (options.defer) script.defer = true;
            if (options.crossorigin) script.crossOrigin = options.crossorigin;

            script.onload = () => {
                this.loadedResources.add(url);
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load ${url}`));
            
            document.head.appendChild(script);
        });

        this.loadingPromises.set(url, promise);
        return promise;
    }

    async loadCSS(url) {
        if (this.loadedResources.has(url)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = () => {
                this.loadedResources.add(url);
                resolve();
            };
            link.onerror = () => reject(new Error(`Failed to load ${url}`));
            
            document.head.appendChild(link);
        });
    }

    async loadCDNResources() {
        const resources = [
            'https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.basic.min.js',
            'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
            'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js'
        ];

        return Promise.all(resources.map(url => this.loadScript(url, { crossorigin: 'anonymous' })));
    }

    isLoaded(url) {
        return this.loadedResources.has(url);
    }
}

export const resourceLoader = new ResourceLoader();