// ROM patching functionality
import { Utils } from './utils.js';

export class PatchManager {
    constructor() {
        this.selectedHack = null;
        this.romPatcherAvailable = false;
        this.checkDependencies();
    }
    
    checkDependencies() {
        this.romPatcherAvailable = (typeof BinFile !== 'undefined' && typeof RomPatcher !== 'undefined');
        if (!this.romPatcherAvailable) {
            console.warn('RomPatcher dependencies not loaded - patching functionality disabled');
        }
    }
    
    setRomPatcherAvailable(available) {
        this.romPatcherAvailable = available;
        this.updatePatchingUI();
    }
    
    updatePatchingUI() {
        const patchBtn = document.getElementById('applyPatchBtn');
        const status = document.getElementById('patchStatus');
        
        if (!this.romPatcherAvailable) {
            if (patchBtn) {
                patchBtn.disabled = true;
                patchBtn.innerHTML = '<i data-lucide="alert-triangle" width="20" height="20"></i> RomPatcher Loading...';
            }
            if (status) {
                status.innerHTML = '<i data-lucide="info" width="16" height="16"></i> Loading patching dependencies...';
                status.className = 'validation-info';
            }
        } else {
            if (patchBtn) {
                patchBtn.innerHTML = '<i data-lucide="download" width="20" height="20"></i> Apply Patch';
            }
            if (status) {
                status.innerHTML = '';
                status.className = '';
            }
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setSelectedHack(hack) {
        this.selectedHack = hack;
    }

    validateROM() {
        const romFile = document.getElementById('romFileInput')?.files[0];
        const validation = document.getElementById('romValidationDetail');
        const patchBtn = document.getElementById('applyPatchBtn');
        
        if (!validation || !patchBtn) return;
        
        if (!romFile || !this.selectedHack?.crc32) {
            validation.innerHTML = '';
            patchBtn.disabled = !romFile;
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const romData = new Uint8Array(e.target.result);
            const calculatedCrc = Utils.crc32(romData);
            
            if (calculatedCrc === this.selectedHack.crc32) {
                validation.innerHTML = '<div class="validation-success"><i data-lucide="check-circle" width="16" height="16"></i> ROM validated</div>';
                patchBtn.disabled = false;
            } else {
                validation.innerHTML = `<div class="validation-error"><i data-lucide="alert-triangle" width="16" height="16"></i> ROM CRC32 mismatch. Expected: ${this.selectedHack.crc32}, Got: ${calculatedCrc}</div>`;
                patchBtn.disabled = false; // Allow patching anyway
            }
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        };
        reader.readAsArrayBuffer(romFile);
    }

    async applyPatch() {
        if (!this.romPatcherAvailable) {
            const status = document.getElementById('patchStatus');
            if (status) {
                status.innerHTML = '<i data-lucide="alert-triangle" width="16" height="16"></i> RomPatcher dependencies not loaded';
                status.className = 'validation-error';
            }
            return;
        }
        
        const romFile = document.getElementById('romFileInput')?.files[0];
        const status = document.getElementById('patchStatus');
        
        if (!romFile || !this.selectedHack || !status) return;
        
        status.textContent = 'Patching...';
        
        try {
            const patchResponse = await fetch(this.selectedHack.file);
            const patchData = await patchResponse.arrayBuffer();
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const romBinFile = new BinFile(new Uint8Array(e.target.result));
                    romBinFile.fileName = romFile.name;
                    
                    const patchBinFile = new BinFile(new Uint8Array(patchData));
                    const patch = RomPatcher.parsePatchFile(patchBinFile);
                    
                    if (!patch) {
                        throw new Error('Invalid patch file format');
                    }
                    
                    const patchedRom = RomPatcher.applyPatch(romBinFile, patch);
                    
                    const blob = new Blob([patchedRom.getBytes()], {type: 'application/octet-stream'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = patchedRom.fileName;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    status.innerHTML = '<i data-lucide="check-circle" width="16" height="16"></i> Patch applied successfully!';
                    status.className = 'validation-success';
                } catch (err) {
                    status.innerHTML = `<i data-lucide="x-circle" width="16" height="16"></i> Error: ${err.message}`;
                    status.className = 'validation-error';
                    console.error('Patching error:', err);
                }
                
                // Re-initialize icons
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            };
            reader.readAsArrayBuffer(romFile);
        } catch (err) {
            status.innerHTML = `<i data-lucide="x-circle" width="16" height="16"></i> Error loading patch: ${err.message}`;
            status.className = 'validation-error';
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
}