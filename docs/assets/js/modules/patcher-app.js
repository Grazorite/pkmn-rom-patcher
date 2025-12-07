// ROM Patcher App - Dedicated patching interface
import { Utils } from './utils.js';

class ROMPatcherApp {
    constructor() {
        this.patches = [];
        this.fuse = null;
        this.selectedPatch = null;
        this.creatorMode = false;
        this.romPatcherInitialized = false;
        this.romPatcherReady = false;
        
        this.init();
    }
    
    async init() {
        this.initializeIcons();
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
            
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            this.patches = await response.json();
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
        const searchInput = document.getElementById('patchSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
        
        const creatorToggle = document.getElementById('creatorMode');
        if (creatorToggle) {
            creatorToggle.addEventListener('change', (e) => {
                this.creatorMode = e.target.checked;
                this.updateCreatorMode();
            });
        }
        
        const closePatchBtn = document.getElementById('closePatchDescription');
        if (closePatchBtn) {
            closePatchBtn.addEventListener('click', () => this.deselectPatch());
        }
    }
    
    initializeRomPatcherWithPatch(patchInfo) {
        if (typeof RomPatcherWeb === 'undefined') {
            console.error('RomPatcherWeb not loaded');
            return false;
        }
        
        if (this.romPatcherInitialized) {
            // Already initialized, just switch patches
            try {
                RomPatcherWeb.setEmbededPatches(patchInfo);
                
                // Show container if hidden
                const container = document.getElementById('rom-patcher-container');
                if (container && container.style.display === 'none') {
                    container.style.display = 'block';
                }
                
                return true;
            } catch (error) {
                console.error('Failed to switch patch:', error);
                return false;
            }
        }
        
        try {
            // First time initialization with embeded patch
            RomPatcherWeb.initialize({
                language: 'en',
                requireValidation: false,
                allowDropFiles: true
            }, patchInfo);
            
            this.romPatcherInitialized = true;
            
            // Show the patcher container
            const container = document.getElementById('rom-patcher-container');
            if (container) {
                container.style.display = 'block';
                container.style.visibility = 'visible';
            } else {
                console.error('rom-patcher-container not found!');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize RomPatcherWeb:', error);
            return false;
        }
    }
    
    setupSearch() {
        const resultsContainer = document.getElementById('patchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="loading">Start typing to search for patches...</div>';
        }
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
        this.renderSearchResults(results.slice(0, 10));
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
            const statusClass = `status-${status.toLowerCase().replace(/\\s+/g, '-')}`;
            
            return `
                <div class="patch-result clickable" data-patch-id="${patch.id}">
                    <div class="patch-result-boxart">
                        ${boxArt ? `<img src="${boxArt}" class="patch-boxart" alt="${patch.title}">` : `<div class="patch-boxart-placeholder"><i data-lucide="image" width="24" height="24"></i></div>`}
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
        
        container.querySelectorAll('.patch-result').forEach(result => {
            result.addEventListener('click', (e) => {
                const patchId = e.target.closest('.patch-result').dataset.patchId;
                this.selectPatch(patchId);
            });
        });
        
        this.initializeIcons();
    }
    
    async selectPatch(patchId) {
        if (this.selectedPatch && this.selectedPatch.id === patchId) {
            this.deselectPatch();
            return;
        }
        
        this.selectedPatch = this.patches.find(p => p.id === patchId);
        if (!this.selectedPatch) return;
        
        this.hideOtherResults(patchId);
        this.positionAndShowDetails(patchId);
        
        // Build patch info for RomPatcher
        // Fix path: manifest has ../patches but we're in /patcher/ so need ../../patches
        const patchFile = this.selectedPatch.file.replace('../patches/', '../../patches/');
        const patchInfo = {
            file: patchFile,
            name: this.selectedPatch.title,
            description: this.selectedPatch.changelog ? this.selectedPatch.changelog.substring(0, 200) : '',
            outputName: this.selectedPatch.title.replace(/[^a-zA-Z0-9-_]/g, '_')
        };
        
        if (this.selectedPatch.meta?.crc32) {
            patchInfo.inputCrc32 = this.selectedPatch.meta.crc32;
        }
        
        // Initialize or switch RomPatcher with this patch
        const success = this.initializeRomPatcherWithPatch(patchInfo);
        
        if (!success) {
            console.error('Failed to load patch');
        }
    }
    
    deselectPatch() {
        this.selectedPatch = null;
        this.hideSelectedPatchWithAnimation();
        
        // Hide patcher widget when no patch selected
        const container = document.getElementById('rom-patcher-container');
        if (container) {
            container.style.display = 'none';
        }
        
        setTimeout(() => {
            this.showAllResults();
        }, 200);
    }
    
    positionAndShowDetails(selectedId) {
        const selectedElement = document.querySelector(`[data-patch-id="${selectedId}"]`);
        const container = document.getElementById('selectedPatch');
        const description = document.getElementById('selectedPatchDescription');
        
        if (!selectedElement || !container) return;
        
        if (description) {
            if (this.selectedPatch.changelog && typeof marked !== 'undefined') {
                let cleanedChangelog = this.selectedPatch.changelog;
                const titlePattern = new RegExp(`^#\\s*${this.selectedPatch.title.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*\\n`, 'i');
                cleanedChangelog = cleanedChangelog.replace(titlePattern, '');
                description.innerHTML = marked.parse(cleanedChangelog);
            } else {
                description.textContent = this.selectedPatch.changelog || 'No description available.';
            }
        }
        
        selectedElement.parentNode.insertBefore(container, selectedElement.nextSibling);
        
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
    
    updateCreatorMode() {
        const patchSection = document.getElementById('rom-patcher-patch-section');
        if (this.creatorMode && patchSection) {
            patchSection.style.display = 'block';
        } else if (patchSection) {
            patchSection.style.display = 'none';
        }
        this.initializeIcons();
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

function initializeApp() {
    window.patcherApp = new ROMPatcherApp();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
