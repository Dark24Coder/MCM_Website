// Variables
const splashContainer = document.getElementById('splashContainer');
const mainContent = document.getElementById('mainContent');
const enterButton = document.getElementById('enterButton');
const backgroundVideo = document.getElementById('backgroundVideo');

// Fonction pour entrer dans le site
function enterSite() {
// Cacher le splash screen
    splashContainer.classList.add('hide');
    
// Afficher le contenu principal après la transition
    setTimeout(() => {
        splashContainer.style.display = 'none';
        document.body.style.overflow = 'auto';
        mainContent.classList.add('show');
    }, 800);

// Arrêter la vidéo pour économiser les ressources
    backgroundVideo.pause();
}

// Événement clic sur le bouton
    enterButton.addEventListener('click', enterSite);

// Événement clavier (touche Entrée)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        enterSite();
    }
});

// Gérer les erreurs de chargement vidéo
    backgroundVideo.addEventListener('error', function() {
    console.log('Erreur de chargement de la vidéo');
// Vous pouvez ajouter une image de fond de secours ici
    splashContainer.style.background = 'linear-gradient(45deg, #1e3c72, #2a5298), url("assets/img/fallback-bg.jpg") center/cover';
});

// Assurer que la vidéo démarre automatiquement
    backgroundVideo.addEventListener('canplaythrough', function() {
        backgroundVideo.play().catch(function(error) {
        console.log('Lecture automatique bloquée par le navigateur');
    });
});

// Animation d'entrée retardée pour le contenu
    window.addEventListener('load', function() {
        setTimeout(() => {
        document.querySelector('.splash-content').style.animation = 'fadeInUp 1.5s ease-out';
    }, 500);
});

// Précharger le contenu principal
    window.addEventListener('load', function() {
        const preloadContent = document.createElement('div');
        preloadContent.innerHTML = mainContent.innerHTML;
        preloadContent.style.display = 'none';
        document.body.appendChild(preloadContent);
});

// Navigation scroll effect
    window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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

// Scroll animations
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

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = translateY(`${scrolled * 0.5}px`);
    }
});

// Add hover effects to floating cards
document.querySelectorAll('.floating-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-10px) scale(1.05)';
});
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});


