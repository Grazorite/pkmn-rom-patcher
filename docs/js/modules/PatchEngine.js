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

            // 2. Load RomPatcher (Dependent on BinFile)
            await this._loadScript('./js/vendor/RomPatcher.js');

            // 4. Verify Global Injection
            if (typeof window.RomPatcher === 'undefined' || typeof window.BinFile === 'undefined') {
                throw new Error("Engine scripts loaded but global objects are missing.");
            }

            console.log('PatchEngine initialized successfully.');

        } catch (error) {
            console.error('PatchEngine Initialization Failed:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                windowRomPatcher: typeof window.RomPatcher,
                windowBinFile: typeof window.BinFile,
                scripts: Array.from(document.querySelectorAll('script')).map(s => s.src)
            });
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
     * Wrapper for CRC32 calculation using BinFile's built-in method
     * @param {File} file 
     * @returns {Promise<string>} Hex string of CRC32
     */
    static async calculateCRC32(file) {
        if (!window.BinFile) throw new Error("BinFile not loaded");
        
        return new Promise((resolve, reject) => {
            try {
                const binFile = new window.BinFile(file, (loadedFile) => {
                    try {
                        const crc = loadedFile.hashCRC32();
                        resolve(crc.toString(16).toUpperCase().padStart(8, '0'));
                    } catch (error) {
                        reject(error);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Apply patch to ROM file
     * @param {File} romFile 
     * @param {File} patchFile 
     * @returns {Promise<BinFile>} Patched ROM
     */
    static async applyPatch(romFile, patchFile) {
        if (!window.RomPatcher || !window.BinFile) throw new Error("Engine not loaded");
        
        return new Promise((resolve, reject) => {
            try {
                const romBinFile = new window.BinFile(romFile, (loadedRom) => {
                    const patchBinFile = new window.BinFile(patchFile, (loadedPatch) => {
                        try {
                            const patch = window.RomPatcher.parsePatchFile(loadedPatch);
                            if (!patch) throw new Error('Invalid patch file format');
                            
                            const patchedRom = window.RomPatcher.applyPatch(loadedRom, patch);
                            resolve(patchedRom);
                        } catch (error) {
                            reject(error);
                        }
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}