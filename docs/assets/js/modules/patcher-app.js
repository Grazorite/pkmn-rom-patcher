// ROM Patcher App - Dedicated patching interface
import { Utils } from './utils.js';
import { imagePopup } from './image-popup.js';
import { renderBadge, initBadgeRenderer } from '../utils/badge-renderer.js';

class ROMPatcherApp {
    constructor() {
        this.patches = [];
        this.fuse = null;
        this.selectedPatch = null;

        this.romPatcherInitialized = false;
        this.romPatcherReady = false;
        this.retryAttempted = false;
        this.isGitHubPages = window.location.hostname.includes('github.io');
        this.basePath = this.isGitHubPages ? '/pkmn-rom-patcher' : '';
        
        this.init();
    }
    
    async init() {
        await initBadgeRenderer();
        this.initializeIcons();
        await this.loadPatches();
        this.setupEventListeners();
        this.setupSearch();
        this.handleURLParameters();
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
            // Sort alphabetically by title
            this.patches.sort((a, b) => a.title.localeCompare(b.title));
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
            const statusClass = `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
            
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
                                ${renderBadge('rom', patch.meta?.baseRom)}
                                ${renderBadge('system', patch.meta?.system)}
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
        // Fix path for both local and GitHub Pages
        let patchFile = this.selectedPatch.file;
        if (this.isGitHubPages) {
            // GitHub Pages: /pkmn-rom-patcher/docs/../patches/file.bps
            patchFile = this.basePath + '/docs/' + this.selectedPatch.file;
        } else {
            // Local: ../../patches/file.bps
            patchFile = patchFile.replace('../patches/', '../../patches/');
        }
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
        
        if (success) {
            // Only show notification if not coming from URL (to avoid double notification)
            const params = new URLSearchParams(window.location.search);
            if (!params.get('patch') && !params.get('name')) {
                this.showNotification(`Selected patch: ${this.selectedPatch.title}`, patchFile);
            }
        } else {
            console.error('Failed to load patch');
        }
    }
    
    deselectPatch() {
        this.selectedPatch = null;
        this.hideSelectedPatchWithAnimation();
        
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
        const container = document.getElementById('selectedPatch');
        const description = document.getElementById('selectedPatchDescription');
        
        if (!selectedElement || !container) return;
        
        // Show banner with bannerImage (same as library implementation)
        const banner = document.getElementById('selectedPatchBanner');
        if (banner) {
            if (this.selectedPatch.meta?.images?.banner) {
                banner.classList.add('has-banner');
                banner.style.setProperty('--banner-bg', `url('${this.selectedPatch.meta.images.banner}')`);
                banner.innerHTML = '';
                banner.style.cursor = 'pointer';
                banner.onclick = () => imagePopup.show(this.selectedPatch.meta.images.banner);
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
                        this.showNotification(`Loaded patch: ${patch.title}`, patchFile);
                    }, 800);
                } else {

                    // Create patch info from URL params for direct loading
                    const patchInfo = {
                        file: patchFile,
                        name: patchName || 'Selected Patch',
                        title: patchName || 'Selected Patch'
                    };
                    this.initializeRomPatcherWithPatch(patchInfo);
                    this.showNotification(`Loaded patch: ${patchInfo.name}`, patchFile);
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
