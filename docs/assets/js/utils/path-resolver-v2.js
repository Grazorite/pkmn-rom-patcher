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

// Make available globally
window.PathResolver = PathResolver;

export default PathResolver;