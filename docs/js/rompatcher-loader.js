// RomPatcher.js loader and initialization
export class RomPatcherLoader {
    constructor() {
        this.isLoaded = false;
        this.callbacks = [];
    }
    
    async initialize() {
        if (this.isLoaded) return true;
        
        try {
            // Check if already loaded
            if (typeof BinFile !== 'undefined' && typeof RomPatcher !== 'undefined') {
                this.isLoaded = true;
                this.notifyCallbacks(true);
                return true;
            }
            
            // Wait for script to load with timeout
            const maxAttempts = 30;
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                if (typeof BinFile !== 'undefined' && typeof RomPatcher !== 'undefined') {
                    this.isLoaded = true;
                    this.notifyCallbacks(true);
                    return true;
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            
            throw new Error('RomPatcher dependencies failed to load');
        } catch (error) {
            console.error('RomPatcher initialization failed:', error);
            this.notifyCallbacks(false);
            return false;
        }
    }
    
    onReady(callback) {
        if (this.isLoaded) {
            callback(true);
        } else {
            this.callbacks.push(callback);
        }
    }
    
    notifyCallbacks(success) {
        this.callbacks.forEach(callback => callback(success));
        this.callbacks = [];
    }
}

// Global instance
window.romPatcherLoader = new RomPatcherLoader();