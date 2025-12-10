// URL validation utilities
export class UrlValidator {
    static validateHttps(url) {
        if (!url) return true; // Empty URLs are valid (optional fields)
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
    
    static async validateAccessibility(url) {
        if (!url) return { valid: true };
        
        return new Promise(resolve => {
            setTimeout(async () => {
                try {
                    const response = await fetch(url, { 
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: AbortSignal.timeout(3000)
                    });
                    resolve({ valid: true, status: response.status });
                } catch (error) {
                    resolve({ valid: false, error: error.message });
                }
            }, 100);
        });
    }
    
    static addValidationIndicator(input) {
        const indicator = document.createElement('div');
        indicator.className = 'url-validation-indicator';
        indicator.innerHTML = '<i data-lucide="loader" width="16" height="16"></i>';
        input.parentNode.appendChild(indicator);
        return indicator;
    }
    
    static updateValidationIndicator(indicator, isValid, message = '') {
        const icon = isValid ? 'check-circle' : 'x-circle';
        const color = isValid ? 'var(--success-color)' : 'var(--error-color)';
        indicator.innerHTML = `<i data-lucide="${icon}" width="16" height="16" style="color: ${color}"></i>`;
        indicator.title = message;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}