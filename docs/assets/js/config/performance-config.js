// Performance configuration and budgets
export const PERFORMANCE_CONFIG = {
    // Core Web Vitals thresholds (aggressive targets)
    thresholds: {
        LCP: 1800,  // Reduced from 2000ms
        FID: 80,    // Reduced from 100ms
        CLS: 0.08,  // Reduced from 0.1
        longtask: 40 // Reduced from 50ms
    },

    // Resource loading budgets
    budgets: {
        criticalCSS: 14000,    // 14KB inline CSS limit
        totalJS: 200000,       // 200KB total JS budget
        images: 500000,        // 500KB image budget per page
        fonts: 100000          // 100KB font budget
    },

    // Loading priorities
    priorities: {
        critical: ['manifest.json'],
        high: ['main.css', 'core.js'],
        low: ['lucide.js', 'fuse.js', 'marked.js']
    }
};