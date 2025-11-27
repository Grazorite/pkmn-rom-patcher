export default class PatchEngine {
    constructor() {
        throw new Error("Use PatchEngine.init() - this class is static.");
    }

    /**
     * Sequentially loads dependencies and initializes the engine.
     * @returns {Promise<void>}
     */
    static async init() {
        if (window.RomPatcher && window.BinFile) {
            console.log('PatchEngine already initialized.');
            return;
        }

        try {
            console.log('Initializing PatchEngine...');
            
            // 1. Load BinFile (Base dependency)
            await this._loadScript('./js/vendor/BinFile.js');

            // 2. Load CRC (Required for validation)
            await this._loadScript('./js/vendor/crc.js');

            // 3. Load RomPatcher (Dependent on BinFile)
            await this._loadScript('./js/vendor/RomPatcher.js');

            // 4. Verify Global Injection
            if (typeof window.RomPatcher === 'undefined' || typeof window.BinFile === 'undefined') {
                throw new Error("Engine scripts loaded but global objects are missing.");
            }

            console.log('PatchEngine initialized successfully.');

        } catch (error) {
            console.error('PatchEngine Initialization Failed:', error);
            throw error; // Propagate to UI
        }
    }

    /**
     * Helper to load a script tag and wait for it to execute.
     */
    static _loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script already exists to prevent duplicates
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Important for execution order
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            
            document.head.appendChild(script);
        });
    }

    /**
     * Wrapper for CRC32 calculation
     * @param {File} file 
     * @returns {Promise<string>} Hex string of CRC32
     */
    static async calculateCRC32(file) {
        if (!window.RomPatcher) throw new Error("Engine not loaded");
        
        return new Promise((resolve, reject) => {
            const romFile = new window.BinFile(file);
            
            try {
                // Using the specific RomPatcher CRC logic:
                const osCrc = window.CRC32.fromFile(file, (crcValue) => {
                    // Convert integer to Hex string
                    resolve((crcValue >>> 0).toString(16).toUpperCase().padStart(8, '0'));
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}