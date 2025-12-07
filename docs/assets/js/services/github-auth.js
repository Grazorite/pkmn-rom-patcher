// GitHub Authentication Service (PAT-based)
export class GitHubAuth {
    constructor() {
        this.tokenKey = 'gh_token';
        this.userKey = 'gh_user';
    }
    
    hasToken() {
        return !!sessionStorage.getItem(this.tokenKey);
    }
    
    getToken() {
        return sessionStorage.getItem(this.tokenKey);
    }
    
    setToken(token) {
        sessionStorage.setItem(this.tokenKey, token);
    }
    
    clearToken() {
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.userKey);
    }
    
    async validateToken(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                sessionStorage.setItem(this.userKey, JSON.stringify(user));
                return { valid: true, user };
            }
            
            return { valid: false, error: 'Invalid token' };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    getUser() {
        const userData = sessionStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }
    
    async promptForToken() {
        return new Promise((resolve) => {
            this.showTokenModal(resolve);
        });
    }
    
    showTokenModal(callback) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal">
                <div class="auth-modal-header">
                    <h3><i data-lucide="github" width="24" height="24"></i> GitHub Authentication</h3>
                    <button class="auth-modal-close" id="authModalClose">
                        <i data-lucide="x" width="20" height="20"></i>
                    </button>
                </div>
                <div class="auth-modal-body">
                    <p>To submit your ROM hack, you need a GitHub Personal Access Token (PAT).</p>
                    
                    <div class="auth-steps">
                        <div class="auth-step">
                            <div class="auth-step-number">1</div>
                            <div class="auth-step-content">
                                <strong>Create a token on GitHub</strong>
                                <a href="https://github.com/settings/tokens/new?description=ROM%20Patcher%20Submission&scopes=public_repo" 
                                   target="_blank" 
                                   class="auth-link">
                                    <i data-lucide="external-link" width="16" height="16"></i>
                                    Generate Token
                                </a>
                                <small>Required scope: <code>public_repo</code></small>
                            </div>
                        </div>
                        
                        <div class="auth-step">
                            <div class="auth-step-number">2</div>
                            <div class="auth-step-content">
                                <strong>Copy and paste your token below</strong>
                                <input type="password" 
                                       id="tokenInput" 
                                       placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                       class="auth-input">
                                <small>Token is stored only in your browser session</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="auth-error" id="authError" style="display: none;"></div>
                </div>
                <div class="auth-modal-footer">
                    <button class="btn-secondary" id="authCancel">Cancel</button>
                    <button class="btn-primary" id="authValidate">
                        <i data-lucide="check" width="16" height="16"></i>
                        Validate Token
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        const tokenInput = modal.querySelector('#tokenInput');
        const validateBtn = modal.querySelector('#authValidate');
        const cancelBtn = modal.querySelector('#authCancel');
        const closeBtn = modal.querySelector('#authModalClose');
        const errorDiv = modal.querySelector('#authError');
        
        const cleanup = () => modal.remove();
        
        const showError = (message) => {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        };
        
        validateBtn.addEventListener('click', async () => {
            const token = tokenInput.value.trim();
            
            if (!token) {
                showError('Please enter a token');
                return;
            }
            
            if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
                showError('Invalid token format');
                return;
            }
            
            validateBtn.disabled = true;
            validateBtn.innerHTML = '<i data-lucide="loader" width="16" height="16" class="spinning"></i> Validating...';
            
            const result = await this.validateToken(token);
            
            if (result.valid) {
                this.setToken(token);
                cleanup();
                callback(token);
            } else {
                validateBtn.disabled = false;
                validateBtn.innerHTML = '<i data-lucide="check" width="16" height="16"></i> Validate Token';
                showError(result.error || 'Token validation failed');
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            callback(null);
        });
        
        closeBtn.addEventListener('click', () => {
            cleanup();
            callback(null);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cleanup();
                callback(null);
            }
        });
        
        tokenInput.focus();
    }
}
