// ========================================
// CONFIGURATION & VARIABLES GLOBALES
// ========================================
const API_BASE = '/api';
let token = null;
let currentUser = null;
let currentEditingMember = null;
let currentSection = 'dashboard';
let allMembers = [];
let filteredMembers = [];
let allServices = [];
let allCommissions = [];
let selectedMembers = [];
let currentPage = 1;
const membersPerPage = 10;

// Messages d'accueil aléatoires
const welcomeMessages = [
    {
        title: "Bienvenue dans votre espace SuperAdmin ! 🎯",
        subtitle: "Pilotez l'ensemble de l'organisation MCM avec efficacité"
    },
    {
        title: "Excellente journée à vous ! ⭐",
        subtitle: "Votre leadership fait la différence dans l'organisation"
    },
    {
        title: "Ravi de vous revoir ! 👋",
        subtitle: "Continuez votre excellent travail de supervision"
    },
    {
        title: "Bonjour SuperAdmin ! 🚀",
        subtitle: "Ensemble, construisons une organisation forte et unie"
    },
    {
        title: "Prêt à accomplir de grandes choses ! ✨",
        subtitle: "L'organisation compte sur votre dévouement"
    },
    {
        title: "Une nouvelle journée pleine d'opportunités ! 🌟",
        subtitle: "Supervisez et développez l'organisation avec passion"
    }
];

// ========================================
// UTILITAIRES
// ========================================
const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
});

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-message">${message}</div>
    `;

    document.getElementById('toastContainer').appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showSuccessAnimation() {
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        const icon = button.querySelector('i');
        if (icon) icon.className = 'fas fa-spinner fa-spin';
    } else {
        button.disabled = false;
        const icon = button.querySelector('i');
        if (icon) {
            if (button.id === 'addMemberBtn') icon.className = 'fas fa-plus';
            else if (button.id === 'createUserBtn') icon.className = 'fas fa-user-plus';
            else if (button.id === 'updateProfileBtn') icon.className = 'fas fa-save';
        }
    }
}

function getRoleDisplayName(role) {
    const roles = {
        'admin': 'Admin de Service',
        'adminCom': 'Admin de Commission',
        'superadmin': 'SuperAdmin'
    };
    return roles[role] || role;
}

function displayRandomWelcome() {
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    document.getElementById('welcomeMessage').textContent = randomMessage.title;
    document.getElementById('welcomeSubtext').textContent = randomMessage.subtitle;
}

// ========================================
// GESTION DES ANNIVERSAIRES
// ========================================
function checkBirthdays() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    const birthdayPeople = [];

    // Vérifier les membres
    allMembers.forEach(member => {
        if (member.date_naissance) {
            const birthDate = new Date(member.date_naissance);
            if (birthDate.getMonth() + 1 === currentMonth && birthDate.getDate() === currentDay) {
                birthdayPeople.push({
                    type: 'member',
                    name: `${member.prenom} ${member.nom}`,
                    age: today.getFullYear() - birthDate.getFullYear()
                });
            }
        }
    });

    // Afficher les notifications d'anniversaire
    const container = document.getElementById('birthdayNotifications');
    if (container) {
        if (birthdayPeople.length > 0) {
            let html = '';
            birthdayPeople.forEach(person => {
                html += `
                    <div class="birthday-notification">
                        <div class="birthday-icon">
                            <i class="fas fa-birthday-cake"></i>
                        </div>
                        <div class="birthday-content">
                            <h3>🎉 Joyeux Anniversaire !</h3>
                            <p><strong>${person.name}</strong> fête ses ${person.age} ans aujourd'hui !</p>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
            
            // Toast de notification
            birthdayPeople.forEach(person => {
                showToast(`🎂 C'est l'anniversaire de ${person.name} aujourd'hui !`, 'info');
            });
        } else {
            container.innerHTML = '';
        }
    }
}

// ========================================
// INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    token = window.localStorage.getItem('mcm_token');
    
    if (!token || token === 'null' || token === 'undefined') {
        window.location.href = './login.html';
        return;
    }
    
    await initializeApp();
});

async function initializeApp() {
    try {
        displayRandomWelcome();
        await loadCurrentUser();
        await loadCommissions();
        await loadServices();
        await loadAllMembers();
        await loadDashboardData();
        checkBirthdays();
        initializeEventListeners();
    } catch (error) {
        console.error('Erreur initialisation:', error);
        showToast('Erreur lors de l\'initialisation', 'error');
    }
}

function initializeEventListeners() {
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleSidebar);
    }

    document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
    document.getElementById('manageUserForm').addEventListener('submit', handleCreateUser);
    document.getElementById('editMemberForm').addEventListener('submit', handleEditMember);
    document.getElementById('userProfileForm').addEventListener('submit', handleUpdateProfile);

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });

    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.getElementById('hamburger');
        if (window.innerWidth <= 1024 && 
            sidebar && hamburger &&
            !sidebar.contains(e.target) && 
            !hamburger.contains(e.target) &&
            sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    });
}

// ========================================
// GESTION UTILISATEUR
// ========================================
async function loadCurrentUser() {
    try {
        const userDataString = window.localStorage.getItem('mcm_user');
        
        if (userDataString && userDataString !== 'null' && userDataString !== 'undefined') {
            currentUser = JSON.parse(userDataString);
        } else {
            currentUser = {
                nom: 'Admin',
                prenom: 'Principal',
                email: 'admin@mcm.com',
                role: 'superadmin'
            };
        }

        updateUserDisplay();
        
    } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
        currentUser = {
            nom: 'Admin',
            prenom: 'Principal',
            email: 'admin@mcm.com',
            role: 'superadmin'
        };
        updateUserDisplay();
    }
}

function updateUserDisplay() {
    const displayName = `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || 'Admin';
    document.getElementById('userName').textContent = displayName;
    
    const initials = (currentUser.prenom?.[0] || '') + (currentUser.nom?.[0] || '') || 'SA';
    document.getElementById('userInitials').textContent = initials.toUpperCase();

    document.getElementById('profileNom').value = currentUser.nom || '';
    document.getElementById('profilePrenom').value = currentUser.prenom || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('updateProfileBtn');
    setButtonLoading(btn, true);

    const profileData = {
        nom: document.getElementById('profileNom').value,
        prenom: document.getElementById('profilePrenom').value,
        email: document.getElementById('profileEmail').value
    };

    const password = document.getElementById('profilePassword').value;
    if (password) {
        profileData.mot_de_passe = password;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });

        if (response.ok) {
            currentUser = { ...currentUser, ...profileData };
            window.localStorage.setItem('mcm_user', JSON.stringify(currentUser));
            updateUserDisplay();
            
            showSuccessAnimation();
            showToast('Profil mis à jour avec succès!', 'success');
            closeUserProfileModal();
        } else {
            showToast('Erreur lors de la mise à jour du profil', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la mise à jour du profil', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

function openUserProfile() {
    document.getElementById('userProfileModal').classList.add('show');
}

function closeUserProfileModal() {
    document.getElementById('userProfileModal').classList.remove('show');
}

async function logout() {
    if (!confirm('Êtes-vous sûr de vouloir vous déconnecter?')) return;
    
    window.localStorage.removeItem('mcm_token');
    window.localStorage.removeItem('mcm_user');
    showToast('Déconnexion réussie', 'info');
    setTimeout(() => {
        window.location.href = './login.html';
    }, 1000);
}

// ========================================
// GESTION DES SECTIONS
// ========================================
function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const sectionMap = {
        'dashboard': 'dashboardSection',
        'members': 'membersSection',
        'addMember': 'addMemberSection',
        'services': 'servicesSection',
        'commissions': 'commissionsSection',
        'administrators': 'administratorsSection',
        'addAdmin': 'addAdminSection',
        'reports': 'reportsSection'
    };
    
    const sectionId = sectionMap[sectionName];
    const sectionElement = document.getElementById(sectionId);
    
    if (sectionElement) {
        sectionElement.classList.add('active');
        currentSection = sectionName;
        
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }
        
        if (sectionName === 'members') {
            displayMembers();
        } else if (sectionName === 'administrators') {
            loadAdministrators();
        } else if (sectionName === 'reports') {
            updateReportsStats();
        }
        
        if (window.innerWidth <= 1024) {
            toggleSidebar();
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    
    if (sidebar && hamburger) {
        sidebar.classList.toggle('open');
        hamburger.classList.toggle('active');
        
        const mobileItems = document.querySelectorAll('.mobile-only');
        mobileItems.forEach(item => {
            if (window.innerWidth <= 1024) {
                item.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
            }
        });
    }
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================
async function loadDashboardData() {
    try {
        const usersRes = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
        const users = await usersRes.json();

        document.getElementById('totalMembers').textContent = allMembers.length;
        document.getElementById('totalAdmins').textContent = users.filter(u => u.role === 'admin' || u.role === 'adminCom').length;
        document.getElementById('totalSuperadmins').textContent = users.filter(u => u.role === 'superadmin').length;
        document.getElementById('totalServices').textContent = allServices.length;

    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

async function loadCommissions() {
    try {
        const response = await fetch(`${API_BASE}/commissions`, {
            headers: getAuthHeaders()
        });
        allCommissions = await response.json();

        const commissionsGrid = document.getElementById('commissionsGrid');
        const commissionSelects = ['memberCommission', 'userCommission', 'editMemberCommission'];
        
        if (commissionsGrid) {
            commissionsGrid.innerHTML = '';
            allCommissions.forEach(commission => {
                const card = document.createElement('div');
                card.className = 'custom-card';
                card.innerHTML = `
                    <div class="custom-card-title">${commission.nom}</div>
                    <div class="custom-card-footer">
                        <i class="fas fa-sitemap"></i>
                        ${commission.nom}
                    </div>
                `;
                commissionsGrid.appendChild(card);
            });
        }

        commissionSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Choisir une commission</option>';
                allCommissions.forEach(commission => {
                    const option = document.createElement('option');
                    option.value = commission.id;
                    option.textContent = commission.nom;
                    select.appendChild(option);
                });
            }
        });

    } catch (error) {
        console.error('Erreur chargement commissions:', error);
    }
}

async function loadServices() {
    try {
        const response = await fetch(`${API_BASE}/services`, {
            headers: getAuthHeaders()
        });
        allServices = await response.json();

        const servicesGrid = document.getElementById('servicesGrid');
        
        if (servicesGrid) {
            servicesGrid.innerHTML = '';
            allServices.forEach(service => {
                const card = document.createElement('div');
                card.className = 'custom-card';
                card.innerHTML = `
                    <div class="custom-card-title">${service.nom}</div>
                    <div class="custom-card-subtitle">${service.commission_nom || 'Commission non définie'}</div>
                    <div class="custom-card-footer">
                        <i class="fas fa-users"></i>
                        <span id="members-count-${service.id}">0</span> membres
                    </div>
                `;
                servicesGrid.appendChild(card);

                loadServiceMemberCount(service.id);
            });
        }

    } catch (error) {
        console.error('Erreur chargement services:', error);
    }
}

async function loadServiceMemberCount(serviceId) {
    try {
        const response = await fetch(`${API_BASE}/membres/service/${serviceId}`, {
            headers: getAuthHeaders()
        });
        const members = await response.json();
        const countEl = document.getElementById(`members-count-${serviceId}`);
        if (countEl) countEl.textContent = members.length;
    } catch (error) {
        console.error(`Erreur comptage membres service ${serviceId}:`, error);
    }
}

// Filtrer les services par commission
function filterServicesByCommission(commissionSelectId, serviceSelectId) {
    const commissionId = parseInt(document.getElementById(commissionSelectId).value);
    const serviceSelect = document.getElementById(serviceSelectId);
    
    if (!serviceSelect) return;
    
    serviceSelect.innerHTML = '<option value="">Sélectionner un service</option>';
    
    if (!commissionId) {
        serviceSelect.innerHTML = '<option value="">Choisir d\'abord une commission</option>';
        return;
    }
    
    const filteredServices = allServices.filter(s => s.commission_id === commissionId);
    
    if (filteredServices.length === 0) {
        serviceSelect.innerHTML = '<option value="">Aucun service dans cette commission</option>';
        return;
    }
    
    filteredServices.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.nom;
        serviceSelect.appendChild(option);
    });
}

// ========================================
// GESTION DES MEMBRES
// ========================================
async function loadAllMembers() {
    try {
        const response = await fetch(`${API_BASE}/membres`, {
            headers: getAuthHeaders()
        });
        allMembers = await response.json();
        
        // Enrichir avec le nom du service
        for (let member of allMembers) {
            const service = allServices.find(s => s.id === member.service_id);
            if (service) {
                member.service_nom = service.nom;
            }
        }
        
        filteredMembers = [...allMembers];
        displayMembers();
        
    } catch (error) {
        console.error('Erreur chargement membres:', error);
    }
}

function displayMembers() {
    const container = document.getElementById('membersTableContainer');
    if (!container) return;
    
    if (filteredMembers.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: var(--gray); padding: 3rem;">
                <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; display: block;"></i>
                Aucun membre trouvé.
            </p>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    const startIndex = (currentPage - 1) * membersPerPage;
    const endIndex = startIndex + membersPerPage;
    const paginated = filteredMembers.slice(startIndex, endIndex);
    
    let html = `
        <table class="members-table">
            <thead>
                <tr>
                    <th><input type="checkbox" onchange="toggleSelectAll(this)"></th>
                    <th>Membre</th>
                    <th>Service</th>
                    <th>Sexe</th>
                    <th>Contact</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    paginated.forEach(member => {
        const initials = `${member.nom.charAt(0)}${member.prenom.charAt(0)}`;
        html += `
            <tr>
                <td><input type="checkbox" class="member-checkbox" value="${member.id}" onchange="updateDeleteButton()"></td>
                <td>
                    <div class="member-info-cell">
                        <div class="member-avatar-small">${initials}</div>
                        <div>
                            <div class="member-name-text">${member.nom} ${member.prenom}</div>
                            <div class="member-email-text">${member.email || 'Pas d\'email'}</div>
                        </div>
                    </div>
                </td>
                <td>${member.service_nom || 'Non défini'}</td>
                <td>
                    <span class="member-badge ${member.sexe.toLowerCase()}">
                        <i class="fas fa-${member.sexe === 'Homme' ? 'male' : 'female'}"></i>
                        ${member.sexe}
                    </span>
                </td>
                <td>
                    <div style="font-size: 0.875rem; color: var(--gray);">
                        <i class="fas fa-phone" style="color: var(--primary-red);"></i>
                        ${member.telephone || 'Non renseigné'}
                    </div>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-edit" onclick="editMember(${member.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteMember(${member.id})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span style="padding: 0.5rem;">...</span>`;
        }
    }
    
    html += `
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayMembers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterMembers() {
    const searchTerm = document.getElementById('searchMembers').value.toLowerCase();
    
    filteredMembers = allMembers.filter(member => {
        const fullName = `${member.nom} ${member.prenom}`.toLowerCase();
        const email = (member.email || '').toLowerCase();
        const service = (member.service_nom || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
            email.includes(searchTerm) || 
            service.includes(searchTerm);
    });
    
    currentPage = 1;
    displayMembers();
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.member-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    updateDeleteButton();
}

function updateDeleteButton() {
    const checkboxes = document.querySelectorAll('.member-checkbox:checked');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    
    if (deleteBtn) {
        if (checkboxes.length > 0) {
            deleteBtn.style.display = 'flex';
            deleteBtn.querySelector('span').textContent = `Supprimer (${checkboxes.length})`;
        } else {
            deleteBtn.style.display = 'none';
        }
    }
}

async function deleteSelectedMembers() {
    const checkboxes = document.querySelectorAll('.member-checkbox:checked');
    const memberIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (memberIds.length === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${memberIds.length} membre(s) ?`)) return;

    try {
        for (const id of memberIds) {
            await fetch(`${API_BASE}/membres/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
        }
        
        showSuccessAnimation();
        showToast(`${memberIds.length} membre(s) supprimé(s) avec succès!`, 'warning');
        await loadAllMembers();
        await loadDashboardData();
        updateDeleteButton();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

async function handleAddMember(e) {
    e.preventDefault();
    const btn = document.getElementById('addMemberBtn');
    setButtonLoading(btn, true);

    const serviceId = document.getElementById('memberService').value;
    
    if (!serviceId) {
        showToast('Veuillez sélectionner un service', 'error');
        setButtonLoading(btn, false);
        return;
    }

    const memberData = {
        service_id: parseInt(serviceId),
        nom: document.getElementById('memberNom').value.trim(),
        prenom: document.getElementById('memberPrenom').value.trim(),
        sexe: document.getElementById('memberSexe').value,
        date_naissance: document.getElementById('memberDateNaissance').value,
        email: document.getElementById('memberEmail').value.trim() || null,
        telephone: document.getElementById('memberTelephone').value.trim() || null
    };

    try {
        const response = await fetch(`${API_BASE}/membres`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(memberData)
        });

        if (response.ok) {
            showSuccessAnimation();
            showToast('Membre ajouté avec succès!', 'success');
            document.getElementById('addMemberForm').reset();
            await loadAllMembers();
            await loadDashboardData();
        } else {
            const error = await response.json();
            showToast('Erreur: ' + (error.error || 'Erreur inconnue'), 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de l\'ajout du membre', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function editMember(memberId) {
    try {
        const member = allMembers.find(m => m.id === memberId);
        
        if (!member) {
            showToast('Membre non trouvé', 'error');
            return;
        }
        
        currentEditingMember = memberId;

        // Trouver la commission du service
        const service = allServices.find(s => s.id === member.service_id);
        if (service && service.commission_id) {
            document.getElementById('editMemberCommission').value = service.commission_id;
            filterServicesByCommission('editMemberCommission', 'editMemberService');
        }
        
        document.getElementById('editMemberService').value = member.service_id || '';
        document.getElementById('editMemberNom').value = member.nom || '';
        document.getElementById('editMemberPrenom').value = member.prenom || '';
        document.getElementById('editMemberSexe').value = member.sexe || '';
        
        let dateValue = member.date_naissance;
        if (dateValue && dateValue.includes('T')) {
            dateValue = dateValue.split('T')[0];
        }
        document.getElementById('editMemberDateNaissance').value = dateValue || '';
        document.getElementById('editMemberEmail').value = member.email || '';
        document.getElementById('editMemberTelephone').value = member.telephone || '';

        document.getElementById('editMemberModal').classList.add('show');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur de chargement', 'error');
    }
}

async function handleEditMember(e) {
    e.preventDefault();
    if (!currentEditingMember) return;

    const memberData = {
        service_id: parseInt(document.getElementById('editMemberService').value),
        nom: document.getElementById('editMemberNom').value.trim(),
        prenom: document.getElementById('editMemberPrenom').value.trim(),
        sexe: document.getElementById('editMemberSexe').value,
        date_naissance: document.getElementById('editMemberDateNaissance').value,
        email: document.getElementById('editMemberEmail').value.trim() || null,
        telephone: document.getElementById('editMemberTelephone').value.trim() || null
    };

    try {
        const response = await fetch(`${API_BASE}/membres/${currentEditingMember}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(memberData)
        });

        if (response.ok) {
            showSuccessAnimation();
            showToast('Membre modifié avec succès!', 'success');
            closeEditMemberModal();
            await loadAllMembers();
            await loadDashboardData();
        } else {
            const error = await response.json();
            showToast('Erreur: ' + (error.error || 'Erreur inconnue'), 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la modification du membre', 'error');
    }
}

function closeEditMemberModal() {
    document.getElementById('editMemberModal').classList.remove('show');
    currentEditingMember = null;
}

async function deleteMember(memberId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;

    try {
        const response = await fetch(`${API_BASE}/membres/${memberId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showSuccessAnimation();
            showToast('Membre supprimé avec succès!', 'warning');
            await loadAllMembers();
            await loadDashboardData();
        } else {
            const error = await response.json();
            showToast('Erreur: ' + (error.error || 'Erreur inconnue'), 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// ========================================
// GESTION DES ADMINISTRATEURS
// ========================================
function handleRoleChange() {
    const role = document.getElementById('userRole').value;
    const commissionGroup = document.getElementById('commissionGroup');
    const serviceGroup = document.getElementById('serviceGroup');
    const userCommission = document.getElementById('userCommission');
    const userService = document.getElementById('userService');

    if (role === 'adminCom') {
        commissionGroup.style.display = 'block';
        serviceGroup.style.display = 'none';
        if (userCommission) userCommission.required = true;
        if (userService) userService.required = false;
    } else if (role === 'admin') {
        commissionGroup.style.display = 'block';
        serviceGroup.style.display = 'block';
        if (userCommission) userCommission.required = true;
        if (userService) userService.required = true;
    } else {
        commissionGroup.style.display = 'none';
        serviceGroup.style.display = 'none';
        if (userCommission) userCommission.required = false;
        if (userService) userService.required = false;
    }
}

async function handleCreateUser(e) {
    e.preventDefault();
    const btn = document.getElementById('createUserBtn');
    setButtonLoading(btn, true);

    const role = document.getElementById('userRole').value;
    const nom = document.getElementById('userNom').value.trim();
    const prenom = document.getElementById('userPrenom').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;

    if (!nom || !prenom || !email || !password || !role) {
        showToast('Tous les champs obligatoires doivent être remplis', 'error');
        setButtonLoading(btn, false);
        return;
    }

    const userData = {
        nom: nom,
        prenom: prenom,
        email: email,
        mot_de_passe: password,
        role: role
    };

    // Ajouter commission_id pour adminCom et admin
    if (role === 'adminCom' || role === 'admin') {
        const commissionId = document.getElementById('userCommission').value;
        if (!commissionId) {
            showToast('Veuillez sélectionner une commission', 'error');
            setButtonLoading(btn, false);
            return;
        }
        userData.commission_id = parseInt(commissionId);
    }

    // Ajouter service_id pour admin
    if (role === 'admin') {
        const serviceId = document.getElementById('userService').value;
        if (!serviceId) {
            showToast('Veuillez sélectionner un service', 'error');
            setButtonLoading(btn, false);
            return;
        }
        userData.service_id = parseInt(serviceId);
    }

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            showSuccessAnimation();
            showToast('Utilisateur créé avec succès!', 'success');
            document.getElementById('manageUserForm').reset();
            handleRoleChange();
            await loadDashboardData();
        } else {
            const error = await response.json();
            showToast('Erreur: ' + (error.error || 'Erreur lors de la création'), 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la création de l\'utilisateur', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function loadAdministrators() {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: getAuthHeaders()
        });
        const users = await response.json();
        const administrators = users.filter(u => u.role === 'admin' || u.role === 'adminCom' || u.role === 'superadmin');

        displayAdministrators(administrators);
        
    } catch (error) {
        console.error('Erreur chargement administrateurs:', error);
        showToast('Erreur lors du chargement des administrateurs', 'error');
    }
}

function displayAdministrators(administrators) {
    const container = document.getElementById('administratorsBody');
    if (!container) return;

    container.innerHTML = '';

    if (administrators.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 2rem;">Aucun administrateur trouvé</p>';
        return;
    }

    const adminList = document.createElement('div');
    adminList.className = 'member-list';

    administrators.forEach(admin => {
        const adminDiv = document.createElement('div');
        adminDiv.className = 'member-item admin';
        adminDiv.innerHTML = `
            <div class="member-info">
                <h4><i class="fas fa-shield-alt" style="color: var(--primary-red);"></i> ${admin.nom} ${admin.prenom}</h4>
                <div class="member-details">
                    <div class="member-detail">
                        <i class="fas fa-envelope"></i>
                        <span>${admin.email}</span>
                    </div>
                    <div class="member-detail">
                        <i class="fas fa-user-tag"></i>
                        <span>${getRoleDisplayName(admin.role)}</span>
                    </div>
                </div>
            </div>
        `;
        adminList.appendChild(adminDiv);
    });

    container.appendChild(adminList);
}

function filterAdministrators() {
    const searchTerm = document.getElementById('searchAdmins').value.toLowerCase();
    
    fetch(`${API_BASE}/users`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(users => {
            const administrators = users.filter(u => {
                const isAdmin = u.role === 'admin' || u.role === 'adminCom' || u.role === 'superadmin';
                const fullName = `${u.nom} ${u.prenom}`.toLowerCase();
                const email = (u.email || '').toLowerCase();
                const role = getRoleDisplayName(u.role).toLowerCase();
                
                return isAdmin && (
                    fullName.includes(searchTerm) || 
                    email.includes(searchTerm) || 
                    role.includes(searchTerm)
                );
            });
            
            displayAdministrators(administrators);
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
}

// ========================================
// STATISTIQUES ET RAPPORTS
// ========================================
function updateReportsStats() {
    const total = allMembers.length;
    const males = allMembers.filter(m => m.sexe === 'Homme').length;
    const females = allMembers.filter(m => m.sexe === 'Femme').length;
    
    document.getElementById('reportTotalMembers').textContent = total;
    document.getElementById('reportMalePercent').textContent = total > 0 ? Math.round((males / total) * 100) + '%' : '0%';
    document.getElementById('reportFemalePercent').textContent = total > 0 ? Math.round((females / total) * 100) + '%' : '0%';
    
    // Calcul de l'âge moyen
    if (total > 0) {
        const avgAge = Math.round(allMembers.reduce((sum, m) => {
            if (m.date_naissance) {
                const birthDate = new Date(m.date_naissance);
                const age = new Date().getFullYear() - birthDate.getFullYear();
                return sum + age;
            }
            return sum;
        }, 0) / total);
        document.getElementById('reportAvgAge').textContent = avgAge + ' ans';
    } else {
        document.getElementById('reportAvgAge').textContent = '0 ans';
    }

    // Statistiques supplémentaires
    const emailCount = allMembers.filter(m => m.email && m.email.trim()).length;
    const phoneCount = allMembers.filter(m => m.telephone && m.telephone.trim()).length;
    const completionRate = total > 0 ? Math.round(((emailCount + phoneCount) / (total * 2)) * 100) : 0;

    document.getElementById('reportEmailCount').textContent = emailCount;
    document.getElementById('reportPhoneCount').textContent = phoneCount;
    document.getElementById('reportCompletionRate').textContent = completionRate + '%';

    // Répartition par service
    displayServiceStats();
}

function displayServiceStats() {
    const container = document.getElementById('serviceStatsGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    allServices.forEach(service => {
        const serviceMembers = allMembers.filter(m => m.service_id === service.id);
        const males = serviceMembers.filter(m => m.sexe === 'Homme').length;
        const females = serviceMembers.filter(m => m.sexe === 'Femme').length;
        
        const card = document.createElement('div');
        card.style.cssText = 'padding: 1.5rem; background: var(--white); border: 2px solid var(--light-gray); border-radius: 12px;';
        
        card.innerHTML = `
            <h4 style="font-weight: 700; margin-bottom: 1rem; color: var(--primary-red);">
                <i class="fas fa-cog"></i> ${service.nom}
            </h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="color: var(--gray);">Total:</span>
                <strong>${serviceMembers.length}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="color: var(--info);"><i class="fas fa-male"></i> Hommes:</span>
                <strong>${males}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #EC4899;"><i class="fas fa-female"></i> Femmes:</span>
                <strong>${females}</strong>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ========================================
// RESPONSIVE
// ========================================
window.addEventListener('resize', function() {
    const mobileItems = document.querySelectorAll('.mobile-only');
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    
    if (window.innerWidth > 1024) {
        if (sidebar) sidebar.classList.remove('open');
        if (hamburger) hamburger.classList.remove('active');
        mobileItems.forEach(el => el.style.display = 'none');
    }
});