const API_BASE_URL = 'http://localhost:3000/api';
let commissions = [];
let services = [];

// ========================================
// 🎨 SYSTÈME DE SELECT PERSONNALISÉ
// ========================================
class CustomSelect {
    constructor(selectElement) {
        this.selectElement = selectElement;
        this.options = Array.from(selectElement.options);
        this.selectedIndex = selectElement.selectedIndex;
        
        this.createCustomSelect();
        this.addEventListeners();
    }

    createCustomSelect() {
        // Créer le wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'custom-select-wrapper';
        
        // Créer le bouton principal
        this.button = document.createElement('div');
        this.button.className = 'custom-select';
        this.button.innerHTML = `
            <span class="custom-select-text placeholder">${this.options[0]?.text || 'Sélectionner...'}</span>
            <span class="custom-select-arrow">▼</span>
        `;
        
        // Créer le dropdown
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'custom-select-dropdown';
        
        // Insérer le custom select après le select natif
        this.selectElement.parentNode.insertBefore(this.wrapper, this.selectElement.nextSibling);
        this.wrapper.appendChild(this.button);
        this.wrapper.appendChild(this.dropdown);
        
        // Remplir les options
        this.updateOptions();
    }

    updateOptions() {
        this.dropdown.innerHTML = '';
        this.options = Array.from(this.selectElement.options);
        
        this.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-select-option';
            optionDiv.textContent = option.text;
            optionDiv.dataset.value = option.value;
            optionDiv.dataset.index = index;
            
            if (index === this.selectedIndex) {
                optionDiv.classList.add('selected');
            }
            
            optionDiv.addEventListener('click', () => this.selectOption(index));
            this.dropdown.appendChild(optionDiv);
        });
    }

    selectOption(index) {
        this.selectedIndex = index;
        this.selectElement.selectedIndex = index;
        
        const selectedOption = this.options[index];
        const textSpan = this.button.querySelector('.custom-select-text');
        
        if (selectedOption.value === '') {
            textSpan.textContent = selectedOption.text;
            textSpan.classList.add('placeholder');
        } else {
            textSpan.textContent = selectedOption.text;
            textSpan.classList.remove('placeholder');
        }
        
        // Mettre à jour les classes selected
        this.dropdown.querySelectorAll('.custom-select-option').forEach((opt, i) => {
            opt.classList.toggle('selected', i === index);
        });
        
        this.close();
        
        // Déclencher l'événement change
        const event = new Event('change', { bubbles: true });
        this.selectElement.dispatchEvent(event);
    }

    toggle() {
        if (this.dropdown.classList.contains('show')) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        // Fermer tous les autres selects
        document.querySelectorAll('.custom-select.active').forEach(select => {
            if (select !== this.button) {
                select.classList.remove('active');
                select.nextElementSibling.classList.remove('show');
            }
        });
        
        this.button.classList.add('active');
        this.dropdown.classList.add('show');
    }

    close() {
        this.button.classList.remove('active');
        this.dropdown.classList.remove('show');
    }

    addEventListeners() {
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Fermer au clic à l'extérieur
        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target)) {
                this.close();
            }
        });
    }

    refresh() {
        this.updateOptions();
        
        // Mettre à jour le texte du bouton
        const selectedOption = this.options[this.selectElement.selectedIndex];
        const textSpan = this.button.querySelector('.custom-select-text');
        
        if (selectedOption && selectedOption.value !== '') {
            textSpan.textContent = selectedOption.text;
            textSpan.classList.remove('placeholder');
        } else {
            textSpan.textContent = selectedOption?.text || 'Sélectionner...';
            textSpan.classList.add('placeholder');
        }
    }

    destroy() {
        this.wrapper.remove();
    }
}

// Instances des custom selects
let roleSelect, commissionSelect, serviceSelect;

// Initialiser les custom selects
function initializeCustomSelects() {
    const roleNative = document.getElementById('registerRole');
    const commissionNative = document.getElementById('registerCommission');
    const serviceNative = document.getElementById('registerService');
    
    if (roleNative && !roleSelect) {
        roleSelect = new CustomSelect(roleNative);
    }
    if (commissionNative && !commissionSelect) {
        commissionSelect = new CustomSelect(commissionNative);
    }
    if (serviceNative && !serviceSelect) {
        serviceSelect = new CustomSelect(serviceNative);
    }
}

// ========================================
// GESTION DES SECTIONS
// ========================================
document.getElementById('loginToggle').addEventListener('click', () => showSection('login'));
document.getElementById('registerToggle').addEventListener('click', () => showSection('register'));

function showSection(section) {
    clearMessages();
    hideForgotPasswordLink();
    hideNoServicesMessage();

    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active'));

    if (section === 'login') {
        document.getElementById('loginToggle').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerToggle').classList.add('active');
        document.getElementById('registerForm').classList.add('active');
        loadCommissionsForRegistration();
        
        // Initialiser les custom selects après un petit délai
        setTimeout(() => {
            initializeCustomSelects();
        }, 100);
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

// ========================================
// MESSAGES
// ========================================
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

// ========================================
// 🔄 LOADING OVERLAY COMPLET
// ========================================
function showLoading(show) {
    const loadingDiv = document.getElementById('loadingSpinner');
    const buttons = document.querySelectorAll('.auth-btn');
    
    if (show) {
        loadingDiv.classList.add('show');
        buttons.forEach(btn => btn.disabled = true);
        document.body.style.overflow = 'hidden';
    } else {
        loadingDiv.classList.remove('show');
        buttons.forEach(btn => btn.disabled = false);
        document.body.style.overflow = '';
    }
}

function showForgotPasswordLink() {
    document.getElementById('forgotPasswordLink').classList.add('show');
}

function hideForgotPasswordLink() {
    document.getElementById('forgotPasswordLink').classList.remove('show');
}

// ========================================
// ⚠️ MESSAGE PAS DE SERVICES
// ========================================
function showNoServicesMessage() {
    let messageDiv = document.getElementById('noServicesMessage');
    
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'noServicesMessage';
        messageDiv.className = 'no-services-message';
        messageDiv.innerHTML = `
            <div class="icon">⚠️</div>
            <div class="content">
                <h4>Aucun service disponible</h4>
                <p>Cette commission n'a pas encore de services. La création de compte pour cette commission n'est pas possible actuellement. Veuillez contacter l'administrateur.</p>
            </div>
        `;
        
        const commissionGroup = document.getElementById('commissionGroup');
        commissionGroup.parentNode.insertBefore(messageDiv, commissionGroup.nextSibling);
    }
    
    messageDiv.classList.add('show');
    
    const submitBtn = document.querySelector('#registerForm .auth-btn');
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
}

function hideNoServicesMessage() {
    const messageDiv = document.getElementById('noServicesMessage');
    if (messageDiv) {
        messageDiv.classList.remove('show');
    }
    
    const submitBtn = document.querySelector('#registerForm .auth-btn');
    submitBtn.disabled = false;
    submitBtn.style.opacity = '';
    submitBtn.style.cursor = '';
}

// ========================================
// MODAL DE COMPTE SUPPRIMÉ
// ========================================
function showAccountDeletedModal(email) {
    let modal = document.getElementById('accountDeletedModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'accountDeletedModal';
        modal.className = 'error-modal';
        modal.innerHTML = `
            <div class="error-modal-content">
                <div class="error-modal-header">
                    <i class="fas fa-exclamation-triangle">⚠️</i>
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
                        ✖ Fermer
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('deletedAccountEmail').textContent = email;
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

document.addEventListener('click', function(e) {
    const modal = document.getElementById('accountDeletedModal');
    if (modal && e.target === modal) {
        closeAccountDeletedModal();
    }
});

// ========================================
// GESTION DES RÔLES ET COMMISSIONS
// ========================================
document.getElementById('registerRole').addEventListener('change', function() {
    const role = this.value;
    const commissionGroup = document.getElementById('commissionGroup');
    const serviceGroup = document.getElementById('serviceGroup');

    hideNoServicesMessage();

    if (role === 'adminCom') {
        commissionGroup.style.display = 'block';
        serviceGroup.style.display = 'none';
        document.getElementById('registerCommission').value = '';
        document.getElementById('registerService').innerHTML = '<option value="">Sélectionnez un service</option>';
        
        if (commissionSelect) commissionSelect.refresh();
        if (serviceSelect) serviceSelect.refresh();
    } else if (role === 'admin') {
        commissionGroup.style.display = 'block';
        serviceGroup.style.display = 'block';
        document.getElementById('registerCommission').value = '';
        document.getElementById('registerService').innerHTML = '<option value="">Sélectionnez un service</option>';
        
        if (commissionSelect) commissionSelect.refresh();
        if (serviceSelect) serviceSelect.refresh();
    } else {
        commissionGroup.style.display = 'none';
        serviceGroup.style.display = 'none';
    }
});

document.getElementById('registerCommission').addEventListener('change', loadServices);

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================
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
    
    if (commissionSelect) {
        commissionSelect.refresh();
    }
}

function loadServices() {
    const commissionId = parseInt(document.getElementById('registerCommission').value);
    const serviceSelect = document.getElementById('registerService');
    serviceSelect.innerHTML = '<option value="">Sélectionnez un service</option>';

    hideNoServicesMessage();

    if (!commissionId) {
        if (window.serviceSelect) {
            window.serviceSelect.refresh();
        }
        return;
    }

    const servicesByCommission = {
        1: [
            { id: 1, nom: 'Intercession' },
            { id: 2, nom: 'Social et humanitaire' }
        ],
        2: [],
        3: [],
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
        8: []
    };

    const servicesForCommission = servicesByCommission[commissionId] || [];
    
    if (servicesForCommission.length === 0) {
        showNoServicesMessage();
        if (window.serviceSelect) {
            window.serviceSelect.refresh();
        }
        return;
    }

    servicesForCommission.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.nom;
        serviceSelect.appendChild(option);
    });
    
    if (window.serviceSelect) {
        window.serviceSelect.refresh();
    }
}

// ========================================
// HANDLE LOGIN
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

        if (response.status === 404) {
            showLoading(false);
            showAccountDeletedModal(email);
            return;
        }

        if (response.status === 401) {
            showLoading(false);
            showError(data.error || 'Email ou mot de passe incorrect');
            document.getElementById('loginEmail').classList.add('error');
            document.getElementById('loginPassword').classList.add('error');
            setTimeout(() => showForgotPasswordLink(), 400);
            return;
        }

        if (response.status === 403) {
            showLoading(false);
            showError('Votre compte a été désactivé. Contactez l\'administrateur.');
            return;
        }

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
            showError(data.error || data.message || 'Erreur de connexion');
        }
    } catch (err) {
        console.error('Erreur connexion:', err);
        showError(`Erreur de connexion au serveur: ${err.message}`);
    } finally {
        showLoading(false);
    }
});

// ========================================
// HANDLE REGISTER
// ========================================
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearMessages();
    hideNoServicesMessage();

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
            
            if (roleSelect) roleSelect.refresh();
            if (commissionSelect) commissionSelect.refresh();
            if (serviceSelect) serviceSelect.refresh();

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

// ========================================
// UTILITAIRES
// ========================================
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

// ========================================
// INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadRememberedCredentials();
    checkUrlParams();
    injectModalStyles();
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm && registerForm.classList.contains('active')) {
        initializeCustomSelects();
    }
});