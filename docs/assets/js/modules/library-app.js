// Library Page Application
import { Utils } from './utils.js';
import { SearchManager } from './search.js';
import { UIManager } from './ui.js';
import { PatchManager } from './patcher.js';
import { CacheManager } from './cache.js';
import { PerformanceMonitor } from './monitor.js';
import { DebugPanel } from './debug.js';
import { AnimationUtils } from '../utils/animations.js';
import animationEngine from '../utils/animation-engine.js';

const ICON_INIT_DELAY_SHORT = 100;
const ICON_INIT_DELAY_LONG = 1000;

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
        this.viewMode = localStorage.getItem('libraryViewMode') || 'card';
        
        this.init();
    }
    
    async init() {
        await this.loadHacks();
        this.setupEventListeners();
        this.generateFilters();
        this.renderHacks();
        
        this.debugPanel = new DebugPanel(this);
        setTimeout(() => this.initializeIcons(), 200);
    }
    
    initializeIcons(container) {
        if (typeof window.initIcons === 'function') {
            window.initIcons();
        } else if (typeof lucide !== 'undefined') {
            try {
                if (container) {
                    lucide.createIcons({ attrs: { 'data-lucide': true } }, container);
                } else {
                    lucide.createIcons();
                }
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
            // Sort alphabetically by title
            this.hacks.sort((a, b) => a.title.localeCompare(b.title));
            this.filteredHacks = [...this.hacks];
            if (typeof Fuse !== 'undefined') {
                this.searchManager.initFuse(this.hacks);
            }
            
            // Hide skeleton and show content
            if (hackGrid) {
                AnimationUtils.hideLoadingSkeleton(hackGrid);
            }
            
            this.generateFilters();
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
            
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            this.hacks = await response.json();
            
            // Sort alphabetically by title
            this.hacks.sort((a, b) => a.title.localeCompare(b.title));
            
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
            const searchWrapper = searchInput.closest('.search-wrapper');
            searchInput.addEventListener('input', Utils.debounce((e) => {
                if (searchWrapper) searchWrapper.classList.add('searching');
                this.applyFilters();
                setTimeout(() => {
                    if (searchWrapper) searchWrapper.classList.remove('searching');
                }, 300);
            }, 400));
        }
        
        // Theme toggles handled by unified theme system
        
        // Navigation handled by global navigation.js
        
        // Other event listeners...
        this.setupFilterListeners();
        this.setupDetailPanelListeners();
        this.setupPatchingListeners();
    }
    
    setupFilterListeners() {
        // Filter dropdown toggles
        document.addEventListener('click', (e) => {
            const filterHeader = e.target.closest('.filter-group h4');
            if (filterHeader) {
                const filterGroup = filterHeader.closest('.filter-group');
                filterGroup.classList.toggle('collapsed');
            }
        });
        
        // Filter checkboxes
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
        
        // View toggle
        const viewToggle = document.getElementById('viewToggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', () => this.toggleView());
            this.updateViewIcon();
        }
        
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                const icon = sidebarToggle.querySelector('i');
                if (sidebar.classList.contains('collapsed')) {
                    icon.setAttribute('data-lucide', 'chevron-right');
                } else {
                    icon.setAttribute('data-lucide', 'chevron-left');
                }
                this.initializeIcons();
            });
        }
    }
    
    setupDetailPanelListeners() {
        // Use event delegation for detail panel interactions
        document.addEventListener('click', (e) => {
            // Badge clicks to set filters (must be before card clicks)
            const badge = e.target.closest('.badge');
            if (badge && badge.closest('.hack-card')) {
                e.preventDefault();
                e.stopPropagation();
                const filterType = badge.classList.contains('badge-rom') ? 'baseRom' :
                                 badge.classList.contains('badge-system') ? 'system' :
                                 badge.classList.contains('badge-difficulty') ? 'difficulty' : null;
                if (filterType) {
                    const value = badge.textContent.trim();
                    this.searchManager.setFilter(filterType, value, true);
                    this.updateFilterCheckbox(filterType, value, true);
                    this.applyFilters();
                }
                return;
            }
            
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
        const patchBtn = document.getElementById('openPatcherBtn');
        
        if (patchBtn) {
            patchBtn.addEventListener('click', () => this.openInPatcher());
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
        this.uiManager.renderHacks(this.filteredHacks, this.viewMode);
        const grid = document.getElementById('hackGrid');
        if (grid) this.initializeIcons(grid);
    }
    
    toggleView() {
        this.viewMode = this.viewMode === 'card' ? 'grid' : 'card';
        localStorage.setItem('libraryViewMode', this.viewMode);
        const hackGrid = document.getElementById('hackGrid');
        if (hackGrid) {
            hackGrid.classList.toggle('grid-view', this.viewMode === 'grid');
        }
        this.renderHacks();
        this.updateViewIcon();
    }
    
    updateViewIcon() {
        const viewToggle = document.getElementById('viewToggle');
        if (viewToggle) {
            const newIcon = this.viewMode === 'grid' ? 'layout-list' : 'grid-3x3';
            
            // Remove ALL children (i and svg elements)
            while (viewToggle.firstChild) {
                viewToggle.removeChild(viewToggle.firstChild);
            }
            
            // Create fresh icon element
            const iconEl = document.createElement('i');
            iconEl.setAttribute('data-lucide', newIcon);
            iconEl.setAttribute('width', '16');
            iconEl.setAttribute('height', '16');
            viewToggle.appendChild(iconEl);
            
            // Ensure tooltip persists
            viewToggle.setAttribute('title', 'Toggle view');
            
            // Initialize icons
            this.initializeIcons();
        }
    }
    
    updateFilterCheckbox(filterType, value, checked) {
        const checkbox = document.getElementById(`${filterType}-${value}`);
        if (checkbox) {
            checkbox.checked = checked;
        }
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
    
    openInPatcher() {
        if (!this.selectedHack) return;
        
        const params = new URLSearchParams({
            patch: this.selectedHack.file,
            name: this.selectedHack.title,
            baseRom: this.selectedHack.baseRom || ''
        });
        
        window.location.href = `../patcher/?${params.toString()}`;
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
            this.initializeIcons();
        }
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