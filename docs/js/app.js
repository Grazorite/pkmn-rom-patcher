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
        // Initialize theme first
        Utils.initTheme();
        this.initializeIcons();
        
        await this.loadHacks();
        this.setupEventListeners();
        this.generateFilters();
        this.renderHacks();
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
        
        // Navigation toggle
        const navToggle = document.getElementById('navToggle');
        const navSidebar = document.getElementById('navSidebar');
        if (navToggle && navSidebar) {
            navToggle.addEventListener('click', () => {
                navSidebar.classList.toggle('open');
            });
        }
        
        // Theme toggle
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const wasDetailOpen = document.getElementById('detailPanel')?.classList.contains('open');
                const wasDetailCollapsed = document.getElementById('detailPanel')?.classList.contains('collapsed');
                
                Utils.toggleTheme();
                
                // Update theme toggle text
                const isDark = document.body.classList.contains('dark-mode');
                const themeText = themeBtn.querySelector('span');
                if (themeText) {
                    themeText.textContent = isDark ? 'Dark Mode' : 'Light Mode';
                }
                
                // Preserve detail panel state after theme change
                if (wasDetailOpen || wasDetailCollapsed) {
                    const panel = document.getElementById('detailPanel');
                    if (panel) {
                        if (wasDetailOpen) {
                            panel.classList.add('open');
                        }
                        if (wasDetailCollapsed) {
                            panel.classList.add('collapsed');
                        }
                    }
                }
                
                // Re-initialize icons after theme change
                setTimeout(() => this.initializeIcons(), 100);
            });
        }
        
        // ROM file input
        const romInput = document.getElementById('romFileInput');
        const fileLabel = document.querySelector('.file-input-label');
        if (romInput && fileLabel) {
            fileLabel.addEventListener('click', () => romInput.click());
            romInput.addEventListener('change', (e) => {
                this.handleROMFile(e);
                this.patchManager.validateROM();
            });
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
                
                // Update filter counts after change
                setTimeout(() => {
                    this.updateFilterCounts();
                }, 100);
            }
        });
        
        // Collapsible filter groups
        document.addEventListener('click', (e) => {
            const filterHeader = e.target.closest('.filter-group h4');
            if (filterHeader) {
                const filterGroup = filterHeader.closest('.filter-group');
                filterGroup.classList.toggle('collapsed');
                
                // Re-initialize icons after state change
                setTimeout(() => this.initializeIcons(), 100);
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
        this.applyFilters();
    }
    
    applyFilters() {
        // Start with all hacks, then apply search if there's a query
        const searchInput = document.getElementById('searchInput');
        const query = searchInput ? searchInput.value.trim() : '';
        
        let baseHacks = query ? this.searchManager.search(query, this.hacks) : [...this.hacks];
        this.filteredHacks = this.searchManager.applyFilters(baseHacks);
        this.uiManager.resetPagination();
        this.renderHacks();
    }
    
    updateFilterCounts() {
        const filters = this.searchManager.generateFilterOptions(this.filteredHacks);
        Object.keys(filters).forEach(filterType => {
            const container = document.getElementById(`${filterType}Filters`);
            if (container) {
                const options = container.querySelectorAll('.filter-option');
                options.forEach(option => {
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    const countSpan = option.querySelector('.filter-count');
                    if (checkbox && countSpan) {
                        const count = filters[filterType].get(checkbox.value) || 0;
                        countSpan.textContent = `(${count})`;
                        option.style.opacity = count > 0 ? '1' : '0.5';
                    }
                });
            }
        });
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
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the app when DOM and scripts are loaded
function initializeApp() {
    // Initialize app immediately for UI, check RomPatcher separately for patching functionality
    window.app = new ROMHackStore();
    
    // RomPatcher initialization is now handled by the PatchManager
}

// Start initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}