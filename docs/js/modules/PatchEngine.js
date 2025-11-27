export default class PatchEngine {
    constructor() {
        throw new Error("Use PatchEngine.init() - this class is static.");
    }

    /**
     * Loads RomPatcher.webapp.js and initializes the engine.
     * @returns {Promise<void>}
     */
    static async init() {
        if (window.RomPatcher && window.BinFile) {
            console.log('PatchEngine already initialized.');
            return;
        }

        try {
            console.log('Initializing PatchEngine with RomPatcher.webapp.js...');
            
            // Set the ROM_PATCHER_JS_PATH for the webapp
            window.ROM_PATCHER_JS_PATH = '../docs/js/vendor/';
            
            // Load the webapp which handles all dependencies automatically
            await this._loadScript('../docs/js/vendor/RomPatcher.webapp.js');

            // Wait for RomPatcher to initialize
            let attempts = 0;
            while ((!window.RomPatcher || !window.BinFile) && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.RomPatcher || !window.BinFile) {
                throw new Error("RomPatcher.webapp.js failed to load required objects");
            }

            console.log('PatchEngine initialized successfully with full RomPatcher functionality.');

        } catch (error) {
            console.error('PatchEngine Initialization Failed:', error);
            throw error;
        }
    }

    /**
     * Helper to load a script tag and wait for it to execute.
     */
    static _loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            
            document.head.appendChild(script);
        });
    }

    /**
     * Calculate CRC32 using BinFile
     * @param {File} file 
     * @returns {Promise<string>} Hex string of CRC32
     */
    static async calculateCRC32(file) {
        if (!window.BinFile) throw new Error("BinFile not loaded");
        
        return new Promise((resolve, reject) => {
            try {
                const binFile = new BinFile(file, (loadedFile) => {
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
     * Apply patch to ROM file using RomPatcher
     * @param {File} romFile 
     * @param {File} patchFile 
     * @returns {Promise<Object>} Patched ROM
     */
    static async applyPatch(romFile, patchFile) {
        if (!window.RomPatcher || !window.BinFile) throw new Error("Required libraries not loaded");
        
        return new Promise((resolve, reject) => {
            try {
                const romBinFile = new BinFile(romFile, (loadedRom) => {
                    const patchBinFile = new BinFile(patchFile, (loadedPatch) => {
                        try {
                            const patch = RomPatcher.parsePatchFile(loadedPatch);
                            if (!patch) throw new Error('Invalid patch file format');
                            
                            const patchedRom = RomPatcher.applyPatch(loadedRom, patch);
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