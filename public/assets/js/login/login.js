// Configuration API
const API_BASE_URL = 'http://localhost:3000/api';

// Variables globales
let commissions = [];
let services = [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadRememberedCredentials();
    
    // Event listeners pour les formulaires
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
});

// Navigation entre les formulaires
function showLogin(event) {
    event.preventDefault();
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(section => (section.style.display = 'none'));

    event.target.classList.add('active');
    document.getElementById('loginForm').style.display = 'block';
    clearMessages();
}

function showRegister(event) {
    event.preventDefault();
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(section => (section.style.display = 'none'));

    event.target.classList.add('active');
    document.getElementById('registerForm').style.display = 'block';
    clearMessages();

    // Charger les commissions fixes pour l'inscription
    loadCommissionsForRegistration();
}

// Toggle visibilité mot de passe
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;

    if (field.type === 'password') {
        field.type = 'text';
        button.textContent = '🙈';
    } else {
        field.type = 'password';
        button.textContent = '👁';
    }
}

// Gestion changement rôle inscription
function handleRoleChange() {
    const role = document.getElementById('registerRole').value;
    const commissionGroup = document.getElementById('commissionGroup');
    const serviceGroup = document.getElementById('serviceGroup');

    if (role === 'adminCom') {
        commissionGroup.style.display = 'block';
        serviceGroup.style.display = 'none';
        document.getElementById('registerService').value = '';
    } else if (role === 'admin') {
        commissionGroup.style.display = 'block';
        serviceGroup.style.display = 'block';
    } else {
        commissionGroup.style.display = 'none';
        serviceGroup.style.display = 'none';
        document.getElementById('registerCommission').value = '';
        document.getElementById('registerService').value = '';
    }
}

// Charger commissions pour inscription (sans token)
function loadCommissionsForRegistration() {
    const select = document.getElementById('registerCommission');
    select.innerHTML = '<option value="">Sélectionnez une commission</option>';

    // Options fixes prédéfinies
    const fixedCommissions = [
        { id: 1, nom: 'Evangélisation' },
        { id: 2, nom: 'Multimédia et Audiovisuel' },
        { id: 3, nom: 'Presse et Documentation' },
        { id: 4, nom: 'Chœur' },
        { id: 5, nom: 'Accueil' },
        { id: 6, nom: 'Comptabilité' },
        { id: 7, nom: 'Organisation et Logistique' },
        { id: 8, nom: 'Liturgie MCM bénin service délégué' }
    ];

    fixedCommissions.forEach(commission => {
        const option = document.createElement('option');
        option.value = commission.id;
        option.textContent = commission.nom;
        select.appendChild(option);
    });

    commissions = fixedCommissions;
}

// Charger services par commission (pour inscription)
function loadServices() {
    const commissionId = document.getElementById('registerCommission').value;
    const serviceSelect = document.getElementById('registerService');
    serviceSelect.innerHTML = '<option value="">Sélectionnez un service</option>';

    if (!commissionId) return;

    // Services prédéfinis par commission
    const servicesByCommission = {
        1: [ // Evangélisation
            { id: 1, nom: 'Prédication' },
            { id: 2, nom: 'Formation biblique' },
            { id: 3, nom: 'Missions' }
        ],
        2: [ // Multimédia et Audiovisuel
            { id: 4, nom: 'Son et éclairage' },
            { id: 5, nom: 'Vidéo et streaming' },
            { id: 6, nom: 'Photographie' }
        ],
        3: [ // Presse et Documentation
            { id: 7, nom: 'Rédaction' },
            { id: 8, nom: 'Archives' },
            { id: 9, nom: 'Communication' }
        ],
        4: [ // Chœur
            { id: 10, nom: 'Chant principal' },
            { id: 11, nom: 'Instruments' },
            { id: 12, nom: 'Direction musicale' }
        ],
        5: [ // Accueil
            { id: 13, nom: 'Réception' },
            { id: 14, nom: 'Orientation' },
            { id: 15, nom: 'Information' }
        ],
        6: [ // Comptabilité
            { id: 16, nom: 'Trésorerie' },
            { id: 17, nom: 'Budget' },
            { id: 18, nom: 'Contrôle' }
        ],
        7: [ // Organisation et Logistique
            { id: 19, nom: 'Événements' },
            { id: 20, nom: 'Matériel' },
            { id: 21, nom: 'Transport' }
        ],
        8: [ // Liturgie MCM bénin service délégué
            { id: 22, nom: 'Cérémonies' },
            { id: 23, nom: 'Protocole' },
            { id: 24, nom: 'Sacristie' }
        ]
    };

    const servicesForCommission = servicesByCommission[commissionId] || [];
    
    servicesForCommission.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.nom;
        serviceSelect.appendChild(option);
    });

    services = servicesForCommission;
}

// Gestion connexion
async function handleLogin(e) {
    e.preventDefault();
    clearMessages();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        showError('Veuillez remplir tous les champs');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, mot_de_passe: password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (document.getElementById('rememberMe').checked) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedPassword', password);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
            }

            showSuccess('Connexion réussie ! Redirection...');

            setTimeout(() => {
                switch (data.user.role) {
                    case 'superadmin':
                        window.location.href = 'superadmin.html';
                        break;
                    case 'adminCom':
                        window.location.href = 'adminCom.html';
                        break;
                    case 'admin':
                        window.location.href = 'admin.html';
                        break;
                    default:
                        window.location.href = 'dashboard.html';
                }
            }, 1500);
        } else {
            showError(data.error || 'Erreur de connexion');
            if (data.error && (data.error.includes('Email') || data.error.includes('mot de passe'))) {
                document.getElementById('loginEmail').classList.add('error');
                document.getElementById('loginPassword').classList.add('error');
            }
        }
    } catch (err) {
        showError('Erreur de connexion au serveur');
        console.error(err);
    } finally {
        showLoading(false);
    }
}

// Gestion inscription
async function handleRegister(e) {
    e.preventDefault();
    clearMessages();

    const formData = {
        nom: document.getElementById('registerNom').value.trim(),
        prenom: document.getElementById('registerPrenom').value.trim(),
        email: document.getElementById('registerEmail').value.trim(),
        mot_de_passe: document.getElementById('registerPassword').value.trim(),
        role: document.getElementById('registerRole').value,
        commission_id: document.getElementById('registerCommission').value || null,
        service_id: document.getElementById('registerService').value || null
    };

    // Validation des champs
    if (!formData.nom || !formData.prenom || !formData.email || !formData.mot_de_passe || !formData.role) {
        showError('Veuillez remplir tous les champs obligatoires');
        return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showError('Veuillez entrer une adresse email valide');
        return;
    }

    // Validation mot de passe
    if (formData.mot_de_passe.length < 6) {
        showError('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    if (formData.role === 'adminCom' && !formData.commission_id) {
        showError('Veuillez sélectionner une commission pour un admin de commission');
        return;
    }

    if (formData.role === 'admin' && (!formData.commission_id || !formData.service_id)) {
        showError('Veuillez sélectionner une commission et un service pour un admin de service');
        return;
    }

    showLoading(true);

    try {
        // Inscription sans token - l'inscription est publique
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');

            document.getElementById('registerForm').reset();
            handleRoleChange(); // Masquer les champs conditionnels

            setTimeout(() => {
                showLogin(new Event('click'));
            }, 2000);
        } else {
            showError(data.error || 'Erreur lors de la création du compte');
            
            // Gestion des erreurs spécifiques
            if (data.error && data.error.includes('email')) {
                document.getElementById('registerEmail').classList.add('error');
            }
        }
    } catch (err) {
        showError('Erreur de connexion au serveur. Veuillez réessayer.');
        console.error('Erreur inscription:', err);
    } finally {
        showLoading(false);
    }
}

// Charger identifiants mémorisés
function loadRememberedCredentials() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');

    if (rememberedEmail && rememberedPassword) {
        document.getElementById('loginEmail').value = rememberedEmail;
        document.getElementById('loginPassword').value = rememberedPassword;
        document.getElementById('rememberMe').checked = true;
    }
}

// Afficher message erreur
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';

    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 7000);
}

// Afficher message succès
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';

    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 5000);
}

// Nettoyer messages et erreurs visuelles
function clearMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    document.querySelectorAll('.form-control.error, .form-select.error').forEach(field => {
        field.classList.remove('error');
    });
}

// Afficher ou cacher spinner et désactiver boutons
function showLoading(show) {
    const loadingDiv = document.getElementById('loadingSpinner');
    const forms = document.querySelectorAll('.form-section');
    const buttons = document.querySelectorAll('.auth-btn');

    if (show) {
        loadingDiv.style.display = 'block';
        forms.forEach(form => (form.style.opacity = '0.5'));
        buttons.forEach(btn => (btn.disabled = true));
    } else {
        loadingDiv.style.display = 'none';
        forms.forEach(form => (form.style.opacity = '1'));
        buttons.forEach(btn => (btn.disabled = false));
    }
}