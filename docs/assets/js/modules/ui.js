// UI rendering and management
import { PerformanceManager } from './performance.js';
import { imageCache } from './image-cache.js';
import { imagePopup } from './image-popup.js';
import { renderBadge, initBadgeRenderer } from '../utils/badge-renderer.js';

export class UIManager {
    constructor() {
        this.currentPage = 0;
        this.itemsPerPage = 20;
        this.performanceManager = new PerformanceManager();
        initBadgeRenderer();
    }

    renderFilterOptions(filterType, options) {
        const container = document.getElementById(`${filterType}Filters`);
        if (!container) return;
        
        const sortedOptions = Array.from(options.entries()).sort((a, b) => b[1] - a[1]);
        
        container.innerHTML = sortedOptions.map(([value, count]) => `
            <div class="filter-option">
                <input type="checkbox" class="custom-checkbox" id="${filterType}-${value}" value="${value}">
                <label for="${filterType}-${value}">${value}</label>
                <span class="filter-count">(${count})</span>
            </div>
        `).join('');
    }

    createGridCard(hack) {
        const imageUrl = hack.meta?.images?.boxArt || hack.meta?.images?.banner;
        const cachedImage = imageUrl ? imageCache.getCachedImage(imageUrl) : null;
        const imageHtml = imageUrl ? 
            `<div class="image-container">
                <img ${cachedImage ? `src="${imageUrl}"` : `data-src="${imageUrl}"`} alt="${hack.title}" class="${cachedImage ? 'loaded' : 'lazy-load'}" loading="lazy" onerror="this.parentElement.classList.add('has-broken-image')">
                <div class="image-fallback"><i data-lucide="image-off" width="32" height="32"></i></div>
            </div>` :
            `<div class="image-fallback"><i data-lucide="image-off" width="32" height="32"></i></div>`;
        
        return `
            <div class="hack-card" data-hack-id="${hack.id}" title="${hack.title}">
                <div class="hack-card-image">
                    ${imageHtml}
                </div>
                <div class="hack-card-content" style="display: none;">
                    <!-- Hidden in grid view -->
                </div>
            </div>
        `;
    }
    
    createHackCard(hack) {
        // Use boxArt for cards, fallback to banner, then placeholder
        const imageUrl = hack.meta?.images?.boxArt || hack.meta?.images?.banner;
        const cachedImage = imageUrl ? imageCache.getCachedImage(imageUrl) : null;
        const imageHtml = imageUrl ? 
            `<div class="image-container">
                <div class="image-placeholder"><i data-lucide="image" width="24" height="24"></i></div>
                <img ${cachedImage ? `src="${imageUrl}"` : `data-src="${imageUrl}"`} alt="${hack.title}" class="${cachedImage ? 'loaded' : 'lazy-load'}" loading="lazy" onerror="this.parentElement.classList.add('has-broken-image')">
                <div class="image-fallback"><i data-lucide="image-off" width="24" height="24"></i></div>
            </div>` : 
            `<div class="image-fallback"><i data-lucide="image-off" width="24" height="24"></i></div>`;
            
        const statusClass = hack.meta?.status ? `status-${hack.meta.status.toLowerCase().replace(' ', '-')}` : 'status-completed';
        
        return `
            <div class="hack-card" data-hack-id="${hack.id}">
                <div class="hack-card-image">
                    ${imageHtml}
                </div>
                <div class="hack-card-content">
                    <div class="hack-card-title">${hack.title}</div>
                    <div class="hack-card-author">by ${hack.meta?.author || 'Unknown'}</div>
                    <div class="hack-card-badges">
                        ${renderBadge('rom', hack.meta?.baseRom)}
                        ${renderBadge('system', hack.meta?.system)}
                        ${renderBadge('difficulty', hack.meta?.difficulty)}
                    </div>
                    <div class="status-indicator">
                        <div class="status-dot ${statusClass}"></div>
                        <span>${hack.meta?.status || 'Completed'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async renderHacks(hacks, viewMode = 'card', append = false) {
        const grid = document.getElementById('hackGrid');
        if (!grid) return;
        
        grid.classList.toggle('grid-view', viewMode === 'grid');

        const startIndex = append ? this.currentPage * this.itemsPerPage : 0;
        const endIndex = startIndex + this.itemsPerPage;
        const hacksToShow = hacks.slice(startIndex, endIndex);
        
        if (hacksToShow.length === 0 && !append) {
            grid.innerHTML = '<div class="no-results"><i data-lucide="search-x" width="48" height="48"></i><p>No ROM hacks found matching your criteria</p></div>';
            this.updateLoadMoreButton(false);
            this.updateResultsCount(0);
            this.initializeIcons();
            return;
        }

        // Batch DOM updates for better performance
        await this.performanceManager.batchDOMUpdates([
            () => {
                const cardsHtml = hacksToShow.map(hack => 
                    viewMode === 'grid' ? this.createGridCard(hack) : this.createHackCard(hack)
                ).join('');
                
                if (append) {
                    grid.insertAdjacentHTML('beforeend', cardsHtml);
                } else {
                    grid.innerHTML = cardsHtml;
                }
            }
        ]);

        // Setup lazy loading for new images and preload
        const imageUrls = hacksToShow
            .map(hack => hack.meta?.images?.boxArt || hack.meta?.images?.banner)
            .filter(Boolean);
        
        if (imageUrls.length > 0) {
            imageCache.preloadImages(imageUrls);
        }
        
        grid.querySelectorAll('.lazy-load').forEach(img => {
            this.performanceManager.observeImage(img);
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
        });

        this.updateResultsCount(hacks.length);
        this.updateLoadMoreButton(endIndex < hacks.length);
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

    updateResultsCount(count) {
        const element = document.getElementById('resultsCount');
        if (element) {
            element.textContent = count === 0 ? 'No hacks found' : `${count} hack${count !== 1 ? 's' : ''} found`;
        }
    }
    
    showLoading() {
        const grid = document.getElementById('hackGrid');
        if (grid) {
            grid.innerHTML = '<div class="loading"><i data-lucide="loader" width="32" height="32" class="loading-spinner"></i><p>Loading ROM hacks...</p></div>';
            this.initializeIcons();
        }
    }

    updateLoadMoreButton(show) {
        const button = document.getElementById('loadMore');
        if (button) {
            button.style.display = show ? 'block' : 'none';
        }
    }

    renderDetailPanel(hack) {
        // Header
        const titleEl = document.getElementById('detailTitle');
        const authorEl = document.getElementById('detailAuthor');
        const badgesEl = document.getElementById('detailBadges');
        const statusEl = document.getElementById('detailStatus');
        const playtimeEl = document.getElementById('detailPlaytime');
        const releasedEl = document.getElementById('detailReleased');
        
        if (titleEl) titleEl.textContent = hack.title;
        if (authorEl) authorEl.innerHTML = `<span class="tooltip" data-tooltip="Author"><i data-lucide="user" width="16" height="16"></i> ${hack.meta?.author || 'Unknown'}</span>`;
        
        // Add badges to header
        if (badgesEl) {
            const badges = [
                renderBadge('rom', hack.meta?.baseRom),
                renderBadge('system', hack.meta?.system),
                renderBadge('difficulty', hack.meta?.difficulty)
            ].filter(Boolean);
            badgesEl.innerHTML = badges.join('');
        }
        
        // Animated status dot
        if (statusEl) {
            const status = hack.meta?.status || 'Completed';
            const statusClass = `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
            statusEl.innerHTML = `<div class="status-dot ${statusClass}"></div> ${status}`;
        }
        if (playtimeEl) playtimeEl.innerHTML = hack.meta?.playtime ? `<span class="tooltip" data-tooltip="Playtime"><i data-lucide="clock" width="16" height="16"></i> ${hack.meta.playtime}</span>` : '';
        if (releasedEl) releasedEl.innerHTML = hack.meta?.released ? `<span class="tooltip" data-tooltip="Release Date"><i data-lucide="calendar" width="16" height="16"></i> ${hack.meta.released}</span>` : '';

        // Show banner with bannerImage
        const banner = document.getElementById('detailBanner');
        if (banner) {
            if (hack.meta?.images?.banner) {
                banner.classList.add('has-banner');
                banner.style.setProperty('--banner-bg', `url('${hack.meta.images.banner}')`);
                banner.innerHTML = '';
                banner.style.cursor = 'pointer';
                banner.onclick = () => imagePopup.show(hack.meta.images.banner);
            } else {
                banner.classList.remove('has-banner');
                banner.style.removeProperty('--banner-bg');
                banner.innerHTML = hack.title;
                banner.style.cursor = 'default';
                banner.onclick = null;
            }
            banner.style.display = 'flex';
        }

        // Description
        const descEl = document.getElementById('detailDescription');
        if (descEl) {
            if (hack.changelog) {
                // Remove title from markdown if it appears at the beginning
                let cleanedChangelog = hack.changelog;
                const titlePattern = new RegExp(`^#\s*${hack.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\s*\n`, 'i');
                cleanedChangelog = cleanedChangelog.replace(titlePattern, '');
                
                if (typeof marked !== 'undefined') {
                    descEl.innerHTML = '<div class="loading-text">Loading description...</div>';
                    requestAnimationFrame(() => {
                        descEl.innerHTML = marked.parse(cleanedChangelog);
                    });
                } else {
                    descEl.innerHTML = cleanedChangelog;
                }
            } else {
                descEl.innerHTML = '<p>No description available.</p>';
            }
        }

        // Metadata table
        this.renderMetadataTable(hack.meta);

        // Links
        this.renderLinksTab(hack.meta?.links);
        
        // Populate collapsed panel
        this.populateCollapsedPanel(hack);
        
        // Setup tab listeners
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.switchTab(btn.dataset.tab);
            };
        });
        
        // Initialize icons only within detail panel
        const panel = document.getElementById('detailPanel');
        if (panel && typeof lucide !== 'undefined') {
            try {
                lucide.createIcons({ attrs: { 'data-lucide': true } }, panel);
            } catch (e) {
                console.warn('Icon initialization failed:', e);
            }
        }
    }
    
    populateCollapsedPanel(hack) {
        const collapsedImage = document.getElementById('collapsedImage');
        const collapsedTitle = document.getElementById('collapsedTitle');
        const collapsedAuthor = document.getElementById('collapsedAuthor');
        const collapsedRating = document.getElementById('collapsedRating');
        
        if (collapsedImage && hack.meta?.images?.boxArt) {
            collapsedImage.src = hack.meta.images.boxArt;
        }
        
        if (collapsedTitle) {
            collapsedTitle.textContent = hack.title;
        }
        
        if (collapsedAuthor) {
            collapsedAuthor.textContent = hack.meta?.author || 'Unknown';
        }
        
        if (collapsedRating && hack.meta?.rating) {
            collapsedRating.innerHTML = this.renderStarRating(hack.meta.rating);
        }
    }

    renderMetadataTable(meta) {
        const table = document.getElementById('metadataTable');
        if (!table || !meta) return;
        
        const formatValue = (value, type = 'string') => {
            if (!value) return 'N/A';
            switch(type) {
                case 'array':
                    return Array.isArray(value) ? value.join(', ') : value;
                case 'boolean':
                    return value === true || value === 'Yes' ? 'Yes' : 'No';
                default:
                    return value;
            }
        };
        
        const fields = [
            ['<i data-lucide="layers" width="14" height="14"></i>Type', formatValue(meta.hackType)],
            ['<i data-lucide="image" width="14" height="14"></i>Graphics', formatValue(meta.graphics)],
            ['<i data-lucide="book" width="14" height="14"></i>Story', formatValue(meta.story)],
            ['<i data-lucide="map" width="14" height="14"></i>Maps', formatValue(meta.maps)],
            ['<i data-lucide="flag" width="14" height="14"></i>Postgame', formatValue(meta.postgame)],
            ['<i data-lucide="settings" width="14" height="14"></i>Mechanics', formatValue(meta.mechanics, 'array')],
            ['<i data-lucide="sparkles" width="14" height="14"></i>Fakemons', formatValue(meta.fakemons)],
            ['<i data-lucide="git-branch" width="14" height="14"></i>Variants', formatValue(meta.variants, 'array')],
            ['<i data-lucide="zap" width="14" height="14"></i>Type Changes', formatValue(meta.typeChanges, 'array')],
            ['<i data-lucide="divide" width="14" height="14"></i>Phys/Spec Split', formatValue(meta.physicalSpecialSplit, 'boolean')],
            ['<i data-lucide="shield" width="14" height="14"></i>Anti-Cheat', formatValue(meta.antiCheat, 'boolean')],
            ['<i data-lucide="hash" width="14" height="14"></i>Total Catchable', formatValue(meta.totalCatchable)],
            ['<i data-lucide="book-open" width="14" height="14"></i>Pokédex Gen', formatValue(meta.pokedexIncludes)],
            ['<i data-lucide="globe" width="14" height="14"></i>Open World', formatValue(meta.openWorld, 'boolean')],
            ['<i data-lucide="shuffle" width="14" height="14"></i>Randomizer', formatValue(meta.randomizer)],
            ['<i data-lucide="skull" width="14" height="14"></i>Nuzlocke', formatValue(meta.nuzlocke)],
            ['<i data-lucide="tag" width="14" height="14"></i>Tags', formatValue(meta.tags, 'array')],
            ['<i data-lucide="award" width="14" height="14"></i>Rating', meta.rating ? this.renderStarRating(meta.rating) : 'N/A']
        ].filter(([_, value]) => value && value !== 'N/A');
        
        table.innerHTML = fields.map(([label, value]) => `
            <div class="metadata-row">
                <span class="metadata-label">${label}</span>
                <span class="metadata-value">${value}</span>
            </div>
        `).join('');
    }
    
    renderStarRating(rating) {
        const stars = [];
        for (let i = 1; i <= 6; i++) {
            if (i <= rating) {
                stars.push('<i data-lucide="star" class="star-filled" width="16" height="16"></i>');
            } else {
                stars.push('<i data-lucide="star" class="star-empty" width="16" height="16"></i>');
            }
        }
        return stars.join('');
    }

    renderLinksTab(links) {
        const container = document.getElementById('detailLinks');
        if (!container) return;
        
        if (!links) {
            container.innerHTML = '<p>No links available.</p>';
            return;
        }
        
        const linkIcons = {
            website: 'globe',
            discord: 'message-circle',
            documentation: 'file-text'
        };
        
        // Order links: website, discord, documentation
        const orderedLinks = ['website', 'discord', 'documentation']
            .filter(type => links[type])
            .map(type => [type, links[type]]);
        
        const linkButtons = orderedLinks.map(([type, url]) => `
            <a href="${url}" target="_blank" class="link-btn">
                <i data-lucide="${linkIcons[type] || 'external-link'}" width="16" height="16"></i>
                ${type.charAt(0).toUpperCase() + type.slice(1)}
            </a>
        `).join('');
        
        container.innerHTML = linkButtons;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const activePanel = document.getElementById(`${tabName}Tab`);
        if (activePanel) activePanel.classList.add('active');
    }

    openDetailPanel() {
        const panel = document.getElementById('detailPanel');
        const overlay = document.getElementById('detailOverlay');
        if (panel) {
            panel.classList.add('open');
            panel.classList.remove('collapsed');
        }
        if (overlay) {
            overlay.classList.add('active');
        }
        // Default to info tab
        this.switchTab('info');
    }

    closeDetailPanel() {
        const panel = document.getElementById('detailPanel');
        const overlay = document.getElementById('detailOverlay');
        if (panel) {
            panel.classList.remove('open', 'collapsed');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    collapseDetailPanel() {
        const panel = document.getElementById('detailPanel');
        const overlay = document.getElementById('detailOverlay');
        if (panel) {
            panel.classList.add('collapsed');
            panel.classList.remove('open');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    expandDetailPanel() {
        const panel = document.getElementById('detailPanel');
        if (panel) {
            panel.classList.add('open');
            panel.classList.remove('collapsed');
        }
    }

    clearAllFilterCheckboxes() {
        document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }

    clearSearchInput() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
    }

    resetPagination() {
        this.currentPage = 0;
    }

    nextPage() {
        this.currentPage++;
    }
    

}