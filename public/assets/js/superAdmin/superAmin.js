        // ========================================
        // CONFIGURATION & VARIABLES GLOBALES
        // ========================================
        const API_BASE = '/api';
        let token = null;
        let currentUser = null;
        let currentEditingMember = null;
        let currentSection = 'dashboard';

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
            const overlay = document.getElementById('successOverlay');
            overlay.classList.add('show');
            
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            setTimeout(() => overlay.classList.remove('show'), 1500);
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

        // ========================================
        // INITIALISATION
        // ========================================
        document.addEventListener('DOMContentLoaded', async () => {
            token = window.localStorage.getItem('mcm_token');
            
            if (!token) {
                window.location.href = './login.html';
                return;
            }
            
            await initializeApp();
        });

        async function initializeApp() {
            try {
                await loadCurrentUser();
                await loadDashboardData();
                await loadServices();
                await loadCommissions();
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

            document.getElementById('userRole').addEventListener('change', handleRoleChange);
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
                showToast('Erreur lors du chargement du profil', 'error');
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
            if (currentUser) {
                document.getElementById('profileNom').value = currentUser.nom || '';
                document.getElementById('profilePrenom').value = currentUser.prenom || '';
                document.getElementById('profileEmail').value = currentUser.email || '';
                document.getElementById('profilePassword').value = '';
                document.getElementById('userProfileModal').classList.add('show');
            } else {
                showToast('Veuillez patienter, chargement du profil...', 'info');
            }
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
                'services': 'servicesSection',
                'commissions': 'commissionsSection'
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
                    loadAllMembersList();
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
                
                const mobileLogout = document.querySelector('.mobile-only');
                if (mobileLogout && window.innerWidth <= 1024) {
                    mobileLogout.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
                }
            }
        }

        // ========================================
        // CHARGEMENT DES DONNÉES
        // ========================================
        async function loadDashboardData() {
            try {
                const [membersRes, usersRes, servicesRes] = await Promise.all([
                    fetch(`${API_BASE}/membres`, { headers: getAuthHeaders() }),
                    fetch(`${API_BASE}/users`, { headers: getAuthHeaders() }),
                    fetch(`${API_BASE}/services`, { headers: getAuthHeaders() })
                ]);

                const members = await membersRes.json();
                const users = await usersRes.json();
                const services = await servicesRes.json();

                document.getElementById('totalMembers').textContent = members.length;
                document.getElementById('totalAdmins').textContent = users.filter(u => u.role === 'admin' || u.role === 'adminCom').length;
                document.getElementById('totalSuperadmins').textContent = users.filter(u => u.role === 'superadmin').length;
                document.getElementById('totalServices').textContent = services.length;

            } catch (error) {
                console.error('Erreur chargement stats:', error);
            }
        }

        async function loadAllMembersList() {
            try {
                const container = document.getElementById('membersListContainer');
                container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 2rem;">Chargement...</p>';

                const response = await fetch(`${API_BASE}/membres`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const members = await response.json();
                    
                    if (members.length === 0) {
                        container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 2rem;">Aucun membre trouvé</p>';
                        return;
                    }

                    let html = '<div class="member-list">';
                    members.forEach(member => {
                        html += `
                            <div class="member-item">
                                <div class="member-info">
                                    <h4>${member.nom} ${member.prenom}</h4>
                                    <div class="member-details">
                                        <div class="member-detail">
                                            <i class="fas fa-envelope"></i>
                                            <span>${member.email || 'Pas d\'email'}</span>
                                        </div>
                                        <div class="member-detail">
                                            <i class="fas fa-phone"></i>
                                            <span>${member.telephone || 'Pas de téléphone'}</span>
                                        </div>
                                        <div class="member-detail">
                                            <i class="fas fa-venus-mars"></i>
                                            <span>${member.sexe || 'Non spécifié'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="member-actions">
                                    <button class="action-btn edit" onclick="editMember(${member.id})" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete" onclick="deleteMember(${member.id})" title="Supprimer">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<p style="text-align: center; color: var(--error); padding: 2rem;">Erreur lors du chargement</p>';
                }
            } catch (error) {
                console.error('Erreur:', error);
                const container = document.getElementById('membersListContainer');
                container.innerHTML = '<p style="text-align: center; color: var(--error); padding: 2rem;">Erreur de connexion</p>';
            }
        }

        async function loadServices() {
            try {
                const response = await fetch(`${API_BASE}/services`, {
                    headers: getAuthHeaders()
                });
                const services = await response.json();

                const servicesGrid = document.getElementById('servicesGrid');
                const selects = ['memberService', 'userService', 'editMemberService'];
                
                servicesGrid.innerHTML = '';
                selects.forEach(id => {
                    const selectEl = document.getElementById(id);
                    if (selectEl) {
                        selectEl.innerHTML = '<option value="">Sélectionner un service</option>';
                    }
                });

                services.forEach(service => {
                    const card = document.createElement('div');
                    card.className = 'custom-card';
                    card.onclick = () => showServiceMembers(service.id, service.nom);
                    card.innerHTML = `
                        <div class="custom-card-title">${service.nom}</div>
                        <div class="custom-card-subtitle">${service.commission_nom || 'Commission non définie'}</div>
                        <div class="custom-card-footer">
                            <i class="fas fa-users"></i>
                            <span id="members-count-${service.id}">0</span> membres
                        </div>
                    `;
                    servicesGrid.appendChild(card);

                    selects.forEach(id => {
                        const selectEl = document.getElementById(id);
                        if (selectEl) {
                            const option = document.createElement('option');
                            option.value = service.id;
                            option.textContent = `${service.nom} - ${service.commission_nom || 'Sans commission'}`;
                            selectEl.appendChild(option);
                        }
                    });

                    loadServiceMemberCount(service.id);
                });

            } catch (error) {
                console.error('Erreur chargement services:', error);
                showToast('Erreur lors du chargement des services', 'error');
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

        async function loadCommissions() {
            try {
                const response = await fetch(`${API_BASE}/commissions`, {
                    headers: getAuthHeaders()
                });
                const commissions = await response.json();

                const commissionsGrid = document.getElementById('commissionsGrid');
                const commissionSelect = document.getElementById('userCommission');
                
                commissionsGrid.innerHTML = '';
                if (commissionSelect) {
                    commissionSelect.innerHTML = '<option value="">Sélectionner une commission</option>';
                }

                commissions.forEach(commission => {
                    const card = document.createElement('div');
                    card.className = 'custom-card';
                    card.onclick = () => showCommissionMembers(commission.id, commission.nom);
                    card.innerHTML = `
                        <div class="custom-card-title">${commission.nom}</div>
                        <div class="custom-card-footer">
                            <i class="fas fa-sitemap"></i>
                            Voir les détails
                        </div>
                    `;
                    commissionsGrid.appendChild(card);

                    if (commissionSelect) {
                        const option = document.createElement('option');
                        option.value = commission.id;
                        option.textContent = commission.nom;
                        commissionSelect.appendChild(option);
                    }
                });

            } catch (error) {
                console.error('Erreur chargement commissions:', error);
            }
        }

        // ========================================
        // GESTION DES MEMBRES
        // ========================================
        async function handleAddMember(e) {
            e.preventDefault();
            const btn = document.getElementById('addMemberBtn');
            setButtonLoading(btn, true);

            const memberData = {
                service_id: document.getElementById('memberService').value,
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
                    showSuccessAnimation();
                    showToast('Membre ajouté avec succès!', 'success');
                    document.getElementById('addMemberForm').reset();
                    await loadDashboardData();
                    await loadServiceMemberCount(memberData.service_id);
                } else {
                    const error = await response.json();
                    showToast('Erreur: ' + error.error, 'error');
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
                const response = await fetch(`${API_BASE}/membres/${memberId}`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const member = await response.json();
                    currentEditingMember = memberId;

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
                    showToast('Données du membre chargées', 'info');
                } else {
                    showToast('Erreur lors du chargement des données du membre', 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur de connexion', 'error');
            }
        }

        async function handleEditMember(e) {
            e.preventDefault();
            if (!currentEditingMember) return;

            const memberData = {
                service_id: document.getElementById('editMemberService').value,
                nom: document.getElementById('editMemberNom').value,
                prenom: document.getElementById('editMemberPrenom').value,
                sexe: document.getElementById('editMemberSexe').value,
                date_naissance: document.getElementById('editMemberDateNaissance').value,
                email: document.getElementById('editMemberEmail').value,
                telephone: document.getElementById('editMemberTelephone').value
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
                    closeModal();
                    await loadDashboardData();
                    if (currentSection === 'members') {
                        await loadAllMembersList();
                    }
                } else {
                    const error = await response.json();
                    showToast('Erreur: ' + error.error, 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur lors de la modification du membre', 'error');
            }
        }

        async function deleteMember(memberId) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre?')) return;

            try {
                const response = await fetch(`${API_BASE}/membres/${memberId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    showSuccessAnimation();
                    showToast('Membre supprimé avec succès!', 'warning');
                    closeModal();
                    await loadDashboardData();
                    if (currentSection === 'members') {
                        await loadAllMembersList();
                    }
                } else {
                    const error = await response.json();
                    showToast('Erreur: ' + error.error, 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur lors de la suppression', 'error');
            }
        }

        // ========================================
        // GESTION DES UTILISATEURS/ADMINS
        // ========================================
        function handleRoleChange() {
            const role = document.getElementById('userRole').value;
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
        }

        async function handleCreateUser(e) {
            e.preventDefault();
            const btn = document.getElementById('createUserBtn');
            setButtonLoading(btn, true);

            const userData = {
                nom: document.getElementById('userNom').value,
                prenom: document.getElementById('userPrenom').value,
                email: document.getElementById('userEmail').value,
                mot_de_passe: document.getElementById('userPassword').value,
                role: document.getElementById('userRole').value,
                commission_id: document.getElementById('userCommission').value || null,
                service_id: document.getElementById('userService').value || null
            };

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
                    await loadDashboardData();
                } else {
                    const error = await response.json();
                    showToast('Erreur: ' + error.error, 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur lors de la création de l\'utilisateur', 'error');
            } finally {
                setButtonLoading(btn, false);
            }
        }

        async function showAdministrators() {
            try {
                const response = await fetch(`${API_BASE}/users`, {
                    headers: getAuthHeaders()
                });
                const users = await response.json();
                const administrators = users.filter(u => u.role === 'admin' || u.role === 'adminCom' || u.role === 'superadmin');

                const modalBody = document.getElementById('administratorsBody');
                modalBody.innerHTML = '';

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
                    modalBody.appendChild(adminDiv);
                });

                document.getElementById('administratorsModal').classList.add('show');

            } catch (error) {
                console.error('Erreur chargement administrateurs:', error);
                showToast('Erreur lors du chargement des administrateurs', 'error');
            }
        }

        // ========================================
        // GESTION DES MODALES
        // ========================================
        async function showServiceMembers(serviceId, serviceName) {
            try {
                const response = await fetch(`${API_BASE}/membres/service/${serviceId}`, {
                    headers: getAuthHeaders()
                });
                const members = await response.json();

                document.getElementById('modalTitle').textContent = `Membres du Service: ${serviceName}`;
                const modalBody = document.getElementById('modalBody');
                modalBody.innerHTML = '';

                if (members.length === 0) {
                    modalBody.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 2rem;">Aucun membre</p>';
                } else {
                    members.forEach(member => {
                        const memberDiv = document.createElement('div');
                        memberDiv.className = 'member-item';
                        memberDiv.innerHTML = `
                            <div class="member-info">
                                <h4>${member.nom} ${member.prenom}</h4>
                                <div class="member-details">
                                    <div class="member-detail">
                                        <i class="fas fa-envelope"></i>
                                        <span>${member.email || 'Pas d\'email'}</span>
                                    </div>
                                    <div class="member-detail">
                                        <i class="fas fa-phone"></i>
                                        <span>${member.telephone || 'Pas de téléphone'}</span>
                                    </div>
                                    <div class="member-detail">
                                        <i class="fas fa-venus-mars"></i>
                                        <span>${member.sexe || 'Non spécifié'}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="member-actions">
                                <button class="action-btn edit" onclick="editMember(${member.id})" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="deleteMember(${member.id})" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `;
                        modalBody.appendChild(memberDiv);
                    });
                }

                document.getElementById('serviceModal').classList.add('show');
                
            } catch (error) {
                console.error('Erreur chargement membres:', error);
                showToast('Erreur lors du chargement des membres', 'error');
            }
        }

        async function showCommissionMembers(commissionId, commissionName) {
            try {
                const servicesRes = await fetch(`${API_BASE}/services`, {
                    headers: getAuthHeaders()
                });
                const allServices = await servicesRes.json();
                const commissionServices = allServices.filter(s => s.commission_id === commissionId);

                document.getElementById('commissionModalTitle').textContent = `Commission: ${commissionName}`;
                const modalBody = document.getElementById('commissionModalBody');
                modalBody.innerHTML = '';

                for (const service of commissionServices) {
                    const serviceHeader = document.createElement('h3');
                    serviceHeader.style.cssText = 'color: var(--primary-red); margin: 1.5rem 0 1rem; padding: 0.75rem; background: rgba(230, 0, 18, 0.1); border-radius: 12px;';
                    serviceHeader.innerHTML = `<i class="fas fa-cog"></i> Service: ${service.nom}`;
                    modalBody.appendChild(serviceHeader);

                    try {
                        const membersRes = await fetch(`${API_BASE}/membres/service/${service.id}`, {
                            headers: getAuthHeaders()
                        });
                        const members = await membersRes.json();

                        if (members.length === 0) {
                            const noMembers = document.createElement('p');
                            noMembers.style.cssText = 'text-align: center; color: var(--gray); padding: 1rem; font-style: italic;';
                            noMembers.textContent = 'Aucun membre dans ce service';
                            modalBody.appendChild(noMembers);
                        } else {
                            members.forEach(member => {
                                const memberDiv = document.createElement('div');
                                memberDiv.className = 'member-item';
                                memberDiv.innerHTML = `
                                    <div class="member-info">
                                        <h4>${member.nom} ${member.prenom}</h4>
                                        <div class="member-details">
                                            <div class="member-detail">
                                                <i class="fas fa-envelope"></i>
                                                <span>${member.email || 'Pas d\'email'}</span>
                                            </div>
                                            <div class="member-detail">
                                                <i class="fas fa-phone"></i>
                                                <span>${member.telephone || 'Pas de téléphone'}</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                modalBody.appendChild(memberDiv);
                            });
                        }
                    } catch (error) {
                        console.error(`Erreur chargement membres service ${service.id}:`, error);
                    }
                }

                document.getElementById('commissionModal').classList.add('show');

            } catch (error) {
                console.error('Erreur chargement membres commission:', error);
                showToast('Erreur lors du chargement de la commission', 'error');
            }
        }

        function closeModal() {
            document.getElementById('serviceModal').classList.remove('show');
        }

        function closeCommissionModal() {
            document.getElementById('commissionModal').classList.remove('show');
        }

        function closeEditMemberModal() {
            document.getElementById('editMemberModal').classList.remove('show');
            currentEditingMember = null;
        }

        function closeAdministratorsModal() {
            document.getElementById('administratorsModal').classList.remove('show');
        }

        function closeUserProfileModal() {
            document.getElementById('userProfileModal').classList.remove('show');
        }

        // ========================================
        // RESPONSIVE
        // ========================================
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