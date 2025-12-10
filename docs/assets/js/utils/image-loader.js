// Optimized image loading utility
export class ImageLoader {
    constructor() {
        this.observer = null;
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });
        }
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Create new image to preload
        const imageLoader = new Image();
        
        imageLoader.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
            
            // Mark container as loaded
            const container = img.closest('.hack-card-image');
            if (container) {
                container.classList.add('loaded');
            }
        };

        imageLoader.onerror = () => {
            // Show fallback on error
            img.classList.add('error');
            const container = img.closest('.hack-card-image');
            if (container) {
                container.classList.add('error');
                container.innerHTML = `
                    <div class="image-fallback">
                        <i data-lucide="image-off" width="24" height="24"></i>
                        <span>Image unavailable</span>
                    </div>
                `;
            }
        };

        imageLoader.src = src;
    }

    observe(img) {
        if (this.observer && img) {
            this.observer.observe(img);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadImage(img);
        }
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Global instance
export const imageLoader = new ImageLoader();