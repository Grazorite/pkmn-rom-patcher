// Page detection utility
export class PageDetector {
    static getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('/library/')) return 'library';
        if (path.includes('/patcher/')) return 'patcher';
        if (path.includes('/submit/')) return 'submit';
        return 'home';
    }

    static needsManifest() {
        return this.getCurrentPage() === 'library';
    }

    static getPageConfig() {
        const page = this.getCurrentPage();
        return {
            library: {
                needsManifest: true,
                needsCDN: true,
                criticalResources: ['manifest.json']
            },
            patcher: {
                needsManifest: false,
                needsCDN: false,
                criticalResources: []
            },
            submit: {
                needsManifest: false,
                needsCDN: true,
                criticalResources: []
            },
            home: {
                needsManifest: false,
                needsCDN: false,
                criticalResources: []
            }
        }[page] || { needsManifest: false, needsCDN: false, criticalResources: [] };
    }
}