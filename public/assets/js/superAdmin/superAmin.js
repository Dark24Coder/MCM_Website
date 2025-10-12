// Configuration API
const API_BASE = '/api';
let token = localStorage.getItem('token');
let currentUser = null;
let currentEditingMember = null;
        
        // Headers avec token
        const getAuthHeaders = () => ({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', async () => {
            await loadCurrentUser();
            await loadDashboardData();
            await loadServices();
            await loadCommissions();
        });

         // Load current user info
        async function loadCurrentUser() {
            try {
                // Essayons d'abord l'endpoint principal
                let response = await fetch(`${API_BASE}/users/me`, {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) {
                    // Si ça ne marche pas, essayons de décoder le token JWT
                    try {
                        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                        console.log('Token payload:', tokenPayload);
                        
                        // Essayons de récupérer les infos utilisateur via l'ID du token
                        if (tokenPayload.id) {
                            response = await fetch(`${API_BASE}/users/${tokenPayload.id}`, {
                                headers: getAuthHeaders()
                            });
                        }
                        
                        if (!response.ok) {
                            // Utilisons les données du token directement
                            currentUser = {
                                id: tokenPayload.id,
                                nom: tokenPayload.nom || '',
                                prenom: tokenPayload.prenom || '',
                                email: tokenPayload.email || '',
                                role: tokenPayload.role
                            };
                            
                            const displayName = currentUser.nom && currentUser.prenom 
                                ? `${currentUser.prenom} ${currentUser.nom}`
                                : currentUser.email ? currentUser.email.split('@')[0] : 'Admin Principal';
                                
                            document.getElementById('userName').textContent = displayName;
                            return;
                        }
                    } catch (tokenError) {
                        console.error('Erreur lors du décodage du token:', tokenError);
                        document.getElementById('userName').textContent = 'Admin Principal';
                        return;
                    }
                }
                
                if (response.ok) {
                    currentUser = await response.json();
                    console.log('Utilisateur chargé:', currentUser);
                    
                    // Afficher le nom complet de l'utilisateur
                    const nom = currentUser.nom || '';
                    const prenom = currentUser.prenom || '';
                    
                    if (nom && prenom) {
                        document.getElementById('userName').textContent = `${prenom} ${nom}`;
                    } else if (currentUser.email) {
                        document.getElementById('userName').textContent = currentUser.email.split('@')[0];
                    } else {
                        document.getElementById('userName').textContent = 'Admin Principal';
                    }
                } else {
                    throw new Error('Impossible de récupérer les données utilisateur');
                }
                
            } catch (error) {
                console.error('Erreur lors du chargement des infos utilisateur:', error);
                showToast('Erreur lors du chargement du profil utilisateur', 'warning');
                document.getElementById('userName').textContent = 'Admin Principal';
            }
        }

        // Load dashboard statistics
        async function loadDashboardData() {
            try {
                // Load members count
                const membersRes = await fetch(`${API_BASE}/membres`, {
                    headers: getAuthHeaders()
                });
                const members = await membersRes.json();
                document.getElementById('totalMembers').textContent = members.length;

                // Load users count
                const usersRes = await fetch(`${API_BASE}/users`, {
                    headers: getAuthHeaders()
                });
                const users = await usersRes.json();
                
                const admins = users.filter(u => u.role === 'admin' || u.role === 'adminCom');
                const superadmins = users.filter(u => u.role === 'superadmin');
                
                document.getElementById('totalAdmins').textContent = admins.length;
                document.getElementById('totalSuperadmins').textContent = superadmins.length;

                // Load services count
                const servicesRes = await fetch(`${API_BASE}/services`, {
                    headers: getAuthHeaders()
                });
                const services = await servicesRes.json();
                document.getElementById('totalServices').textContent = services.length;

            } catch (error) {
                console.error('Erreur lors du chargement des statistiques:', error);
            }
        }

        // Load services
        async function loadServices() {
            try {
                const response = await fetch(`${API_BASE}/services`, {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const services = await response.json();
                
                const servicesGrid = document.getElementById('servicesGrid');
                const serviceSelect = document.getElementById('memberService');
                const userServiceSelect = document.getElementById('userService');
                const editServiceSelect = document.getElementById('editMemberService');
                
                servicesGrid.innerHTML = '';
                serviceSelect.innerHTML = '<option value="">Sélectionner un service</option>';
                userServiceSelect.innerHTML = '<option value="">Sélectionner un service</option>';
                editServiceSelect.innerHTML = '<option value="">Sélectionner un service</option>';

                if (!Array.isArray(services)) {
                    throw new Error('Format de données invalide pour les services');
                }

                services.forEach(service => {
                    // Create service card
                    const serviceCard = document.createElement('div');
                    serviceCard.className = 'service-card';
                    serviceCard.onclick = () => showServiceMembers(service.id, service.nom);
                    
                    serviceCard.innerHTML = `
                        <div class="service-name">${service.nom}</div>
                        <div class="service-commission">${service.commission_nom || 'Commission non définie'}</div>
                        <div class="service-members">
                            <i class="fas fa-users"></i> 
                            <span id="members-count-${service.id}">0</span> membres
                        </div>
                    `;
                    
                    servicesGrid.appendChild(serviceCard);
                    
                    // Add to selects
                    const optionText = `${service.nom} - ${service.commission_nom || 'Sans commission'}`;
                    serviceSelect.innerHTML += `<option value="${service.id}">${optionText}</option>`;
                    userServiceSelect.innerHTML += `<option value="${service.id}">${optionText}</option>`;
                    editServiceSelect.innerHTML += `<option value="${service.id}">${optionText}</option>`;
                    
                    // Load member count for this service
                    loadServiceMemberCount(service.id);
                });

                // Load commissions display
                await loadCommissionsDisplay();

            } catch (error) {
                console.error('Erreur lors du chargement des services:', error);
                showToast('Erreur lors du chargement des services', 'error');
            }
        }

        // Load commissions for display
        async function loadCommissionsDisplay() {
            try {
                const commissionsRes = await fetch(`${API_BASE}/commissions`, {
                    headers: getAuthHeaders()
                });
                const commissions = await commissionsRes.json();
                
                const servicesRes = await fetch(`${API_BASE}/services`, {
                    headers: getAuthHeaders()
                });
                const services = await servicesRes.json();
                
                const commissionsGrid = document.getElementById('commissionsGrid');
                commissionsGrid.innerHTML = '';

                commissions.forEach(commission => {
                    const commissionServices = services.filter(s => s.commission_id === commission.id);
                    const totalMembers = commissionServices.reduce((sum, service) => {
                        const countEl = document.getElementById(`members-count-${service.id}`);
                        return sum + (countEl ? parseInt(countEl.textContent) || 0 : 0);
                    }, 0);

                    const commissionCard = document.createElement('div');
                    commissionCard.className = 'commission-card';
                    commissionCard.onclick = () => showCommissionMembers(commission.id, commission.nom);
                    
                    commissionCard.innerHTML = `
                        <div class="commission-name">${commission.nom}</div>
                        <div class="commission-services">
                            <i class="fas fa-cogs"></i> ${commissionServices.length} service(s)
                        </div>
                        <div class="commission-members">
                            <i class="fas fa-users"></i> ${totalMembers} membre(s) total
                        </div>
                    `;
                    
                    commissionsGrid.appendChild(commissionCard);
                });

            } catch (error) {
                console.error('Erreur lors du chargement des commissions:', error);
            }
        }

        // Load member count for a service
        async function loadServiceMemberCount(serviceId) {
            try {
                const response = await fetch(`${API_BASE}/membres/service/${serviceId}`, {
                    headers: getAuthHeaders()
                });
                const members = await response.json();
                
                const countElement = document.getElementById(`members-count-${serviceId}`);
                if (countElement) {
                    countElement.textContent = members.length;
                }
            } catch (error) {
                console.error(`Erreur lors du chargement des membres du service ${serviceId}:`, error);
            }
        }

        // Load commissions
        async function loadCommissions() {
            try {
                const response = await fetch(`${API_BASE}/commissions`, {
                    headers: getAuthHeaders()
                });
                const commissions = await response.json();
                
                const commissionSelect = document.getElementById('userCommission');
                commissionSelect.innerHTML = '<option value="">Sélectionner une commission</option>';
                
                commissions.forEach(commission => {
                    commissionSelect.innerHTML += `<option value="${commission.id}">${commission.nom}</option>`;
                });

            } catch (error) {
                console.error('Erreur lors du chargement des commissions:', error);
            }
        }

                // Show service members in modal
        async function showServiceMembers(serviceId, serviceName) {
            try {
                const membersRes = await fetch(`${API_BASE}/membres/service/${serviceId}`, {
                    headers: getAuthHeaders()
                });
                
                if (!membersRes.ok) {
                    throw new Error(`Erreur HTTP ${membersRes.status}: ${membersRes.statusText}`);
                }
                
                const members = await membersRes.json();
                
                // Get service admin info
                let serviceAdmin = null;
                try {
                    const serviceRes = await fetch(`${API_BASE}/services/${serviceId}`, {
                        headers: getAuthHeaders()
                    });
                    
                    if (serviceRes.ok) {
                        const serviceData = await serviceRes.json();
                        if (serviceData.admin_id) {
                            const adminRes = await fetch(`${API_BASE}/users/${serviceData.admin_id}`, {
                                headers: getAuthHeaders()
                            });
                            if (adminRes.ok) {
                                serviceAdmin = await adminRes.json();
                            }
                        }
                    }
                } catch (adminError) {
                    console.warn('Impossible de charger les infos admin du service:', adminError);
                }
                
                document.getElementById('modalTitle').textContent = `Membres du Service: ${serviceName}`;
                
                const modalBody = document.getElementById('modalBody');
                modalBody.innerHTML = '';
                
                // Show admin first if exists
                if (serviceAdmin) {
                    const adminDiv = document.createElement('div');
                    adminDiv.className = 'member-item admin-header';
                    adminDiv.innerHTML = `
                        <div class="member-info">
                            <h4>
                                <i class="fas fa-user-tie"></i>
                                ${serviceAdmin.nom} ${serviceAdmin.prenom}
                            </h4>
                            <p>${serviceAdmin.email}</p>
                        </div>
                        <div class="admin-badge">
                            <i class="fas fa-shield-alt"></i>
                            Admin du Service
                        </div>
                    `;
                    modalBody.appendChild(adminDiv);
                }
                
                if (!Array.isArray(members) || members.length === 0) {
                    const noMembersDiv = document.createElement('div');
                    noMembersDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Aucun membre dans ce service</p>';
                    modalBody.appendChild(noMembersDiv);
                } else {
                    members.forEach(member => {
                        const memberDiv = document.createElement('div');
                        memberDiv.className = 'member-item';
                        memberDiv.innerHTML = `
                            <div class="member-info">
                                <h4>${member.nom || ''} ${member.prenom || ''}</h4>
                                <div class="member-contact">
                                    <div class="contact-item">
                                        <i class="fas fa-envelope"></i>
                                        <span>${member.email || 'Pas d\'email'}</span>
                                    </div>
                                    <div class="contact-item">
                                        <i class="fas fa-phone"></i>
                                        <span>${member.telephone || 'Pas de téléphone'}</span>
                                    </div>
                                    <div class="contact-item">
                                        <i class="fas fa-venus-mars"></i>
                                        <span>${member.sexe || 'Non spécifié'}</span>
                                        <i class="fas fa-birthday-cake" style="margin-left: 1rem;"></i>
                                        <span>${member.date_naissance ? new Date(member.date_naissance).toLocaleDateString() : 'Non spécifiée'}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="member-actions">
                                <button class="action-btn edit-btn" onclick="editMember(${member.id})" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-btn" onclick="deleteMember(${member.id})" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `;
                        modalBody.appendChild(memberDiv);
                    });
                }
                
                document.getElementById('serviceModal').style.display = 'block';
                showToast(`${members.length} membre(s) chargé(s) pour ${serviceName}`, 'info');
                
            } catch (error) {
                console.error('Erreur lors du chargement des membres:', error);
                showToast('Erreur lors du chargement des membres du service', 'error');
            }
        }

        // Show commission members
        async function showCommissionMembers(commissionId, commissionName) {
            try {
                // Get all services in this commission
                const servicesRes = await fetch(`${API_BASE}/services`, {
                    headers: getAuthHeaders()
                });
                const allServices = await servicesRes.json();
                const commissionServices = allServices.filter(s => s.commission_id === commissionId);
                
                // Get commission admin
                const commissionRes = await fetch(`${API_BASE}/commissions/${commissionId}`, {
                    headers: getAuthHeaders()
                });
                let commissionAdmin = null;
                
                if (commissionRes.ok) {
                    const commissionData = await commissionRes.json();
                    if (commissionData.admin_id) {
                        const adminRes = await fetch(`${API_BASE}/users/${commissionData.admin_id}`, {
                            headers: getAuthHeaders()
                        });
                        if (adminRes.ok) {
                            commissionAdmin = await adminRes.json();
                        }
                    }
                }
                
                document.getElementById('commissionModalTitle').textContent = `Commission: ${commissionName}`;
                const modalBody = document.getElementById('commissionModalBody');
                modalBody.innerHTML = '';
                
                // Show commission admin first
                if (commissionAdmin) {
                    const adminDiv = document.createElement('div');
                    adminDiv.className = 'member-item admin-header';
                    adminDiv.innerHTML = `
                        <div class="member-info">
                            <h4>
                                <i class="fas fa-crown"></i>
                                ${commissionAdmin.nom} ${commissionAdmin.prenom}
                            </h4>
                            <p>${commissionAdmin.email}</p>
                        </div>
                        <div class="admin-badge">
                            <i class="fas fa-shield-alt"></i>
                            Admin de Commission
                        </div>
                    `;
                    modalBody.appendChild(adminDiv);
                }
                
                // Show each service and its members
                for (const service of commissionServices) {
                    // Service header
                    const serviceHeaderDiv = document.createElement('div');
                    serviceHeaderDiv.innerHTML = `
                        <h3 style="color: #667eea; margin: 1.5rem 0 1rem 0; padding: 0.5rem; background: rgba(102, 126, 234, 0.1); border-radius: 8px; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-cog"></i>
                            Service: ${service.nom}
                        </h3>
                    `;
                    modalBody.appendChild(serviceHeaderDiv);
                    
                    // Get service admin
                    let serviceAdmin = null;
                    if (service.admin_id) {
                        try {
                            const adminRes = await fetch(`${API_BASE}/users/${service.admin_id}`, {
                                headers: getAuthHeaders()
                            });
                            if (adminRes.ok) {
                                serviceAdmin = await adminRes.json();
                            }
                        } catch (error) {
                            console.warn('Could not load service admin:', error);
                        }
                    }
                    
                    // Show service admin
                    if (serviceAdmin) {
                        const serviceAdminDiv = document.createElement('div');
                        serviceAdminDiv.className = 'member-item admin-header';
                        serviceAdminDiv.style.marginLeft = '1rem';
                        serviceAdminDiv.innerHTML = `
                            <div class="member-info">
                                <h4>
                                    <i class="fas fa-user-tie"></i>
                                    ${serviceAdmin.nom} ${serviceAdmin.prenom}
                                </h4>
                                <p>${serviceAdmin.email}</p>
                            </div>
                            <div class="admin-badge">
                                <i class="fas fa-cogs"></i>
                                Admin du Service
                            </div>
                        `;
                        modalBody.appendChild(serviceAdminDiv);
                    }
                    
                    // Get and show service members
                    try {
                        const membersRes = await fetch(`${API_BASE}/membres/service/${service.id}`, {
                            headers: getAuthHeaders()
                        });
                        const members = await membersRes.json();
                        
                        if (members.length === 0) {
                            const noMembersDiv = document.createElement('div');
                            noMembersDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem; margin-left: 1rem; font-style: italic;">Aucun membre dans ce service</p>';
                            modalBody.appendChild(noMembersDiv);
                        } else {
                            members.forEach(member => {
                                const memberDiv = document.createElement('div');
                                memberDiv.className = 'member-item';
                                memberDiv.style.marginLeft = '1rem';
                                memberDiv.innerHTML = `
                                    <div class="member-info">
                                        <h4>${member.nom} ${member.prenom}</h4>
                                        <div class="member-contact">
                                            <div class="contact-item">
                                                <i class="fas fa-envelope"></i>
                                                <span>${member.email || 'Pas d\'email'}</span>
                                            </div>
                                            <div class="contact-item">
                                                <i class="fas fa-phone"></i>
                                                <span>${member.telephone || 'Pas de téléphone'}</span>
                                            </div>
                                            <div class="contact-item">
                                                <i class="fas fa-venus-mars"></i>
                                                <span>${member.sexe}</span>
                                                <i class="fas fa-birthday-cake" style="margin-left: 1rem;"></i>
                                                <span>${new Date(member.date_naissance).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="member-badge">Membre</div>
                                `;
                                modalBody.appendChild(memberDiv);
                            });
                        }
                    } catch (error) {
                        console.error(`Erreur lors du chargement des membres du service ${service.id}:`, error);
                    }
                }
                
                document.getElementById('commissionModal').style.display = 'block';
                
            } catch (error) {
                console.error('Erreur lors du chargement des membres de la commission:', error);
                showToast('Erreur lors du chargement des membres de la commission', 'error');
            }
        }

        // Close commission modal
        function closeCommissionModal() {
            document.getElementById('commissionModal').style.display = 'none';
        }

        // Show administrators modal
        async function showAdministrators() {
            try {
                const response = await fetch(`${API_BASE}/users`, {
                    headers: getAuthHeaders()
                });
                const users = await response.json();
                
                const administrators = users.filter(u => u.role === 'admin' || u.role === 'adminCom' || u.role === 'superadmin');
                
                const administratorsBody = document.getElementById('administratorsBody');
                administratorsBody.innerHTML = '';
                
                if (administrators.length === 0) {
                    administratorsBody.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Aucun administrateur trouvé</p>';
                } else {
                    administrators.forEach(admin => {
                        const adminDiv = document.createElement('div');
                        adminDiv.className = 'member-item';
                        adminDiv.innerHTML = `
                            <div class="member-info">
                                <h4>${admin.nom} ${admin.prenom}</h4>
                                <p>${admin.email}</p>
                                <p>Rôle: ${getRoleDisplayName(admin.role)}</p>
                            </div>
                            <div class="member-actions">
                                <i class="fas fa-shield-alt" style="color: #667eea; font-size: 1.5rem;"></i>
                            </div>
                        `;
                        administratorsBody.appendChild(adminDiv);
                    });
                }
                
                document.getElementById('administratorsModal').style.display = 'block';
                
            } catch (error) {
                console.error('Erreur lors du chargement des administrateurs:', error);
            }
        }

        // Get role display name
        function getRoleDisplayName(role) {
            switch(role) {
                case 'admin': return 'Admin de Service';
                case 'adminCom': return 'Admin de Commission';
                case 'superadmin': return 'SuperAdmin';
                default: return role;
            }
        }

        // Open user profile modal
        function openUserProfile() {
            console.log('Ouverture du profil utilisateur, currentUser:', currentUser);
            
            if (currentUser) {
                // Remplir le formulaire avec les données existantes
                document.getElementById('profileNom').value = currentUser.nom || '';
                document.getElementById('profilePrenom').value = currentUser.prenom || '';
                document.getElementById('profileEmail').value = currentUser.email || '';
                document.getElementById('profilePassword').value = '';
                
                // Afficher le modal
                document.getElementById('userProfileModal').style.display = 'block';
            } else {
                console.warn('Aucune donnée utilisateur disponible');
                showToast('Impossible de charger les données utilisateur', 'error');
                
                // Essayons de recharger les données utilisateur
                loadCurrentUser().then(() => {
                    if (currentUser) {
                        document.getElementById('profileNom').value = currentUser.nom || '';
                        document.getElementById('profilePrenom').value = currentUser.prenom || '';
                        document.getElementById('profileEmail').value = currentUser.email || '';
                        document.getElementById('profilePassword').value = '';
                        document.getElementById('userProfileModal').style.display = 'block';
                    }
                });
            }
        }

        // Close modals
        function closeModal() {
            document.getElementById('serviceModal').style.display = 'none';
        }

        function closeEditMemberModal() {
            document.getElementById('editMemberModal').style.display = 'none';
            currentEditingMember = null;
        }

        function closeAdministratorsModal() {
            document.getElementById('administratorsModal').style.display = 'none';
        }

        function closeUserProfileModal() {
            document.getElementById('userProfileModal').style.display = 'none';
        }

        // Role change handler
        document.getElementById('userRole').addEventListener('change', function() {
            const role = this.value;
            const commissionGroup = document.getElementById('commissionGroup');
            const serviceGroup = document.getElementById('serviceGroup');
            const userCommission = document.getElementById('userCommission');
            const userService = document.getElementById('userService');
            
            // Reset les valeurs
            userCommission.value = '';
            userService.value = '';
            
            if (role === 'adminCom') {
                commissionGroup.style.display = 'block';
                serviceGroup.style.display = 'none';
                userCommission.required = true;
                userService.required = false;
            } else if (role === 'admin') {
                commissionGroup.style.display = 'block';
                serviceGroup.style.display = 'block';
                userCommission.required = true;
                userService.required = true;
            } else {
                commissionGroup.style.display = 'none';
                serviceGroup.style.display = 'none';
                userCommission.required = false;
                userService.required = false;
            }
        });

        // Button loading state
        function setButtonLoading(buttonId, isLoading) {
            const button = document.getElementById(buttonId);
            const span = button.querySelector('span');
            const icon = button.querySelector('i');
            
            if (isLoading) {
                button.disabled = true;
                icon.style.display = 'none';
                const spinner = document.createElement('div');
                spinner.className = 'loading-spinner';
                button.insertBefore(spinner, span);
                span.textContent = 'Chargement...';
            } else {
                button.disabled = false;
                const spinner = button.querySelector('.loading-spinner');
                if (spinner) {
                    spinner.remove();
                }
                icon.style.display = 'inline';
            }
        }

        // Add member form handler
        document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            setButtonLoading('addMemberBtn', true);
            
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
                    showErrorAnimation();
                    showToast('Erreur: ' + error.error, 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showErrorAnimation();
                showToast('Erreur lors de l\'ajout du membre', 'error');
            } finally {
                setButtonLoading('addMemberBtn', false);
                // Restore original text
                document.getElementById('addMemberBtn').querySelector('span').textContent = 'Ajouter le Membre';
            }
        });

        // Manage user form handler
        document.getElementById('manageUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            setButtonLoading('createUserBtn', true);
            
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
                    showErrorAnimation();
                    showToast('Erreur: ' + error.error, 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showErrorAnimation();
                showToast('Erreur lors de la création de l\'utilisateur', 'error');
            } finally {
                setButtonLoading('createUserBtn', false);
                // Restore original text
                document.getElementById('createUserBtn').querySelector('span').textContent = 'Créer l\'Utilisateur';
            }
        });

        // Edit member function
        async function editMember(memberId) {
            try {
                console.log('Editing member ID:', memberId);
                
                // Try different endpoints to get member data
                let response = await fetch(`${API_BASE}/membres/${memberId}`, {
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) {
                    // Try alternative endpoint
                    response = await fetch(`${API_BASE}/member/${memberId}`, {
                        headers: getAuthHeaders()
                    });
                }
                
                if (response.ok) {
                    const member = await response.json();
                    console.log('Member data loaded:', member);
                    
                    currentEditingMember = memberId;
                    
                    // Populate edit form with better error handling
                    const serviceSelect = document.getElementById('editMemberService');
                    const nomInput = document.getElementById('editMemberNom');
                    const prenomInput = document.getElementById('editMemberPrenom');
                    const sexeSelect = document.getElementById('editMemberSexe');
                    const dateInput = document.getElementById('editMemberDateNaissance');
                    const emailInput = document.getElementById('editMemberEmail');
                    const telephoneInput = document.getElementById('editMemberTelephone');
                    
                    if (serviceSelect) serviceSelect.value = member.service_id || '';
                    if (nomInput) nomInput.value = member.nom || '';
                    if (prenomInput) prenomInput.value = member.prenom || '';
                    if (sexeSelect) sexeSelect.value = member.sexe || '';
                    if (dateInput) {
                        // Handle different date formats
                        let dateValue = member.date_naissance;
                        if (dateValue) {
                            if (dateValue.includes('T')) {
                                dateValue = dateValue.split('T')[0];
                            }
                            dateInput.value = dateValue;
                        }
                    }
                    if (emailInput) emailInput.value = member.email || '';
                    if (telephoneInput) telephoneInput.value = member.telephone || '';
                    
                    document.getElementById('editMemberModal').style.display = 'block';
                    
                    showToast('Données du membre chargées', 'info');
                } else {
                    console.error('Response not OK:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.error('Error details:', errorText);
                    
                    showErrorAnimation();
                    showToast(`Erreur lors du chargement des données du membre (${response.status})`, 'error');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données du membre:', error);
                showErrorAnimation();
                showToast('Erreur de connexion lors du chargement des données', 'error');
            }
        }

        // Edit member form handler
        document.getElementById('editMemberForm').addEventListener('submit', async (e) => {
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
                } else {
                    const error = await response.json();
                    showErrorAnimation();
                    showToast('Erreur: ' + error.error, 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showErrorAnimation();
                showToast('Erreur lors de la modification du membre', 'error');
            }
        });

        // User profile form handler
        document.getElementById('userProfileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            setButtonLoading('updateProfileBtn', true);
            
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
                // Essayons différents endpoints pour la mise à jour du profil
                let response = await fetch(`${API_BASE}/auth/profile`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(profileData)
                });
                
                // Si le premier endpoint ne marche pas
                if (!response.ok) {
                    response = await fetch(`${API_BASE}/users/profile`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(profileData)
                    });
                }
                
                // Si toujours pas bon, essayons avec PATCH
                if (!response.ok) {
                    response = await fetch(`${API_BASE}/auth/me`, {
                        method: 'PATCH',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(profileData)
                    });
                }
                
                if (response.ok) {
                    let updatedUser;
                    try {
                        updatedUser = await response.json();
                    } catch (parseError) {
                        // Si pas de JSON en retour, on utilise les données du formulaire
                        updatedUser = profileData;
                    }
                    
                    // Mise à jour des données locales
                    currentUser = { ...currentUser, ...updatedUser };
                    
                    // Mise à jour de l'affichage du nom
                    const nom = updatedUser.nom || profileData.nom;
                    const prenom = updatedUser.prenom || profileData.prenom;
                    document.getElementById('userName').textContent = `${prenom} ${nom}`;
                    
                    showSuccessAnimation();
                    showToast('Profil mis à jour avec succès!', 'success');
                    closeUserProfileModal();
                    
                    console.log('Profil mis à jour:', currentUser);
                } else {
                    let errorMessage = 'Erreur lors de la mise à jour du profil';
                    try {
                        const error = await response.json();
                        errorMessage = error.error || error.message || errorMessage;
                    } catch (parseError) {
                        // Si on ne peut pas parser l'erreur, on garde le message par défaut
                    }
                    
                    showErrorAnimation();
                    showToast('Erreur: ' + errorMessage, 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showErrorAnimation();
                showToast('Erreur lors de la mise à jour du profil', 'error');
            } finally {
                setButtonLoading('updateProfileBtn', false);
                // Restore original text
                document.getElementById('updateProfileBtn').querySelector('span').textContent = 'Mettre à jour mon profil';
            }
        });

        // Delete member function
        async function deleteMember(memberId) {
            // Custom confirmation with animation
            if (await showConfirmDialog('Êtes-vous sûr de vouloir supprimer ce membre?')) {
                try {
                    const response = await fetch(`${API_BASE}/membres/${memberId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                    
                    if (response.ok) {
                        showDeleteAnimation();
                        showToast("Membre supprimé avec succès !", 'warning');
                        closeModal();
                        await loadDashboardData();
                    } else {
                        const error = await response.json();
                        showErrorAnimation();
                        showToast('Erreur: ' + error.error, 'error');
                    }
                } catch (error) {
                    console.error('Erreur:', error);
                    showErrorAnimation();
                    showToast('Erreur lors de la suppression', 'error');
                }
            }
        }

        // Logout function
        async function logout() {
            if (await showConfirmDialog('Êtes-vous sûr de vouloir vous déconnecter?')) {
                localStorage.removeItem('token');
                showToast('Déconnexion réussie', 'info');
                setTimeout(() => {
                    window.location.href = './login.html';
                }, 1000);
            }
        }

        // Animation functions
        function showSuccessAnimation() {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        function showErrorAnimation() {
            // Shake animation for errors
            document.body.classList.add('shake');
            setTimeout(() => {
                document.body.classList.remove('shake');
            }, 500);
        }

        function showDeleteAnimation() {
            // Red confetti for deletions
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#ff6b6b', '#ff8e8e', '#ffaaaa']
            });
        }

        // Enhanced Toast function
        function showToast(message, type = "success") {
            const toast = document.createElement("div");
            toast.classList.add("toast", type);
            toast.textContent = message;

            // Add icon based on type
            const icon = document.createElement("i");
            switch(type) {
                case "success":
                    icon.className = "fas fa-check-circle";
                    break;
                case "error":
                    icon.className = "fas fa-exclamation-circle";
                    break;
                case "warning":
                    icon.className = "fas fa-exclamation-triangle";
                    break;
                case "info":
                    icon.className = "fas fa-info-circle";
                    break;
            }
            
            toast.insertBefore(icon, toast.firstChild);
            toast.insertBefore(document.createTextNode(" "), toast.childNodes[1]);

            document.getElementById("toast-container").appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 4000);
        }

        // Custom confirm dialog
        function showConfirmDialog(message) {
            return new Promise((resolve) => {
                const confirmed = confirm(message);
                resolve(confirmed);
            });
        }

        // Check authentication on page load
        if (!token) {
            window.location.href = './login.html';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modals = ['serviceModal', 'editMemberModal', 'administratorsModal', 'userProfileModal', 'commissionModal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (event.target === modal) {
                    modal.style.display = 'none';
                    if (modalId === 'editMemberModal') {
                        currentEditingMember = null;
                    }
                }
            });
        }