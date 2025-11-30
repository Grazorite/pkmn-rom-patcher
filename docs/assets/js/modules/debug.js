// Debug utilities for performance analysis
export class DebugPanel {
    constructor(app) {
        this.app = app;
        this.isVisible = false;
        this.panel = null;
        this.setupKeyboardShortcut();
    }

    setupKeyboardShortcut() {
        // Ctrl+Shift+D to toggle debug panel
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (!this.panel) {
            this.createPanel();
        }
        
        this.panel.style.display = 'block';
        this.isVisible = true;
        this.updateContent();
        
        // Auto-refresh every 2 seconds
        this.refreshInterval = setInterval(() => {
            this.updateContent();
        }, 2000);
    }

    hide() {
        if (this.panel) {
            this.panel.style.display = 'none';
        }
        this.isVisible = false;
        
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'debug-panel';
        this.panel.innerHTML = `
            <div class="debug-header">
                <h3>Performance Debug Panel</h3>
                <button class="debug-close" onclick="this.closest('#debug-panel').style.display='none'">×</button>
            </div>
            <div class="debug-content">
                <div class="debug-section">
                    <h4>Performance Metrics</h4>
                    <div id="debug-performance"></div>
                </div>
                <div class="debug-section">
                    <h4>Cache Status</h4>
                    <div id="debug-cache"></div>
                </div>
                <div class="debug-section">
                    <h4>Memory Usage</h4>
                    <div id="debug-memory"></div>
                </div>
                <div class="debug-section">
                    <h4>Actions</h4>
                    <div class="debug-actions">
                        <button onclick="window.app.debugPanel.clearCache()">Clear Cache</button>
                        <button onclick="window.app.debugPanel.exportMetrics()">Export Metrics</button>
                        <button onclick="window.app.debugPanel.runPerformanceTest()">Run Test</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        this.panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            background: var(--surface-color, #fff);
            border: 1px solid var(--border-color, #ddd);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
            overflow-y: auto;
            display: none;
        `;
        
        document.body.appendChild(this.panel);
    }

    updateContent() {
        if (!this.isVisible) return;

        // Performance metrics
        const perfElement = document.getElementById('debug-performance');
        if (perfElement) {
            const summary = this.app.performanceMonitor.getSummary();
            perfElement.innerHTML = Object.entries(summary)
                .map(([name, data]) => `
                    <div><strong>${name}:</strong> ${data.latest?.toFixed(2)}ms (avg: ${data.avg?.toFixed(2)}ms)</div>
                `).join('');
        }

        // Cache status
        const cacheElement = document.getElementById('debug-cache');
        if (cacheElement) {
            const stats = this.app.cacheManager.getStats();
            cacheElement.innerHTML = `
                <div>Manifest: ${stats.manifestCached ? '✓' : '✗'}</div>
                <div>Search Cache: ${stats.searchCacheSize} entries</div>
                <div>Filter Cache: ${stats.filterCacheSize} entries</div>
                <div>Memory: ${(stats.totalMemoryUsage / 1024).toFixed(1)} KB</div>
            `;
        }

        // Memory usage
        const memoryElement = document.getElementById('debug-memory');
        if (memoryElement && 'memory' in performance) {
            const memory = performance.memory;
            memoryElement.innerHTML = `
                <div>Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB</div>
                <div>Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB</div>
                <div>Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB</div>
            `;
        }
    }

    clearCache() {
        this.app.cacheManager.clearAll();
        console.log('Cache cleared');
        this.updateContent();
    }

    exportMetrics() {
        const data = this.app.performanceMonitor.exportMetrics();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-metrics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async runPerformanceTest() {
        console.log('Running performance test...');
        
        // Test search performance
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            this.app.performanceMonitor.startTiming('search-test');
            searchInput.value = 'pokemon';
            searchInput.dispatchEvent(new Event('input'));
            
            setTimeout(() => {
                this.app.performanceMonitor.endTiming('search-test');
                console.log('Search test completed');
            }, 500);
        }
        
        // Test filter performance
        this.app.performanceMonitor.startTiming('filter-test');
        this.app.applyFilters();
        this.app.performanceMonitor.endTiming('filter-test');
        
        console.log('Performance test completed');
        this.updateContent();
    }
}