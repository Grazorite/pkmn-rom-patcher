// Form field renderer - Generates HTML from metadata config
import { METADATA_FIELDS } from '../config/metadata-fields.js';

function renderTooltip(text) {
    return text ? `<i data-lucide="help-circle" class="field-tooltip" title="${text}"></i>` : '';
}

export function renderFormField(fieldName, config) {
    const { label, icon, type, required, options, hint, placeholder, tooltip, optionTooltips } = config;
    const requiredAttr = required ? 'required' : '';
    const requiredMark = required ? ' *' : '';
    
    let fieldHTML = '';
    
    switch (type) {
        case 'select':
            fieldHTML = `
                <select id="${fieldName}" name="${fieldName}" ${requiredAttr}>
                    <option value="">Select...</option>
                    ${options.map(opt => {
                        const optTooltip = optionTooltips?.[opt] || '';
                        return `<option value="${opt}" title="${optTooltip}">${opt}</option>`;
                    }).join('')}
                </select>
            `;
            break;
            
        case 'multi-text':
            fieldHTML = `
                <input type="text" id="${fieldName}" name="${fieldName}" ${requiredAttr} 
                       list="${fieldName}Options" placeholder="${hint || ''}">
                <datalist id="${fieldName}Options">
                    ${options.map(opt => `<option value="${opt}">`).join('')}
                </datalist>
            `;
            break;
            
        case 'multi-checkbox':
            fieldHTML = `
                <div class="checkbox-group">
                    ${options.map(opt => {
                        const optTooltip = optionTooltips?.[opt] || '';
                        return `
                            <label class="checkbox-label" title="${optTooltip}">
                                <input type="checkbox" name="${fieldName}[]" value="${opt}">
                                <span>${opt}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
                ${config.allowCustom ? `
                    <input type="text" id="${fieldName}Custom" 
                           placeholder="Add custom values (comma-separated)" 
                           class="custom-input">
                ` : ''}
            `;
            break;
            
        case 'text-with-options':
            fieldHTML = `
                <input type="text" id="${fieldName}" name="${fieldName}" ${requiredAttr} 
                       list="${fieldName}Options" placeholder="${placeholder || ''}">
                <datalist id="${fieldName}Options">
                    ${options.map(opt => `<option value="${opt}">`).join('')}
                </datalist>
            `;
            break;
            
        case 'text':
            fieldHTML = `
                <input type="text" id="${fieldName}" name="${fieldName}" ${requiredAttr} 
                       placeholder="${placeholder || ''}">
            `;
            break;
            
        case 'number':
            fieldHTML = `
                <input type="number" id="${fieldName}" name="${fieldName}" ${requiredAttr} 
                       placeholder="${placeholder || ''}" min="0">
            `;
            break;
            
        case 'date':
            fieldHTML = `
                <input type="date" id="${fieldName}" name="${fieldName}" ${requiredAttr}>
            `;
            break;
    }
    
    return `
        <div class="form-group">
            <label for="${fieldName}">
                <i data-lucide="${icon}" width="16" height="16"></i>
                ${label}${requiredMark}
                ${renderTooltip(tooltip)}
            </label>
            ${fieldHTML}
            ${hint ? `<small class="form-hint">${hint}</small>` : ''}
        </div>
    `;
}

export function renderFormRow(fields) {
    return `
        <div class="form-row">
            ${fields.map(fieldName => renderFormField(fieldName, METADATA_FIELDS[fieldName])).join('')}
        </div>
    `;
}

export function renderDetailsStep() {
    const fields = [
        'hackType', 'status', 'difficulty', 'released',
        'graphics', 'story', 'maps', 'postgame',
        'tags', 'mechanics', 'fakemons', 'variants',
        'typeChanges', 'physicalSpecialSplit', 'antiCheat',
        'playtime', 'totalCatchable', 'pokedexIncludes',
        'openWorld', 'randomizer', 'nuzlocke'
    ];
    
    return fields.map(fieldName => renderFormField(fieldName, METADATA_FIELDS[fieldName])).join('');
}
