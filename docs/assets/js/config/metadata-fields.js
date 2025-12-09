// Metadata field definitions - Single source of truth
export const METADATA_FIELDS = {
    // Step 2: Details
    hackType: {
        label: 'Hack Type',
        icon: 'layers',
        type: 'select',
        required: true,
        options: ['New', 'Improvement'],
        tooltip: 'Type of ROM hack modification',
        optionTooltips: {
            'New': 'Deviates from original Pokemon ROMs enough to be considered a standalone game',
            'Improvement': 'Only has difficulty increments, QOL changes, sprite updates / replacements etc.'
        }
    },
    status: {
        label: 'Status',
        icon: 'activity',
        type: 'select',
        required: true,
        options: ['Completed', 'Perpetual Beta', 'Updating', 'Cancelled', 'In Development'],
        tooltip: 'Current development status',
        optionTooltips: {
            'Completed': 'Fully playable as creator intended',
            'Perpetual Beta': 'Completed, still receiving minor updates',
            'Updating': 'Playable but awaiting major updates',
            'Cancelled': 'Unfinished',
            'In Development': 'Currently being developed'
        }
    },
    difficulty: {
        label: 'Difficulty',
        icon: 'trending-up',
        type: 'select',
        required: true,
        options: ['Normal', 'Hard', 'Challenging', 'Kaizo', 'Customisable']
    },
    released: {
        label: 'Release Date',
        icon: 'calendar',
        type: 'date',
        required: true,
        tooltip: 'Last updated by creator'
    },
    graphics: {
        label: 'Graphics',
        icon: 'image',
        type: 'select',
        required: true,
        options: ['New', 'Enhanced', 'Same'],
        tooltip: 'Tiles, sprites, scenes etc.'
    },
    story: {
        label: 'Story',
        icon: 'book',
        type: 'select',
        required: true,
        options: ['New', 'Enhanced', 'Same']
    },
    maps: {
        label: 'Maps',
        icon: 'map',
        type: 'select',
        required: true,
        options: ['New', 'Enhanced', 'Same']
    },
    postgame: {
        label: 'Postgame',
        icon: 'flag',
        type: 'select',
        required: true,
        options: ['Yes', 'No', 'N/A']
    },
    tags: {
        label: 'Tags',
        icon: 'tag',
        type: 'multi-checkbox',
        required: true,
        options: ['Difficulty', 'Enhancement', 'New mechanics', 'Dex replacement', 'Story-driven', 'Atypical'],
        allowCustom: true,
        hint: 'Select all that apply',
        optionTooltips: {
            'Difficulty': 'Increased difficulty (e.g. trainer levels increased)',
            'Enhancement': 'Added QOL changes from later generations',
            'New mechanics': 'Brand-new mechanics not native to Pokemon ROMs',
            'Dex replacement': 'Replaced the usual expected Pokemon by generations / sprites, either partial or full',
            'Story-driven': 'Brand-new storyline / heavy story emphasis',
            'Atypical': 'Entirely different gameplay formula from base Pokemon ROM (e.g. no gym challenge)'
        }
    },
    mechanics: {
        label: 'Mechanics',
        icon: 'settings',
        type: 'multi-checkbox',
        required: true,
        options: ['Triple / Rotation battles', 'Mega evolution', 'Z-moves', 'Dynamax / Gigantamax', 'Terrastalization', 'None'],
        allowCustom: true,
        hint: 'Select all that apply'
    },
    fakemons: {
        label: 'Fakemons',
        icon: 'sparkles',
        type: 'select',
        required: true,
        options: ['All', 'Majority', 'A few', 'None']
    },
    variants: {
        label: 'Variants',
        icon: 'git-branch',
        type: 'multi-checkbox',
        required: true,
        options: ['Beta version', 'OG regional', 'New regional', 'Mega evolutions', 'Fusions', 'None'],
        allowCustom: true,
        hint: 'Select all that apply',
        optionTooltips: {
            'Beta version': 'Scrapped beta Pokemon',
            'OG regional': 'Added regional Pokemon (Shadow / Alolan / Galarian / Hisuian / Paldean)',
            'New regional': 'Brand-new non-mainline variants of existing Pokemon',
            'Mega evolutions': 'Brand-new non-mainline mega evolutions',
            'Fusions': 'Combined existing Pokemon to create new ones'
        }
    },
    typeChanges: {
        label: 'Type Changes',
        icon: 'zap',
        type: 'multi-checkbox',
        required: true,
        options: ['Base types', 'Added OG types', 'Added new types', 'None'],
        allowCustom: true,
        hint: 'Select all that apply',
        optionTooltips: {
            'Base types': 'Replaced OG typings (e.g. pidgey > electric / flying)',
            'Added OG types': 'Added a Pokemon type from a later generation (Steel / Dark / Fairy)',
            'Added new types': 'Added brand-new type'
        }
    },
    physicalSpecialSplit: {
        label: 'Physical-Special Split',
        icon: 'divide',
        type: 'select',
        required: true,
        options: ['Yes', 'No']
    },
    antiCheat: {
        label: 'Anti-cheat',
        icon: 'shield',
        type: 'select',
        required: true,
        options: ['Yes', 'No'],
        tooltip: 'ROM softlocks when cheats are used or Gameshark / Action Replay codes don\'t work'
    },
    playtime: {
        label: 'Playtime',
        icon: 'clock',
        type: 'text',
        required: false,
        placeholder: 'e.g., 8 gyms + E4',
        tooltip: 'Number of gyms, expected playtime length etc.'
    },
    totalCatchable: {
        label: 'Total Catchable',
        icon: 'hash',
        type: 'number',
        required: false,
        placeholder: 'e.g., 386'
    },
    pokedexIncludes: {
        label: 'Pokedex Includes up to Generation',
        icon: 'book-open',
        type: 'select',
        required: true,
        options: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'N/A']
    },
    openWorld: {
        label: 'Open World',
        icon: 'globe',
        type: 'select',
        required: true,
        options: ['Yes', 'No']
    },
    randomizer: {
        label: 'Randomizer',
        icon: 'shuffle',
        type: 'text-with-options',
        required: true,
        options: ['Yes', 'No'],
        placeholder: 'Select or type custom value'
    },
    nuzlocke: {
        label: 'Nuzlocke',
        icon: 'skull',
        type: 'text-with-options',
        required: true,
        options: ['Yes', 'No'],
        placeholder: 'Select or type custom value'
    }
};

export const STATUS_COLORS = {
    'Completed': { bg: 'var(--success)', label: 'Complete' },
    'Perpetual Beta': { bg: 'var(--warning)', label: 'Perpetual Beta' },
    'Updating': { bg: '#3B82F6', label: 'Updating' },
    'Cancelled': { bg: 'var(--error)', label: 'Cancelled' },
    'In Development': { bg: '#F59E0B', label: 'In Development' }
};
