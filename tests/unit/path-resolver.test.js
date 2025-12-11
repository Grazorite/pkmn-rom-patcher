/**
 * Path Resolver Tests
 * Tests both local development and GitHub Pages environments
 */

// Mock window.location for testing
const mockLocation = (hostname) => {
    delete window.location;
    window.location = { hostname };
};

// Import PathResolver (in real test environment, would use proper import)
// For now, we'll include the class directly for testing
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
    
    static _reset() {
        this._basePath = null;
    }
}

// Test Suite
const runTests = () => {
    console.log('🧪 Running Path Resolver Tests...\n');
    
    // Test 1: Local Development Environment
    console.log('📍 Testing Local Development Environment');
    mockLocation('localhost');
    PathResolver._reset();
    
    const localTests = {
        'Base Path': PathResolver.getBasePath(),
        'CSS Asset': PathResolver.resolveCSS('main.css'),
        'JS Asset': PathResolver.resolveJS('modules/app.js'),
        'Manifest': PathResolver.resolveManifest(),
        'Patch File': PathResolver.resolvePatch('emerald/hack.bps'),
        'Navigation': PathResolver.resolveNavigation('patcher/'),
        'ROM Patcher JS': PathResolver.resolveRomPatcherJS('RomPatcher.webapp.js')
    };
    
    const expectedLocal = {
        'Base Path': '/docs/',
        'CSS Asset': '/docs/assets/css/main.css',
        'JS Asset': '/docs/assets/js/modules/app.js',
        'Manifest': '/docs/manifest.json',
        'Patch File': '/docs/patches/emerald/hack.bps',
        'Navigation': '/docs/patcher/',
        'ROM Patcher JS': '/docs/patcher/rom-patcher-js/RomPatcher.webapp.js'
    };
    
    let localPassed = 0;
    Object.keys(localTests).forEach(test => {
        const actual = localTests[test];
        const expected = expectedLocal[test];
        const passed = actual === expected;
        console.log(`  ${passed ? '✅' : '❌'} ${test}: ${actual} ${passed ? '' : `(expected: ${expected})`}`);
        if (passed) localPassed++;
    });
    
    // Test 2: GitHub Pages Environment
    console.log('\n📍 Testing GitHub Pages Environment');
    mockLocation('grazorite.github.io');
    PathResolver._reset();
    
    const githubTests = {
        'Base Path': PathResolver.getBasePath(),
        'CSS Asset': PathResolver.resolveCSS('main.css'),
        'JS Asset': PathResolver.resolveJS('modules/app.js'),
        'Manifest': PathResolver.resolveManifest(),
        'Patch File': PathResolver.resolvePatch('emerald/hack.bps'),
        'Navigation': PathResolver.resolveNavigation('patcher/'),
        'ROM Patcher JS': PathResolver.resolveRomPatcherJS('RomPatcher.webapp.js')
    };
    
    const expectedGitHub = {
        'Base Path': '/pkmn-rom-patcher/docs/',
        'CSS Asset': '/pkmn-rom-patcher/docs/assets/css/main.css',
        'JS Asset': '/pkmn-rom-patcher/docs/assets/js/modules/app.js',
        'Manifest': '/pkmn-rom-patcher/docs/manifest.json',
        'Patch File': '/pkmn-rom-patcher/docs/patches/emerald/hack.bps',
        'Navigation': '/pkmn-rom-patcher/docs/patcher/',
        'ROM Patcher JS': '/pkmn-rom-patcher/docs/patcher/rom-patcher-js/RomPatcher.webapp.js'
    };
    
    let githubPassed = 0;
    Object.keys(githubTests).forEach(test => {
        const actual = githubTests[test];
        const expected = expectedGitHub[test];
        const passed = actual === expected;
        console.log(`  ${passed ? '✅' : '❌'} ${test}: ${actual} ${passed ? '' : `(expected: ${expected})`}`);
        if (passed) githubPassed++;
    });
    
    // Test 3: Path Cleaning (handles redundant prefixes)
    console.log('\n📍 Testing Path Cleaning');
    PathResolver._reset();
    mockLocation('localhost');
    
    const cleaningTests = {
        'Double assets prefix': PathResolver.resolveAsset('assets/css/main.css'),
        'Double css prefix': PathResolver.resolveCSS('css/components/button.css'),
        'Double js prefix': PathResolver.resolveJS('js/utils/helper.js'),
        'Double patches prefix': PathResolver.resolvePatch('patches/emerald/hack.bps')
    };
    
    const expectedCleaning = {
        'Double assets prefix': '/docs/assets/css/main.css',
        'Double css prefix': '/docs/assets/css/components/button.css',
        'Double js prefix': '/docs/assets/js/utils/helper.js',
        'Double patches prefix': '/docs/patches/emerald/hack.bps'
    };
    
    let cleaningPassed = 0;
    Object.keys(cleaningTests).forEach(test => {
        const actual = cleaningTests[test];
        const expected = expectedCleaning[test];
        const passed = actual === expected;
        console.log(`  ${passed ? '✅' : '❌'} ${test}: ${actual} ${passed ? '' : `(expected: ${expected})`}`);
        if (passed) cleaningPassed++;
    });
    
    // Summary
    const totalTests = Object.keys(localTests).length + Object.keys(githubTests).length + Object.keys(cleaningTests).length;
    const totalPassed = localPassed + githubPassed + cleaningPassed;
    
    console.log(`\n📊 Test Results: ${totalPassed}/${totalTests} passed`);
    console.log(`   Local Environment: ${localPassed}/${Object.keys(localTests).length}`);
    console.log(`   GitHub Pages: ${githubPassed}/${Object.keys(githubTests).length}`);
    console.log(`   Path Cleaning: ${cleaningPassed}/${Object.keys(cleaningTests).length}`);
    
    if (totalPassed === totalTests) {
        console.log('\n🎉 All tests passed! Path resolver is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Check implementation.');
    }
    
    return { totalPassed, totalTests, success: totalPassed === totalTests };
};

// Export for use in browser console or test runner
if (typeof window !== 'undefined') {
    window.runPathResolverTests = runTests;
}

// Auto-run if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests, PathResolver };
}