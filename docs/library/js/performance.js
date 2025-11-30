// Performance optimization utilities
export class PerformanceManager {
    constructor() {
        this.imageCache = new Map();
        this.intersectionObserver = null;
        this.resizeObserver = null;
        this.setupObservers();
    }

    setupObservers() {
        // Lazy loading for images
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.intersectionObserver.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '50px' });
        }

        // Responsive image handling
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(this.debounce(() => {
                this.updateImageSizes();
            }, 250));
        }
    }

    // Debounce utility
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle utility for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Lazy load images
    observeImage(img) {
        if (this.intersectionObserver && img) {
            this.intersectionObserver.observe(img);
        }
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (src && !this.imageCache.has(src)) {
            const image = new Image();
            image.onload = () => {
                img.src = src;
                img.classList.add('loaded');
                this.imageCache.set(src, true);
            };
            image.onerror = () => {
                img.style.display = 'none';
            };
            image.src = src;
        }
    }

    // Virtual scrolling for large lists
    createVirtualList(container, items, renderItem, itemHeight = 200) {
        const containerHeight = container.clientHeight;
        const visibleItems = Math.ceil(containerHeight / itemHeight) + 2;
        let scrollTop = 0;

        const updateVisibleItems = this.throttle(() => {
            const startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(startIndex + visibleItems, items.length);
            
            container.innerHTML = '';
            container.style.height = `${items.length * itemHeight}px`;
            container.style.position = 'relative';

            for (let i = startIndex; i < endIndex; i++) {
                const item = renderItem(items[i], i);
                item.style.position = 'absolute';
                item.style.top = `${i * itemHeight}px`;
                item.style.height = `${itemHeight}px`;
                container.appendChild(item);
            }
        }, 16);

        container.addEventListener('scroll', (e) => {
            scrollTop = e.target.scrollTop;
            updateVisibleItems();
        });

        updateVisibleItems();
    }

    // Optimize DOM operations
    batchDOMUpdates(updates) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                updates.forEach(update => update());
                resolve();
            });
        });
    }

    // Memory cleanup
    cleanup() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.imageCache.clear();
    }

    updateImageSizes() {
        // Update responsive images based on container size
        document.querySelectorAll('.hack-card-image img').forEach(img => {
            const container = img.closest('.hack-card');
            if (container) {
                const width = container.offsetWidth;
                // Adjust image quality based on container size
                if (width < 200) {
                    img.classList.add('low-res');
                } else {
                    img.classList.remove('low-res');
                }
            }
        });
    }
}