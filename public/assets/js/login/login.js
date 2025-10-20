const API_BASE_URL = 'http://localhost:3000/api';
let commissions = [];
let services = [];

// Form toggle
document.getElementById('loginToggle').addEventListener('click', () => showSection('login'));
document.getElementById('registerToggle').addEventListener('click', () => showSection('register'));

function showSection(section) {
    clearMessages();
    hideForgotPasswordLink();

    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active'));

    if (section === 'login') {
        document.getElementById('loginToggle').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerToggle').classList.add('active');
        document.getElementById('registerForm').classList.add('active');
        loadCommissionsForRegistration();
    }
}

// Password toggle
document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const input = document.getElementById(target);
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = 'ðŸ™ˆ';
        } else {
            input.type = 'password';
            btn.textContent = 'ðŸ‘';
        }
    });
});

// Messages
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('infoMessage').style.display = 'none';
    setTimeout(() => errorDiv.style.display = 'none', 8000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('infoMessage').style.display = 'none';
    setTimeout(() => successDiv.style.display = 'none', 5000);
}

function showInfo(message) {
    const infoDiv = document.getElementById('infoMessage');
    infoDiv.textContent = message;
    infoDiv.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    setTimeout(() => infoDiv.style.display = 'none', 5000);
}

function clearMessages() {
    document.querySelectorAll('.message').forEach(msg => msg.style.display = 'none');
    document.querySelectorAll('.form-control.error, .form-select.error').forEach(field => {
    field.classList.remove('error');
    });
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loadingSpinner');
    const buttons = document.querySelectorAll('.auth-btn');
    if (show) {
        loadingDiv.style.display = 'block';
        buttons.forEach(btn => btn.disabled = true);
    } else {
        loadingDiv.style.display = 'none';
        buttons.forEach(btn => btn.disabled = false);
    }
}

function showForgotPasswordLink() {
    document.getElementById('forgotPasswordLink').classList.add('show');
}

function hideForgotPasswordLink() {
    document.getElementById('forgotPasswordLink').classList.remove('show');
}

// Role change handler
document.getElementById('registerRole').addEventListener('change', function() {
    const role = this.value;
    const commissionGroup = document.getElementById('commissionGroup');
    const serviceGroup = document.getElementById('serviceGroup');

    if (role === 'adminCom') {
        commissionGroup.style.display = 'block';
        serviceGroup.style.display = 'none';
    } else if (role === 'admin') {
        commissionGroup.style.display = 'block';
        serviceGroup.style.display = 'block';
    } else {
        commissionGroup.style.display = 'none';
        serviceGroup.style.display = 'none';
    }
});

// Commission change
document.getElementById('registerCommission').addEventListener('change', loadServices);

// Load commissions
function loadCommissionsForRegistration() {
    const select = document.getElementById('registerCommission');
    select.innerHTML = '<option value="">SÃ©lectionnez une commission</option>';

    const fixedCommissions = [
        { id: 1, nom: 'EvangÃ©lisation' },
        { id: 2, nom: 'MultimÃ©dia et Audiovisuel' },
        { id: 3, nom: 'Presse et Documentation' },
        { id: 4, nom: 'ChÅ“ur' },
        { id: 5, nom: 'Accueil' },
        { id: 6, nom: 'ComptabilitÃ©' },
        { id: 7, nom: 'Organisation et Logistique' },
        { id: 8, nom: 'Liturgie MCM bÃ©nin service dÃ©lÃ©guÃ©' }
    ];

    fixedCommissions.forEach(commission => {
        const option = document.createElement('option');
        option.value = commission.id;
        option.textContent = commission.nom;
        select.appendChild(option);
    });

    commissions = fixedCommissions;
}

// Load services
function loadServices() {
    const commissionId = parseInt(document.getElementById('registerCommission').value);
    const serviceSelect = document.getElementById('registerService');
    serviceSelect.innerHTML = '<option value="">SÃ©lectionnez un service</option>';

    if (!commissionId) return;

    const servicesByCommission = {
        1: [
            { id: 1, nom: 'Intercession' },
            { id: 2, nom: 'Social et humanitaire' }
        ],
        2: [
            { id: 3, nom: 'Son et Ã©clairage' },
            { id: 4, nom: 'VidÃ©o et streaming' },
            { id: 5, nom: 'Photographie' }
        ],
        3: [
            { id: 6, nom: 'RÃ©daction' },
            { id: 7, nom: 'Archives' },
            { id: 8, nom: 'Communication' }
        ],
        4: [
            { id: 9, nom: 'Louange et adoration' },
            { id: 10, nom: 'Logistique musicale' },
            { id: 11, nom: 'Liturgie' }
        ],
        5: [
            { id: 12, nom: 'Protocole /Accueil' },
            { id: 13, nom: 'Ordre et sÃ©curitÃ©' },
            { id: 14, nom: 'Enregistrements' },
            { id: 15, nom: 'IntÃ©grations et sacrements' }
        ],
        6: [
            { id: 16, nom: 'Suivi budgÃ©taire' },
            { id: 17, nom: 'Collecte et offrande' }
        ],
        7: [
            { id: 18, nom: 'Installation et matÃ©riel' },
            { id: 19, nom: 'Transport et mobilitÃ©' },
            { id: 20, nom: 'Approvisionnement' },
            { id: 21, nom: 'PrÃ©paration des Ã©vÃ©nements' }
        ],
        8: [
            { id: 22, nom: 'CÃ©rÃ©monies' },
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
}

// Handle Login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearMessages();
    hideForgotPasswordLink();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showError('Veuillez remplir tous les champs');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Veuillez entrer une adresse email valide');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, mot_de_passe: password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (data.token) {
                localStorage.setItem('mcm_token', data.token);
            }
            if (data.user) {
                localStorage.setItem('mcm_user', JSON.stringify(data.user));
            }

            const remember = document.getElementById('rememberMe').checked;
            if (remember) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedPassword', password);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
            }

            showSuccess('Connexion rÃ©ussie ! Redirection...');

            setTimeout(() => {
                const role = data.user?.role;
                switch (role) {
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
            }, 900);
        } else {
            showError(data.error || data.message || 'Email ou mot de passe incorrect');
            document.getElementById('loginEmail').classList.add('error');
            document.getElementById('loginPassword').classList.add('error');
            setTimeout(() => showForgotPasswordLink(), 400);
        }
    } catch (err) {
        console.error('Erreur connexion:', err);
        showError(`Erreur de connexion au serveur: ${err.message}`);
    } finally {
        showLoading(false);
    }
});

// Handle Register
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearMessages();

    const nom = document.getElementById('registerNom').value.trim();
    const prenom = document.getElementById('registerPrenom').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const telephone = document.getElementById('registerTelephone').value.trim();
    const mot_de_passe = document.getElementById('registerPassword').value;
    const mot_de_passe_confirm = document.getElementById('registerConfirmPassword').value;
    const role = document.getElementById('registerRole').value;
    const commission_id = document.getElementById('registerCommission').value || null;
    const service_id = document.getElementById('registerService').value || null;

    if (!nom || !prenom || !email || !telephone || !mot_de_passe || !mot_de_passe_confirm || !role) {
        showError('Veuillez remplir tous les champs obligatoires');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Veuillez entrer une adresse email valide');
        return;
    }

    if (mot_de_passe.length < 8) {
        showError('Le mot de passe doit contenir au moins 8 caractÃ¨res');
        return;
    }

    if (mot_de_passe !== mot_de_passe_confirm) {
        showError('Les mots de passe ne correspondent pas');
        return;
    }

    if (role === 'adminCom' && !commission_id) {
        showError('Veuillez sÃ©lectionner une commission');
        return;
    }

    if (role === 'admin' && (!commission_id || !service_id)) {
        showError('Veuillez sÃ©lectionner une commission et un service');
        return;
    }

    const formData = {
        nom, prenom, email, telephone, mot_de_passe, role,
        commission_id: commission_id || null,
        service_id: service_id || null
    };

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok && (data.success || data.message)) {
            showSuccess('Compte crÃ©Ã© avec succÃ¨s ! Vous pouvez maintenant vous connecter.');
            document.getElementById('registerForm').reset();
            document.getElementById('commissionGroup').style.display = 'none';
            document.getElementById('serviceGroup').style.display = 'none';

            setTimeout(() => {
                showSection('login');
                document.getElementById('loginEmail').value = email;
            }, 1500);
        } else {
            showError(data.error || data.message || 'Erreur lors de la crÃ©ation du compte');
        }
    } catch (err) {
        console.error('Erreur inscription:', err);
        showError(`Erreur de connexion au serveur: ${err.message}`);
    } finally {
        showLoading(false);
    }
});

// Load remembered credentials
function loadRememberedCredentials() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');

    if (rememberedEmail) {
        document.getElementById('loginEmail').value = rememberedEmail;
    }
    if (rememberedPassword) {
        document.getElementById('loginPassword').value = rememberedPassword;
        document.getElementById('rememberMe').checked = true;
    }
}

// Check URL params
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    
    if (message === 'password_reset_success') {
        showSuccess('Votre mot de passe a Ã©tÃ© rÃ©initialisÃ© avec succÃ¨s ! Vous pouvez maintenant vous connecter.');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (message === 'password_changed_success') {
        showSuccess('Votre mot de passe a Ã©tÃ© changÃ© avec succÃ¨s ! Vous pouvez maintenant vous connecter.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const section = urlParams.get('section');
    if (section === 'register') showSection('register');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadRememberedCredentials();
    checkUrlParams();
});