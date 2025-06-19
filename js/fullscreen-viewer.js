document.addEventListener('DOMContentLoaded', function() {
    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay';
    overlay.innerHTML = `
        <button class="close-fullscreen">×</button>
        <img class="fullscreen-image" src="" alt="Fullscreen view">
    `;
    document.body.appendChild(overlay);

    // Get all case study images
    const images = document.querySelectorAll('.slide-images img');
    
    // Add fullscreen functionality to each image
    images.forEach(img => {
        // Create container for the image
        const container = document.createElement('div');
        container.className = 'image-container';
        img.parentNode.insertBefore(container, img);
        container.appendChild(img);

        // Add fullscreen indicator
        const indicator = document.createElement('div');
        indicator.className = 'fullscreen-indicator';
        indicator.innerHTML = '<i class="fas fa-expand"></i>';
        container.appendChild(indicator);

        // Handle click events
        container.addEventListener('click', function(e) {
            if (e.target === indicator || e.target.closest('.fullscreen-indicator')) {
                const fullscreenImg = overlay.querySelector('.fullscreen-image');
                fullscreenImg.src = img.src;
                fullscreenImg.alt = img.alt;
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Close fullscreen view
    const closeButton = overlay.querySelector('.close-fullscreen');
    closeButton.addEventListener('click', function() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}); 