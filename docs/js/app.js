// Main application
import { Utils } from './utils.js';
import { SearchManager } from './search.js';
import { UIManager } from './ui.js';
import { PatchManager } from './patcher.js';

class ROMHackStore {
    constructor() {
        this.hacks = [];
        this.filteredHacks = [];
        this.searchManager = new SearchManager();
        this.uiManager = new UIManager();
        this.patchManager = new PatchManager();
        this.selectedHack = null;
        
        this.init();
    }
    
    async init() {
        await this.loadHacks();
        this.setupEventListeners();
        this.generateFilters();
        this.renderHacks();
        Utils.initTheme();
        this.initializeIcons();
    }
    
    initializeIcons() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    async loadHacks() {
        try {
            const response = await fetch('manifest.json');
            this.hacks = await response.json();
            this.filteredHacks = [...this.hacks];
            this.searchManager.initFuse(this.hacks);
        } catch (error) {
            console.error('Failed to load hacks:', error);
            const grid = document.getElementById('hackGrid');
            if (grid) grid.innerHTML = '<div class="loading">Failed to load ROM hacks</div>';
        }
    }
    
    setupEventListeners() {
        // Search with debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
        
        // Clear filters
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFilters());
        }
        
        // Load more
        const loadMoreBtn = document.getElementById('loadMore');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMore());
        }
        
        // Detail panel
        const closeBtn = document.getElementById('closeDetail');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDetailPanel());
        }
        
        // Click outside to collapse
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('detailPanel');
            const isClickInside = panel && panel.contains(e.target);
            const isHackCard = e.target.closest('.hack-card');
            
            if (!isClickInside && !isHackCard && panel && panel.classList.contains('open')) {
                this.uiManager.collapseDetailPanel();
            }
        });
        
        // Click collapsed panel to expand
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('detailPanel');
            if (panel && panel.classList.contains('collapsed') && panel.contains(e.target)) {
                this.uiManager.expandDetailPanel();
            }
        });
        
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.uiManager.switchTab(e.target.dataset.tab);
            });
        });
        
        // Theme toggle
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                Utils.toggleTheme();
                // Re-initialize icons after theme change
                setTimeout(() => this.initializeIcons(), 100);
            });
        }
        
        // ROM file input
        const romInput = document.getElementById('romFileInput');
        if (romInput) {
            romInput.addEventListener('change', () => this.patchManager.validateROM());
        }
        
        // Apply patch
        const patchBtn = document.getElementById('applyPatchBtn');
        if (patchBtn) {
            patchBtn.addEventListener('click', () => this.patchManager.applyPatch());
        }
        
        // Hack card clicks
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.hack-card');
            if (card) {
                const hackId = card.dataset.hackId;
                this.openDetailPanel(hackId);
            }
        });
        
        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.closest('.filter-options')) {
                const filterId = e.target.closest('.filter-options').id;
                const filterType = filterId.replace('Filters', '');
                this.handleFilterChange(filterType, e.target.value, e.target.checked);
            }
        });
    }
    
    generateFilters() {
        const filters = this.searchManager.generateFilterOptions(this.hacks);
        Object.keys(filters).forEach(filterType => {
            this.uiManager.renderFilterOptions(filterType, filters[filterType]);
        });
    }
    
    handleFilterChange(filterType, value, checked) {
        this.searchManager.setFilter(filterType, value, checked);
        this.applyFilters();
    }
    
    handleSearch(query) {
        this.filteredHacks = this.searchManager.search(query, this.hacks);
        this.applyFilters();
    }
    
    applyFilters() {
        this.filteredHacks = this.searchManager.applyFilters(this.filteredHacks);
        this.uiManager.resetPagination();
        this.renderHacks();
    }
    
    clearAllFilters() {
        this.uiManager.clearAllFilterCheckboxes();
        this.uiManager.clearSearchInput();
        this.searchManager.clearAllFilters();
        this.filteredHacks = [...this.hacks];
        this.uiManager.resetPagination();
        this.renderHacks();
    }
    
    renderHacks() {
        this.uiManager.renderHacks(this.filteredHacks);
    }
    
    loadMore() {
        this.uiManager.nextPage();
        this.uiManager.renderHacks(this.filteredHacks, true);
    }
    
    openDetailPanel(hackId) {
        this.selectedHack = this.hacks.find(hack => hack.id === hackId);
        if (!this.selectedHack) return;
        
        this.patchManager.setSelectedHack(this.selectedHack);
        this.uiManager.renderDetailPanel(this.selectedHack);
        this.uiManager.openDetailPanel();
        
        // Re-initialize icons in the detail panel
        setTimeout(() => this.initializeIcons(), 100);
    }
    
    closeDetailPanel() {
        this.uiManager.closeDetailPanel();
        this.selectedHack = null;
        this.patchManager.setSelectedHack(null);
    }
}

// Initialize the app when DOM and scripts are loaded
function initializeApp() {
    // Check if RomPatcher dependencies are loaded
    if (typeof BinFile !== 'undefined' && typeof RomPatcher !== 'undefined') {
        window.app = new ROMHackStore();
    } else {
        // Retry after a short delay
        setTimeout(initializeApp, 100);
    }
}

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);