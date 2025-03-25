// Initialize Swiper
const swiper = new Swiper('.case-study-carousel', {
    // Optional parameters
    loop: true,
    
    // Pagination
    pagination: {
        el: '.swiper-pagination',
        clickable: true
    },
    
    // Navigation arrows
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    
    // Responsive breakpoints
    breakpoints: {
        // when window width is >= 768px
        768: {
            slidesPerView: 1,
            spaceBetween: 30
        }
    },
    
    // Auto height
    autoHeight: true,
    
    // Effect
    effect: 'fade',
    fadeEffect: {
        crossFade: true
    }
});

// Update copyright year
document.getElementById('current-year').textContent = new Date().getFullYear(); 