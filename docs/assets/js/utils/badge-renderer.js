// Badge Renderer - Centralized badge HTML generation
import { configLoader } from './config-loader.js';

let baseRomsCache = null;

async function loadBaseRoms() {
    if (baseRomsCache) return baseRomsCache;
    baseRomsCache = await configLoader.load('base-roms.json');
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
