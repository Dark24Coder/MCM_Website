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
            btn.textContent = '🙈';
        } else {
            input.type = 'password';
            btn.textContent = '👁';
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

// ========================================
// MODAL DE COMPTE SUPPRIMÉ
// ========================================
function showAccountDeletedModal(email) {
    // Créer la modal si elle n'existe pas
    let modal = document.getElementById('accountDeletedModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'accountDeletedModal';
        modal.className = 'error-modal';
        modal.innerHTML = `
            <div class="error-modal-content">
                <div class="error-modal-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Compte Supprimé ou Inexistant</h2>
                </div>
                <div class="error-modal-body">
                    <p>Votre compte n'existe plus dans le système ou a été supprimé par un administrateur.</p>
                    <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le SuperAdmin pour plus d'informations.</p>
                    <div class="contact-info">
                        <p><strong>Email du compte:</strong> <span id="deletedAccountEmail"></span></p>
                        <p><strong>Contact SuperAdmin:</strong></p>
                        <p>📧 admin@mcm.com</p>
                        <p>📞 +229 XX XX XX XX</p>
                    </div>
                </div>
                <div class="error-modal-footer">
                    <button onclick="closeAccountDeletedModal()" class="btn-close-modal">
                        <i class="fas fa-times"></i> Fermer
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Mettre à jour l'email
    document.getElementById('deletedAccountEmail').textContent = email;
    
    // Afficher la modal
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeAccountDeletedModal() {
    const modal = document.getElementById('accountDeletedModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// Fermer la modal en cliquant en dehors
document.addEventListener('click', function(e) {
    const modal = document.getElementById('accountDeletedModal');
    if (modal && e.target === modal) {
        closeAccountDeletedModal();
    }
});

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
    select.innerHTML = '<option value="">Sélectionnez une commission</option>';

    const fixedCommissions = [
        { id: 1, nom: 'Évangélisation' },
        { id: 2, nom: 'Multimédia et Audiovisuel' },
        { id: 3, nom: 'Presse et Documentation' },
        { id: 4, nom: 'Chœur' },
        { id: 5, nom: 'Accueil' },
        { id: 6, nom: 'Comptabilité' },
        { id: 7, nom: 'Organisation et Logistique' },
        { id: 8, nom: 'Liturgie MCM Bénin Service Délégué' }
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
    serviceSelect.innerHTML = '<option value="">Sélectionnez un service</option>';

    if (!commissionId) return;

    const servicesByCommission = {
        1: [
            { id: 1, nom: 'Intercession' },
            { id: 2, nom: 'Social et humanitaire' }
        ],
        2: [
            { id: 3, nom: 'Son et éclairage' },
            { id: 4, nom: 'Vidéo et streaming' },
            { id: 5, nom: 'Photographie' }
        ],
        3: [
            { id: 6, nom: 'Rédaction' },
            { id: 7, nom: 'Archives' },
            { id: 8, nom: 'Communication' }
        ],
        4: [
            { id: 9, nom: 'Louange et adoration' },
            { id: 10, nom: 'Logistique musicale' },
            { id: 11, nom: 'Liturgie' }
        ],
        5: [
            { id: 12, nom: 'Protocole/Accueil' },
            { id: 13, nom: 'Ordre et sécurité' },
            { id: 14, nom: 'Enregistrements' },
            { id: 15, nom: 'Intégrations et sacrements' }
        ],
        6: [
            { id: 16, nom: 'Suivi budgétaire' },
            { id: 17, nom: 'Collecte et offrande' }
        ],
        7: [
            { id: 18, nom: 'Installation et matériel' },
            { id: 19, nom: 'Transport et mobilité' },
            { id: 20, nom: 'Approvisionnement' },
            { id: 21, nom: 'Préparation des événements' }
        ],
        8: [
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
}

// ========================================
// HANDLE LOGIN - AVEC GESTION COMPTE SUPPRIMÉ
// ========================================
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

        // ✅ GESTION DU COMPTE SUPPRIMÉ (404)
        if (response.status === 404) {
            showLoading(false);
            showAccountDeletedModal(email);
            return;
        }

        // ✅ GESTION MOT DE PASSE INCORRECT (401)
        if (response.status === 401) {
            showLoading(false);
            showError(data.error || 'Email ou mot de passe incorrect');
            document.getElementById('loginEmail').classList.add('error');
            document.getElementById('loginPassword').classList.add('error');
            setTimeout(() => showForgotPasswordLink(), 400);
            return;
        }

        // ✅ GESTION COMPTE INACTIF (403)
        if (response.status === 403) {
            showLoading(false);
            showError('Votre compte a été désactivé. Contactez l\'administrateur.');
            return;
        }

        // ✅ CONNEXION RÉUSSIE
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

            showSuccess('Connexion réussie ! Redirection...');

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
            // Autres erreurs
            showError(data.error || data.message || 'Erreur de connexion');
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
        showError('Le mot de passe doit contenir au moins 8 caractères');
        return;
    }

    if (mot_de_passe !== mot_de_passe_confirm) {
        showError('Les mots de passe ne correspondent pas');
        return;
    }

    if (role === 'adminCom' && !commission_id) {
        showError('Veuillez sélectionner une commission');
        return;
    }

    if (role === 'admin' && (!commission_id || !service_id)) {
        showError('Veuillez sélectionner une commission et un service');
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
            showSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
            document.getElementById('registerForm').reset();
            document.getElementById('commissionGroup').style.display = 'none';
            document.getElementById('serviceGroup').style.display = 'none';

            setTimeout(() => {
                showSection('login');
                document.getElementById('loginEmail').value = email;
            }, 1500);
        } else {
            showError(data.error || data.message || 'Erreur lors de la création du compte');
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
        showSuccess('Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (message === 'password_changed_success') {
        showSuccess('Votre mot de passe a été changé avec succès ! Vous pouvez maintenant vous connecter.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const section = urlParams.get('section');
    if (section === 'register') showSection('register');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadRememberedCredentials();
    checkUrlParams();
    
    // Injecter les styles de la modal
    injectModalStyles();
});

// ========================================
// STYLES POUR LA MODAL DE COMPTE SUPPRIMÉ
// ========================================
function injectModalStyles() {
    if (document.getElementById('accountDeletedModalStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'accountDeletedModalStyles';
    styles.textContent = `
        .error-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        .error-modal.show {
            opacity: 1;
            pointer-events: auto;
        }

        .error-modal-content {
            background: white;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            overflow: hidden;
        }

        @keyframes slideUp {
            from {
                transform: translateY(50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .error-modal-header {
            background: linear-gradient(135deg, #E60012, #B8000E);
            color: white;
            padding: 2rem;
            text-align: center;
        }

        .error-modal-header i {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .error-modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
        }

        .error-modal-body {
            padding: 2rem;
        }

        .error-modal-body p {
            color: #374151;
            line-height: 1.6;
            margin-bottom: 1rem;
        }

        .contact-info {
            background: #F8F9FA;
            padding: 1.5rem;
            border-radius: 12px;
            margin-top: 1.5rem;
            border-left: 4px solid #E60012;
        }

        .contact-info p {
            margin: 0.5rem 0;
            color: #1F2937;
        }

        .contact-info strong {
            color: #E60012;
        }

        .error-modal-footer {
            padding: 1.5rem 2rem 2rem;
            text-align: center;
        }

        .btn-close-modal {
            padding: 0.875rem 2rem;
            background: #E60012;
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-close-modal:hover {
            background: #B8000E;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(230, 0, 18, 0.3);
        }

        @media (max-width: 768px) {
            .error-modal-content {
                width: 95%;
            }
        }
    `;
    document.head.appendChild(styles);
}