// Performance monitoring utilities
export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = [];
        this.setupObservers();
    }

    setupObservers() {
        // Core Web Vitals monitoring
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            this.observeMetric('LCP', ['largest-contentful-paint']);
            
            // First Input Delay
            this.observeMetric('FID', ['first-input']);
            
            // Cumulative Layout Shift
            this.observeMetric('CLS', ['layout-shift']);
            
            // Long Tasks
            this.observeMetric('longtask', ['longtask']);
        }

        // Memory usage monitoring
        if ('memory' in performance) {
            setInterval(() => {
                this.recordMemoryUsage();
            }, 30000); // Every 30 seconds
        }
    }

    observeMetric(name, entryTypes) {
        try {
            // Check if entryTypes are supported
            if (!PerformanceObserver.supportedEntryTypes) {
                return;
            }
            
            const supportedTypes = entryTypes.filter(type => 
                PerformanceObserver.supportedEntryTypes.includes(type)
            );
            
            if (supportedTypes.length === 0) {
                return; // Silently skip unsupported types
            }
            
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric(name, entry);
                }
            });
            
            observer.observe({ entryTypes: supportedTypes });
            this.observers.push(observer);
        } catch (e) {
            // Silently fail for unsupported metrics
        }
    }

    recordMetric(name, entry) {
        const value = entry.value || entry.duration || entry.startTime;
        
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        this.metrics.get(name).push({
            value,
            timestamp: Date.now(),
            entry,
            url: entry.url || window.location.href
        });

        // Keep only last 50 entries per metric (reduced memory usage)
        const entries = this.metrics.get(name);
        if (entries.length > 50) {
            entries.splice(0, entries.length - 50);
        }

        // Log significant performance issues
        this.checkThresholds(name, value);
    }

    checkThresholds(name, value) {
        const thresholds = {
            LCP: 2500, // 2.5s (realistic target)
            FID: 80,   // 80ms
            CLS: 0.08, // 0.08
            longtask: 40 // 40ms
        };

        if (thresholds[name] && value > thresholds[name]) {
            console.warn(`Performance threshold exceeded for ${name}: ${Math.round(value)}ms (threshold: ${thresholds[name]}ms)`);
            
            // Identify LCP element for debugging
            if (name === 'LCP') {
                this.identifyLCPElement(value);
                if (value > 2500) {
                    console.error('Critical LCP performance issue detected');
                }
            }
        } else if (thresholds[name]) {
            console.log(`✓ ${name}: ${Math.round(value)}ms (under ${thresholds[name]}ms threshold)`);
        }
    }

    identifyLCPElement(lcpTime) {
        // Get LCP element details for debugging
        const lcpEntries = this.metrics.get('LCP');
        if (lcpEntries && lcpEntries.length > 0) {
            const latestLCP = lcpEntries[lcpEntries.length - 1];
            const element = latestLCP.entry.element;
            if (element) {
                console.group(`🎯 LCP Element Analysis (${Math.round(lcpTime)}ms)`);
                console.log('Element:', element);
                console.log('Tag:', element.tagName);
                console.log('Classes:', element.className);
                console.log('ID:', element.id);
                console.log('Size:', latestLCP.entry.size);
                console.groupEnd();
            }
        }
    }

    recordMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            this.recordMetric('memory', {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit
            });
        }
    }

    // Measure custom operations
    startTiming(label) {
        performance.mark(`${label}-start`);
    }

    endTiming(label) {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
        
        const measure = performance.getEntriesByName(label, 'measure')[0];
        if (measure) {
            this.recordMetric(label, measure);
        }
    }

    // Get performance summary
    getSummary() {
        const summary = {};
        
        for (const [name, entries] of this.metrics) {
            if (entries.length === 0) continue;
            
            const values = entries.map(e => e.value).filter(v => typeof v === 'number');
            if (values.length === 0) continue;
            
            summary[name] = {
                count: values.length,
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                latest: values[values.length - 1]
            };
        }
        
        return summary;
    }

    // Export metrics for analysis
    exportMetrics() {
        const data = {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            metrics: Object.fromEntries(this.metrics),
            summary: this.getSummary()
        };
        
        return JSON.stringify(data, null, 2);
    }

    // Clean up observers
    disconnect() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.metrics.clear();
    }
}