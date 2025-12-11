// Universal Path Resolver
export class PathResolver {
    static resolvePatchPath(patchPath) {
        if (!patchPath) return '';
        if (patchPath.startsWith('http')) return patchPath;
        
        // Normalize to base-relative path (remove ../ prefixes)
        return patchPath.replace(/^\.\.\//, '');
    }
    
    static resolveImagePath(imagePath, currentPage = 'library') {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        
        // Normalize to base-relative path
        return imagePath.replace(/^\.\.\//, '');
    }
    
    static getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('/patcher/')) return 'patcher';
        if (path.includes('/library/')) return 'library';
        if (path.includes('/submit/')) return 'submit';
        return 'home';
    }
}