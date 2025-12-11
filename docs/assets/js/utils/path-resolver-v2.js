/**
 * Centralized path resolution for cross-environment compatibility
 * Handles local development server vs GitHub Pages deployment
 */
class PathResolver {
    static _basePath = null;
    
    static getBasePath() {
        if (this._basePath === null) {
            const isGitHubPages = window.location.hostname === 'grazorite.github.io';
            this._basePath = isGitHubPages ? '/pkmn-rom-patcher/docs/' : '/docs/';
        }
        return this._basePath;
    }
    
    static resolveAsset(path) {
        return this.getBasePath() + 'assets/' + path.replace(/^assets\//, '');
    }
    
    static resolveCSS(path) {
        return this.resolveAsset('css/' + path.replace(/^css\//, ''));
    }
    
    static resolveJS(path) {
        return this.resolveAsset('js/' + path.replace(/^js\//, ''));
    }
    
    static resolveManifest() {
        return this.getBasePath() + 'manifest.json';
    }
    
    static resolvePatch(path) {
        return this.getBasePath() + 'patches/' + path.replace(/^patches\//, '');
    }
    
    static resolveNavigation(page) {
        return this.getBasePath() + page.replace(/^\//, '');
    }
    
    static resolveRomPatcherJS(path) {
        return this.getBasePath() + 'patcher/rom-patcher-js/' + path.replace(/^.*rom-patcher-js\//, '');
    }
    
    // For testing - allows mocking environment
    static _setEnvironment(isGitHubPages) {
        this._basePath = isGitHubPages ? '/pkmn-rom-patcher/docs/' : '/docs/';
    }
    
    static _reset() {
        this._basePath = null;
    }
}

// Apply CSS and navigation fixes when loaded
document.addEventListener('DOMContentLoaded', () => {
    const path = location.pathname;
    
    // Load CSS based on page
    if (path.includes('/patcher/')) {
        const cssLinks = [
            'design-system/background-system.css',
            'design-system/status-system.css', 
            'design-system/image-display.css',
            'main.css?v=3',
            'transitions.css',
            'components/patcher-results.css?v=2',
            'components/loaded-patch-info.css?v=2',
            'components/patcher-single-layout.css?v=2',
            'components/patcher-widget-position.css?v=2',
            'components/rompatcher-theme.css?v=2'
        ];
        
        cssLinks.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = PathResolver.resolveCSS(href);
            document.head.appendChild(link);
        });
        
        const romPatcherCSS = document.createElement('link');
        romPatcherCSS.rel = 'stylesheet';
        romPatcherCSS.href = PathResolver.resolveRomPatcherJS('style.css');
        document.head.appendChild(romPatcherCSS);
    } else if (path.includes('/library/')) {
        const cssLinks = [
            'design-system/background-system.css',
            'design-system/status-system.css', 
            'design-system/image-display.css',
            'main.css?v=3',
            'components/mobile-filter-sheet.css',
            'transitions.css',
            'performance.css?v=2'
        ];
        
        cssLinks.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = PathResolver.resolveCSS(href);
            document.head.appendChild(link);
        });
    } else if (path.includes('/submit/')) {
        const cssLinks = [
            'design-system/background-system.css',
            'design-system/status-system.css', 
            'design-system/image-display.css',
            'main.css?v=3',
            'transitions.css',
            'performance.css?v=2'
        ];
        
        cssLinks.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = PathResolver.resolveCSS(href);
            document.head.appendChild(link);
        });
    }
    
    // Update navigation links
    document.querySelectorAll('.nav-link, .nav-collapsed-icon').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http')) {
            link.href = PathResolver.resolveNavigation(href);
        }
    });
});

// Make available globally
window.PathResolver = PathResolver;

export default PathResolver;