// Mobile Filter Sheet Component
class MobileFilterSheet {
    constructor() {
        this.sheet = null;
        this.backdrop = null;
        this.isOpen = false;
        this.init();
    }
    
    init() {
        this.createSheet();
        this.bindEvents();
    }
    
    createSheet() {
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'mobile-filter-backdrop';
        
        // Create sheet
        this.sheet = document.createElement('div');
        this.sheet.className = 'mobile-filter-sheet';
        this.sheet.innerHTML = `
            <div class="mobile-filter-header">
                <h3>Filters</h3>
                <button class="mobile-filter-close">
                    <i data-lucide="x" width="20" height="20"></i>
                </button>
            </div>
            <div class="mobile-filter-content"></div>
        `;
        
        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.sheet);
        
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    bindEvents() {
        const closeBtn = this.sheet.querySelector('.mobile-filter-close');
        closeBtn.addEventListener('click', () => this.close());
        this.backdrop.addEventListener('click', () => this.close());
    }
    
    open() {
        if (this.isOpen) return;
        
        // Copy sidebar content to mobile sheet
        const sidebar = document.querySelector('.sidebar');
        const content = this.sheet.querySelector('.mobile-filter-content');
        if (sidebar && content) {
            content.innerHTML = sidebar.innerHTML;
            // Re-initialize icons in copied content
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        
        this.backdrop.classList.add('open');
        this.sheet.classList.add('open');
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.backdrop.classList.remove('open');
        this.sheet.classList.remove('open');
        document.body.style.overflow = '';
        this.isOpen = false;
    }
    
    toggle() {
        this.isOpen ? this.close() : this.open();
    }
}

// Export for use in other modules
window.MobileFilterSheet = MobileFilterSheet;