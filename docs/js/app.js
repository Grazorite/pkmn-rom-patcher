class ROMHackStore {
    constructor() {
        this.hacks = [];
        this.filteredHacks = [];
        this.fuse = null;
        this.currentPage = 0;
        this.itemsPerPage = 20;
        this.activeFilters = {
            baseRom: new Set(),
            system: new Set(),
            status: new Set(),
            difficulty: new Set(),
            tags: new Set()
        };
        this.selectedHack = null;
        
        this.init();
    }
    
    async init() {
        await this.loadHacks();
        this.setupFuse();
        this.setupEventListeners();
        this.setupTheme();
        this.generateFilters();
        this.renderHacks();
    }
    
    async loadHacks() {
        try {
            const response = await fetch('manifest.json');
            this.hacks = await response.json();
            this.filteredHacks = [...this.hacks];
        } catch (error) {
            console.error('Failed to load hacks:', error);
            document.getElementById('hackGrid').innerHTML = '<div class="loading">Failed to load ROM hacks</div>';
        }
    }
    
    setupFuse() {
        const options = {
            keys: ['title', 'meta.tags', 'meta.author', 'meta.baseRom'],
            threshold: 0.3,
            includeScore: true
        };
        this.fuse = new Fuse(this.hacks, options);
    }
    
    setupEventListeners() {
        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // Clear filters
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearAllFilters();
        });
        
        // Load more
        document.getElementById('loadMore').addEventListener('click', () => {
            this.loadMore();
        });
        
        // Detail panel
        document.getElementById('closeDetail').addEventListener('click', () => {
            this.closeDetailPanel();
        });
        
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // ROM file input for patching
        document.getElementById('romFileInput').addEventListener('change', () => {
            this.validateROM();
        });
        
        // Apply patch button
        document.getElementById('applyPatchBtn').addEventListener('click', () => {
            this.applyPatch();
        });
    }
    
    setupTheme() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').textContent = '☀️';
        }
    }
    
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('darkMode', isDark);
    }
    
    generateFilters() {
        const filters = {
            baseRom: new Map(),
            system: new Map(),
            status: new Map(),
            difficulty: new Map(),
            tags: new Map()
        };
        
        this.hacks.forEach(hack => {
            if (hack.meta) {
                // Count occurrences
                if (hack.meta.baseRom) filters.baseRom.set(hack.meta.baseRom, (filters.baseRom.get(hack.meta.baseRom) || 0) + 1);
                if (hack.meta.system) filters.system.set(hack.meta.system, (filters.system.get(hack.meta.system) || 0) + 1);
                if (hack.meta.status) filters.status.set(hack.meta.status, (filters.status.get(hack.meta.status) || 0) + 1);
                if (hack.meta.difficulty) filters.difficulty.set(hack.meta.difficulty, (filters.difficulty.get(hack.meta.difficulty) || 0) + 1);
                if (hack.meta.tags && Array.isArray(hack.meta.tags)) {
                    hack.meta.tags.forEach(tag => {
                        filters.tags.set(tag, (filters.tags.get(tag) || 0) + 1);
                    });
                }
            }
        });
        
        // Render filter options
        Object.keys(filters).forEach(filterType => {
            this.renderFilterOptions(filterType, filters[filterType]);
        });
    }
    
    renderFilterOptions(filterType, options) {
        const container = document.getElementById(`${filterType}Filters`);
        const sortedOptions = Array.from(options.entries()).sort((a, b) => b[1] - a[1]);
        
        container.innerHTML = sortedOptions.map(([value, count]) => `
            <div class="filter-option">
                <input type="checkbox" id="${filterType}-${value}" value="${value}" 
                       onchange="app.handleFilterChange('${filterType}', '${value}', this.checked)">
                <label for="${filterType}-${value}">${value}</label>
                <span class="filter-count">(${count})</span>
            </div>
        `).join('');
    }
    
    handleFilterChange(filterType, value, checked) {
        if (checked) {
            this.activeFilters[filterType].add(value);
        } else {
            this.activeFilters[filterType].delete(value);
        }
        this.applyFilters();
    }
    
    handleSearch(query) {
        if (query.trim() === '') {
            this.filteredHacks = [...this.hacks];
        } else {
            const results = this.fuse.search(query);
            this.filteredHacks = results.map(result => result.item);
        }
        this.applyFilters();
    }
    
    applyFilters() {
        let filtered = [...this.filteredHacks];
        
        // Apply active filters
        Object.keys(this.activeFilters).forEach(filterType => {
            if (this.activeFilters[filterType].size > 0) {
                filtered = filtered.filter(hack => {
                    if (!hack.meta) return false;
                    
                    if (filterType === 'tags') {
                        return hack.meta.tags && hack.meta.tags.some(tag => 
                            this.activeFilters[filterType].has(tag)
                        );
                    } else {
                        return this.activeFilters[filterType].has(hack.meta[filterType]);
                    }
                });
            }
        });
        
        this.filteredHacks = filtered;
        this.currentPage = 0;
        this.renderHacks();
    }
    
    clearAllFilters() {
        // Clear all checkboxes
        document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Clear active filters
        Object.keys(this.activeFilters).forEach(key => {
            this.activeFilters[key].clear();
        });
        
        // Clear search
        document.getElementById('searchInput').value = '';
        
        // Reset to all hacks
        this.filteredHacks = [...this.hacks];
        this.currentPage = 0;
        this.renderHacks();
    }
    
    renderHacks() {
        const grid = document.getElementById('hackGrid');
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const hacksToShow = this.filteredHacks.slice(0, endIndex);
        
        if (hacksToShow.length === 0) {
            grid.innerHTML = '<div class="loading">No ROM hacks found matching your criteria</div>';
            document.getElementById('loadMore').style.display = 'none';
            document.getElementById('resultsCount').textContent = '0 hacks found';
            return;
        }
        
        grid.innerHTML = hacksToShow.map(hack => this.createHackCard(hack)).join('');
        
        // Update results count
        document.getElementById('resultsCount').textContent = `${this.filteredHacks.length} hack${this.filteredHacks.length !== 1 ? 's' : ''} found`;
        
        // Show/hide load more button
        const loadMoreBtn = document.getElementById('loadMore');
        if (endIndex < this.filteredHacks.length) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
    
    createHackCard(hack) {
        const imageUrl = hack.meta?.images?.boxArt;
        const imageHtml = imageUrl ? 
            `<img src="${imageUrl}" alt="${hack.title}" onerror="this.style.display='none'">` : 
            hack.title;
            
        const statusClass = hack.meta?.status ? `status-${hack.meta.status.toLowerCase()}` : 'status-completed';
        
        return `
            <div class="hack-card" onclick="app.openDetailPanel('${hack.id}')">
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
    
    loadMore() {
        this.currentPage++;
        this.renderHacks();
    }
    
    openDetailPanel(hackId) {
        this.selectedHack = this.hacks.find(hack => hack.id === hackId);
        if (!this.selectedHack) return;
        
        this.renderDetailPanel();
        document.getElementById('detailPanel').classList.add('open');
    }
    
    closeDetailPanel() {
        document.getElementById('detailPanel').classList.remove('open');
        this.selectedHack = null;
    }
    
    renderDetailPanel() {
        const hack = this.selectedHack;
        
        // Header
        document.getElementById('detailTitle').textContent = hack.title;
        document.getElementById('detailAuthor').textContent = `by ${hack.meta?.author || 'Unknown'}`;
        document.getElementById('detailStatus').textContent = hack.meta?.status || 'Completed';
        document.getElementById('detailPlaytime').textContent = hack.meta?.playtime || '';
        
        // Banner
        const banner = document.getElementById('detailBanner');
        if (hack.meta?.images?.banner) {
            banner.innerHTML = `<img src="${hack.meta.images.banner}" alt="${hack.title}">`;
        } else {
            banner.innerHTML = hack.title;
        }
        
        // Info tab
        document.getElementById('detailDescription').innerHTML = hack.changelog ? 
            marked.parse(hack.changelog) : '<p>No description available.</p>';
        
        // Metadata table
        this.renderMetadataTable(hack.meta);
        
        // Links tab
        this.renderLinksTab(hack.meta?.links);
    }
    
    renderMetadataTable(meta) {
        if (!meta) return;
        
        const table = document.getElementById('metadataTable');
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
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }
    
    // CRC32 calculation (same as before)
    crc32(data) {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c;
        }
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) {
            crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }
        return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
    }
    
    validateROM() {
        const romFile = document.getElementById('romFileInput').files[0];
        const validation = document.getElementById('romValidationDetail');
        const patchBtn = document.getElementById('applyPatchBtn');
        
        if (!romFile || !this.selectedHack?.crc32) {
            validation.innerHTML = '';
            patchBtn.disabled = !romFile;
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const romData = new Uint8Array(e.target.result);
            const calculatedCrc = this.crc32(romData);
            
            if (calculatedCrc === this.selectedHack.crc32) {
                validation.innerHTML = '<div class="validation-success">✓ ROM validated</div>';
                patchBtn.disabled = false;
            } else {
                validation.innerHTML = `<div class="validation-error">⚠ ROM CRC32 mismatch. Expected: ${this.selectedHack.crc32}, Got: ${calculatedCrc}</div>`;
                patchBtn.disabled = false; // Allow patching anyway
            }
        };
        reader.readAsArrayBuffer(romFile);
    }
    
    async applyPatch() {
        const romFile = document.getElementById('romFileInput').files[0];
        const status = document.getElementById('patchStatus');
        
        if (!romFile || !this.selectedHack) return;
        
        status.textContent = 'Patching...';
        
        try {
            const patchResponse = await fetch(this.selectedHack.file);
            const patchData = await patchResponse.arrayBuffer();
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const romBinFile = new BinFile(new Uint8Array(e.target.result));
                    romBinFile.fileName = romFile.name;
                    
                    const patchBinFile = new BinFile(new Uint8Array(patchData));
                    const patch = RomPatcher.parsePatchFile(patchBinFile);
                    
                    if (!patch) {
                        throw new Error('Invalid patch file format');
                    }
                    
                    const patchedRom = RomPatcher.applyPatch(romBinFile, patch);
                    
                    const blob = new Blob([patchedRom.getBytes()], {type: 'application/octet-stream'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = patchedRom.fileName;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    status.textContent = '✅ Patch applied successfully!';
                } catch (err) {
                    status.textContent = `❌ Error: ${err.message}`;
                    console.error('Patching error:', err);
                }
            };
            reader.readAsArrayBuffer(romFile);
        } catch (err) {
            status.textContent = `❌ Error loading patch: ${err.message}`;
        }
    }
}

// Initialize the app
const app = new ROMHackStore();