// Basic search fallback utility
export class BasicSearch {
    static search(query, data, options = {}) {
        if (!query || !data || !Array.isArray(data)) {
            return [];
        }
        
        const searchQuery = query.toLowerCase().trim();
        if (!searchQuery) return [];
        
        const keys = options.keys || ['title'];
        const threshold = options.threshold || 0.3;
        
        return data.filter(item => {
            return keys.some(key => {
                const value = this.getNestedValue(item, key);
                if (!value) return false;
                
                const searchValue = String(value).toLowerCase();
                return searchValue.includes(searchQuery);
            });
        }).map(item => ({ item, score: 0 }));
    }
    
    static getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }
}