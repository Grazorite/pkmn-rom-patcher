// Inline PathResolver for patcher page
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
    
    static resolveRomPatcherJS(path) {
        return this.getBasePath() + 'patcher/rom-patcher-js/' + path.replace(/^.*rom-patcher-js\//, '');
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
    
    // ROM patcher CSS
    const romPatcherCSS = document.createElement('link');
    romPatcherCSS.rel = 'stylesheet';
    romPatcherCSS.href = PathResolver.resolveRomPatcherJS('style.css');
    document.head.appendChild(romPatcherCSS);
    
    // Update navigation links
    document.querySelectorAll('.nav-link, .nav-collapsed-icon').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http')) {
            link.href = PathResolver.resolveNavigation(href);
        }
    });
});

window.PathResolver = PathResolver;