// Configuration
const API_BASE = '/api';
let currentUser = null;
let authToken = localStorage.getItem('mcm_token');
let services = [];
let allMembers = [];
let currentSection = 'dashboard';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Token récupéré:', authToken);
    
    if (!authToken || authToken === 'null' || authToken === 'undefined') {
        console.log('Pas de token valide, redirection vers login');
        window.location.href = './login.html';
        return;
    }
            
    console.log('✅ Token présent, chargement du dashboard AdminCom');
    initializeApp();
});

async function initializeApp() {
    try {
        await loadUserProfile();
        await loadServices();
        initializeEventListeners();
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        showToast('Erreur lors de l\'initialisation', 'error');
    }
}

// Section Management
function showSection(sectionName) {
    console.log('📍 Affichage section:', sectionName);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
            
    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
            
    // Show selected section
    const sectionMap = {
        'dashboard': 'dashboardSection',
        'services': 'servicesSection',
        'members': 'membersSection'
    };
            
    const sectionId = sectionMap[sectionName];
    const sectionElement = document.getElementById(sectionId);
            
    if (sectionElement) {
        sectionElement.classList.add('active');
        currentSection = sectionName;
        
        // Update active sidebar link
        event.currentTarget.classList.add('active');
                
        // Close sidebar on mobile
        if (window.innerWidth <= 1024) {
            toggleSidebar();
        }
    }
}

        // Event Listeners
        function initializeEventListeners() {
            // Hamburger menu
            const hamburger = document.getElementById('hamburger');
            if (hamburger) {
                hamburger.addEventListener('click', toggleSidebar);
            }

            // Forms
            document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
            document.getElementById('profileForm').addEventListener('submit', handleUpdateProfile);
            document.getElementById('editMemberForm').addEventListener('submit', handleEditMember);

            // Close modals on outside click
            window.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    e.target.classList.remove('active');
                }
            });

            // Close sidebar on outside click (mobile)
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

        // Sidebar Toggle
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const hamburger = document.getElementById('hamburger');
            
            if (sidebar && hamburger) {
                sidebar.classList.toggle('open');
                hamburger.classList.toggle('active');
                
                // Show/hide logout in sidebar on mobile
                const mobileLogout = document.querySelector('.mobile-only');
                if (mobileLogout && window.innerWidth <= 1024) {
                    mobileLogout.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
                }
            }
        }

        // Load User Profile
        async function loadUserProfile() {
            try {
                console.log('📋 Chargement du profil utilisateur AdminCom');
                const userDataString = localStorage.getItem('mcm_user');
                
                if (!userDataString || userDataString === 'null' || userDataString === 'undefined') {
                    console.log('❌ Pas de données utilisateur');
                    document.getElementById('userName').textContent = 'AdminCom';
                    document.getElementById('userInitials').textContent = 'AC';
                    document.getElementById('welcomeName').textContent = 'Administrateur';
                    
                    currentUser = {
                        nom: 'Admin',
                        prenom: 'Commission',
                        email: 'admincom@mcm.com',
                        commission_id: 1
                    };
                    return;
                }
                
                const userData = JSON.parse(userDataString);
                console.log('✅ Données utilisateur parsées:', userData);
                currentUser = userData;
                
                const fullName = `${userData.prenom} ${userData.nom}`;
                document.getElementById('userName').textContent = fullName;
                document.getElementById('welcomeName').textContent = fullName;
                
                const initials = `${userData.prenom.charAt(0)}${userData.nom.charAt(0)}`;
                document.getElementById('userInitials').textContent = initials.toUpperCase();
                
                // Fill profile form
                document.getElementById('profileNom').value = userData.nom || '';
                document.getElementById('profilePrenom').value = userData.prenom || '';
                document.getElementById('profileEmail').value = userData.email || '';
                
                // Load commission name if available
                if (userData.commission_id) {
                    await loadCommissionName(userData.commission_id);
                }
                
            } catch (error) {
                console.error('❌ Erreur lors du chargement du profil:', error);
                showToast('Erreur lors du chargement du profil', 'error');
            }
        }

        async function loadCommissionName(commissionId) {
            try {
                const response = await fetch(`${API_BASE}/commissions`, {
                    headers: getAuthHeaders()
                });
                
                if (response.ok) {
                    const commissions = await response.json();
                    const commission = commissions.find(c => c.id === commissionId);
                    if (commission) {
                        document.getElementById('commissionName').textContent = commission.nom;
                    }
                }
            } catch (error) {
                console.error('Erreur chargement nom commission:', error);
            }
        }

        // Profile Modal
        function openProfileModal() {
            const modal = document.getElementById('profileModal');
            if (modal) {
                modal.classList.add('active');
            }
        }

        function closeProfileModal() {
            const modal = document.getElementById('profileModal');
            if (modal) {
                modal.classList.remove('active');
            }
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
                    currentUser.nom = profileData.nom;
                    currentUser.prenom = profileData.prenom;
                    currentUser.email = profileData.email;
                    localStorage.setItem('mcm_user', JSON.stringify(currentUser));
                    
                    showSuccessAnimation();
                    showToast('Profil mis à jour avec succès!', 'success');
                    await loadUserProfile();
                    closeProfileModal();
                } else {
                    const result = await response.json();
                    throw new Error(result.error || 'Erreur lors de la modification');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur lors de la mise à jour: ' + error.message, 'error');
            } finally {
                setButtonLoading(btn, false);
            }
        }

        // Load Services - CORRECTION DE L'ERREUR 500
        async function loadServices() {
            try {
                console.log('📋 Début du chargement des services');
                
                if (!currentUser || !currentUser.commission_id) {
                    console.error('❌ Commission ID manquante');
                    showToast('Erreur: Commission ID non trouvée', 'error');
                    return;
                }

                console.log('🔍 Chargement services pour commission ID:', currentUser.commission_id);

                // Charger TOUS les services d'abord
                const response = await fetch(`${API_BASE}/services`, {
                    headers: getAuthHeaders()
                });
                
                console.log('📡 Réponse API services:', response.status);
                
                if (response.status === 401) {
                    console.log('❌ Token expiré, redirection');
                    localStorage.removeItem('mcm_token');
                    localStorage.removeItem('mcm_user');
                    window.location.href = './login.html';
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                
                const allServices = await response.json();
                
                // Filtrer les services de la commission
                services = allServices.filter(s => s.commission_id === currentUser.commission_id);
                
                console.log('✅ Services récupérés:', services);
                
                displayServices();
                populateServiceSelect();
                await loadAllMembers();
                updateStats();
                
            } catch (error) {
                console.error('❌ Erreur chargement services:', error);
                showToast('Erreur lors du chargement des services: ' + error.message, 'error');
            }
        }

        function displayServices() {
            const container = document.getElementById('servicesGrid');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (services.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray);">
                        <i class="fas fa-cogs" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <p>Aucun service trouvé dans votre commission.</p>
                    </div>
                `;
                return;
            }
            
            services.forEach(service => {
                const serviceCard = document.createElement('div');
                serviceCard.className = 'service-card';
                serviceCard.onclick = () => openServiceModal(service);
                
                serviceCard.innerHTML = `
                    <div class="service-card-header">
                        <div class="service-icon">${service.nom.charAt(0)}</div>
                        <div>
                            <div class="service-title">${service.nom}</div>
                        </div>
                    </div>
                    <div class="service-details">
                        <div class="service-detail" id="count-${service.id}">
                            <i class="fas fa-users"></i>
                            <span>Chargement...</span>
                        </div>
                    </div>
                `;
                container.appendChild(serviceCard);
                
                loadServiceMemberCount(service.id);
            });
        }

        async function loadServiceMemberCount(serviceId) {
            try {
                const response = await fetch(`${API_BASE}/membres/service/${serviceId}`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const members = await response.json();
                    const countElement = document.getElementById(`count-${serviceId}`);
                    if (countElement) {
                        countElement.innerHTML = `
                            <i class="fas fa-users"></i>
                            <span>${members.length} membre(s)</span>
                        `;
                    }
                }
            } catch (error) {
                console.error('Erreur comptage membres:', error);
            }
        }

        function populateServiceSelect() {
            const select = document.getElementById('serviceSelect');
            if (!select) return;
            
            select.innerHTML = '<option value="">Choisir un service</option>';
            
            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.nom;
                select.appendChild(option);
            });
        }

        // Service Modal
        async function openServiceModal(service) {
            const modal = document.getElementById('serviceModal');
            const title = document.getElementById('serviceModalTitle');
            const content = document.getElementById('serviceModalContent');

            if (!modal || !title || !content) return;

            title.innerHTML = `<i class="fas fa-cogs"></i> ${service.nom}`;
            content.innerHTML = '<p style="text-align: center; color: var(--gray);">Chargement...</p>';
            modal.classList.add('active');

            try {
                const response = await fetch(`${API_BASE}/membres/service/${service.id}`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const members = await response.json();
                    displayServiceMembers(members, content);
                }
            } catch (error) {
                content.innerHTML = '<p style="color: var(--error);">Erreur lors du chargement</p>';
            }
        }

        function displayServiceMembers(members, container) {
            if (members.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--gray);">Aucun membre dans ce service</p>';
                return;
            }

            let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
            members.forEach(member => {
                const initials = `${member.nom.charAt(0)}${member.prenom.charAt(0)}`;
                html += `
                    <div style="padding: 1rem; border: 1px solid var(--light-gray); border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--primary-red), var(--dark-red)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">${initials}</div>
                            <div>
                                <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem;">${member.nom} ${member.prenom}</h4>
                                <p style="color: var(--gray); font-size: 0.85rem;">${member.sexe} • ${member.email || 'Pas d\'email'}</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-sm btn-warning" onclick="editMember(${member.id}); closeServiceModal();">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-sm btn-danger" onclick="deleteMember(${member.id}); closeServiceModal();">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        }

        function closeServiceModal() {
            const modal = document.getElementById('serviceModal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        // Load All Members
        async function loadAllMembers() {
            try {
                console.log('📋 Chargement de tous les membres');
                
                allMembers = [];
                
                for (const service of services) {
                    try {
                        const response = await fetch(`${API_BASE}/membres/service/${service.id}`, {
                            headers: getAuthHeaders()
                        });
                        
                        if (response.ok) {
                            const serviceMembers = await response.json();
                            serviceMembers.forEach(member => {
                                member.service_nom = service.nom;
                            });
                            allMembers = allMembers.concat(serviceMembers);
                        }
                    } catch (error) {
                        console.error(`Erreur membres service ${service.id}:`, error);
                    }
                }

                console.log('✅ Tous les membres chargés:', allMembers);
                displayAllMembers();
                
            } catch (error) {
                console.error('❌ Erreur chargement membres:', error);
            }
        }

        function displayAllMembers() {
            const container = document.getElementById('allMembersGrid');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (allMembers.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray);">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <p>Aucun membre trouvé.</p>
                    </div>
                `;
                return;
            }
            
            allMembers.forEach(member => {
                const initials = `${member.nom.charAt(0)}${member.prenom.charAt(0)}`;
                
                const memberCard = document.createElement('div');
                memberCard.className = 'member-card';
                
                memberCard.innerHTML = `
                    <div class="member-header">
                        <div class="member-avatar">${initials}</div>
                        <div>
                            <div class="member-name">${member.nom} ${member.prenom}</div>
                            <div class="member-service">${member.service_nom || 'Service non défini'}</div>
                        </div>
                    </div>
                    <div class="member-contact">
                        <div class="member-contact-item">
                            <i class="fas fa-venus-mars"></i>
                            <span>${member.sexe}</span>
                        </div>
                        <div class="member-contact-item">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(member.date_naissance)}</span>
                        </div>
                        <div class="member-contact-item">
                            <i class="fas fa-envelope"></i>
                            <span>${member.email || 'Non renseigné'}</span>
                        </div>
                        <div class="member-contact-item">
                            <i class="fas fa-phone"></i>
                            <span>${member.telephone || 'Non renseigné'}</span>
                        </div>
                    </div>
                    <div class="member-actions">
                        <button class="btn-sm btn-warning" onclick="editMember(${member.id})">
                            <i class="fas fa-edit"></i>
                            Modifier
                        </button>
                        <button class="btn-sm btn-danger" onclick="deleteMember(${member.id})">
                            <i class="fas fa-trash"></i>
                            Supprimer
                        </button>
                    </div>
                `;
                container.appendChild(memberCard);
            });
        }

        // Update Stats
        function updateStats() {
            const totalServicesEl = document.getElementById('totalServices');
            const totalMembersEl = document.getElementById('totalMembers');
            const avgEl = document.getElementById('avgMembersPerService');
            
            if (totalServicesEl) totalServicesEl.textContent = services.length;
            if (totalMembersEl) totalMembersEl.textContent = allMembers.length;
            const avg = services.length > 0 ? Math.round(allMembers.length / services.length) : 0;
            if (avgEl) avgEl.textContent = avg;
        }

        // Add Member
        async function handleAddMember(e) {
            e.preventDefault();
            
            const btn = document.getElementById('addMemberBtn');
            setButtonLoading(btn, true);
            
            const memberData = {
                service_id: parseInt(document.getElementById('serviceSelect').value),
                nom: document.getElementById('memberNom').value,
                prenom: document.getElementById('memberPrenom').value,
                sexe: document.getElementById('memberSexe').value,
                date_naissance: document.getElementById('memberDateNaissance').value,
                email: document.getElementById('memberEmail').value,
                telephone: document.getElementById('memberTelephone').value
            };

            try {
                const response = await fetch(`${API_BASE}/membres`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(memberData)
                });

                if (response.ok) {
                    document.getElementById('addMemberForm').reset();
                    showSuccessAnimation();
                    showToast('Membre ajouté avec succès!', 'success');
                    await loadServices();
                } else {
                    const result = await response.json();
                    throw new Error(result.error || 'Erreur lors de l\'ajout');
                }
            } catch (error) {
                console.error('❌ Erreur ajout:', error);
                showToast('Erreur: ' + error.message, 'error');
            } finally {
                setButtonLoading(btn, false);
            }
        }

        // Edit Member
        async function editMember(id) {
            try {
                const response = await fetch(`${API_BASE}/membres/${id}`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const member = await response.json();
                    
                    document.getElementById('editMemberId').value = member.id;
                    document.getElementById('editMemberNom').value = member.nom;
                    document.getElementById('editMemberPrenom').value = member.prenom;
                    document.getElementById('editMemberSexe').value = member.sexe;
                    
                    let dateValue = member.date_naissance;
                    if (dateValue && dateValue.includes('T')) {
                        dateValue = dateValue.split('T')[0];
                    }
                    document.getElementById('editMemberDateNaissance').value = dateValue || '';
                    document.getElementById('editMemberEmail').value = member.email || '';
                    document.getElementById('editMemberTelephone').value = member.telephone || '';
                    
                    const modal = document.getElementById('editMemberModal');
                    if (modal) {
                        modal.classList.add('active');
                    }
                } else {
                    showToast('Erreur lors du chargement', 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur de connexion', 'error');
            }
        }

        function closeEditMemberModal() {
            const modal = document.getElementById('editMemberModal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        async function handleEditMember(e) {
            e.preventDefault();
            
            const id = document.getElementById('editMemberId').value;
            const memberData = {
                nom: document.getElementById('editMemberNom').value,
                prenom: document.getElementById('editMemberPrenom').value,
                sexe: document.getElementById('editMemberSexe').value,
                date_naissance: document.getElementById('editMemberDateNaissance').value,
                email: document.getElementById('editMemberEmail').value,
                telephone: document.getElementById('editMemberTelephone').value
            };

            try {
                const response = await fetch(`${API_BASE}/membres/${id}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(memberData)
                });

                if (response.ok) {
                    showSuccessAnimation();
                    showToast('Membre modifié avec succès!', 'success');
                    closeEditMemberModal();
                    await loadServices();
                } else {
                    const result = await response.json();
                    throw new Error(result.error || 'Erreur lors de la modification');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur: ' + error.message, 'error');
            }
        }

        // Delete Member
        async function deleteMember(id) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;

            try {
                const response = await fetch(`${API_BASE}/membres/${id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    showSuccessAnimation();
                    showToast('Membre supprimé avec succès!', 'warning');
                    await loadServices();
                } else {
                    const result = await response.json();
                    throw new Error(result.error || 'Erreur lors de la suppression');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur: ' + error.message, 'error');
            }
        }

        // Utility Functions
        function formatDate(dateString) {
            if (!dateString) return 'Non spécifiée';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        function setButtonLoading(button, isLoading) {
            if (!button) return;
            
            if (isLoading) {
                button.disabled = true;
                const icon = button.querySelector('i');
                if (icon) icon.className = 'fas fa-spinner fa-spin';
            } else {
                button.disabled = false;
                const icon = button.querySelector('i');
                if (icon) {
                    if (button.id === 'addMemberBtn') icon.className = 'fas fa-plus';
                    else if (button.id === 'updateProfileBtn') icon.className = 'fas fa-save';
                }
            }
        }

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

            const container = document.getElementById('toastContainer');
            if (container) {
                container.appendChild(toast);

                setTimeout(() => {
                    toast.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => toast.remove(), 300);
                }, 4000);
            }
        }

        function showSuccessAnimation() {
            const overlay = document.getElementById('successOverlay');
            if (overlay) {
                overlay.classList.add('show');
                
                if (typeof confetti !== 'undefined') {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }

                setTimeout(() => {
                    overlay.classList.remove('show');
                }, 1500);
            }
        }

        function logout() {
            if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) return;
            
            console.log('🚪 Déconnexion en cours');
            localStorage.removeItem('mcm_token');
            localStorage.removeItem('mcm_user');
            showToast('Déconnexion réussie', 'info');
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1000);
        }

        // Responsive handling
        window.addEventListener('resize', function() {
            const mobileLogout = document.querySelector('.mobile-only');
            const sidebar = document.getElementById('sidebar');
            const hamburger = document.getElementById('hamburger');
            
            if (window.innerWidth > 1024) {
                if (sidebar) sidebar.classList.remove('open');
                if (hamburger) hamburger.classList.remove('active');
                if (mobileLogout) mobileLogout.style.display = 'none';
            }
        });