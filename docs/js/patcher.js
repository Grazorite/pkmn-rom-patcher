// ROM patching functionality
import { Utils } from './utils.js';
import PatchEngine from './modules/PatchEngine.js';

export class PatchManager {
    constructor() {
        this.selectedHack = null;
        this.romPatcherAvailable = false;
        this.initializeRomPatcher();
    }
    
    async initializeRomPatcher() {
        // Check if RomPatcher is available
        if (window.RomPatcher && window.BinFile && window.HashCalculator) {
            this.setRomPatcherAvailable(true);
        } else {
            this.setRomPatcherAvailable(false);
            this.showCriticalError('Patcher Engine not ready. Please refresh.');
        }
    }
    
    setRomPatcherAvailable(available) {
        this.romPatcherAvailable = available;
        this.updatePatchingUI();
    }
    
    updatePatchingUI(message = null) {
        const patchBtn = document.getElementById('applyPatchBtn');
        const status = document.getElementById('patchStatus');
        
        if (message) {
            if (status) {
                status.innerHTML = `<i data-lucide="loader" width="16" height="16"></i> ${message}`;
                status.className = 'validation-info';
            }
            return;
        }
        
        if (!this.romPatcherAvailable) {
            if (patchBtn) {
                patchBtn.disabled = true;
                patchBtn.innerHTML = '<i data-lucide="alert-triangle" width="20" height="20"></i> Engine Failed';
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
    
    showCriticalError(message) {
        const status = document.getElementById('patchStatus');
        if (status) {
            status.innerHTML = `<i data-lucide="alert-circle" width="16" height="16"></i> ${message}`;
            status.className = 'validation-error';
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setSelectedHack(hack) {
        this.selectedHack = hack;
    }

    async validateROM() {
        const romFile = document.getElementById('romFileInput')?.files[0];
        const validation = document.getElementById('romValidationDetail');
        const patchBtn = document.getElementById('applyPatchBtn');
        
        if (!validation || !patchBtn) return;
        
        if (!romFile || !this.selectedHack?.crc32) {
            validation.innerHTML = '';
            patchBtn.disabled = !romFile || !this.romPatcherAvailable;
            return;
        }
        
        if (!this.romPatcherAvailable) {
            validation.innerHTML = '<div class="validation-error"><i data-lucide="alert-triangle" width="16" height="16"></i> Patcher Engine not ready</div>';
            patchBtn.disabled = true;
            return;
        }
        
        try {
            const calculatedCrc = await PatchEngine.calculateCRC32(romFile);
            
            if (calculatedCrc === this.selectedHack.crc32) {
                validation.innerHTML = '<div class="validation-success"><i data-lucide="check-circle" width="16" height="16"></i> ROM validated</div>';
                patchBtn.disabled = false;
            } else {
                validation.innerHTML = `<div class="validation-error"><i data-lucide="alert-triangle" width="16" height="16"></i> ROM CRC32 mismatch. Expected: ${this.selectedHack.crc32}, Got: ${calculatedCrc}</div>`;
                patchBtn.disabled = false; // Allow patching anyway
            }
        } catch (error) {
            validation.innerHTML = '<div class="validation-error"><i data-lucide="x-circle" width="16" height="16"></i> ROM validation failed</div>';
            patchBtn.disabled = true;
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async applyPatch() {
        if (!this.romPatcherAvailable) {
            this.showCriticalError('Patcher Engine not ready');
            return;
        }
        
        const romFile = document.getElementById('romFileInput')?.files[0];
        const status = document.getElementById('patchStatus');
        
        if (!romFile || !this.selectedHack || !status) return;
        
        status.innerHTML = '<i data-lucide="loader" width="16" height="16"></i> Applying patch...';
        status.className = 'validation-info';
        
        try {
            const patchResponse = await fetch(this.selectedHack.file);
            if (!patchResponse.ok) throw new Error('Failed to download patch');
            
            const patchFile = new File([await patchResponse.arrayBuffer()], 'patch.bps');
            const patchedRom = await PatchEngine.applyPatch(romFile, patchFile);
            
            const blob = new Blob([patchedRom._u8array], {type: 'application/octet-stream'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = patchedRom.fileName;
            a.click();
            URL.revokeObjectURL(url);
            
            status.innerHTML = '<i data-lucide="check-circle" width="16" height="16"></i> Patch applied successfully!';
            status.className = 'validation-success';
        } catch (error) {
            status.innerHTML = `<i data-lucide="x-circle" width="16" height="16"></i> Error: ${error.message}`;
            status.className = 'validation-error';
            console.error('Patching error:', error);
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}