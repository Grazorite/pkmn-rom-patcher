// Inline PathResolver for submit page
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
    
    static resolveNavigation(page) {
        return this.getBasePath() + page.replace(/^\//, '');
    }
}

// Apply paths immediately
document.addEventListener('DOMContentLoaded', () => {
    // Update CSS links
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
    
    // Update navigation links
    document.querySelectorAll('.nav-link, .nav-collapsed-icon').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http')) {
            link.href = PathResolver.resolveNavigation(href);
        }
    });
});

window.PathResolver = PathResolver;