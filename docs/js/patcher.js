// ROM patching functionality
import { Utils } from './utils.js';

export class PatchManager {
    constructor() {
        this.selectedHack = null;
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
                validation.innerHTML = '<div class="validation-success">ROM validated</div>';
                patchBtn.disabled = false;
            } else {
                validation.innerHTML = `<div class="validation-error">ROM CRC32 mismatch. Expected: ${this.selectedHack.crc32}, Got: ${calculatedCrc}</div>`;
                patchBtn.disabled = false; // Allow patching anyway
            }
        };
        reader.readAsArrayBuffer(romFile);
    }

    async applyPatch() {
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
                    
                    status.textContent = 'Patch applied successfully!';
                } catch (err) {
                    status.textContent = `Error: ${err.message}`;
                    console.error('Patching error:', err);
                }
            };
            reader.readAsArrayBuffer(romFile);
        } catch (err) {
            status.textContent = `Error loading patch: ${err.message}`;
        }
    }
}