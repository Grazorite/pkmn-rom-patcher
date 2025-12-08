/**
 * Animation Engine - RAF-based animation system
 */

export class AnimationEngine {
    constructor() {
        this.animations = new Map();
        this.animationId = 0;
    }

    /**
     * Animate using requestAnimationFrame
     */
    animate(callback, duration, easing = 'easeInOutCubic') {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const id = this.animationId++;
            const easingFn = this.easing[easing];

            const step = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easingFn(progress);

                callback(easedProgress);

                if (progress < 1) {
                    this.animations.set(id, requestAnimationFrame(step));
                } else {
                    this.animations.delete(id);
                    resolve();
                }
            };

            this.animations.set(id, requestAnimationFrame(step));
        });
    }

    /**
     * Fade out elements
     */
    fadeOut(elements, duration = 200) {
        const els = Array.isArray(elements) ? elements : [elements];
        
        return Promise.all(els.map(el => {
            if (!el) return Promise.resolve();
            
            return this.animate((progress) => {
                el.style.opacity = 1 - progress;
                el.style.transform = `translateY(${progress * 10}px)`;
            }, duration, 'easeOutQuad');
        }));
    }

    /**
     * Fade in elements with stagger
     */
    fadeIn(elements, staggerDelay = 60) {
        const els = Array.isArray(elements) ? elements : [elements];
        
        return Promise.all(els.map((el, index) => {
            if (!el) return Promise.resolve();
            
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            return new Promise(resolve => {
                setTimeout(() => {
                    this.animate((progress) => {
                        el.style.opacity = progress;
                        el.style.transform = `translateY(${20 * (1 - progress)}px)`;
                    }, 300, 'easeOutCubic').then(resolve);
                }, index * staggerDelay);
            });
        }));
    }

    /**
     * Easing functions
     */
    easing = {
        linear: t => t,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeOutCubic: t => (--t) * t * t + 1
    };

    /**
     * Cancel all animations
     */
    cancelAll() {
        this.animations.forEach(id => cancelAnimationFrame(id));
        this.animations.clear();
    }
}

export default new AnimationEngine();
