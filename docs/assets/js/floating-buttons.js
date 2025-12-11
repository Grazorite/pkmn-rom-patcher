// Floating Buttons Management
(function() {
    'use strict';
    
    function initFloatingButtons() {
        const filterBtn = document.getElementById('floatingFilterBtn');
        const closeBtn = document.getElementById('floatingCloseBtn');
        const backToTopBtn = document.getElementById('backToTop');
        
        // Filter button functionality
        if (filterBtn) {
            let clickCount = 0;
            let clickTimer = null;
            
            filterBtn.addEventListener('click', () => {
                clickCount++;
                
                if (clickCount === 1) {
                    clickTimer = setTimeout(() => {
                        // Mobile: show filter sheet, Desktop: toggle sidebar
                        if (window.innerWidth <= 768) {
                            if (window.mobileFilterSheet) {
                                window.mobileFilterSheet.toggle();
                            }
                        } else {
                            const sidebar = document.querySelector('.sidebar');
                            if (sidebar) {
                                sidebar.classList.toggle('collapsed');
                            }
                        }
                        clickCount = 0;
                    }, 300);
                } else if (clickCount === 2) {
                    // Double click: clear all filters
                    clearTimeout(clickTimer);
                    if (window.app && typeof window.app.clearAllFilters === 'function') {
                        window.app.clearAllFilters();
                    }
                    clickCount = 0;
                }
            });
            
            // Show filter button on library page
            if (window.location.pathname.includes('/library/')) {
                filterBtn.classList.add('visible');
            }
        }
        
        // Close button functionality
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // Close detail panel
                const panel = document.getElementById('detailPanel');
                const overlay = document.getElementById('detailOverlay');
                if (panel) {
                    panel.classList.remove('open', 'collapsed');
                }
                if (overlay) {
                    overlay.classList.remove('active');
                }
                closeBtn.style.display = 'none';
            });
        }
        
        // Back to top functionality (enhanced from existing)
        if (backToTopBtn) {
            let scrollTimeout;
            const handleScroll = () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    if (window.scrollY > 200) {
                        backToTopBtn.classList.add('visible');
                    } else {
                        backToTopBtn.classList.remove('visible');
                    }
                }, 50);
            };
            
            window.addEventListener('scroll', handleScroll, { passive: true });
            
            backToTopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
        
        // Replace filter button with close button when detail panel opens
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const panel = mutation.target;
                    if (panel.id === 'detailPanel' && closeBtn && filterBtn) {
                        if (panel.classList.contains('open')) {
                            // Start cross-fade: filter out, close in
                            filterBtn.classList.remove('visible');
                            closeBtn.style.display = 'flex';
                            setTimeout(() => closeBtn.classList.add('visible'), 150);
                        } else {
                            // Reverse cross-fade: close out, filter in
                            closeBtn.classList.remove('visible');
                            setTimeout(() => {
                                closeBtn.style.display = 'none';
                                filterBtn.classList.add('visible');
                            }, 150);
                        }
                    }
                }
            });
        });
        
        const detailPanel = document.getElementById('detailPanel');
        if (detailPanel) {
            observer.observe(detailPanel, { attributes: true });
        }
        
        // Initialize icons
        const initIcon = () => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            } else {
                setTimeout(initIcon, 100);
            }
        };
        initIcon();
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFloatingButtons);
    } else {
        initFloatingButtons();
    }
})();