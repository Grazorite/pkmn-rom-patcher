// Config Loader - Frontend access to config files
import { configLoader } from '../utils/config-loader.js';

let systemsCache = null;
let baseRomsCache = null;

export async function loadSystems() {
    if (systemsCache) return systemsCache;
    
    systemsCache = await configLoader.load('systems.json');
    return systemsCache;
}

export async function loadBaseRoms() {
    if (baseRomsCache) return baseRomsCache;
    
    baseRomsCache = await configLoader.load('base-roms.json');
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
