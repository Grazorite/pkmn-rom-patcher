// ROM Patcher App - Dedicated patching interface
import { Utils } from '../../docs/js/utils.js';
import { PatchManager } from '../../docs/js/patcher.js';

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
        
        // Theme toggle
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                Utils.toggleTheme();
                
                // Update theme toggle text
                const isDark = document.body.classList.contains('dark-mode');
                const themeText = themeBtn.querySelector('span');
                if (themeText) {
                    themeText.textContent = isDark ? 'Dark Mode' : 'Light Mode';
                }
                
                setTimeout(() => this.initializeIcons(), 100);
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
                            ${patch.meta?.baseRom ? `<span class="badge badge-rom">${patch.meta.baseRom}</span>` : ''}
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
            // Clean markdown formatting from description
            const cleanDescription = this.selectedPatch.changelog ? 
                this.selectedPatch.changelog.replace(/[#*`]/g, '').substring(0, 300) + '...' : 
                'No description available.';
            description.textContent = cleanDescription;
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
        
        // Override checksum validation in creator mode
        if (this.creatorMode) {
            const originalValidate = this.patchManager.validateROM;
            this.patchManager.validateROM = () => {
                const btn = document.getElementById('applyPatchBtn');
                const romFile = document.getElementById('romFileInput')?.files[0];
                if (btn) btn.disabled = !romFile;
            };
        }
        
        await this.patchManager.applyPatch();
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