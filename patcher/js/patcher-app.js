// ROM Patcher App - Dedicated patching interface
import { Utils } from '../../docs/js/utils.js';
import { PatchManager } from '../../docs/js/patcher.js';
import PatchEngine from '../../docs/js/modules/PatchEngine.js';

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
        Utils.initTheme();
        this.initializeIcons();
        
        // Initialize PatchEngine first
        try {
            await PatchEngine.init();
            console.log('PatchEngine ready for ROM Patcher app');
        } catch (error) {
            console.error('Failed to initialize PatchEngine:', error);
            console.error('ROM Patcher App - PatchEngine init failed:', {
                error: error.message,
                stack: error.stack,
                windowObjects: {
                    RomPatcher: typeof window.RomPatcher,
                    BinFile: typeof window.BinFile
                }
            });
            this.showEngineError();
        }
        
        await this.loadPatches();
        this.setupEventListeners();
        this.setupSearch();
    }
    
    initializeIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    async loadPatches() {
        try {
            const response = await fetch('../docs/manifest.json');
            this.patches = await response.json();
            this.setupFuse();
        } catch (error) {
            console.error('Failed to load patches:', error);
            document.getElementById('patchResults').innerHTML = 
                '<div class="loading error">Failed to load patches</div>';
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
        
        // Navigation toggle
        const navToggle = document.getElementById('navToggle');
        const navSidebar = document.getElementById('navSidebar');
        if (navToggle && navSidebar) {
            navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navSidebar.classList.toggle('open');
            });
            
            navSidebar.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Theme toggle (expanded)
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.handleThemeToggle();
            });
        }
        
        // Theme toggle (collapsed)
        const themeCollapsed = document.getElementById('themeToggleCollapsed');
        if (themeCollapsed) {
            themeCollapsed.addEventListener('click', () => {
                this.handleThemeToggle();
            });
        }
    }
    
    setupSearch() {
        // Show initial message
        document.getElementById('patchResults').innerHTML = 
            '<div class="loading">Start typing to search for patches...</div>';
    }
    
    handleSearch(query) {
        const resultsContainer = document.getElementById('patchResults');
        
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
            return `
                <div class="patch-result clickable" data-patch-id="${patch.id}">
                    <div class="patch-result-content">
                        <h4>${patch.title}</h4>
                        <p class="patch-description">${description}</p>
                        <div class="patch-badges">
                            ${patch.meta?.system ? `<span class="badge badge-system" data-system="${patch.meta.system}">${patch.meta.system}</span>` : ''}
                            ${patch.meta?.baseRom ? `<span class="badge badge-rom" data-rom="${patch.meta.baseRom}">${patch.meta.baseRom}</span>` : ''}
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
            this.selectedPatch = null;
            this.patchManager.setSelectedHack(null);
            this.hideSelectedPatch();
            this.showAllResults();
            return;
        }
        
        this.selectedPatch = this.patches.find(p => p.id === patchId);
        if (!this.selectedPatch) return;
        
        this.patchManager.setSelectedHack(this.selectedPatch);
        this.renderSelectedPatch();
        this.hideOtherResults(patchId);
        this.validateCurrentROM();
        this.updatePatchButton();
    }
    
    renderSelectedPatch() {
        const container = document.getElementById('selectedPatch');
        const title = document.getElementById('selectedPatchTitle');
        const description = document.getElementById('selectedPatchDescription');
        
        if (title) title.textContent = this.selectedPatch.title;
        if (description) {
            if (this.selectedPatch.changelog && typeof marked !== 'undefined') {
                // Remove title from markdown if it appears at the beginning
                let cleanedChangelog = this.selectedPatch.changelog;
                const titlePattern = new RegExp(`^#\s*${this.selectedPatch.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\s*\n`, 'i');
                cleanedChangelog = cleanedChangelog.replace(titlePattern, '');
                
                description.innerHTML = marked.parse(cleanedChangelog);
            } else {
                description.textContent = this.selectedPatch.changelog || 'No description available.';
            }
        }
        
        container.style.display = 'block';
        this.initializeIcons();
    }
    
    hideSelectedPatch() {
        const container = document.getElementById('selectedPatch');
        if (container) container.style.display = 'none';
    }
    
    hideOtherResults(selectedId) {
        const results = document.querySelectorAll('.patch-result');
        results.forEach(result => {
            if (result.dataset.patchId !== selectedId) {
                result.style.display = 'none';
            } else {
                result.classList.add('selected');
            }
        });
    }
    
    showAllResults() {
        const results = document.querySelectorAll('.patch-result');
        results.forEach(result => {
            result.style.display = 'block';
            result.classList.remove('selected');
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
        
        if (!this.patchManager.romPatcherAvailable) {
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
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    handleThemeToggle() {
        Utils.toggleTheme();
        
        // Update both theme toggles
        const isDark = document.body.classList.contains('dark-mode');
        const themeBtn = document.getElementById('themeToggle');
        const themeCollapsed = document.getElementById('themeToggleCollapsed');
        
        if (themeBtn) {
            const themeText = themeBtn.querySelector('span');
            if (themeText) {
                themeText.textContent = isDark ? 'Dark Mode' : 'Light Mode';
            }
        }
        
        setTimeout(() => this.initializeIcons(), 100);
    }
    
    showEngineError() {
        const resultsContainer = document.getElementById('patchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="loading error">Patch Engine failed to load. Check browser console for details.</div>';
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