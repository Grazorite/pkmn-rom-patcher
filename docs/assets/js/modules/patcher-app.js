// ROM Patcher App - Dedicated patching interface
import { Utils } from './utils.js';
import { PatchManager } from './patcher.js';
import { imageCache } from './image-cache.js';
// import PatchEngine from './PatchEngine.js'; // Temporarily disabled

class ROMPatcherApp {
    constructor() {
        this.patches = [];
        this.fuse = null;
        this.selectedPatch = null;
        this.patchManager = new PatchManager();
        this.creatorMode = false;
        
        this.init();
    }
    
    async init() {
        this.initializeIcons();
        
        // Skip PatchEngine for now to test manifest loading
        console.log('Skipping PatchEngine initialization for debugging');
        
        await this.loadPatches();
        this.setupEventListeners();
        this.setupSearch();
    }
    
    initializeIcons() {
        if (typeof window.initIcons === 'function') {
            window.initIcons();
        } else if (typeof lucide !== 'undefined') {
            try {
                lucide.createIcons();
            } catch (e) {
                console.warn('Icon initialization failed:', e);
            }
        }
    }
    
    async loadPatches() {
        try {
            // Try multiple manifest paths for different server setups
            const manifestPaths = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? ['/docs/manifest.json', './manifest.json', '../manifest.json']
                : ['../manifest.json'];
            
            let response;
            let successPath;
            for (const path of manifestPaths) {
                try {
                    response = await fetch(path);
                    if (response.ok) {
                        successPath = path;
                        break;
                    }
                } catch (e) { /* try next path */ }
            }
            console.log('Patcher manifest loaded from:', successPath);
            console.log('Patcher manifest response:', response.status, response.statusText);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            this.patches = await response.json();
            console.log('Patcher loaded patches:', this.patches.length);
            this.setupFuse();
        } catch (error) {
            console.error('Failed to load patches:', error);
            document.getElementById('patchResults').innerHTML = 
                `<div class="loading error">Failed to load patches: ${error.message}</div>`;
        }
    }
    
    setupFuse() {
        const options = {
            keys: ['title', 'meta.tags', 'meta.author', 'meta.baseRom'],
            threshold: 0.3,
            includeScore: true,
            minMatchCharLength: 2
        };
        this.fuse = new Fuse(this.patches, options);
    }
    
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('patchSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
        
        // Creator mode toggle
        const creatorToggle = document.getElementById('creatorMode');
        if (creatorToggle) {
            creatorToggle.addEventListener('change', (e) => {
                this.creatorMode = e.target.checked;
                this.updateCreatorMode();
            });
        }
        
        // ROM file input
        const romInput = document.getElementById('romFileInput');
        const fileLabel = document.querySelector('.file-input-label');
        
        if (romInput && fileLabel) {
            fileLabel.addEventListener('click', () => romInput.click());
            romInput.addEventListener('change', (e) => this.handleROMFile(e));
        }
        
        // Apply patch button
        const patchBtn = document.getElementById('applyPatchBtn');
        if (patchBtn) {
            patchBtn.addEventListener('click', () => this.applyPatch());
        }
        
        // Close patch description button
        const closePatchBtn = document.getElementById('closePatchDescription');
        if (closePatchBtn) {
            closePatchBtn.addEventListener('click', () => this.deselectPatch());
        }
        
        // Navigation handled by global navigation.js
        
        // Theme toggles handled by unified theme system
    }
    
    setupSearch() {
        // Don't override debug messages - only show initial message if no error present
        const resultsContainer = document.getElementById('patchResults');
        if (resultsContainer && !resultsContainer.innerHTML.includes('Patch Engine Failed')) {
            resultsContainer.innerHTML = '<div class="loading">Start typing to search for patches...</div>';
        }
    }
    
    handleSearch(query) {
        const resultsContainer = document.getElementById('patchResults');
        
        // Don't override debug error messages
        if (resultsContainer.innerHTML.includes('Patch Engine Failed')) {
            return;
        }
        
        if (!query.trim()) {
            resultsContainer.innerHTML = '<div class="loading">Start typing to search for patches...</div>';
            return;
        }
        
        if (query.length < 2) {
            resultsContainer.innerHTML = '<div class="loading">Type at least 2 characters...</div>';
            return;
        }
        
        const results = this.fuse.search(query);
        this.renderSearchResults(results.slice(0, 10)); // Limit to 10 results
    }
    
    renderSearchResults(results) {
        const container = document.getElementById('patchResults');
        
        if (results.length === 0) {
            container.innerHTML = '<div class="loading">No patches found</div>';
            return;
        }
        
        const resultsHtml = results.map(result => {
            const patch = result.item;
            const description = patch.changelog ? patch.changelog.replace(/[#*`]/g, '').substring(0, 100) + '...' : 'No description available';
            const boxArt = patch.meta?.images?.boxArt || '';
            const status = patch.meta?.status || 'Completed';
            const statusClass = `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
            
            return `
                <div class="patch-result clickable" data-patch-id="${patch.id}">
                    <div class="patch-result-boxart">
                        ${boxArt ? `<div class="image-container"><div class="image-placeholder"><i data-lucide="image" width="16" height="16"></i></div><img ${imageCache.getCachedImage(boxArt) ? `src="${boxArt}" class="patch-boxart loaded"` : `data-src="${boxArt}" class="patch-boxart"`} alt="${patch.title}"></div>` : `<div class="patch-boxart-placeholder"><i data-lucide="image" width="24" height="24"></i></div>`}
                    </div>
                    <div class="patch-result-content">
                        <h4>${patch.title}</h4>
                        <p class="patch-description">${description}</p>
                        <div class="patch-meta-row">
                            <div class="patch-badges">
                                ${patch.meta?.baseRom ? `<span class="badge badge-rom" data-rom="${patch.meta.baseRom}">${patch.meta.baseRom}</span>` : ''}
                                ${patch.meta?.system ? `<span class="badge badge-system" data-system="${patch.meta.system}">${patch.meta.system}</span>` : ''}
                            </div>
                            <div class="status-indicator">
                                <div class="status-dot ${statusClass}"></div>
                                <span>${status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = resultsHtml;
        
        // Add click handlers for entire patch result
        container.querySelectorAll('.patch-result').forEach(result => {
            result.addEventListener('click', (e) => {
                const patchId = e.target.closest('.patch-result').dataset.patchId;
                this.selectPatch(patchId);
            });
        });
        
        this.initializeIcons();
    }
    
    selectPatch(patchId) {
        // If clicking the same patch, deselect it
        if (this.selectedPatch && this.selectedPatch.id === patchId) {
            this.deselectPatch();
            return;
        }
        
        this.selectedPatch = this.patches.find(p => p.id === patchId);
        if (!this.selectedPatch) return;
        
        this.patchManager.setSelectedHack(this.selectedPatch);
        this.hideOtherResults(patchId);
        this.positionAndShowDetails(patchId);
        this.validateCurrentROM();
        this.updatePatchButton();
    }
    
    deselectPatch() {
        this.selectedPatch = null;
        this.patchManager.setSelectedHack(null);
        this.hideSelectedPatchWithAnimation();
        setTimeout(() => {
            this.showAllResults();
        }, 200);
        this.updatePatchButton();
    }
    
    positionAndShowDetails(selectedId) {
        const selectedElement = document.querySelector(`[data-patch-id="${selectedId}"]`);
        const container = document.getElementById('selectedPatch');
        const description = document.getElementById('selectedPatchDescription');
        
        if (!selectedElement || !container) return;
        
        // Update content
        if (description) {
            if (this.selectedPatch.changelog && typeof marked !== 'undefined') {
                let cleanedChangelog = this.selectedPatch.changelog;
                const titlePattern = new RegExp(`^#\s*${this.selectedPatch.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\s*\n`, 'i');
                cleanedChangelog = cleanedChangelog.replace(titlePattern, '');
                description.innerHTML = marked.parse(cleanedChangelog);
            } else {
                description.textContent = this.selectedPatch.changelog || 'No description available.';
            }
        }
        
        // Position after selected element
        selectedElement.parentNode.insertBefore(container, selectedElement.nextSibling);
        
        // Show with animation
        container.style.display = 'block';
        container.classList.remove('hide');
        setTimeout(() => {
            container.classList.add('show');
        }, 10);
        
        this.initializeIcons();
    }
    
    hideSelectedPatchWithAnimation() {
        const container = document.getElementById('selectedPatch');
        if (container) {
            container.classList.remove('show');
            container.classList.add('hide');
            setTimeout(() => {
                container.style.display = 'none';
                container.classList.remove('hide');
            }, 400);
        }
    }
    
    hideOtherResults(selectedId) {
        const results = document.querySelectorAll('.patch-result');
        results.forEach(result => {
            if (result.dataset.patchId !== selectedId) {
                result.classList.add('hidden');
            } else {
                result.classList.add('selected');
            }
        });
    }
    
    showAllResults() {
        const results = document.querySelectorAll('.patch-result');
        results.forEach(result => {
            result.classList.remove('hidden', 'selected');
        });
    }
    
    handleROMFile(event) {
        const file = event.target.files[0];
        const fileInfo = document.getElementById('romFileInfo');
        
        if (!file) {
            fileInfo.innerHTML = '';
            return;
        }
        
        fileInfo.innerHTML = `
            <div class="file-selected">
                <i data-lucide="file" width="16" height="16"></i>
                <span>${file.name}</span>
                <small>${this.formatFileSize(file.size)}</small>
            </div>
        `;
        
        this.validateCurrentROM();
        this.updatePatchButton();
        this.initializeIcons();
    }
    
    validateCurrentROM() {
        if (!this.selectedPatch || this.creatorMode) {
            document.getElementById('romValidationDetail').innerHTML = '';
            return;
        }
        
        this.patchManager.validateROM();
    }
    
    updateCreatorMode() {
        const validation = document.getElementById('romValidationDetail');
        if (this.creatorMode) {
            validation.innerHTML = '<div class="validation-info"><i data-lucide="info" width="16" height="16"></i> Creator mode: For creating patches from ROMs</div>';
        } else {
            this.validateCurrentROM();
        }
        this.updatePatchButton();
        this.initializeIcons();
    }
    
    updatePatchButton() {
        const btn = document.getElementById('applyPatchBtn');
        const romFile = document.getElementById('romFileInput')?.files[0];
        
        if (btn) {
            btn.disabled = !romFile || !this.selectedPatch;
        }
    }
    
    async applyPatch() {
        if (!this.selectedPatch) return;
        
        const romFile = document.getElementById('romFileInput')?.files[0];
        const status = document.getElementById('patchStatus');
        
        if (!romFile || !status) return;
        
        if (!this.romPatcherAvailable) {
            status.innerHTML = '<i data-lucide="alert-circle" width="16" height="16"></i> Patcher Engine not ready';
            status.className = 'validation-error';
            return;
        }
        
        status.innerHTML = '<i data-lucide="loader" width="16" height="16"></i> Applying patch...';
        status.className = 'validation-info';
        
        try {
            const patchResponse = await fetch(this.selectedPatch.file);
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
        
        setTimeout(() => this.initializeIcons(), 50);
    }
    

    
    showEngineError() {
        const resultsContainer = document.getElementById('patchResults');
        const debugContainer = document.getElementById('debugContainer');
        
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="loading error">Patch Engine failed to load. Check debug info below.</div>';
        }
        
        if (debugContainer) {
            const debugInfo = `
                <h3>Patch Engine Debug Info</h3>
                <p><strong>Window Objects:</strong></p>
                <ul>
                    <li>RomPatcher: ${typeof window.RomPatcher}</li>
                    <li>MarcFile: ${typeof window.MarcFile}</li>
                    <li>BinFile: ${typeof window.BinFile}</li>
                </ul>
                <p><strong>Scripts Loaded:</strong></p>
                <ul>
                    ${Array.from(document.querySelectorAll('script')).map(s => `<li>${s.src || 'inline'}</li>`).join('')}
                </ul>
            `;
            debugContainer.innerHTML = debugInfo;
            debugContainer.style.display = 'block';
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the app
function initializeApp() {
    window.patcherApp = new ROMPatcherApp();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}