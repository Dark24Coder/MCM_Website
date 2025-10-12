const API_BASE = '/api';
        let currentUser = null;
        let authToken = localStorage.getItem('mcm_token');
        let memberToDelete = null;

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔍 Token récupéré:', authToken);
            console.log('🔍 Données utilisateur:', localStorage.getItem('mcm_user'));
            
            if (!authToken || authToken === 'null' || authToken === 'undefined') {
                console.log('Pas de token valide, redirection vers login');
                window.location.href = './login.html';
                return;
            }
            
            console.log('✅ Token présent, chargement du dashboard');
            loadUserProfile();
            loadMembers();
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
                console.log('📋 Chargement du profil utilisateur');
                const userDataString = localStorage.getItem('mcm_user');
                console.log('🔍 Données brutes:', userDataString);
                
                if (!userDataString || userDataString === 'null' || userDataString === 'undefined') {
                    console.log('❌ Pas de données utilisateur, utilisation des valeurs par défaut');
                    // Ne pas rediriger, juste utiliser des valeurs par défaut
                    document.getElementById('userNameDisplay').textContent = 'Administrateur';
                    document.getElementById('userAvatar').textContent = 'AD';
                    
                    // Créer un utilisateur par défaut temporaire
                    currentUser = {
                        nom: 'Admin',
                        prenom: 'User',
                        email: 'admin@mcm.com',
                        service_id: 1 // Valeur par défaut
                    };
                    return;
                }
                
                const userData = JSON.parse(userDataString);
                console.log('✅ Données utilisateur parsées:', userData);
                currentUser = userData;
                
                const fullName = `${userData.nom} ${userData.prenom}`;
                document.getElementById('userNameDisplay').textContent = fullName;
                
                const initials = `${userData.nom.charAt(0)}${userData.prenom.charAt(0)}`;
                document.getElementById('userAvatar').textContent = initials;
                
                // Fill profile form
                document.getElementById('profileNom').value = userData.nom || '';
                document.getElementById('profilePrenom').value = userData.prenom || '';
                document.getElementById('profileEmail').value = userData.email || '';
                
                console.log('✅ Profil utilisateur chargé avec succès');
                
            } catch (error) {
                console.error('❌ Erreur lors du parsing des données utilisateur:', error);
                // Ne pas rediriger, juste utiliser des valeurs par défaut
                document.getElementById('userNameDisplay').textContent = 'Administrateur';
                document.getElementById('userAvatar').textContent = 'AD';
                
                currentUser = {
                    nom: 'Admin',
                    prenom: 'User',
                    email: 'admin@mcm.com',
                    service_id: 1
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
                const response = await fetch(`${API_BASE}/profile`, {
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

        // Members Management
        async function loadMembers() {
            try {
                console.log('📋 Début du chargement des membres');
                showLoading('membersList');
                
                const response = await fetch(`${API_BASE}/membres`, {
                    headers: { 
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('📡 Réponse API membres:', response.status);
                
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
                
                const members = await response.json();
                console.log('✅ Membres récupérés:', members);
                displayMembers(members);
                
            } catch (error) {
                console.error('❌ Erreur lors du chargement des membres:', error);
                
                // Afficher un message d'erreur dans la liste
                const container = document.getElementById('membersList');
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #718096;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #f56565;"></i>
                        <h3 style="margin-bottom: 1rem;">Erreur de chargement</h3>
                        <p style="margin-bottom: 1rem;">${error.message}</p>
                        <button class="btn btn-primary" onclick="loadMembers()">
                            <i class="fas fa-refresh"></i>
                            Réessayer
                        </button>
                    </div>
                `;
            }
        }

        function displayMembers(members) {
            const container = document.getElementById('membersList');
            container.innerHTML = '';
            
            if (members.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #718096;">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>Aucun membre trouvé dans votre service.</p>
                    </div>
                `;
                return;
            }
            
            // Séparer l'admin et les autres membres
            const adminMembers = [];
            const regularMembers = [];
            
            members.forEach(member => {
                // Vérifier si c'est l'admin connecté (même nom et prénom)
                if (currentUser && 
                    member.nom === currentUser.nom && 
                    member.prenom === currentUser.prenom) {
                    adminMembers.push(member);
                } else {
                    regularMembers.push(member);
                }
            });
            
            // Afficher d'abord les admins puis les membres réguliers
            [...adminMembers, ...regularMembers].forEach(member => {
                const initials = `${member.nom.charAt(0)}${member.prenom.charAt(0)}`;
                const isAdmin = adminMembers.includes(member);
                
                const memberCard = document.createElement('div');
                memberCard.className = `member-card ${isAdmin ? 'admin' : ''}`;
                memberCard.onclick = () => openMemberModal(member);
                
                memberCard.innerHTML = `
                    <div class="member-header">
                        <div class="member-avatar ${isAdmin ? 'admin' : ''}">${initials}</div>
                        <div class="member-info">
                            <h3>${member.nom} ${member.prenom}</h3>
                            ${isAdmin ? '<span class="member-badge">Administrateur</span>' : ''}
                        </div>
                    </div>
                    <div class="member-details">
                        <div class="member-detail">
                            <i class="fas fa-venus-mars"></i>
                            <span>${member.sexe}</span>
                        </div>
                        <div class="member-detail">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(member.date_naissance)}</span>
                        </div>
                        <div class="member-detail">
                            <i class="fas fa-envelope"></i>
                            <span>${member.email || 'Non renseigné'}</span>
                        </div>
                        <div class="member-detail">
                            <i class="fas fa-phone"></i>
                            <span>${member.telephone || 'Non renseigné'}</span>
                        </div>
                    </div>
                `;
                container.appendChild(memberCard);
            });
        }

        async function handleAddMember(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<div class="loading"></div> Ajout en cours...';
            submitBtn.disabled = true;
            
            // Vérifier que currentUser existe et a un service_id
            if (!currentUser || !currentUser.service_id) {
                console.error('❌ Données utilisateur manquantes');
                alert('Erreur: Données utilisateur manquantes. Veuillez vous reconnecter.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            const memberData = {
                nom: document.getElementById('memberNom').value,
                prenom: document.getElementById('memberPrenom').value,
                sexe: document.getElementById('memberSexe').value,
                date_naissance: document.getElementById('memberDateNaissance').value,
                email: document.getElementById('memberEmail').value,
                telephone: document.getElementById('memberTelephone').value,
                service_id: currentUser.service_id
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
                    loadMembers();
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

        // Member Modal Management
        function openMemberModal(member) {
            const modal = document.getElementById('memberModal');
            const content = document.getElementById('memberModalContent');
            
            const isAdmin = currentUser && 
                member.nom === currentUser.nom && 
                member.prenom === currentUser.prenom;
            
            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div class="member-avatar ${isAdmin ? 'admin' : ''}" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto 1rem;">
                        ${member.nom.charAt(0)}${member.prenom.charAt(0)}
                    </div>
                    <h3 style="margin-bottom: 0.5rem;">${member.nom} ${member.prenom}</h3>
                    ${isAdmin ? '<span class="member-badge">Administrateur</span>' : ''}
                </div>
                
                <div class="member-details" style="margin-bottom: 2rem;">
                    <div class="member-detail" style="margin-bottom: 1rem;">
                        <i class="fas fa-venus-mars"></i>
                        <span><strong>Sexe:</strong> ${member.sexe}</span>
                    </div>
                    <div class="member-detail" style="margin-bottom: 1rem;">
                        <i class="fas fa-calendar"></i>
                        <span><strong>Date de naissance:</strong> ${formatDate(member.date_naissance)}</span>
                    </div>
                    <div class="member-detail" style="margin-bottom: 1rem;">
                        <i class="fas fa-envelope"></i>
                        <span><strong>Email:</strong> ${member.email || 'Non renseigné'}</span>
                    </div>
                    <div class="member-detail" style="margin-bottom: 1rem;">
                        <i class="fas fa-phone"></i>
                        <span><strong>Téléphone:</strong> ${member.telephone || 'Non renseigné'}</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn btn-warning" onclick="editMember(${member.id})">
                        <i class="fas fa-edit"></i>
                        Modifier
                    </button>
                    ${!isAdmin ? `
                        <button class="btn btn-danger" onclick="deleteMember(${member.id})">
                            <i class="fas fa-trash"></i>
                            Supprimer
                        </button>
                    ` : ''}
                </div>
            `;
            
            modal.classList.add('active');
        }

        function closeMemberModal() {
            document.getElementById('memberModal').classList.remove('active');
        }

        function editMember(id) {
            // Trouver le membre dans la liste actuelle
            fetch(`${API_BASE}/membres`, {
                headers: { 
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(members => {
                const member = members.find(m => m.id === id);
                if (member) {
                    document.getElementById('editMemberId').value = member.id;
                    document.getElementById('editMemberNom').value = member.nom;
                    document.getElementById('editMemberPrenom').value = member.prenom;
                    document.getElementById('editMemberSexe').value = member.sexe;
                    document.getElementById('editMemberDateNaissance').value = member.date_naissance;
                    document.getElementById('editMemberEmail').value = member.email || '';
                    document.getElementById('editMemberTelephone').value = member.telephone || '';
                    
                    closeMemberModal();
                    document.getElementById('editMemberModal').classList.add('active');
                }
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
                telephone: document.getElementById('editMemberTelephone').value,
                service_id: currentUser.service_id
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
                    loadMembers();
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

        function deleteMember(id) {
            memberToDelete = id;
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
                    loadMembers();
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

        function showError(message) {
            alert(message); // Simple pour l'instant, peut être amélioré
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

        // Fonction de debug temporaire - à supprimer en production
        window.debugAuth = function() {
            console.log('=== DEBUG AUTHENTIFICATION ===');
            console.log('Token:', localStorage.getItem('mcm_token'));
            console.log('User:', localStorage.getItem('mcm_user'));
            console.log('currentUser:', currentUser);
            console.log('authToken:', authToken);
        };

        // Test de connexion API
        window.testAPI = async function() {
            try {
                const response = await fetch(`${API_BASE}/membres`, {
                    headers: { 
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Test API - Status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Test API - Données:', data);
                } else {
                    console.log('Test API - Erreur:', await response.text());
                }
            } catch (error) {
                console.error('Test API - Exception:', error);
            }
        };

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