// Submit Form Module
import { SubmissionHandler } from '../services/submission-handler.js';
import { renderBadge, initBadgeRenderer } from '../utils/badge-renderer.js';
import { renderDetailsStep } from '../utils/form-renderer.js';
import { STATUS_COLORS } from '../config/metadata-fields.js';

class SubmitForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.formData = this.loadFromStorage() || {};
        this.baseRoms = [];
        this.submissionHandler = new SubmissionHandler();
        this.init();
    }
    
    async init() {
        await initBadgeRenderer();
        await this.loadBaseRoms();
        this.renderDynamicFields();
        this.setupEventListeners();
        this.updateUI();
        this.initializeIcons();
    }
    
    renderDynamicFields() {
        const container = document.getElementById('detailsFieldsContainer');
        if (container) {
            container.innerHTML = renderDetailsStep();
            this.initializeIcons();
        }
    }
    
    async loadBaseRoms() {
        const { loadSystems, loadBaseRoms, getBaseRomSystem, getBaseRomVariants } = await import('../config/loader.js');
        
        this.systems = await loadSystems();
        this.baseRomsConfig = await loadBaseRoms();
        
        this.baseRoms = Object.entries(this.baseRomsConfig).map(([key, data]) => ({
            key,
            fullName: data.fullName,
            system: data.system,
            variants: data.variants || []
        }));
        
        this.populateBaseRomDropdown();
    }
    
    populateBaseRomDropdown() {
        const select = document.getElementById('baseRom');
        if (!select) return;
        
        this.baseRoms.sort((a, b) => a.fullName.localeCompare(b.fullName));
        
        this.baseRoms.forEach(rom => {
            const option = document.createElement('option');
            option.value = rom.key;
            option.textContent = `${rom.fullName} (${rom.system})`;
            option.dataset.system = rom.system;
            option.dataset.variants = JSON.stringify(rom.variants);
            select.appendChild(option);
        });
        
        select.addEventListener('change', (e) => this.onBaseRomChange(e));
    }
    
    onBaseRomChange(e) {
        const option = e.target.selectedOptions[0];
        if (!option) return;
        
        // Remove existing variant selector
        const existingSelector = document.getElementById('crcVariantGroup');
        if (existingSelector) existingSelector.remove();
        
        const variants = JSON.parse(option.dataset.variants || '[]');
        const system = option.dataset.system;
        
        if (variants.length > 1) {
            this.showVariantSelector(variants, option.value);
        }
    }
    
    showVariantSelector(variants, romKey) {
        const existingSelector = document.getElementById('crcVariantGroup');
        if (existingSelector) existingSelector.remove();
        
        const baseRomGroup = document.getElementById('baseRom').closest('.form-group');
        const variantGroup = document.createElement('div');
        variantGroup.id = 'crcVariantGroup';
        variantGroup.className = 'form-group';
        variantGroup.innerHTML = `
            <label for="crcVariant">
                <i data-lucide="cpu" width="16" height="16"></i>
                ROM Variant *
            </label>
            <select id="crcVariant" name="crcVariant" required>
                <option value="">Select ROM variant...</option>
                ${variants.map(v => `
                    <option value="${v.crc}">
                        ${v.region}${v.revision ? ` (${v.revision})` : ''} - CRC: ${v.crc}
                    </option>
                `).join('')}
            </select>
            <small class="form-hint">Multiple ROM versions detected. Select the one you're using.</small>
        `;
        
        baseRomGroup.after(variantGroup);
        this.initializeIcons();
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn')?.addEventListener('click', () => this.prevStep());
        document.getElementById('submitBtn')?.addEventListener('click', () => this.submit());
        
        // Step circle clicks
        document.querySelectorAll('.step-circle').forEach((circle, index) => {
            circle.addEventListener('click', () => {
                const targetStep = index + 1;
                this.navigateToStep(targetStep);
            });
        });
        
        // Form inputs - auto-save
        document.getElementById('submitForm')?.addEventListener('input', (e) => {
            this.saveFormData();
        });
        
        // Patch source toggle
        document.querySelectorAll('input[name="patchSource"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.togglePatchSource(e.target.value);
            });
        });
    }
    
    navigateToStep(targetStep) {
        if (targetStep === this.currentStep) return;
        
        // If going forward, validate all steps in between
        if (targetStep > this.currentStep) {
            for (let i = this.currentStep; i < targetStep; i++) {
                if (!this.validateStep(i)) {
                    return;
                }
            }
        }
        
        this.currentStep = targetStep;
        this.updateUI();
        this.saveFormData();
    }
    
    nextStep() {
        if (this.validateStep(this.currentStep)) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateUI();
                this.saveFormData();
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateUI();
        }
    }
    
    validateStep(step) {
        const currentStepEl = document.querySelector(`.form-step[data-step="${step}"]`);
        const requiredInputs = currentStepEl.querySelectorAll('[required]');
        
        const missingFields = [];
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = 'var(--error-color, #ef4444)';
                const label = currentStepEl.querySelector(`label[for="${input.id}"]`);
                const fieldName = label ? label.textContent.replace('*', '').trim() : input.name;
                missingFields.push({ element: input, name: fieldName });
            } else {
                input.style.borderColor = '';
            }
        });
        
        if (missingFields.length > 0) {
            this.showValidationError(missingFields);
            return false;
        }
        
        return true;
    }
    
    showValidationError(missingFields) {
        const fieldNames = missingFields.map(f => f.name).join(', ');
        const message = `Please fill in the following required field${missingFields.length > 1 ? 's' : ''}: ${fieldNames}`;
        
        if (confirm(message + '\n\nClick OK to scroll to the first missing field.')) {
            missingFields[0].element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            missingFields[0].element.focus();
        }
    }
    
    updateUI() {
        // Update steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector(`.form-step[data-step="${this.currentStep}"]`)?.classList.add('active');
        
        // Update progress
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNum = index + 1;
            if (stepNum < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNum === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        // Update progress bar width
        const progressBar = document.querySelector('.progress-steps::after');
        const progressPercent = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        document.querySelector('.progress-steps').style.setProperty('--progress-width', `${progressPercent}%`);
        
        // Update buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (prevBtn) prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-flex';
        if (nextBtn) nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'inline-flex';
        if (submitBtn) submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';
        
        // Update preview on last step
        if (this.currentStep === this.totalSteps) {
            this.renderPreview();
        }
        
        this.initializeIcons();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    togglePatchSource(source) {
        const urlGroup = document.getElementById('patchUrlGroup');
        const uploadGroup = document.getElementById('patchUploadGroup');
        
        if (source === 'url') {
            urlGroup.style.display = 'block';
            uploadGroup.style.display = 'none';
            document.getElementById('patchUrl').required = true;
            document.getElementById('patchFile').required = false;
        } else {
            urlGroup.style.display = 'none';
            uploadGroup.style.display = 'block';
            document.getElementById('patchUrl').required = false;
            document.getElementById('patchFile').required = true;
        }
    }
    
    saveFormData() {
        const form = document.getElementById('submitForm');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (key.endsWith('[]')) {
                const fieldName = key.slice(0, -2);
                if (!data[fieldName]) data[fieldName] = [];
                data[fieldName].push(value);
            } else {
                data[key] = value;
            }
        }
        
        // Process multi-checkbox fields
        ['tags', 'mechanics', 'variants', 'typeChanges'].forEach(fieldName => {
            const selected = data[fieldName] || [];
            const customInput = document.getElementById(`${fieldName}Custom`);
            if (customInput && customInput.value.trim()) {
                const customValues = customInput.value.split(',').map(v => v.trim()).filter(Boolean);
                selected.push(...customValues);
            }
            data[fieldName] = selected.join(', ');
        });
        
        this.formData = data;
        localStorage.setItem('submitFormData', JSON.stringify(data));
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem('submitFormData');
        return saved ? JSON.parse(saved) : null;
    }
    
    renderPreview() {
        const preview = document.getElementById('previewContent');
        if (!preview) return;
        
        const data = this.formData;
        const romData = this.baseRoms.find(r => r.key === data.baseRom);
        const romName = romData?.fullName || data.baseRom;
        const statusColor = STATUS_COLORS[data.status];
        
        preview.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">${data.title || 'Untitled'}</h3>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center;">
                ${renderBadge('system', romData?.system)}
                ${renderBadge('rom', romName)}
                ${data.crcVariant ? `<span class="badge" style="background: rgba(102,126,234,0.2); color: var(--text-primary);">CRC: ${data.crcVariant}</span>` : ''}
                ${renderBadge('difficulty', data.difficulty)}
                ${statusColor ? `<div class="status-indicator"><div class="status-dot" style="background: ${statusColor.bg};"></div><span>${statusColor.label}</span></div>` : ''}
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;"><strong>Author:</strong> ${data.author || 'Unknown'}</p>
            ${data.version ? `<p style="color: var(--text-secondary); margin-bottom: 1rem;"><strong>Version:</strong> ${data.version}</p>` : ''}
            ${data.released ? `<p style="color: var(--text-secondary); margin-bottom: 1rem;"><strong>Released:</strong> ${data.released}</p>` : ''}
            ${data.description ? `<p style="color: var(--text-secondary); margin-bottom: 1rem;">${data.description}</p>` : ''}
            ${data.hackType ? `<p style="color: var(--text-secondary); margin-bottom: 0.5rem;"><strong>Type:</strong> ${data.hackType}</p>` : ''}
            ${data.tags ? `<p style="color: var(--text-secondary); margin-bottom: 0.5rem;"><strong>Tags:</strong> ${data.tags}</p>` : ''}
            ${data.mechanics ? `<p style="color: var(--text-secondary); margin-bottom: 0.5rem;"><strong>Mechanics:</strong> ${data.mechanics}</p>` : ''}
            ${data.boxArt ? `<p style="color: var(--text-secondary); margin-top: 1rem;"><strong>Box Art:</strong> ${data.boxArt}</p>` : ''}
            ${data.patchUrl ? `<p style="color: var(--text-secondary);"><strong>Patch URL:</strong> ${data.patchUrl}</p>` : ''}
        `;
    }
    
    async submit() {
        if (!this.validateStep(this.currentStep)) return;
        
        this.showProgressModal();
        
        const formData = this.getFormDataWithFile();
        const result = await this.submissionHandler.submit(formData);
        
        this.hideProgressModal();
        
        if (result.success) {
            this.showSuccessModal(result.prUrl, result.prNumber);
            localStorage.removeItem('submitFormData');
        } else {
            this.showErrorModal(result.error);
        }
    }
    
    getFormDataWithFile() {
        const form = document.getElementById('submitForm');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (key === 'patchFile' && value instanceof File && value.size > 0) {
                data[key] = value;
            } else if (typeof value === 'string') {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    showProgressModal() {
        const modal = document.createElement('div');
        modal.className = 'progress-modal-overlay';
        modal.id = 'progressModal';
        modal.innerHTML = `
            <div class="progress-modal">
                <h3>Submitting to GitHub</h3>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar" style="width: 0%"></div>
                </div>
                <div class="progress-message" id="progressMessage">Initializing...</div>
            </div>
        `;
        document.body.appendChild(modal);
        
        this.submissionHandler.setProgressCallback((message, percent) => {
            const bar = document.getElementById('progressBar');
            const msg = document.getElementById('progressMessage');
            if (bar) bar.style.width = `${percent}%`;
            if (msg) msg.textContent = message;
        });
    }
    
    hideProgressModal() {
        const modal = document.getElementById('progressModal');
        if (modal) modal.remove();
    }
    
    showSuccessModal(prUrl, prNumber) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal">
                <div class="auth-modal-header">
                    <h3><i data-lucide="check-circle" width="24" height="24"></i> Submission Successful!</h3>
                </div>
                <div class="auth-modal-body">
                    <p>Your ROM hack has been submitted successfully!</p>
                    <p>Pull Request #${prNumber} has been created and is awaiting review.</p>
                    <a href="${prUrl}" target="_blank" class="auth-link">
                        <i data-lucide="external-link" width="16" height="16"></i>
                        View Pull Request
                    </a>
                </div>
                <div class="auth-modal-footer">
                    <button class="btn-primary" id="successOk">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        document.getElementById('successOk').addEventListener('click', () => {
            modal.remove();
            window.location.href = '../library/';
        });
    }
    
    showErrorModal(error) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal">
                <div class="auth-modal-header">
                    <h3><i data-lucide="alert-circle" width="24" height="24"></i> Submission Failed</h3>
                </div>
                <div class="auth-modal-body">
                    <p>There was an error submitting your ROM hack:</p>
                    <div class="auth-error">${error}</div>
                    <p style="margin-top: 1rem;">Please try again or contact support if the issue persists.</p>
                </div>
                <div class="auth-modal-footer">
                    <button class="btn-primary" id="errorOk">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        document.getElementById('errorOk').addEventListener('click', () => {
            modal.remove();
        });
    }
    
    initializeIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Initialize
function initializeSubmitForm() {
    new SubmitForm();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSubmitForm);
} else {
    initializeSubmitForm();
}
