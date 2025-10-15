// ===== SPLASH SCREEN =====
const splashContainer = document.getElementById('splashContainer');
const mainContent = document.getElementById('mainContent');
const enterButton = document.getElementById('enterButton');
const backgroundVideo = document.getElementById('backgroundVideo');

function enterSite() {
    splashContainer.classList.add('hide');
    setTimeout(() => {
        splashContainer.style.display = 'none';
        document.body.style.overflow = 'auto';
        mainContent.classList.add('show');
    }, 800);
    if (backgroundVideo) backgroundVideo.pause();
}

enterButton.addEventListener('click', enterSite);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') enterSite();
});

// ===== NAVIGATION =====
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

hamburger.addEventListener('click', function() {
    this.classList.toggle('active');
    const spans = this.querySelectorAll('span');
    if (this.classList.contains('active')) {
        spans[0].style.transform = 'translateY(6px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-6px) rotate(-45deg)';
    } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    }
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling - SEULEMENT pour les liens internes avec #
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // Ne pas bloquer les liens vers d'autres pages
        if (href === '#' || !href) {
            e.preventDefault();
            return;
        }
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Gérer spécifiquement les boutons de connexion pour éviter tout conflit
document.querySelectorAll('.login-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        // Ne rien faire ici, laisser le navigateur gérer la navigation normale
        // Cela permet au href="login.html" de fonctionner correctement
    });
});

// ===== CAROUSEL =====
const track = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('carouselDots');
const slides = document.querySelectorAll('.carousel-slide');
let currentSlide = 0;

// Create dots
slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('carousel-dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll('.carousel-dot');

function updateCarousel() {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarousel();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateCarousel();
}

nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

// Auto-play carousel
setInterval(nextSlide, 5000);

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});

// ===== RESPONSIVE STYLES =====
const style = document.createElement('style');
style.textContent = `
    .mobile-only { display: none; }
    .desktop-only { display: block; }
    
    @media (max-width: 768px) {
        .mobile-only { display: block; }
        .desktop-only { display: none; }
    }
`;
document.head.appendChild(style);