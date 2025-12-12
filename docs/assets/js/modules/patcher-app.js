// ROM Patcher App - Dedicated patching interface
import { Utils } from './utils.js';
import { imagePopup } from './image-popup.js';
import { renderBadge, initBadgeRenderer } from '../utils/badge-renderer.js';
import { StateManager } from '../utils/state-manager.js';

import { BasicSearch } from '../utils/basic-search.js';
import { manifestLoader } from '../utils/manifest-loader.js';

class ROMPatcherApp {
    constructor() {
        this.patches = [];
        this.fuse = null;
        this.selectedPatch = null;

        this.romPatcherInitialized = false;
        this.romPatcherReady = false;
        this.retryAttempted = false;
        
        this.init();
    }
    
    async init() {
        await initBadgeRenderer();
        this.initializeIcons();
        
        // Setup initial search UI
        this.setupSearch();
        this.setupEventListeners();
        
        // Load patches for search functionality
        await this.loadPatches();
        
        // Setup Fuse.js if patches were loaded
        if (this.patches.length > 0) {
            this.setupFuse();
            // Update search UI now that data is available
            this.setupSearch();
        }
        
        this.restoreState();
        this.handleURLParameters();
    }
    
    restoreState() {
        const state = StateManager.loadState('patcher');
        if (!state) return;
        
        const searchInput = document.getElementById('patchSearch');
        if (searchInput && state.searchQuery) {
            searchInput.value = state.searchQuery;
            this.handleSearch(state.searchQuery);
        }
        
        if (state.selectedPatchId) {
            setTimeout(() => this.selectPatch(state.selectedPatchId), 500);
        }
    }
    
    saveState() {
        // Validate state before saving
        const searchInput = document.getElementById('patchSearch');
        const searchQuery = searchInput?.value || '';
        const selectedPatchId = this.selectedPatch?.id || null;
        
        // Only save if we have valid data
        if (searchInput && (searchQuery || selectedPatchId)) {
            StateManager.saveState('patcher', {
                searchQuery,
                selectedPatchId
            });
        }
    }
    
    deferredSaveState() {
        // Defer state saving until after DOM operations complete
        setTimeout(() => {
            try {
                this.saveState();
            } catch (error) {
                console.warn('State save failed:', error);
                // Retry once after additional delay
                setTimeout(() => {
                    try {
                        this.saveState();
                    } catch (retryError) {
                        console.error('State save retry failed:', retryError);
                    }
                }, 100);
            }
        }, 50);
    }
    
    deferredInitializeIcons() {
        // Defer icon initialization until after DOM is fully rendered
        setTimeout(() => {
            try {
                this.initializeIcons();
            } catch (error) {
                console.warn('Icon initialization failed:', error);
                // Fallback: try again after longer delay
                setTimeout(() => {
                    try {
                        this.initializeIcons();
                    } catch (retryError) {
                        console.error('Icon initialization retry failed:', retryError);
                    }
                }, 100);
            }
        }, 10);
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
        // Always load manifest for search functionality using centralized loader
        try {
            this.patches = await manifestLoader.load();
            this.patches.sort((a, b) => a.title.localeCompare(b.title));
        } catch (error) {
            console.warn('Failed to load patches manifest:', error.message);
            this.patches = [];
        }
    }
    
    setupFuse() {
        if (typeof Fuse === 'undefined') {
            console.warn('Fuse.js not available for patcher search');
            return;
        }
        
        try {
            const options = {
                keys: ['title', 'meta.tags', 'meta.author', 'meta.baseRom'],
                threshold: 0.3,
                includeScore: true,
                minMatchCharLength: 2
            };
            this.fuse = new Fuse(this.patches, options);
        } catch (error) {
            console.warn('Failed to initialize Fuse.js in patcher:', error);
            this.fuse = null;
        }
    }
    
    setupEventListeners() {
        const searchInput = document.getElementById('patchSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
                this.deferredSaveState();
            }, 300));
        }
        
        // Event delegation for patch results
        const resultsContainer = document.getElementById('patchResults');
        if (resultsContainer) {
            resultsContainer.addEventListener('click', (e) => {
                const patchResult = e.target.closest('.patch-result');
                if (patchResult && patchResult.dataset.patchId) {
                    this.selectPatch(patchResult.dataset.patchId);
                }
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
        
        if (!patchInfo || !patchInfo.file) {
            console.error('Invalid patch info provided:', patchInfo);
            return false;
        }
        
        try {
            if (!this.romPatcherInitialized) {
                // First time initialization with embeded patch
                RomPatcherWeb.initialize({
                    language: 'en',
                    requireValidation: false,
                    allowDropFiles: true
                }, patchInfo);
                
                this.romPatcherInitialized = true;
            } else {
                // Verify embeded mode is active
                if (typeof RomPatcherWeb.setEmbededPatches === 'function') {
                    RomPatcherWeb.setEmbededPatches(patchInfo);
                } else {
                    // Reinitialize if embeded mode lost
                    this.romPatcherInitialized = false;
                    return this.initializeRomPatcherWithPatch(patchInfo);
                }
            }
            
            // Move patcher content to container
            const container = document.getElementById('rom-patcher-container');
            const placeholder = document.getElementById('rom-patcher-content-placeholder');
            
            // Move all content from placeholder to main container
            while (placeholder && placeholder.firstChild) {
                container.appendChild(placeholder.firstChild);
            }
            
            // Show the patcher container
            if (container) {
                container.style.display = 'block';
            }
            
            // Show loaded patch info
            this.showLoadedPatchInfo(patchInfo);
            
            this.retryAttempted = false;
            return true;
        } catch (error) {
            console.error('Failed to initialize/switch patch:', error);
            
            // Retry once if not already attempted
            if (!this.retryAttempted) {
                this.retryAttempted = true;
                this.romPatcherInitialized = false;
                return this.initializeRomPatcherWithPatch(patchInfo);
            }
            
            return false;
        }
    }
    
    setupSearch() {
        const resultsContainer = document.getElementById('patchResults');
        if (resultsContainer) {
            if (this.patches.length > 0) {
                resultsContainer.innerHTML = '<div class="loading">Start typing to search for patches...</div>';
            } else {
                resultsContainer.innerHTML = '<div class="loading">Loading patches for search...</div>';
            }
        }
    }
    
    handleSearch(query) {
        const resultsContainer = document.getElementById('patchResults');
        
        if (!query.trim()) {
            if (this.patches.length > 0) {
                resultsContainer.innerHTML = '<div class="loading">Start typing to search for patches...</div>';
            } else {
                resultsContainer.innerHTML = '<div class="loading">Loading patches for search...</div>';
            }
            return;
        }
        
        if (query.length < 2) {
            resultsContainer.innerHTML = '<div class="loading">Type at least 2 characters...</div>';
            return;
        }
        
        // Check if patches are still loading
        if (this.patches.length === 0) {
            resultsContainer.innerHTML = '<div class="loading">Loading patches...</div>';
            return;
        }
        
        let results = [];
        
        // Use Fuse.js if available
        if (this.fuse) {
            try {
                results = this.fuse.search(query);
            } catch (error) {
                console.warn('Fuse.js search failed:', error);
                results = this.basicSearch(query);
            }
        } else {
            // Fallback to basic search
            results = this.basicSearch(query);
        }
        
        this.renderSearchResults(results.slice(0, 10));
    }
    
    basicSearch(query) {
        if (!this.patches || !Array.isArray(this.patches)) {
            return [];
        }
        
        const searchQuery = query.toLowerCase();
        return this.patches.filter(patch => {
            return patch.title.toLowerCase().includes(searchQuery) ||
                   (patch.meta?.author && patch.meta.author.toLowerCase().includes(searchQuery)) ||
                   (patch.meta?.baseRom && patch.meta.baseRom.toLowerCase().includes(searchQuery)) ||
                   (patch.meta?.tags && patch.meta.tags.some(tag => 
                       tag.toLowerCase().includes(searchQuery)
                   ));
        }).map(item => ({ item, score: 0 }));
    }
    
    renderSearchResults(results) {
        const container = document.getElementById('patchResults');
        
        if (!container) {
            console.error('Patch results container not found');
            return;
        }
        
        if (results.length === 0) {
            container.innerHTML = '<div class="loading">No patches found</div>';
            return;
        }
        
        const resultsHtml = results.map(result => {
            const patch = result.item;
            const description = patch.changelog ? patch.changelog.replace(/[#*`]/g, '').substring(0, 100) + '...' : 'No description available';
            const boxArt = patch.meta?.images?.boxArt;
            const status = patch.meta?.status || 'Completed';
            const statusClass = `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
            
            // Resolve box art URL properly
            let boxArtUrl = '';
            if (boxArt) {
                if (boxArt.startsWith('http')) {
                    boxArtUrl = boxArt;
                } else {
                    // Handle relative paths
                    boxArtUrl = boxArt.startsWith('/') ? boxArt : `/${boxArt}`;
                }
            }
            
            return `
                <div class="patch-result clickable" data-patch-id="${patch.id}">
                    <div class="patch-result-boxart">
                        ${boxArtUrl ? 
                            `<div class="image-container">
                                <img src="${boxArtUrl}" class="patch-boxart" alt="${patch.title}" onerror="this.parentElement.classList.add('has-broken-image')">
                                <div class="image-fallback"><i data-lucide="image-off" width="24" height="24"></i></div>
                            </div>` : 
                            `<div class="image-fallback"><i data-lucide="image-off" width="24" height="24"></i></div>`
                        }
                    </div>
                    <div class="patch-result-content">
                        <h4>${patch.title}</h4>
                        <p class="patch-description">${description}</p>
                        <div class="patch-badges">
                            ${renderBadge('rom', patch.meta?.baseRom)}
                            ${renderBadge('system', patch.meta?.system)}
                            <div class="status-indicator">
                                <div class="status-dot ${statusClass}"></div>
                                <span>${status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add result count info
        const countInfo = results.length === 1 ? '1 patch found' : `${results.length} patches found`;
        const countHtml = `<div class="search-results-count">${countInfo}</div>`;
        
        container.innerHTML = countHtml + resultsHtml;
        
        // Event delegation handles clicks - no individual listeners needed
        this.deferredInitializeIcons();
        
        // Ensure container remains accessible after DOM updates
        this.preserveSelectedPatchContainer();
    }
    
    async selectPatch(patchId) {
        if (this.selectedPatch && this.selectedPatch.id === patchId) {
            this.deselectPatch();
            return;
        }
        
        this.selectedPatch = this.patches.find(p => p.id === patchId);
        if (!this.selectedPatch) {
            console.warn('Patch not found:', patchId);
            return;
        }
        
        this.hideOtherResults(patchId);
        this.positionAndShowDetails(patchId);
        
        // Build patch info for RomPatcher using unified path resolution
        const patchInfo = {
            file: this.selectedPatch.file,
            name: this.selectedPatch.title,
            description: this.selectedPatch.changelog ? this.selectedPatch.changelog.substring(0, 200) : '',
            outputName: this.selectedPatch.title.replace(/[^a-zA-Z0-9-_]/g, '_')
        };
        
        if (this.selectedPatch.meta?.crc32) {
            patchInfo.inputCrc32 = this.selectedPatch.meta.crc32;
        }
        
        // Initialize or switch RomPatcher with this patch
        const success = this.initializeRomPatcherWithPatch(patchInfo);
        
        if (success) {
            // Save state after successful patch selection
            this.deferredSaveState();
            
            // Only show notification if not coming from URL (to avoid double notification)
            const params = new URLSearchParams(window.location.search);
            if (!params.get('patch') && !params.get('name')) {
                this.showNotification(`Selected patch: ${this.selectedPatch.title}`, patchInfo.file);
            }
        } else {
            console.error('Failed to load patch');
            this.selectedPatch = null; // Reset on failure
        }
    }
    
    deselectPatch() {
        this.selectedPatch = null;
        this.hideSelectedPatchWithAnimation();
        
        // Save state after UI updates complete
        this.deferredSaveState();
        
        // Unload patch from patcher widget
        if (typeof RomPatcherWeb !== 'undefined' && typeof RomPatcherWeb.providePatchFile === 'function') {
            RomPatcherWeb.providePatchFile(null);
        }
        
        // Hide loaded patch info
        const infoContainer = document.getElementById('rom-patcher-loaded-patch-info');
        if (infoContainer) {
            infoContainer.style.display = 'none';
        }
        
        // Hide patcher widget
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
        let container = document.getElementById('selectedPatch');
        
        // Create container if missing (DOM lifecycle issue)
        if (!container) {
            container = this.createSelectedPatchContainer();
        }
        
        const description = document.getElementById('selectedPatchDescription');
        
        if (!selectedElement || !container) {
            console.warn('Required elements not found for patch details:', { selectedId, selectedElement: !!selectedElement, container: !!container });
            return;
        }
        
        // Show banner with bannerImage (same as library implementation)
        const banner = document.getElementById('selectedPatchBanner');
        if (banner) {
            const bannerImage = this.selectedPatch.meta?.images?.banner || '';
            if (bannerImage) {
                banner.classList.add('has-banner');
                banner.style.setProperty('--banner-bg', `url('${bannerImage}')`);
                banner.innerHTML = '';
                banner.style.cursor = 'pointer';
                banner.onclick = () => imagePopup.show(bannerImage);
            } else {
                banner.classList.remove('has-banner');
                banner.style.removeProperty('--banner-bg');
                banner.innerHTML = this.selectedPatch.title;
                banner.style.cursor = 'default';
                banner.onclick = null;
            }
            banner.style.display = 'flex';
        }
        
        if (description) {
            if (this.selectedPatch.changelog && typeof marked !== 'undefined') {
                let cleanedChangelog = this.selectedPatch.changelog;
                const titlePattern = new RegExp(`^#\\s*${this.selectedPatch.title.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*\\n`, 'i');
                cleanedChangelog = cleanedChangelog.replace(titlePattern, '');
                
                description.innerHTML = marked.parse(cleanedChangelog);
            } else {
                let content = this.selectedPatch.changelog || 'No description available.';
                description.textContent = content;
            }
        }
        
        // Ensure container is properly positioned in DOM
        if (container.parentNode !== selectedElement.parentNode) {
            selectedElement.parentNode.insertBefore(container, selectedElement.nextSibling);
        }
        
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
                // Keep container in DOM but move to stable location
                this.ensureContainerInStableLocation(container);
            }, 400);
        }
    }
    
    ensureContainerInStableLocation(container) {
        // Move container to a stable location in DOM to prevent loss
        const patcherMain = document.querySelector('.patcher-main-single');
        if (patcherMain && container.parentNode !== patcherMain) {
            patcherMain.appendChild(container);
        }
    }
    
    preserveSelectedPatchContainer() {
        // Ensure container exists and is in a stable location after DOM updates
        let container = document.getElementById('selectedPatch');
        if (!container) {
            container = this.createSelectedPatchContainer();
            this.ensureContainerInStableLocation(container);
        } else {
            this.ensureContainerInStableLocation(container);
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
    

    
    handleURLParameters() {
        const params = new URLSearchParams(window.location.search);
        const patchFile = params.get('patch');
        const patchName = params.get('name');
        

        
        if (patchFile || patchName) {
            // Wait for patches to load, then try to find and select
            setTimeout(() => {

                
                const patch = this.patches.find(p => 
                    p.file === patchFile || 
                    p.title === patchName ||
                    p.file.includes(patchFile) ||
                    (patchFile && patchFile.includes(p.file.split('/').pop()))
                );
                

                
                if (patch) {
                    // Force display patch results
                    const searchInput = document.getElementById('patchSearch');
                    const resultsContainer = document.getElementById('patchResults');
                    
                    if (searchInput && resultsContainer) {
                        searchInput.value = patch.title;

                        
                        // Force search results display
                        this.handleSearch(patch.title);
                        
                        // Force results container to show content - Multiple attempts
                        setTimeout(() => {
                            if (resultsContainer.textContent.includes('Start typing')) {
                                this.renderSearchResults([{ item: patch, score: 0 }]);
                            }
                        }, 200);
                        
                        setTimeout(() => {
                            if (resultsContainer.textContent.includes('Start typing')) {
                                resultsContainer.innerHTML = '';
                                this.renderSearchResults([{ item: patch, score: 0 }]);
                            }
                        }, 600);
                        
                        setTimeout(() => {
                            if (resultsContainer.textContent.includes('Start typing')) {
                                resultsContainer.style.display = 'none';
                                setTimeout(() => {
                                    resultsContainer.style.display = 'block';
                                    this.renderSearchResults([{ item: patch, score: 0 }]);
                                }, 50);
                            }
                        }, 1000);
                    }
                    
                    // Select the patch after search results appear
                    setTimeout(() => {

                        this.selectPatch(patch.id);
                        this.showNotification(`Loaded patch: ${patch.title}`, patch.file);
                    }, 800);
                } else {

                    // Create patch info from URL params for direct loading
                    const patchInfo = {
                        file: patchFile,
                        name: patchName || 'Selected Patch',
                        title: patchName || 'Selected Patch'
                    };
                    this.initializeRomPatcherWithPatch(patchInfo);
                    this.showNotification(`Loaded patch: ${patchInfo.name}`, patchInfo.file);
                }
            }, 1200);
        }
    }
    
    showNotification(message, patchFile = null) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        let displayMessage = message;
        if (patchFile) {
            const fileName = patchFile.split('/').pop();
            displayMessage = `${message}<br><small style="opacity: 0.8;">${fileName}</small>`;
        }
        
        notification.innerHTML = `
            <i data-lucide="info" width="16" height="16"></i>
            <span>${displayMessage}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 8000);
        
        this.initializeIcons();
    }
    
    createSelectedPatchContainer() {
        const container = document.createElement('div');
        container.id = 'selectedPatch';
        container.className = 'selected-patch';
        container.style.cssText = 'display: none; position: relative;';
        
        container.innerHTML = `
            <button class="close-btn" id="closePatchDescription" style="position: absolute; top: 0.75rem; right: 0.75rem; z-index: 10;">
                <i data-lucide="x" width="20" height="20"></i>
            </button>
            <div id="selectedPatchBanner" class="detail-banner"></div>
            <div class="patch-info" style="max-height: 400px; overflow-y: auto; padding: 0.5rem 1.25rem 1rem 1rem; position: relative;">
                <p id="selectedPatchDescription" style="padding-right: 0.75rem; margin: 0;"></p>
            </div>
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 80px; background: linear-gradient(to bottom, transparent, var(--bg-secondary)); pointer-events: none;"></div>
        `;
        
        // Re-attach close button event listener
        const closeBtn = container.querySelector('#closePatchDescription');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.deselectPatch());
        }
        
        return container;
    }
    
    showLoadedPatchInfo(patchInfo) {
        const infoContainer = document.getElementById('rom-patcher-loaded-patch-info');
        const nameElement = document.getElementById('rom-patcher-loaded-patch-name');
        
        if (infoContainer && nameElement && patchInfo.file) {
            const fileName = patchInfo.file.split('/').pop();
            nameElement.textContent = fileName;
            infoContainer.style.display = 'block';
        }
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
