// PatchEngine.js - Robust ROM patching service
export class PatchEngine {
    static isInitialized = false;
    static initPromise = null;

    static async init() {
        if (this.isInitialized) return true;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._loadDependencies();
        return this.initPromise;
    }

    static async _loadDependencies() {
        try {
            // Load scripts in sequence - BinFile must load first
            await this._loadScript('js/vendor/binfile.min.js');
            await this._loadScript('js/vendor/rompatcher.min.js');
            
            // Wait a bit for global objects to be available
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify dependencies are available
            if (typeof window.BinFile === 'undefined' || typeof window.RomPatcher === 'undefined') {
                throw new Error('Dependencies not properly loaded');
            }

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('PatchEngine initialization failed:', error);
            throw error;
        }
    }

    static _loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    static async calculateCRC32(file) {
        if (!this.isInitialized) throw new Error('PatchEngine not initialized');
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const binFile = new window.BinFile(data);
                    const crc = binFile.hashCRC32();
                    resolve(crc.toString(16).toUpperCase().padStart(8, '0'));
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    static async applyPatch(romFile, patchFile) {
        if (!this.isInitialized) throw new Error('PatchEngine not initialized');

        return new Promise((resolve, reject) => {
            const romReader = new FileReader();
            romReader.onload = (e) => {
                try {
                    const romBinFile = new window.BinFile(new Uint8Array(e.target.result));
                    romBinFile.fileName = romFile.name;

                    const patchReader = new FileReader();
                    patchReader.onload = (pe) => {
                        try {
                            const patchBinFile = new window.BinFile(new Uint8Array(pe.target.result));
                            const patch = window.RomPatcher.parsePatchFile(patchBinFile);
                            
                            if (!patch) throw new Error('Invalid patch file format');
                            
                            const patchedRom = window.RomPatcher.applyPatch(romBinFile, patch);
                            resolve(patchedRom);
                        } catch (error) {
                            reject(error);
                        }
                    };
                    patchReader.onerror = reject;
                    patchReader.readAsArrayBuffer(patchFile);
                } catch (error) {
                    reject(error);
                }
            };
            romReader.onerror = reject;
            romReader.readAsArrayBuffer(romFile);
        });
    }
}