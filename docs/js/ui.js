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
        const imageUrl = hack.meta?.images?.boxArt;
        const imageHtml = imageUrl ? 
            `<img src="${imageUrl}" alt="${hack.title}" onerror="this.style.display='none'">` : 
            hack.title;
            
        const statusClass = hack.meta?.status ? `status-${hack.meta.status.toLowerCase()}` : 'status-completed';
        
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

        // Banner
        const banner = document.getElementById('detailBanner');
        if (banner) {
            if (hack.meta?.images?.banner) {
                banner.innerHTML = `<img src="${hack.meta.images.banner}" alt="${hack.title}">`;
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
    }

    renderMetadataTable(meta) {
        const table = document.getElementById('metadataTable');
        if (!table || !meta) return;
        
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
            ['Rating', meta.rating ? `${meta.rating}/5` : null]
        ].filter(([_, value]) => value);
        
        table.innerHTML = fields.map(([label, value]) => `
            <tr>
                <td>${label}</td>
                <td>${value}</td>
            </tr>
        `).join('');
    }

    renderLinksTab(links) {
        const container = document.getElementById('detailLinks');
        if (!container) return;
        
        if (!links) {
            container.innerHTML = '<p>No links available.</p>';
            return;
        }
        
        const linkButtons = Object.entries(links).map(([type, url]) => `
            <a href="${url}" target="_blank" class="link-btn">
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
        if (panel) panel.classList.add('open');
    }

    closeDetailPanel() {
        const panel = document.getElementById('detailPanel');
        if (panel) panel.classList.remove('open');
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