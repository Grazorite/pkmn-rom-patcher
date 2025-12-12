// Centralized config file loader with environment-aware paths
export class ConfigLoader {
    constructor() {
        this.cache = new Map();
    }

    static getConfigPath(filename) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isLocal ? `/config/${filename}` : `../config/${filename}`;
    }

    async load(filename) {
        if (this.cache.has(filename)) {
            return this.cache.get(filename);
        }

        const path = ConfigLoader.getConfigPath(filename);
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Config file not found: ${path}`);
            }
            
            const data = await response.json();
            this.cache.set(filename, data);
            return data;
        } catch (error) {
            console.error(`Failed to load config ${filename}:`, error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

export const configLoader = new ConfigLoader();