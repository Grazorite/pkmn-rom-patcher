/**
 * Animation Utilities - Modular animation helpers
 */

export class AnimationUtils {
    /**
     * Add staggered animations to elements
     * @param {NodeList|Array} elements - Elements to animate
     * @param {string} animationClass - CSS animation class to add
     * @param {number} delay - Delay between each element (ms)
     * @param {number} startDelay - Initial delay before first element (ms)
     */
    static staggerElements(elements, animationClass = 'anim-fade-in-up', delay = 100, startDelay = 0) {
        if (!elements || elements.length === 0) return;
        
        elements.forEach((element, index) => {
            if (element) {
                // Set CSS custom property for stagger delay
                element.style.setProperty('--stagger-index', index);
                element.style.setProperty('--stagger-delay', `${delay}ms`);
                
                // Add animation class with delay
                setTimeout(() => {
                    element.classList.add(animationClass);
                }, startDelay + (index * delay));
            }
        });
    }
    
    /**
     * Add entrance animations to hack cards
     * @param {NodeList|Array} cards - Hack card elements
     */
    static animateHackCards(cards) {
        if (!cards || cards.length === 0) return;
        
        // Remove existing animation classes
        cards.forEach(card => {
            card.classList.remove('anim-scale-in', 'anim-fade-in-up');
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px) scale(0.9)';
        });
        
        // Add staggered entrance animations
        this.staggerElements(cards, 'anim-scale-in', 80, 100);
        
        // Reset styles after animation
        setTimeout(() => {
            cards.forEach(card => {
                card.style.opacity = '';
                card.style.transform = '';
            });
        }, 100 + (cards.length * 80) + 600);
    }
    
    /**
     * Add smooth scroll animation
     * @param {Element} element - Element to scroll to
     * @param {number} offset - Offset from top (px)
     * @param {number} duration - Animation duration (ms)
     */
    static smoothScrollTo(element, offset = 0, duration = 800) {
        if (!element) return;
        
        const targetPosition = element.offsetTop - offset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }
        
        function easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
        
        requestAnimationFrame(animation);
    }
    
    /**
     * Add loading skeleton animation
     * @param {Element} container - Container element
     * @param {number} count - Number of skeleton items
     * @param {string} type - Type of skeleton ('card', 'list', 'text')
     */
    static showLoadingSkeleton(container, count = 6, type = 'card') {
        if (!container) return;
        
        const skeletons = [];
        
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = `loading-skeleton skeleton-${type}`;
            
            if (type === 'card') {
                skeleton.innerHTML = `
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-badges">
                            <div class="skeleton-badge"></div>
                            <div class="skeleton-badge"></div>
                        </div>
                    </div>
                `;
            } else if (type === 'list') {
                skeleton.innerHTML = `
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-text-block">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                    </div>
                `;
            } else {
                skeleton.innerHTML = `
                    <div class="skeleton-title"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text short"></div>
                `;
            }
            
            skeletons.push(skeleton);
            container.appendChild(skeleton);
        }
        
        // Stagger skeleton appearance
        this.staggerElements(skeletons, 'anim-fade-in', 50);
        
        return skeletons;
    }
    
    /**
     * Remove loading skeletons with animation
     * @param {Element} container - Container element
     */
    static hideLoadingSkeleton(container) {
        if (!container) return;
        
        const skeletons = container.querySelectorAll('.loading-skeleton');
        
        // Fade out skeletons
        skeletons.forEach((skeleton, index) => {
            setTimeout(() => {
                skeleton.style.opacity = '0';
                skeleton.style.transform = 'scale(0.9)';
                
                setTimeout(() => {
                    if (skeleton.parentNode) {
                        skeleton.parentNode.removeChild(skeleton);
                    }
                }, 300);
            }, index * 50);
        });
    }
    
    /**
     * Add ripple effect to element
     * @param {Element} element - Element to add ripple to
     * @param {Event} event - Click event
     */
    static addRippleEffect(element, event) {
        if (!element || !event) return;
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Ensure element has relative positioning
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
    
    /**
     * Animate number counting
     * @param {Element} element - Element containing the number
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration (ms)
     */
    static animateNumber(element, start, end, duration = 1000) {
        if (!element) return;
        
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }
    
    /**
     * Add intersection observer for scroll animations
     * @param {string} selector - CSS selector for elements to observe
     * @param {string} animationClass - Animation class to add
     * @param {Object} options - Intersection observer options
     */
    static observeScrollAnimations(selector, animationClass = 'anim-fade-in-up', options = {}) {
        const defaultOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            ...options
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(animationClass);
                    observer.unobserve(entry.target);
                }
            });
        }, defaultOptions);
        
        document.querySelectorAll(selector).forEach(element => {
            observer.observe(element);
        });
        
        return observer;
    }
}

// Add ripple animation keyframes to document if not exists
if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .skeleton-image {
            width: 100%;
            height: 120px;
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 8px;
            margin-bottom: 12px;
        }
        
        .skeleton-content {
            padding: 0 12px;
        }
        
        .skeleton-title {
            height: 16px;
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
            margin-bottom: 8px;
            width: 80%;
        }
        
        .skeleton-text {
            height: 12px;
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
            margin-bottom: 6px;
            width: 60%;
        }
        
        .skeleton-text.short {
            width: 40%;
        }
        
        .skeleton-badges {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }
        
        .skeleton-badge {
            height: 20px;
            width: 60px;
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 10px;
        }
        
        .skeleton-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 50%;
            margin-right: 12px;
        }
        
        .skeleton-text-block {
            flex: 1;
        }
        
        .skeleton-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 16px;
        }
        
        .skeleton-list {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
        }
    `;
    document.head.appendChild(style);
}

export default AnimationUtils;