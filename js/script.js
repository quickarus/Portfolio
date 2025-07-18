// Update copyright year
document.getElementById('current-year').textContent = new Date().getFullYear();

// Confetti effect for resume button
function triggerConfetti() {
    const count = 200;
    const defaults = {
        origin: { x: 0.33, y: 0.85 },
        spread: 180,
        ticks: 400,
        gravity: 1,
        decay: 0.99,
        startVelocity: 15,
        colors: ['#FF0000', '#FF8C00', '#FFD700', '#00FF00', '#00BFFF', '#8A2BE2', '#FF1493'],
        shapes: ['square', 'circle'],
    };

    function fire(particleRatio, opts) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
        });
    }

    fire(0.25, {
        spread: 20,
        startVelocity: 25,
    });

    fire(0.2, {
        spread: 40,
        startVelocity: 20,
    });

    fire(0.35, {
        spread: 60,
        startVelocity: 30,
        decay: 0.98
    });

    fire(0.1, {
        spread: 80,
        startVelocity: 15,
        decay: 0.98
    });

    fire(0.1, {
        spread: 80,
        startVelocity: 25,
        decay: 0.98
    });
}

// Add click event listener for resume button
document.addEventListener('DOMContentLoaded', () => {
    const resumeButton = document.querySelector('a[download].hero-resume-btn');
    if (resumeButton) {
        resumeButton.addEventListener('click', function() {
            triggerConfetti();
        });
    }
});

// Subtle parallax effect
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    document.body.style.backgroundPositionY = -(scrolled * 0.15) + 'px';
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: '0px'
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Add fade-in class to elements and observe them
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('section > .container > *');
    elements.forEach(element => {
        element.classList.add('fade-in');
        observer.observe(element);
    });
});

// Mobile menu functionality
const nav = document.querySelector('.cosmic-nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        nav.style.transform = 'translateY(-100%)';
    } else {
        nav.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

// Initialize testimonials carousel
document.addEventListener('DOMContentLoaded', () => {
    const testimonialsCarousel = new Swiper('.testimonials-carousel', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        autoplay: {
            delay: 30000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
}); 