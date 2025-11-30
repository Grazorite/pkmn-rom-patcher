// Search and filter functionality
export class SearchManager {
    constructor() {
        this.fuse = null;
        this.activeFilters = {
            baseRom: new Set(),
            system: new Set(),
            status: new Set(),
            difficulty: new Set(),
            tags: new Set(),
            fakemons: new Set(),
            graphics: new Set(),
            story: new Set(),
            mechanics: new Set(),
            rating: new Set()
        };
    }

    initFuse(data) {
        const options = {
            keys: ['title', 'meta.tags', 'meta.author', 'meta.baseRom'],
            threshold: 0.3,
            includeScore: true
        };
        this.fuse = new Fuse(data, options);
    }

    search(query, data) {
        if (!query.trim()) {
            return data;
        }
        const results = this.fuse.search(query);
        return results.map(result => result.item);
    }

    applyFilters(data) {
        let filtered = [...data];
        
        Object.keys(this.activeFilters).forEach(filterType => {
            if (this.activeFilters[filterType].size > 0) {
                filtered = filtered.filter(hack => {
                    if (!hack.meta) return false;
                    
                    if (filterType === 'tags') {
                        return hack.meta.tags && hack.meta.tags.some(tag => 
                            this.activeFilters[filterType].has(tag)
                        );
                    } else if (filterType === 'mechanics') {
                        return hack.meta.mechanics && hack.meta.mechanics.some && hack.meta.mechanics.some(mechanic => 
                            this.activeFilters[filterType].has(mechanic)
                        );
                    } else if (filterType === 'baseRom') {
                        const baseRom = hack.baseRom || hack.meta?.baseRom;
                        return this.activeFilters[filterType].has(baseRom);
                    } else if (filterType === 'rating') {
                        const rating = hack.meta?.rating;
                        if (rating) {
                            const ratingRange = Math.floor(rating) + ' Stars';
                            return this.activeFilters[filterType].has(ratingRange);
                        }
                        return false;
                    } else {
                        return this.activeFilters[filterType].has(hack.meta[filterType]);
                    }
                });
            }
        });
        
        return filtered;
    }

    setFilter(filterType, value, checked) {
        if (checked) {
            this.activeFilters[filterType].add(value);
        } else {
            this.activeFilters[filterType].delete(value);
        }
    }

    clearAllFilters() {
        Object.keys(this.activeFilters).forEach(key => {
            this.activeFilters[key].clear();
        });
    }

    generateFilterOptions(data) {
        const filters = {
            baseRom: new Map(),
            system: new Map(),
            status: new Map(),
            difficulty: new Map(),
            tags: new Map(),
            fakemons: new Map(),
            graphics: new Map(),
            story: new Map(),
            mechanics: new Map(),
            rating: new Map()
        };
        
        data.forEach(hack => {
            // Use baseRom from top level or meta
            const baseRom = hack.baseRom || hack.meta?.baseRom;
            if (baseRom) filters.baseRom.set(baseRom, (filters.baseRom.get(baseRom) || 0) + 1);
            
            if (hack.meta) {
                if (hack.meta.system) filters.system.set(hack.meta.system, (filters.system.get(hack.meta.system) || 0) + 1);
                if (hack.meta.status) filters.status.set(hack.meta.status, (filters.status.get(hack.meta.status) || 0) + 1);
                if (hack.meta.difficulty) filters.difficulty.set(hack.meta.difficulty, (filters.difficulty.get(hack.meta.difficulty) || 0) + 1);
                if (hack.meta.fakemons) filters.fakemons.set(hack.meta.fakemons, (filters.fakemons.get(hack.meta.fakemons) || 0) + 1);
                if (hack.meta.graphics) filters.graphics.set(hack.meta.graphics, (filters.graphics.get(hack.meta.graphics) || 0) + 1);
                if (hack.meta.story) filters.story.set(hack.meta.story, (filters.story.get(hack.meta.story) || 0) + 1);
                
                if (hack.meta.rating) {
                    const ratingRange = Math.floor(hack.meta.rating) + ' Stars';
                    filters.rating.set(ratingRange, (filters.rating.get(ratingRange) || 0) + 1);
                }
                
                if (hack.meta.tags && Array.isArray(hack.meta.tags)) {
                    hack.meta.tags.forEach(tag => {
                        filters.tags.set(tag, (filters.tags.get(tag) || 0) + 1);
                    });
                }
                
                if (hack.meta.mechanics) {
                    if (Array.isArray(hack.meta.mechanics)) {
                        hack.meta.mechanics.forEach(mechanic => {
                            filters.mechanics.set(mechanic, (filters.mechanics.get(mechanic) || 0) + 1);
                        });
                    } else if (typeof hack.meta.mechanics === 'string') {
                        const mechanics = hack.meta.mechanics.split(',').map(m => m.trim());
                        mechanics.forEach(mechanic => {
                            filters.mechanics.set(mechanic, (filters.mechanics.get(mechanic) || 0) + 1);
                        });
                    }
                }
            }
        });
        
        return filters;
    }
}