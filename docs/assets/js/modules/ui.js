// UI rendering and management
import { PerformanceManager } from './performance.js';
import { imageCache } from './image-cache.js';
import { imagePopup } from './image-popup.js';

export class UIManager {
    constructor() {
        this.currentPage = 0;
        this.itemsPerPage = 20;
        this.performanceManager = new PerformanceManager();
        this.renderQueue = [];
        this.isRendering = false;
    }

    renderFilterOptions(filterType, options) {
        const container = document.getElementById(`${filterType}Filters`);
        if (!container) return;
        
        const sortedOptions = Array.from(options.entries()).sort((a, b) => b[1] - a[1]);
        
        container.innerHTML = sortedOptions.map(([value, count]) => `
            <div class="filter-option">
                <input type="checkbox" id="${filterType}-${value}" value="${value}">
                <label for="${filterType}-${value}">${value}</label>
                <span class="filter-count">(${count})</span>
            </div>
        `).join('');
    }

    createHackCard(hack) {
        // Use boxArt for cards, fallback to banner, then placeholder
        const imageUrl = hack.meta?.images?.boxArt || hack.meta?.images?.banner;
        const cachedImage = imageUrl ? imageCache.getCachedImage(imageUrl) : null;
        const imageHtml = imageUrl ? 
            `<div class="image-container">
                <div class="image-placeholder"><i data-lucide="image" width="24" height="24"></i></div>
                <img ${cachedImage ? `src="${imageUrl}"` : `data-src="${imageUrl}"`} alt="${hack.title}" class="${cachedImage ? 'loaded' : 'lazy-load'}" loading="lazy">
            </div>` : 
            `<div class="hack-card-placeholder"><i data-lucide="image" width="24" height="24"></i><span>${hack.title}</span></div>`;
            
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
                        ${hack.meta?.baseRom ? `<span class="badge badge-rom" data-rom="${hack.meta.baseRom}">${hack.meta.baseRom}</span>` : ''}
                        ${hack.meta?.system ? `<span class="badge badge-system" data-system="${hack.meta.system}">${hack.meta.system}</span>` : ''}
                        ${hack.meta?.difficulty ? `<span class="badge badge-difficulty" data-difficulty="${hack.meta.difficulty}">${hack.meta.difficulty}</span>` : ''}
                    </div>
                    <div class="status-indicator">
                        <div class="status-dot ${statusClass}"></div>
                        <span>${hack.meta?.status || 'Completed'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async renderHacks(hacks, append = false) {
        const grid = document.getElementById('hackGrid');
        if (!grid) return;

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
                const cardsHtml = hacksToShow.map(hack => this.createHackCard(hack)).join('');
                
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
            requestAnimationFrame(() => window.initIcons());
        } else if (typeof lucide !== 'undefined') {
            requestAnimationFrame(() => {
                try {
                    lucide.createIcons();
                } catch (e) {
                    console.warn('Icon initialization failed:', e);
                }
            });
        }
    }

    updateResultsCount(count) {
        const element = document.getElementById('resultsCount');
        if (element) {
            if (count === 0) {
                element.textContent = 'No hacks found';
            } else {
                element.textContent = `${count} hack${count !== 1 ? 's' : ''} found`;
            }
        }
    }
    
    showLoading() {
        const grid = document.getElementById('hackGrid');
        if (grid) {
            grid.innerHTML = '<div class="loading"><i data-lucide="loader" width="32" height="32" class="loading-spinner"></i><p>Loading ROM hacks...</p></div>';
            // Re-initialize icons
            setTimeout(() => this.initializeIcons(), 100);
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
            const badges = [];
            if (hack.meta?.baseRom) badges.push(`<span class="badge badge-rom" data-rom="${hack.meta.baseRom}">${hack.meta.baseRom}</span>`);
            if (hack.meta?.system) badges.push(`<span class="badge badge-system" data-system="${hack.meta.system}">${hack.meta.system}</span>`);
            if (hack.meta?.difficulty) badges.push(`<span class="badge badge-difficulty" data-difficulty="${hack.meta.difficulty}">${hack.meta.difficulty}</span>`);
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
                
                descEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(cleanedChangelog) : cleanedChangelog;
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
        setTimeout(() => {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.switchTab(btn.dataset.tab);
                };
            });
        }, 50);
        
        // Re-initialize icons
        setTimeout(() => this.initializeIcons(), 100);
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
        
        const fieldIcons = {
            'Base ROM': 'disc',
            'System': 'cpu',
            'Difficulty': 'trending-up',
            'Graphics': 'image',
            'Story': 'book-open',
            'Maps': 'map',
            'Postgame': 'plus-circle',
            'Mechanics': 'settings',
            'Fakemons': 'star',
            'Tags': 'tag',
            'Released': 'calendar',
            'Rating': 'award'
        };
        
        const fields = [
            ['Graphics', meta.graphics],
            ['Story', meta.story],
            ['Maps', meta.maps],
            ['Postgame', meta.postgame],
            ['Mechanics', Array.isArray(meta.mechanics) ? meta.mechanics.join(', ') : meta.mechanics],
            ['Fakemons', meta.fakemons],
            ['Tags', Array.isArray(meta.tags) ? meta.tags.join(', ') : meta.tags],
            ['Rating', meta.rating ? this.renderStarRating(meta.rating) : null]
        ].filter(([_, value]) => value);
        
        table.innerHTML = fields.map(([label, value]) => `
            <tr>
                <td>
                    <i data-lucide="${fieldIcons[label] || 'info'}" width="14" height="14"></i>
                    ${label}
                </td>
                <td${label === 'Base ROM' ? ' style="white-space: nowrap;"' : ''}>${value}</td>
            </tr>
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