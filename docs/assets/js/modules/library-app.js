// Library Page Application
import { Utils } from './utils.js';
import { SearchManager } from './search.js';
import { UIManager } from './ui.js';
import { PatchManager } from './patcher.js';
import { CacheManager } from './cache.js';
import { PerformanceMonitor } from './monitor.js';
import { DebugPanel } from './debug.js';
import PatchEngine from './PatchEngine.js';

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
        Utils.initTheme();
        this.initializeIcons();
        
        try {
            await PatchEngine.init();
        } catch (error) {
            console.error('PatchEngine init failed:', error);
        }
        
        await this.loadHacks();
        this.setupEventListeners();
        this.generateFilters();
        this.renderHacks();
        
        this.debugPanel = new DebugPanel(this);
        setTimeout(() => this.initializeIcons(), 500);
    }
    
    initializeIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    async loadHacks() {
        const cachedData = this.cacheManager.getManifest();
        if (cachedData) {
            this.hacks = cachedData;
            this.filteredHacks = [...this.hacks];
            if (typeof Fuse !== 'undefined') {
                this.searchManager.initFuse(this.hacks);
            }
            return;
        }

        try {
            const response = await fetch('../manifest.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.hacks = await response.json();
            this.filteredHacks = [...this.hacks];
            if (typeof Fuse !== 'undefined') {
                this.searchManager.initFuse(this.hacks);
            }
            this.cacheManager.setManifest(this.hacks);
        } catch (error) {
            console.error('Failed to load hacks:', error);
            this.showError(error.message);
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
        
        // Theme toggles
        ['themeToggle', 'themeToggleCollapsed'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.handleThemeToggle());
            }
        });
        
        // Navigation
        const navToggle = document.getElementById('navToggle');
        if (navToggle) {
            navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('navSidebar')?.classList.toggle('open');
            });
        }
        
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
            // Hack card clicks
            const card = e.target.closest('.hack-card');
            if (card) {
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
        setTimeout(() => this.initializeIcons(), 100);
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
            this.initializeIcons();
        }
    }
    
    handleThemeToggle() {
        Utils.toggleTheme();
        const isDark = document.body.classList.contains('dark-mode');
        
        ['themeToggle', 'themeToggleCollapsed'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                const icon = btn.querySelector('i');
                const text = btn.querySelector('span');
                if (icon) icon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
                if (text) text.textContent = isDark ? 'Dark Mode' : 'Light Mode';
            }
        });
        
        setTimeout(() => this.initializeIcons(), 100);
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