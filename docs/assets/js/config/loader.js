// Config Loader - Frontend access to config files

let systemsCache = null;
let baseRomsCache = null;

export async function loadSystems() {
    if (systemsCache) return systemsCache;
    
    const response = await fetch('config/systems.json');
    systemsCache = await response.json();
    return systemsCache;
}

export async function loadBaseRoms() {
    if (baseRomsCache) return baseRomsCache;
    
    const response = await fetch('config/base-roms.json');
    baseRomsCache = await response.json();
    return baseRomsCache;
}

export function getSystemAbbr(systemName, systems) {
    for (const [abbr, data] of Object.entries(systems)) {
        if (data.name === systemName || abbr === systemName) {
            return abbr;
        }
    }
    return null;
}

export function getBaseRomAbbr(romName, baseRoms) {
    for (const [key, data] of Object.entries(baseRoms)) {
        if (data.fullName === romName || key === romName) {
            return data.abbreviation;
        }
    }
    return null;
}

export function getBaseRomVariants(romName, baseRoms) {
    for (const [key, data] of Object.entries(baseRoms)) {
        if (data.fullName === romName || key === romName) {
            return data.variants || [];
        }
    }
    return [];
}

export function getBaseRomSystem(romName, baseRoms) {
    for (const [key, data] of Object.entries(baseRoms)) {
        if (data.fullName === romName || key === romName) {
            return data.system;
        }
    }
    return null;
}

export function getBaseRomFullName(romKey, baseRoms) {
    return baseRoms[romKey]?.fullName || romKey;
}
