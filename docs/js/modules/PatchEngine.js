export default class PatchEngine {
    constructor() {
        throw new Error("Use PatchEngine.init() - this class is static.");
    }

    /**
     * Loads the bundled RomPatcher webapp and initializes the engine.
     * @returns {Promise<void>}
     */
    static async init() {
        if (window.RomPatcher && (window.MarcFile || window.BinFile)) {
            console.log('PatchEngine already initialized.');
            return;
        }

        try {
            console.log('Initializing PatchEngine with bundled library...');
            
            // Set worker path before loading
            window.CRC32_WORKER_PATH = './js/vendor/worker_crc.js';
            
            // Load the bundled library
            await this._loadScript('./js/vendor/RomPatcher.webapp.js');

            // Verify bundled objects are available
            if (typeof window.RomPatcher === 'undefined' || (typeof window.MarcFile === 'undefined' && typeof window.BinFile === 'undefined')) {
                throw new Error("Bundled library loaded but required objects are missing.");
            }

            console.log('PatchEngine initialized successfully with bundled library.');

        } catch (error) {
            console.error('PatchEngine Initialization Failed:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                windowRomPatcher: typeof window.RomPatcher,
                windowMarcFile: typeof window.MarcFile,
                windowBinFile: typeof window.BinFile,
                scripts: Array.from(document.querySelectorAll('script')).map(s => s.src)
            });
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
     * Calculate CRC32 using MarcFile
     * @param {File} file 
     * @returns {Promise<string>} Hex string of CRC32
     */
    static async calculateCRC32(file) {
        const FileClass = window.MarcFile || window.BinFile;
        if (!FileClass) throw new Error("MarcFile/BinFile not loaded");
        
        return new Promise((resolve, reject) => {
            try {
                const binFile = new FileClass(file, (loadedFile) => {
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
     * Apply patch to ROM file using bundled RomPatcher
     * @param {File} romFile 
     * @param {File} patchFile 
     * @returns {Promise<Object>} Patched ROM
     */
    static async applyPatch(romFile, patchFile) {
        if (!window.RomPatcher) throw new Error("RomPatcher not loaded");
        
        const FileClass = window.MarcFile || window.BinFile;
        if (!FileClass) throw new Error("MarcFile/BinFile not loaded");
        
        return new Promise((resolve, reject) => {
            try {
                const romBinFile = new FileClass(romFile, (loadedRom) => {
                    const patchBinFile = new FileClass(patchFile, (loadedPatch) => {
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