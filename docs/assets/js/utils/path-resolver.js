// Universal Path Resolver
export class PathResolver {
    static resolveImagePath(imagePath, currentPage = 'library') {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        
        // Handle relative paths based on current page context
        if (currentPage === 'patcher') {
            // Patcher is in /patcher/ directory, needs to go up one level
            return imagePath.startsWith('../') ? imagePath : `../${imagePath}`;
        }
        
        // Library and other pages
        return imagePath;
    }
    
    static getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('/patcher/')) return 'patcher';
        if (path.includes('/library/')) return 'library';
        if (path.includes('/submit/')) return 'submit';
        return 'home';
    }
}