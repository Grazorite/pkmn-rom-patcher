// Back to Top Button
(function() {
    // Create button
    const button = document.createElement('button');
    button.className = 'back-to-top';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = '<i data-lucide="arrow-up" width="24" height="24"></i>';
    document.body.appendChild(button);
    
    // Show/hide based on scroll position
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (window.scrollY > 300) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        }, 100);
    });
    
    // Scroll to top on click
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Initialize icon
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
})();
