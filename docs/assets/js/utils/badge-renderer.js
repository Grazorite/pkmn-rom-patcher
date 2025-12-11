// Badge Renderer - Centralized badge HTML generation
let baseRomsCache = null;

async function loadBaseRoms() {
    if (baseRomsCache) return baseRomsCache;
    const response = await fetch('config/base-roms.json');
    baseRomsCache = await response.json();
    return baseRomsCache;
}

function normalizeRomName(romName) {
    if (!baseRomsCache) return romName;
    
    for (const [key, data] of Object.entries(baseRomsCache)) {
        if (key === romName || data.fullName === romName) {
            return data.fullName;
        }
    }
    return romName;
}

export function renderBadge(type, value) {
    if (!value) return '';
    
    const normalizedValue = type === 'rom' ? normalizeRomName(value) : value;
    
    return `<span class="badge badge-${type}" data-${type}="${normalizedValue}">${value}</span>`;
}

export async function initBadgeRenderer() {
    await loadBaseRoms();
}
