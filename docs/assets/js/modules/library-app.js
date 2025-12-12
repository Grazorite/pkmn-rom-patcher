// Library Page Application
import { Utils } from './utils.js';
import { SearchManager } from './search.js';
import { UIManager } from './ui.js';
import { CacheManager } from './cache.js';
import { PerformanceMonitor } from './monitor.js';

import { AnimationUtils } from '../utils/animations.js';
import animationEngine from '../utils/animation-engine.js';
import { StateManager } from '../utils/state-manager.js';
import { imageLoader } from '../utils/image-loader.js';
import { resourceLoader } from '../utils/resource-loader.js';
import { manifestLoader } from '../utils/manifest-loader.js';
import { configLoader } from '../utils/config-loader.js';
import { PageDetector } from '../utils/page-detector.js';
import { BasicSearch } from '../utils/basic-search.js';

const ICON_INIT_DELAY_SHORT = 100;
const ICON_INIT_DELAY_LONG = 1000;

class ROMLibraryApp {
    constructor() {
        this.hacks = [];
        this.filteredHacks = [];
        this.searchManager = new SearchManager();
        this.uiManager = new UIManager();

        this.cacheManager = new CacheManager();
        this.performanceMonitor = new PerformanceMonitor();
        this.selectedHack = null;
        this.viewMode = localStorage.getItem('libraryViewMode') || 'card';
        
        this.init();
    }
    
    async init() {
        // Fast initial render
        this.showInitialContent();
        
        // Load critical data first
        await this.loadHacks();
        
        // Load CDN resources and wait for search dependencies
        await this.loadCDNResources();
        
        // Initialize search after dependencies are loaded
        this.initializeSearch();
        
        // Setup event listeners after search is ready
        this.setupEventListeners();
        
        // Restore state immediately for test compatibility
        this.restoreState();
        
        // Defer heavy operations
        requestIdleCallback(() => {
            this.generateFilters();
            this.renderHacks();
            // Apply restored filters after rendering
            const state = StateManager.loadState('library');
            if (state) {
                this.applyRestoredFilters(state);
            }

        }, { timeout: 1000 });
        
        // Initialize icons after CDN loads
        this.initializeIconsWhenReady();
    }
    
    initializeSearch() {
        // Initialize Fuse.js if available
        if (typeof Fuse !== 'undefined' && this.hacks.length > 0) {
            this.searchManager.initFuse(this.hacks);
        }
    }
    
    async loadCDNResources() {
        try {
            await resourceLoader.loadCDNResources();
            // Small delay to ensure scripts are executed
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.warn('CDN resources failed to load:', error);
        }
    }
    
    initializeIconsWhenReady() {
        const checkAndInit = () => {
            if (typeof lucide !== 'undefined') {
                this.initializeIcons();
            } else {
                setTimeout(checkAndInit, 100);
            }
        };
        checkAndInit();
    }
    
    restoreState() {
        const state = StateManager.loadState('library');
        if (!state) return;
        
        // Ensure DOM is ready before restoring state
        this.restoreSearchState(state);
        this.restoreFilterState(state);
        this.restoreViewState(state);
        this.restoreScrollState(state);
    }
    
    restoreSearchState(state) {
        if (!state.searchQuery) return;
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = state.searchQuery;
            // Trigger input event to ensure search is applied
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // Retry if DOM not ready
            this.retrySearchRestore = (this.retrySearchRestore || 0) + 1;
            if (this.retrySearchRestore < 5) {
                setTimeout(() => this.restoreSearchState(state), 100);
            }
        }
    }
    

    
    restoreFilterState(state) {
        
        if (!state.filters) return;
        
        Object.entries(state.filters).forEach(([filterType, values]) => {
            values.forEach(value => {
                this.searchManager.setFilter(filterType, value, true);
                this.updateFilterCheckbox(filterType, value, true);
            });
        });
    }
    
    restoreViewState(state) {
        if (state.viewMode) {
            this.viewMode = state.viewMode;
            this.updateViewIcon();
        }
    }
    
    restoreScrollState(state) {
        if (state.scrollPosition) {
            setTimeout(() => window.scrollTo(0, state.scrollPosition), 100);
        }
    }
    
    applyRestoredFilters(state) {
        // Apply filters after restoration
        if (state.searchQuery || (state.filters && Object.keys(state.filters).length > 0)) {
            this.applyFilters();
        }
    }
    
    saveState() {
        const searchInput = document.getElementById('searchInput');
        StateManager.saveState('library', {
            searchQuery: searchInput?.value || '',
            filters: this.searchManager.getActiveFilters(),
            viewMode: this.viewMode,
            scrollPosition: window.scrollY
        });
    }
    
    initializeIcons(container) {
        // Defer icon initialization to avoid blocking render
        requestIdleCallback(() => {
            if (typeof window.initIcons === 'function') {
                window.initIcons();
            } else if (typeof lucide !== 'undefined') {
                try {
                    if (container) {
                        // Only initialize icons in specific container
                        const icons = container.querySelectorAll('[data-lucide]');
                        icons.forEach(icon => {
                            if (!icon.querySelector('svg')) {
                                lucide.createIcons({ attrs: { 'data-lucide': true } }, icon);
                            }
                        });
                    } else {
                        lucide.createIcons();
                    }
                } catch (e) {
                    console.warn('Icon initialization failed:', e);
                }
            } else {
                // Load lucide if not available
                resourceLoader.loadScript('https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js')
                    .then(() => {
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    })
                    .catch(e => console.warn('Failed to load lucide:', e));
            }
        });
    }
    
    showInitialContent() {
        // Show loading state immediately with enhanced skeletons
        const hackGrid = document.getElementById('hackGrid');
        if (hackGrid) {
            hackGrid.innerHTML = `
                <div class="skeleton skeleton-card skeleton-loading"></div>
                <div class="skeleton skeleton-card skeleton-loading"></div>
                <div class="skeleton skeleton-card skeleton-loading"></div>
                <div class="skeleton skeleton-card skeleton-loading"></div>
                <div class="skeleton skeleton-card skeleton-loading"></div>
                <div class="skeleton skeleton-card skeleton-loading"></div>
            `;
        }
    }
    
    async loadHacks() {
        // Only load manifest if this page needs it
        if (!PageDetector.needsManifest()) {
            this.hacks = [];
            this.filteredHacks = [];
            return;
        }

        try {
            // Start manifest loading immediately (don't block on SW)
            const manifestPromise = manifestLoader.load();
            
            // Start SW readiness check in parallel (non-blocking)
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.catch(() => {}); // Background check
            }
            
            // Wait only for manifest, not SW
            this.hacks = await manifestPromise;
            this.hacks.sort((a, b) => a.title.localeCompare(b.title));
            this.filteredHacks = [...this.hacks];
            
            // Update legacy cache for compatibility
            this.cacheManager.setManifest({
                data: this.hacks,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('Failed to load hacks:', error);
            this.showError('Unable to load ROM library. Please check your connection and try again.');
            // Set empty arrays as fallback
            this.hacks = [];
            this.filteredHacks = [];
        }
    }
    

    
    setupEventListeners() {
        // Search with defensive programming
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const searchWrapper = searchInput.closest('.search-wrapper');
            
            searchInput.addEventListener('input', Utils.debounce((e) => {
                if (searchWrapper) searchWrapper.classList.add('searching');
                this.applyFilters();
                this.saveState();
                setTimeout(() => {
                    if (searchWrapper) searchWrapper.classList.remove('searching');
                }, 300);
            }, 400));
        }
        
        // Save scroll position (less frequently to reduce noise)
        window.addEventListener('scroll', Utils.debounce(() => {
            this.saveState();
        }, 2000));
        
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
                this.saveState();
            }
        });
        

        
        // Clear filters button
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
                
                // Defensive icon management - handle both i and svg elements
                let icon = sidebarToggle.querySelector('i, svg, .collapse-icon');
                if (!icon) {
                    // Recreate icon if missing
                    icon = document.createElement('i');
                    icon.className = 'collapse-icon';
                    sidebarToggle.appendChild(icon);
                }
                
                if (icon && icon.setAttribute) {
                    if (sidebar.classList.contains('collapsed')) {
                        icon.setAttribute('data-lucide', 'chevron-right');
                    } else {
                        icon.setAttribute('data-lucide', 'chevron-left');
                    }
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
            
            // Close button handled by floating-buttons.js
            
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
        // Fast render without icons first
        this.uiManager.renderHacks(this.filteredHacks, this.viewMode);
        
        // Initialize icons after render
        const grid = document.getElementById('hackGrid');
        if (grid) {
            // Defer icon initialization to next frame
            requestAnimationFrame(() => {
                this.initializeIcons(grid);
            });
        }
    }
    
    toggleView() {
        this.viewMode = this.viewMode === 'card' ? 'grid' : 'card';
        localStorage.setItem('libraryViewMode', this.viewMode);
        this.renderHacks();
        this.updateViewIcon();
        this.saveState();
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
        this.saveState();
    }
    
    openDetailPanel(hackId) {
        this.selectedHack = this.hacks.find(hack => hack.id === hackId);
        if (!this.selectedHack) return;
        

        this.uiManager.renderDetailPanel(this.selectedHack);
        this.uiManager.openDetailPanel();
        setTimeout(() => this.initializeIcons(), 100);
    }
    
    closeDetailPanel() {
        this.uiManager.closeDetailPanel();
        this.selectedHack = null;

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
    
    // Cleanup on page unload
    destroy() {
        if (imageLoader) {
            imageLoader.disconnect();
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