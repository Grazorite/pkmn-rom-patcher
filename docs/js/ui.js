// UI rendering and management
export class UIManager {
    constructor() {
        this.currentPage = 0;
        this.itemsPerPage = 20;
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
        // Use banner image for cards, fallback to boxArt, then title
        const imageUrl = hack.meta?.images?.banner || hack.meta?.images?.boxArt;
        const imageHtml = imageUrl ? 
            `<img src="${imageUrl}" alt="${hack.title}" onerror="this.style.display='none'">` : 
            hack.title;
            
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
                        ${hack.meta?.system ? `<span class="badge badge-system">${hack.meta.system}</span>` : ''}
                        ${hack.meta?.difficulty ? `<span class="badge badge-difficulty">${hack.meta.difficulty}</span>` : ''}
                    </div>
                    <div class="status-indicator">
                        <div class="status-dot ${statusClass}"></div>
                        <span>${hack.meta?.status || 'Completed'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderHacks(hacks, append = false) {
        const grid = document.getElementById('hackGrid');
        if (!grid) return;

        const startIndex = append ? this.currentPage * this.itemsPerPage : 0;
        const endIndex = startIndex + this.itemsPerPage;
        const hacksToShow = hacks.slice(startIndex, endIndex);
        
        if (hacksToShow.length === 0 && !append) {
            grid.innerHTML = '<div class="loading">No ROM hacks found matching your criteria</div>';
            this.updateLoadMoreButton(false);
            this.updateResultsCount(0);
            return;
        }

        const cardsHtml = hacksToShow.map(hack => this.createHackCard(hack)).join('');
        
        if (append) {
            grid.insertAdjacentHTML('beforeend', cardsHtml);
        } else {
            grid.innerHTML = cardsHtml;
        }

        this.updateResultsCount(hacks.length);
        this.updateLoadMoreButton(endIndex < hacks.length);
    }

    updateResultsCount(count) {
        const element = document.getElementById('resultsCount');
        if (element) {
            element.textContent = `${count} hack${count !== 1 ? 's' : ''} found`;
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
        const statusEl = document.getElementById('detailStatus');
        const playtimeEl = document.getElementById('detailPlaytime');
        
        if (titleEl) titleEl.textContent = hack.title;
        if (authorEl) authorEl.innerHTML = `<i data-lucide="user" width="16" height="16"></i> ${hack.meta?.author || 'Unknown'}`;
        if (statusEl) {
            const statusIcon = hack.meta?.status === 'Completed' ? 'check-circle' : 'clock';
            statusEl.innerHTML = `<i data-lucide="${statusIcon}" width="16" height="16"></i> ${hack.meta?.status || 'Completed'}`;
        }
        if (playtimeEl) playtimeEl.innerHTML = hack.meta?.playtime ? `<i data-lucide="clock" width="16" height="16"></i> ${hack.meta.playtime}` : '';

        // Banner with boxArt background
        const banner = document.getElementById('detailBanner');
        if (banner) {
            if (hack.meta?.images?.banner) {
                const boxArtStyle = hack.meta?.images?.boxArt ? 
                    `background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${hack.meta.images.boxArt}'); background-size: cover; background-position: center;` : '';
                banner.innerHTML = `<img src="${hack.meta.images.banner}" alt="${hack.title}" style="${boxArtStyle}">`;
            } else {
                banner.innerHTML = hack.title;
            }
        }

        // Description
        const descEl = document.getElementById('detailDescription');
        if (descEl) {
            descEl.innerHTML = hack.changelog ? 
                marked.parse(hack.changelog) : '<p>No description available.</p>';
        }

        // Metadata table
        this.renderMetadataTable(hack.meta);

        // Links
        this.renderLinksTab(hack.meta?.links);
        
        // Populate collapsed panel
        this.populateCollapsedPanel(hack);
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 50);
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
            ['Base ROM', meta.baseRom],
            ['System', meta.system],
            ['Difficulty', meta.difficulty],
            ['Graphics', meta.graphics],
            ['Story', meta.story],
            ['Maps', meta.maps],
            ['Postgame', meta.postgame],
            ['Mechanics', Array.isArray(meta.mechanics) ? meta.mechanics.join(', ') : meta.mechanics],
            ['Fakemons', meta.fakemons],
            ['Tags', Array.isArray(meta.tags) ? meta.tags.join(', ') : meta.tags],
            ['Released', meta.released],
            ['Rating', meta.rating ? this.renderStarRating(meta.rating) : null]
        ].filter(([_, value]) => value);
        
        table.innerHTML = fields.map(([label, value]) => `
            <tr>
                <td>
                    <i data-lucide="${fieldIcons[label] || 'info'}" width="14" height="14"></i>
                    ${label}
                </td>
                <td>${value}</td>
            </tr>
        `).join('');
    }
    
    renderStarRating(rating) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
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
        if (panel) {
            panel.classList.add('open');
            panel.classList.remove('collapsed');
        }
    }

    closeDetailPanel() {
        const panel = document.getElementById('detailPanel');
        if (panel) {
            panel.classList.remove('open', 'collapsed');
        }
    }
    
    collapseDetailPanel() {
        const panel = document.getElementById('detailPanel');
        if (panel) {
            panel.classList.add('collapsed');
            panel.classList.remove('open');
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