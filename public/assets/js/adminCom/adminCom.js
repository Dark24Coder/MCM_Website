        const API_BASE = '/api';
        let currentUser = null;
        let authToken = localStorage.getItem('mcm_token');
        let memberToDelete = null;
        let services = [];

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔍 Token récupéré:', authToken);
            console.log('🔍 Données utilisateur:', localStorage.getItem('mcm_user'));
            
            if (!authToken || authToken === 'null' || authToken === 'undefined') {
                console.log('Pas de token valide, redirection vers login');
                window.location.href = './login.html';
                return;
            }
            
            console.log('✅ Token présent, chargement du dashboard AdminCom');
            loadUserProfile();
            loadServices();
            initializeEventListeners();
        });

        function initializeEventListeners() {
            // User profile click
            document.getElementById('userProfile').addEventListener('click', function(e) {
                e.preventDefault();
                openProfileModal();
            });

            // Close modals when clicking outside
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            });

            // Form submissions
            document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
            document.getElementById('profileForm').addEventListener('submit', handleUpdateProfile);
            document.getElementById('editMemberForm').addEventListener('submit', handleEditMember);
        }

        // User Profile Management
        function loadUserProfile() {
            try {
                console.log('📋 Chargement du profil utilisateur AdminCom');
                const userDataString = localStorage.getItem('mcm_user');
                console.log('🔍 Données brutes:', userDataString);
                
                if (!userDataString || userDataString === 'null' || userDataString === 'undefined') {
                    console.log('❌ Pas de données utilisateur, utilisation des valeurs par défaut');
                    document.getElementById('userNameDisplay').textContent = 'AdminCom';
                    document.getElementById('userAvatar').textContent = 'AC';
                    
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
                
                // Afficher nom et prénom (pas l'email)
                const fullName = `${userData.nom} ${userData.prenom}`;
                document.getElementById('userNameDisplay').textContent = fullName;
                
                const initials = `${userData.nom.charAt(0)}${userData.prenom.charAt(0)}`;
                document.getElementById('userAvatar').textContent = initials;
                
                // Fill profile form
                document.getElementById('profileNom').value = userData.nom || '';
                document.getElementById('profilePrenom').value = userData.prenom || '';
                document.getElementById('profileEmail').value = userData.email || '';
                
                console.log('✅ Profil utilisateur AdminCom chargé avec succès');
                
            } catch (error) {
                console.error('❌ Erreur lors du parsing des données utilisateur:', error);
                document.getElementById('userNameDisplay').textContent = 'AdminCom';
                document.getElementById('userAvatar').textContent = 'AC';
                
                currentUser = {
                    nom: 'Admin',
                    prenom: 'Commission',
                    email: 'admincom@mcm.com',
                    commission_id: 1
                };
            }
        }

        function openProfileModal() {
            document.getElementById('profileModal').classList.add('active');
        }

        function closeProfileModal() {
            document.getElementById('profileModal').classList.remove('active');
        }

        async function handleUpdateProfile(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<div class="loading"></div> Sauvegarde...';
            submitBtn.disabled = true;
            
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
                const response = await fetch(`${API_BASE}/users/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(profileData)
                });

                if (response.ok) {
                    currentUser.nom = profileData.nom;
                    currentUser.prenom = profileData.prenom;
                    currentUser.email = profileData.email;
                    localStorage.setItem('mcm_user', JSON.stringify(currentUser));
                    
                    showSuccessAnimation('Profil modifié avec succès !');
                    loadUserProfile();
                    closeProfileModal();
                } else {
                    const result = await response.json();
                    throw new Error(result.error || 'Erreur lors de la modification');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de la modification du profil: ' + error.message);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }

        // Services Management
        async function loadServices() {
            try {
                console.log('📋 Début du chargement des services de la commission');
                showLoading('servicesGrid');
                
                if (!currentUser || !currentUser.commission_id) {
                    console.error('❌ Commission ID manquante');
                    return;
                }

                const response = await fetch(`${API_BASE}/services/commission/${currentUser.commission_id}`, {
                    headers: { 
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('📡 Réponse API services:', response.status);
                
                if (response.status === 401) {
                    console.log('❌ Token expiré, redirection vers login');
                    localStorage.removeItem('mcm_token');
                    localStorage.removeItem('mcm_user');
                    window.location.href = './login.html';
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                
                services = await response.json();
                console.log('✅ Services récupérés:', services);
                displayServices();
                populateServiceSelect();
                loadAllMembers();
                
            } catch (error) {
                console.error('❌ Erreur lors du chargement des services:', error);
                
                const container = document.getElementById('servicesGrid');
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #718096;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #f56565;"></i>
                        <h3 style="margin-bottom: 1rem;">Erreur de chargement</h3>
                        <p style="margin-bottom: 1rem;">${error.message}</p>
                        <button class="btn btn-primary" onclick="loadServices()">
                            <i class="fas fa-refresh"></i>
                            Réessayer
                        </button>
                    </div>
                `;
            }
        }

        function displayServices() {
            const container = document.getElementById('servicesGrid');
            container.innerHTML = '';
            
            if (services.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #718096;">
                        <i class="fas fa-building" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
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
                    <div class="service-header">
                        <div class="service-icon">${service.nom.charAt(0)}</div>
                        <div class="service-info">
                            <h3>${service.nom}</h3>
                        </div>
                    </div>
                    <div class="service-details">
                        <div class="service-detail" id="admin-${service.id}">
                            <i class="fas fa-user-tie"></i>
                            <span>Admin: Chargement...</span>
                        </div>
                        <div class="service-detail" id="count-${service.id}">
                            <i class="fas fa-users"></i>
                            <span>0 membre(s)</span>
                        </div>
                    </div>
                `;
                container.appendChild(serviceCard);
                
                // Charger les détails du service
                loadServiceDetails(service.id);
            });
        }

        async function loadServiceDetails(serviceId) {
            try {
                const response = await fetch(`${API_BASE}/membres/service/${serviceId}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
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
                console.error('Erreur détails service:', error);
            }
        }

        function populateServiceSelect() {
            const select = document.getElementById('serviceSelect');
            select.innerHTML = '<option value="">Choisir un service</option>';
            
            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.nom;
                select.appendChild(option);
            });
        }

        async function openServiceModal(service) {
            const modal = document.getElementById('serviceModal');
            const title = document.getElementById('serviceModalTitle');
            const content = document.getElementById('serviceModalContent');

            title.innerHTML = `<i class="fas fa-building"></i> ${service.nom}`;
            content.innerHTML = '<p>Chargement...</p>';
            modal.classList.add('active');

            try {
                const response = await fetch(`${API_BASE}/membres/service/${service.id}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (response.ok) {
                    const members = await response.json();
                    displayServiceMembers(members, content);
                }
            } catch (error) {
                content.innerHTML = '<p>Erreur lors du chargement</p>';
            }
        }

        function displayServiceMembers(members, container) {
            if (members.length === 0) {
                container.innerHTML = '<p>Aucun membre dans ce service</p>';
                return;
            }

            let html = '<div class="members-list" style="max-height: 300px; overflow-y: auto;">';
            members.forEach(member => {
                html += `
                    <div class="member-item" style="padding: 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4>${member.nom} ${member.prenom}</h4>
                            <p style="color: #718096; font-size: 0.9rem;">${member.sexe} • ${member.email || 'Pas d\'email'} • ${member.telephone || 'Pas de téléphone'}</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-warning btn-sm" onclick="editMember(${member.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteMember(${member.id})">
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
            document.getElementById('serviceModal').classList.remove('active');
        }

        // All Members Management
        async function loadAllMembers() {
            try {
                console.log('📋 Chargement de tous les membres de la commission');
                
                if (!currentUser || !currentUser.commission_id) {
                    console.error('❌ Commission ID manquante pour charger les membres');
                    return;
                }

                let allMembers = [];
                
                // Charger les membres de chaque service
                for (const service of services) {
                    try {
                        const response = await fetch(`${API_BASE}/membres/service/${service.id}`, {
                            headers: {
                                'Authorization': `Bearer ${authToken}`
                            }
                        });
                        
                        if (response.ok) {
                            const serviceMembers = await response.json();
                            // Ajouter le nom du service à chaque membre
                            serviceMembers.forEach(member => {
                                member.service_nom = service.nom;
                            });
                            allMembers = allMembers.concat(serviceMembers);
                        }
                    } catch (error) {
                        console.error(`Erreur chargement membres service ${service.id}:`, error);
                    }
                }

                console.log('✅ Tous les membres chargés:', allMembers);
                displayAllMembers(allMembers);
                
            } catch (error) {
                console.error('❌ Erreur lors du chargement de tous les membres:', error);
            }
        }

        function displayAllMembers(allMembers) {
            const container = document.getElementById('allMembersGrid');
            container.innerHTML = '';
            
            if (allMembers.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #718096;">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>Aucun membre trouvé dans votre commission.</p>
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
                        <div class="member-info">
                            <div class="member-avatar">${initials}</div>
                            <div class="member-details">
                                <h4>${member.nom} ${member.prenom}</h4>
                                <div class="member-service">${member.service_nom || 'Service non défini'}</div>
                            </div>
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
                        <button class="btn btn-warning btn-sm" onclick="editMember(${member.id})">
                            <i class="fas fa-edit"></i>
                            Modifier
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMember(${member.id})">
                            <i class="fas fa-trash"></i>
                            Supprimer
                        </button>
                    </div>
                `;
                container.appendChild(memberCard);
            });
        }

        // Add Member
        async function handleAddMember(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<div class="loading"></div> Ajout en cours...';
            submitBtn.disabled = true;
            
            const memberData = {
                nom: document.getElementById('memberNom').value,
                prenom: document.getElementById('memberPrenom').value,
                sexe: document.getElementById('memberSexe').value,
                date_naissance: document.getElementById('memberDateNaissance').value,
                email: document.getElementById('memberEmail').value,
                telephone: document.getElementById('memberTelephone').value,
                service_id: parseInt(document.getElementById('serviceSelect').value)
            };

            console.log('📝 Données membre à ajouter:', memberData);

            try {
                const response = await fetch(`${API_BASE}/membres`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(memberData)
                });

                console.log('📡 Réponse ajout membre:', response.status);

                if (response.ok) {
                    document.getElementById('addMemberForm').reset();
                    showSuccessAnimation('Membre ajouté avec succès !');
                    loadServices(); // Recharger pour mettre à jour les compteurs
                    loadAllMembers(); // Recharger la liste complète
                } else {
                    const result = await response.json();
                    throw new Error(result.error || 'Erreur lors de l\'ajout');
                }
            } catch (error) {
                console.error('❌ Erreur ajout membre:', error);
                alert('Erreur lors de l\'ajout du membre: ' + error.message);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }

        // Edit Member
        function editMember(id) {
            // Fermer la modal service si ouverte
            closeServiceModal();
            
            // Trouver le membre dans la liste actuelle
            fetch(`${API_BASE}/membres/${id}`, {
                headers: { 
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(member => {
                document.getElementById('editMemberId').value = member.id;
                document.getElementById('editMemberNom').value = member.nom;
                document.getElementById('editMemberPrenom').value = member.prenom;
                document.getElementById('editMemberSexe').value = member.sexe;
                document.getElementById('editMemberDateNaissance').value = member.date_naissance;
                document.getElementById('editMemberEmail').value = member.email || '';
                document.getElementById('editMemberTelephone').value = member.telephone || '';
                
                document.getElementById('editMemberModal').classList.add('active');
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('Erreur lors du chargement des données du membre');
            });
        }

        function closeEditMemberModal() {
            document.getElementById('editMemberModal').classList.remove('active');
        }

        async function handleEditMember(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<div class="loading"></div> Modification...';
            submitBtn.disabled = true;
            
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
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(memberData)
                });

                if (response.ok) {
                    showSuccessAnimation('Membre modifié avec succès !');
                    closeEditMemberModal();
                    loadServices();
                    loadAllMembers();
                } else {
                    const result = await response.json();
                    throw new Error(result.error || 'Erreur lors de la modification');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de la modification: ' + error.message);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }

        // Delete Member
        function deleteMember(id) {
            memberToDelete = id;
            // Fermer la modal service si ouverte
            closeServiceModal();
            document.getElementById('deleteAlert').classList.add('active');
        }

        async function confirmDelete() {
            if (!memberToDelete) return;

            try {
                const response = await fetch(`${API_BASE}/membres/${memberToDelete}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (response.ok) {
                    showSuccessAnimation('Membre supprimé avec succès !');
                    loadServices();
                    loadAllMembers();
                } else {
                    const result = await response.json();
                    throw new Error(result.error || 'Erreur lors de la suppression');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de la suppression: ' + error.message);
            } finally {
                cancelDelete();
            }
        }

        function cancelDelete() {
            memberToDelete = null;
            document.getElementById('deleteAlert').classList.remove('active');
        }

        // Utility Functions
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        function showLoading(containerId) {
            const container = document.getElementById(containerId);
            container.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; padding: 3rem; grid-column: 1/-1;">
                    <div class="loading" style="width: 40px; height: 40px;"></div>
                </div>
            `;
        }

        function showSuccessAnimation(message) {
            // Animation de confettis
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#667eea', '#764ba2', '#f093fb']
            });

            // Animation de succès personnalisée
            const successDiv = document.createElement('div');
            successDiv.className = 'success-animation';
            successDiv.innerHTML = `
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3 style="color: var(--text-dark); margin-bottom: 0.5rem;">${message}</h3>
                <p style="color: #718096;">Opération réalisée avec succès</p>
            `;
            
            document.body.appendChild(successDiv);
            
            // Supprimer après 3 secondes
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
        }

        function logout() {
            console.log('🚪 Déconnexion en cours');
            localStorage.removeItem('mcm_token');
            localStorage.removeItem('mcm_user');
            console.log('🧹 Données supprimées du localStorage');
            window.location.href = './login.html';
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // ESC to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
                document.getElementById('deleteAlert').classList.remove('active');
            }
        });