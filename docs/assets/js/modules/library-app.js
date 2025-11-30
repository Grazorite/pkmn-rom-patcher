// Library Page Application
import { Utils } from './utils.js';
import { SearchManager } from './search.js';
import { UIManager } from './ui.js';
import { PatchManager } from './patcher.js';
import { CacheManager } from './cache.js';
import { PerformanceMonitor } from './monitor.js';
import { DebugPanel } from './debug.js';
import { AnimationUtils } from '../utils/animations.js';
// import PatchEngine from './PatchEngine.js'; // Temporarily disabled

class ROMLibraryApp {
    constructor() {
        this.hacks = [];
        this.filteredHacks = [];
        this.searchManager = new SearchManager();
        this.uiManager = new UIManager();
        this.patchManager = new PatchManager();
        this.cacheManager = new CacheManager();
        this.performanceMonitor = new PerformanceMonitor();
        this.selectedHack = null;
        
        this.init();
    }
    
    async init() {
        this.initializeIcons();
        
        // Skip PatchEngine for now to test manifest loading
        console.log('Skipping PatchEngine initialization for debugging');
        
        // Initialize filters after loading hacks
        if (this.hacks.length > 0) {
            this.generateFilters();
        }
        
        await this.loadHacks();
        this.setupEventListeners();
        this.generateFilters();
        this.renderHacks();
        
        this.debugPanel = new DebugPanel(this);
        setTimeout(() => this.initializeIcons(), 100);
        setTimeout(() => this.initializeIcons(), 1000);
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
    
    async loadHacks() {
        // Show loading skeleton while fetching
        const hackGrid = document.getElementById('hackGrid');
        if (hackGrid) {
            AnimationUtils.showLoadingSkeleton(hackGrid, 6, 'card');
        }
        
        const cachedData = this.cacheManager.getManifest();
        if (cachedData) {
            this.hacks = cachedData;
            this.filteredHacks = [...this.hacks];
            if (typeof Fuse !== 'undefined') {
                this.searchManager.initFuse(this.hacks);
            }
            
            // Hide skeleton and show content
            if (hackGrid) {
                AnimationUtils.hideLoadingSkeleton(hackGrid);
            }
            return;
        }

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
            console.log('Manifest loaded from:', successPath);
            console.log('Manifest response:', response.status, response.statusText);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            this.hacks = await response.json();
            console.log('Loaded hacks:', this.hacks.length);
            
            this.filteredHacks = [...this.hacks];
            if (typeof Fuse !== 'undefined') {
                this.searchManager.initFuse(this.hacks);
            }
            this.cacheManager.setManifest(this.hacks);
            
            // Hide skeleton and generate filters after loading
            if (hackGrid) {
                AnimationUtils.hideLoadingSkeleton(hackGrid);
            }
            this.generateFilters();
        } catch (error) {
            console.error('Failed to load hacks:', error);
            if (hackGrid) {
                AnimationUtils.hideLoadingSkeleton(hackGrid);
            }
            this.showError(`${error.message} - Check browser console for details`);
        }
    }
    
    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.applyFilters();
            }, 150));
        }
        
        // Theme toggles handled by unified theme system
        
        // Navigation handled by global navigation.js
        
        // Other event listeners...
        this.setupFilterListeners();
        this.setupDetailPanelListeners();
        this.setupPatchingListeners();
    }
    
    setupFilterListeners() {
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.closest('.filter-options')) {
                const filterId = e.target.closest('.filter-options').id;
                const filterType = filterId.replace('Filters', '');
                this.searchManager.setFilter(filterType, e.target.value, e.target.checked);
                this.applyFilters();
            }
        });
        
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFilters());
        }
    }
    
    setupDetailPanelListeners() {
        // Use event delegation for detail panel interactions
        document.addEventListener('click', (e) => {
            // Hack card clicks with ripple effect
            const card = e.target.closest('.hack-card');
            if (card) {
                AnimationUtils.addRippleEffect(card, e);
                this.openDetailPanel(card.dataset.hackId);
                return;
            }
            
            // Close button
            if (e.target.closest('#closeDetail')) {
                this.closeDetailPanel();
                return;
            }
            
            // Click outside to close detail panel
            const panel = document.getElementById('detailPanel');
            const isClickInside = panel && panel.contains(e.target);
            
            if (!isClickInside && panel && panel.classList.contains('open')) {
                this.uiManager.collapseDetailPanel();
            }
        });
        
        // Add ripple effects to buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.patch-btn, .load-more, .clear-btn, .breadcrumb-link');
            if (button) {
                AnimationUtils.addRippleEffect(button, e);
            }
        });
    }
    
    setupPatchingListeners() {
        const romInput = document.getElementById('romFileInput');
        const patchBtn = document.getElementById('applyPatchBtn');
        
        if (romInput) {
            romInput.addEventListener('change', (e) => {
                this.handleROMFile(e);
                this.patchManager.validateROM();
            });
        }
        
        if (patchBtn) {
            patchBtn.addEventListener('click', () => this.patchManager.applyPatch());
        }
    }
    
    generateFilters() {
        const filters = this.searchManager.generateFilterOptions(this.hacks);
        Object.keys(filters).forEach(filterType => {
            this.uiManager.renderFilterOptions(filterType, filters[filterType]);
        });
    }
    
    applyFilters() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput ? searchInput.value.trim() : '';
        
        let baseHacks = query ? this.searchManager.search(query, this.hacks) : [...this.hacks];
        this.filteredHacks = this.searchManager.applyFilters(baseHacks);
        this.uiManager.resetPagination();
        this.renderHacks();
    }
    
    renderHacks() {
        this.uiManager.renderHacks(this.filteredHacks);
        
        // Add staggered animations to hack cards after rendering
        setTimeout(() => {
            const hackCards = document.querySelectorAll('.hack-card');
            AnimationUtils.animateHackCards(hackCards);
        }, 50);
    }
    
    clearAllFilters() {
        this.uiManager.clearAllFilterCheckboxes();
        this.uiManager.clearSearchInput();
        this.searchManager.clearAllFilters();
        this.filteredHacks = [...this.hacks];
        this.uiManager.resetPagination();
        this.renderHacks();
    }
    
    openDetailPanel(hackId) {
        this.selectedHack = this.hacks.find(hack => hack.id === hackId);
        if (!this.selectedHack) return;
        
        this.patchManager.setSelectedHack(this.selectedHack);
        this.uiManager.renderDetailPanel(this.selectedHack);
        this.uiManager.openDetailPanel();
        setTimeout(() => this.initializeIcons(), 50);
        setTimeout(() => this.initializeIcons(), 200);
    }
    
    closeDetailPanel() {
        this.uiManager.closeDetailPanel();
        this.selectedHack = null;
        this.patchManager.setSelectedHack(null);
    }
    
    handleROMFile(event) {
        const file = event.target.files[0];
        const fileInfo = document.getElementById('romFileInfo');
        
        if (!file) {
            if (fileInfo) fileInfo.innerHTML = '';
            return;
        }
        
        if (fileInfo) {
            fileInfo.innerHTML = `
                <div class="file-selected">
                    <i data-lucide="file" width="16" height="16"></i>
                    <span>${file.name}</span>
                    <small>${this.formatFileSize(file.size)}</small>
                </div>
            `;
            setTimeout(() => this.initializeIcons(), 50);
        }
    }
    

    
    showError(message) {
        const grid = document.getElementById('hackGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-state">
                    <i data-lucide="wifi-off" width="48" height="48"></i>
                    <p>Failed to load ROM hacks</p>
                    <small>${message}</small>
                    <button onclick="window.location.reload()" class="retry-btn">
                        <i data-lucide="refresh-cw" width="16" height="16"></i>
                        Retry
                    </button>
                </div>
            `;
            setTimeout(() => this.initializeIcons(), 50);
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

// Initialize the library app
function initializeLibraryApp() {
    window.app = new ROMLibraryApp();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLibraryApp);
} else {
    initializeLibraryApp();
}