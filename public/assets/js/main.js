// ========================================
// CONFIGURATION ET VARIABLES GLOBALES
// ========================================
const CONFIG = {
    animations: {
        splashTransitionDuration: 800,
        fadeInDelay: 500,
        particleCount: 20,
        typeWriterSpeed: 100
    },
    scroll: {
        navbarThreshold: 50,
        parallaxRate: -0.5,
        heroScrollThreshold: 100
    }
};

// Cache des éléments DOM
const elements = {
    splashContainer: document.getElementById('splashContainer'),
    mainContent: document.getElementById('mainContent'),
    enterButton: document.getElementById('enterButton'),
    backgroundVideo: document.getElementById('backgroundVideo'),
    navbar: document.getElementById('navbar'),
    hamburger: document.getElementById('hamburger'),
    navMenu: document.getElementById('nav-menu'),
    hero: null // Sera initialisé plus tard
};

// ========================================
// GESTIONNAIRE D'ÉVÉNEMENTS CENTRALISÉ
// ========================================
class EventManager {
    constructor() {
        this.scrollHandlers = [];
        this.isScrolling = false;
    }

    addScrollHandler(handler) {
        this.scrollHandlers.push(handler);
    }

    handleScroll() {
        if (!this.isScrolling) {
            requestAnimationFrame(() => {
                const scrollY = window.pageYOffset;
                this.scrollHandlers.forEach(handler => handler(scrollY));
                this.isScrolling = false;
            });
            this.isScrolling = true;
        }
    }

    init() {
        window.addEventListener('scroll', () => this.handleScroll());
    }
}

const eventManager = new EventManager();

// ========================================
// MODULE SPLASH SCREEN
// ========================================
const SplashScreen = {
    init() {
        this.bindEvents();
        this.handleVideoErrors();
    },

    bindEvents() {
        // Bouton d'entrée
        elements.enterButton?.addEventListener('click', () => this.enterSite());
        
        // Touche Entrée
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.enterSite();
            }
        });
    },

    enterSite() {
        if (!elements.splashContainer) return;

        elements.splashContainer.classList.add('hide');
        
        setTimeout(() => {
            elements.splashContainer.style.display = 'none';
            document.body.style.overflow = 'auto';
            elements.mainContent?.classList.add('show');
        }, CONFIG.animations.splashTransitionDuration);

        // Arrêter la vidéo
        elements.backgroundVideo?.pause();
    },

    handleVideoErrors() {
        if (!elements.backgroundVideo) return;

        elements.backgroundVideo.addEventListener('error', () => {
            console.log('Erreur de chargement de la vidéo');
            elements.splashContainer.style.background = 
                'linear-gradient(45deg, #1e3c72, #2a5298), url("assets/img/fallback-bg.jpg") center/cover';
        });

        elements.backgroundVideo.addEventListener('canplaythrough', () => {
            elements.backgroundVideo.play().catch(error => {
                console.log('Lecture automatique bloquée par le navigateur');
            });
        });
    }
};

// ========================================
// MODULE NAVIGATION
// ========================================
const Navigation = {
    init() {
        this.bindEvents();
        this.setupScrollEffect();
        this.setupSmoothScrolling();
    },

    bindEvents() {
        // Menu mobile
        elements.hamburger?.addEventListener('click', () => {
            elements.hamburger.classList.toggle('active');
            elements.navMenu?.classList.toggle('active');
        });

        // Fermer le menu mobile sur clic d'un lien
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                elements.hamburger?.classList.remove('active');
                elements.navMenu?.classList.remove('active');
            });
        });
    },

    setupScrollEffect() {
        eventManager.addScrollHandler((scrollY) => {
            if (!elements.navbar) return;
            
            if (scrollY > CONFIG.scroll.navbarThreshold) {
                elements.navbar.classList.add('scrolled');
            } else {
                elements.navbar.classList.remove('scrolled');
            }
        });
    },

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                target?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
    }
};

// ========================================
// MODULE ANIMATIONS ET EFFETS
// ========================================
const AnimationManager = {
    init() {
        this.setupScrollAnimations();
        this.setupParallaxEffect();
        this.initializeOnLoad();
    },

    setupScrollAnimations() {
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
    },

    setupParallaxEffect() {
        eventManager.addScrollHandler((scrollY) => {
            if (!elements.hero) return;
            
            const rate = scrollY * CONFIG.scroll.parallaxRate;
            elements.hero.style.transform = `translateY(${rate}px)`;

            // Gestion de la classe scrolled
            if (scrollY > CONFIG.scroll.heroScrollThreshold) {
                elements.hero.classList.add('scrolled');
            } else {
                elements.hero.classList.remove('scrolled');
            }
        });
    },

    initializeOnLoad() {
        window.addEventListener('load', () => {
            this.animateContent();
            this.createParticles();
            this.setupCardEffects();
        });
    },

    animateContent() {
        // Animation du contenu splash
        setTimeout(() => {
            const splashContent = document.querySelector('.splash-content');
            if (splashContent) {
                splashContent.style.animation = 'fadeInUp 1.5s ease-out';
            }
        }, CONFIG.animations.fadeInDelay);

        // Animation du contenu hero
        const heroElements = document.querySelectorAll('.hero-content > *');
        heroElements.forEach((el, index) => {
            el.style.animationDelay = `${index * 0.2}s`;
            el.style.animation = 'fadeInUp 1s ease-out forwards';
        });

        // Animation des cartes flottantes
        const cards = document.querySelectorAll('.floating-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.3}s`;
            card.style.opacity = '0';
            card.style.animation = `slideInRight 1s ease-out ${index * 0.3}s forwards, floatCard${index + 1} 8s ease-in-out ${index * 2}s infinite`;
        });
    },

    createParticles() {
        if (!elements.hero) return;

        for (let i = 0; i < CONFIG.animations.particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 15}s`;
            particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
            elements.hero.appendChild(particle);
        }
    },

    setupCardEffects() {
        document.querySelectorAll('.floating-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-15px) scale(1.05) rotate(2deg)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    },

    // Effet de machine à écrire (optionnel)
    typeWriterEffect() {
        const title = document.querySelector('.hero-title');
        if (!title) return;

        const text = title.textContent;
        title.textContent = '';
        title.style.opacity = '1';

        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                title.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, CONFIG.animations.typeWriterSpeed);
    }
};

// ========================================
// MODULE DE PRÉCHARGEMENT
// ========================================
const PreloadManager = {
    init() {
        window.addEventListener('load', () => {
            this.preloadMainContent();
        });
    },

    preloadMainContent() {
        if (!elements.mainContent) return;

        const preloadContent = document.createElement('div');
        preloadContent.innerHTML = elements.mainContent.innerHTML;
        preloadContent.style.display = 'none';
        document.body.appendChild(preloadContent);
    }
};

// ========================================
// INITIALISATION PRINCIPALE
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le cache des éléments
    elements.hero = document.querySelector('.hero');

    // Initialiser tous les modules
    eventManager.init();
    SplashScreen.init();
    Navigation.init();
    AnimationManager.init();
    PreloadManager.init();

    console.log('Application initialisée avec succès');
});

// ========================================
// UTILITAIRES (optionnel)
// ========================================
const Utils = {
    // Fonction pour activer l'effet typewriter
    enableTypeWriter() {
        setTimeout(() => {
            AnimationManager.typeWriterEffect();
        }, 500);
    },

    // Fonction pour déboguer les performances
    logPerformance() {
        console.log('Scroll handlers actifs:', eventManager.scrollHandlers.length);
    }
};