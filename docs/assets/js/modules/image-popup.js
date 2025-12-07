// Image Popup Modal Module
export class ImagePopup {
    constructor() {
        this.modal = null;
        this.modalImage = null;
        this.init();
    }
    
    init() {
        this.createModal();
        this.setupEventListeners();
    }
    
    createModal() {
        // Remove existing modal if present
        const existing = document.getElementById('imageModal');
        if (existing) existing.remove();
        
        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; cursor: pointer;';
        
        const image = document.createElement('img');
        image.id = 'modalImage';
        image.style.cssText = 'max-width: 90%; max-height: 90%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 8px;';
        
        modal.appendChild(image);
        document.body.appendChild(modal);
        
        this.modal = modal;
        this.modalImage = image;
    }
    
    setupEventListeners() {
        if (this.modal) {
            this.modal.onclick = (e) => {
                e.stopPropagation();
                this.hide();
            };
        }
    }
    
    show(imageUrl) {
        if (this.modal && this.modalImage && imageUrl) {
            this.modalImage.src = imageUrl;
            this.modal.style.display = 'block';
        }
    }
    
    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }
}

// Global instance
export const imagePopup = new ImagePopup();