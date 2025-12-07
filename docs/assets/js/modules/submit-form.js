// Submit Form Module
import { SubmissionHandler } from '../services/submission-handler.js';

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
        await this.loadBaseRoms();
        this.setupEventListeners();
        this.updateUI();
        this.initializeIcons();
    }
    
    async loadBaseRoms() {
        // Complete list from ui-elements.css badge-rom data attributes
        this.baseRoms = [
            'Alpha Sapphire', 'Black', 'Black 2', 'Blue', 'Brilliant Diamond',
            'Colosseum', 'Conquest', 'Crystal', 'Diamond', 'Emerald',
            'Fire Emblem: The Sacred Stones', 'FireRed', 'Gold', 'Green',
            'HeartGold', 'LeafGreen', "Let's Go! Eevee", 'Moon', 'Omega Ruby',
            'Pinball', 'Platinum', 'Pokemon Mystery Dungeon: Explorers of Sky',
            'Pokemon Mystery Dungeon: Go For It! Light Adventure Squad!',
            'Pokemon Mystery Dungeon: Red Rescue Team',
            'Pokemon Mystery Dungeon: Rescue Team DX', 'Red', 'Ruby', 'Rumble',
            'Scarlet', 'Silver', 'SoulSilver', 'Super Mystery Dungeon', 'Sword',
            'Trading Card Game', 'Trading Card Game 2: The Invasion of Team GR!',
            'Ultra Moon', 'Ultra Sun', 'White', 'White 2', 'X',
            'XD: Gale of Darkness', 'Y', 'Yellow'
        ];
        this.populateBaseRomDropdown();
    }
    
    populateBaseRomDropdown() {
        const select = document.getElementById('baseRom');
        if (!select) return;
        
        this.baseRoms.forEach(rom => {
            const option = document.createElement('option');
            option.value = rom;
            option.textContent = rom;
            select.appendChild(option);
        });
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
        
        let isValid = true;
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = 'var(--error-color, #ef4444)';
                isValid = false;
            } else {
                input.style.borderColor = '';
            }
        });
        
        if (!isValid) {
            alert('Please fill in all required fields');
        }
        
        return isValid;
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
            data[key] = value;
        }
        
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
        
        preview.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">${data.title || 'Untitled'}</h3>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                ${data.baseRom ? `<span class="badge badge-rom">${data.baseRom}</span>` : ''}
                ${data.difficulty ? `<span class="badge badge-difficulty">${data.difficulty}</span>` : ''}
                ${data.status ? `<span class="badge badge-status">${data.status}</span>` : ''}
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;"><strong>Author:</strong> ${data.author || 'Unknown'}</p>
            ${data.version ? `<p style="color: var(--text-secondary); margin-bottom: 1rem;"><strong>Version:</strong> ${data.version}</p>` : ''}
            ${data.description ? `<p style="color: var(--text-secondary); margin-bottom: 1rem;">${data.description}</p>` : ''}
            ${data.boxArt ? `<p style="color: var(--text-secondary);"><strong>Box Art:</strong> ${data.boxArt}</p>` : ''}
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
