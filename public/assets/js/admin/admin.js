
        const API_BASE = '/api';
        let currentUser = null;
        let authToken = localStorage.getItem('mcm_token');
        let allMembers = [];
        let currentPage = 1;
        const membersPerPage = 10;

        // Welcome messages
        const welcomeMessages = [
            {
                title: "Excellente journée à vous ! 🌟",
                subtitle: "Prêt à accomplir de grandes choses aujourd'hui ?"
            },
            {
                title: "Bienvenue dans votre espace ! 👋",
                subtitle: "Gérez votre service avec efficacité et simplicité"
            },
            {
                title: "Ravi de vous revoir ! 😊",
                subtitle: "Continuez votre excellent travail de gestion"
            },
            {
                title: "Bonjour Admin ! ✨",
                subtitle: "Votre service compte sur votre dévouement"
            },
            {
                title: "Que cette journée soit productive ! 🚀",
                subtitle: "Ensemble, construisons une communauté forte"
            }
        ];

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            if (!authToken || authToken === 'null' || authToken === 'undefined') {
                window.location.href = './login.html';
                return;
            }
            
            initializeApp();
        });

        async function initializeApp() {
            loadUserProfile();
            await loadMembers();
            displayRandomWelcome();
            initializeEventListeners();
        }

        function initializeEventListeners() {
            document.getElementById('hamburger').addEventListener('click', toggleSidebar);
            document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
            document.getElementById('profileForm').addEventListener('submit', handleUpdateProfile);
            document.getElementById('editMemberForm').addEventListener('submit', handleEditMember);

            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.classList.remove('show');
                    }
                });
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

        function displayRandomWelcome() {
            const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
            document.getElementById('welcomeMessage').textContent = randomMessage.title;
            document.getElementById('welcomeSubtext').textContent = randomMessage.subtitle;
        }

        function loadUserProfile() {
            try {
                const userDataString = localStorage.getItem('mcm_user');
                
                if (!userDataString || userDataString === 'null') {
                    currentUser = {
                        nom: 'Admin',
                        prenom: 'User',
                        email: 'admin@mcm.com',
                        service_id: 1
                    };
                } else {
                    currentUser = JSON.parse(userDataString);
                }
                
                const fullName = `${currentUser.prenom} ${currentUser.nom}`;
                document.getElementById('userName').textContent = fullName;
                
                const initials = `${currentUser.prenom.charAt(0)}${currentUser.nom.charAt(0)}`;
                document.getElementById('userAvatar').textContent = initials.toUpperCase();
                
                document.getElementById('profileNom').value = currentUser.nom || '';
                document.getElementById('profilePrenom').value = currentUser.prenom || '';
                document.getElementById('profileEmail').value = currentUser.email || '';
                
            } catch (error) {
                console.error('Erreur chargement profil:', error);
                currentUser = {
                    nom: 'Admin',
                    prenom: 'User',
                    email: 'admin@mcm.com',
                    service_id: 1
                };
            }
        }

        async function loadMembers() {
            try {
                const response = await fetch(`${API_BASE}/membres`, {
                    headers: { 
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.status === 401) {
                    localStorage.removeItem('mcm_token');
                    localStorage.removeItem('mcm_user');
                    window.location.href = './login.html';
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                
                allMembers = await response.json();
                updateStatistics();
                displayMembers();
                
            } catch (error) {
                console.error('Erreur chargement membres:', error);
                showToast('Erreur lors du chargement des membres', 'error');
                
                // Mode démo si API échoue
                allMembers = getDemoMembers();
                updateStatistics();
                displayMembers();
            }
        }

        // Données de démonstration
        function getDemoMembers() {
            return [
                {
                    id: 1,
                    nom: "Doe",
                    prenom: "John",
                    sexe: "Homme",
                    date_naissance: "1990-05-15",
                    email: "john.doe@email.com",
                    telephone: "+229 12 34 56 78",
                    service_id: 1,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    nom: "Smith",
                    prenom: "Jane",
                    sexe: "Femme", 
                    date_naissance: "1992-08-22",
                    email: "jane.smith@email.com",
                    telephone: "+229 98 76 54 32",
                    service_id: 1,
                    created_at: new Date().toISOString()
                }
            ];
        }

        function updateStatistics() {
            const total = allMembers.length;
            const males = allMembers.filter(m => m.sexe === 'Homme').length;
            const females = allMembers.filter(m => m.sexe === 'Femme').length;
            
            // Calculate recent members (this month)
            const now = new Date();
            const thisMonth = allMembers.filter(m => {
                const memberDate = new Date(m.created_at || m.date_naissance);
                return memberDate.getMonth() === now.getMonth() && 
                       memberDate.getFullYear() === now.getFullYear();
            }).length;

            // Update dashboard stats
            document.getElementById('totalMembers').textContent = total;
            document.getElementById('maleMembers').textContent = males;
            document.getElementById('femaleMembers').textContent = females;
            document.getElementById('recentMembers').textContent = thisMonth;

            // Update reports stats
            document.getElementById('reportTotalMembers').textContent = total;
            document.getElementById('reportMalePercent').textContent = total > 0 ? Math.round((males / total) * 100) + '%' : '0%';
            document.getElementById('reportFemalePercent').textContent = total > 0 ? Math.round((females / total) * 100) + '%' : '0%';
            
            // Calculate average age
            if (total > 0) {
                const avgAge = Math.round(allMembers.reduce((sum, m) => {
                    const birthDate = new Date(m.date_naissance);
                    const age = new Date().getFullYear() - birthDate.getFullYear();
                    return sum + age;
                }, 0) / total);
                document.getElementById('reportAvgAge').textContent = avgAge + ' ans';
            }

            // Additional report stats
            const emailCount = allMembers.filter(m => m.email && m.email.trim()).length;
            const phoneCount = allMembers.filter(m => m.telephone && m.telephone.trim()).length;
            const completionRate = total > 0 ? Math.round(((emailCount + phoneCount) / (total * 2)) * 100) : 0;

            document.getElementById('reportEmailCount').textContent = emailCount;
            document.getElementById('reportPhoneCount').textContent = phoneCount;
            document.getElementById('reportCompletionRate').textContent = completionRate + '%';
        }

        function displayMembers() {
            const container = document.getElementById('membersTableContainer');
            
            if (allMembers.length === 0) {
                container.innerHTML = `
                    <p style="text-align: center; color: var(--gray); padding: 3rem;">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; display: block;"></i>
                        Aucun membre trouvé dans votre service.
                    </p>
                `;
                return;
            }

            const startIndex = (currentPage - 1) * membersPerPage;
            const endIndex = startIndex + membersPerPage;
            const paginatedMembers = allMembers.slice(startIndex, endIndex);

            let html = `
                <table class="members-table">
                    <thead>
                        <tr>
                            <th>Nom & Prénom</th>
                            <th>Sexe</th>
                            <th>Date de Naissance</th>
                            <th>Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            paginatedMembers.forEach(member => {
                html += `
                    <tr>
                        <td>
                            <div class="member-name">${member.nom} ${member.prenom}</div>
                        </td>
                        <td>
                            <span class="member-badge ${member.sexe.toLowerCase()}">
                                <i class="fas fa-${member.sexe === 'Homme' ? 'male' : 'female'}"></i>
                                ${member.sexe}
                            </span>
                        </td>
                        <td>${formatDate(member.date_naissance)}</td>
                        <td>
                            <div style="font-size: 0.875rem;">
                                <div style="margin-bottom: 0.25rem;">
                                    <i class="fas fa-envelope" style="color: var(--primary-red); width: 16px;"></i>
                                    ${member.email || 'Non renseigné'}
                                </div>
                                <div>
                                    <i class="fas fa-phone" style="color: var(--primary-red); width: 16px;"></i>
                                    ${member.telephone || 'Non renseigné'}
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn edit" onclick="editMember(${member.id})" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="deleteMember(${member.id})" title="Supprimer">
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
            displayPagination();
        }

        function displayPagination() {
            const totalPages = Math.ceil(allMembers.length / membersPerPage);
            const paginationContainer = document.getElementById('pagination');
            
            if (totalPages <= 1) {
                paginationContainer.innerHTML = '';
                return;
            }

            let html = `
                <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
            `;

            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                    html += `
                        <button onclick="changePage(${i})" ${i === currentPage ? 'class="active"' : ''}>
                            ${i}
                        </button>
                    `;
                } else if (i === currentPage - 2 || i === currentPage + 2) {
                    html += '<span style="padding: 0.5rem;">...</span>';
                }
            }

            html += `
                <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;

            paginationContainer.innerHTML = html;
        }

        function changePage(page) {
            const totalPages = Math.ceil(allMembers.length / membersPerPage);
            if (page < 1 || page > totalPages) return;
            currentPage = page;
            displayMembers();
        }

        async function handleAddMember(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('addMemberBtn');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Ajout en cours...</span>';
            submitBtn.disabled = true;
            
            if (!currentUser || !currentUser.service_id) {
                showToast('Erreur: Données utilisateur manquantes', 'error');
                submitBtn.innerHTML = originalHTML;
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

            try {
                const response = await fetch(`${API_BASE}/membres`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(memberData)
                });

                if (response.ok) {
                    document.getElementById('addMemberForm').reset();
                    showSuccessAnimation('Membre ajouté avec succès !');
                    await loadMembers();
                } else {
                    const result = await response.json();
                    showToast('Erreur: ' + (result.error || 'Erreur inconnue'), 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur de connexion au serveur', 'error');
            } finally {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }
        }

        async function editMember(id) {
            const member = allMembers.find(m => m.id === id);
            if (!member) {
                showToast('Membre introuvable', 'error');
                return;
            }

            document.getElementById('editMemberId').value = member.id;
            document.getElementById('editMemberNom').value = member.nom;
            document.getElementById('editMemberPrenom').value = member.prenom;
            document.getElementById('editMemberSexe').value = member.sexe;
            
            let dateValue = member.date_naissance;
            if (dateValue && dateValue.includes('T')) {
                dateValue = dateValue.split('T')[0];
            }
            document.getElementById('editMemberDateNaissance').value = dateValue;
            document.getElementById('editMemberEmail').value = member.email || '';
            document.getElementById('editMemberTelephone').value = member.telephone || '';

            document.getElementById('editMemberModal').classList.add('show');
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
                    await loadMembers();
                } else {
                    const result = await response.json();
                    showToast('Erreur: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur lors de la modification', 'error');
            }
        }

        async function deleteMember(id) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;

            try {
                const response = await fetch(`${API_BASE}/membres/${id}`, {
                    method: 'DELETE',
                    headers: { 
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    showSuccessAnimation('Membre supprimé avec succès !');
                    await loadMembers();
                } else {
                    const result = await response.json();
                    showToast('Erreur: ' + (result.error || 'Erreur lors de la suppression'), 'error');
                }
            } catch (error) {
                console.error('Erreur suppression:', error);
                showToast('Erreur de connexion au serveur', 'error');
            }
        }

        async function handleUpdateProfile(e) {
            e.preventDefault();
            
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
                    showToast('Erreur: ' + (result.error || 'Erreur inconnue'), 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur lors de la modification du profil', 'error');
            }
        }

        function showSection(sectionName) {
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            document.querySelectorAll('.sidebar-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const sectionMap = {
                'dashboard': 'dashboardSection',
                'addMember': 'addMemberSection',
                'members': 'membersSection',
                'reports': 'reportsSection'
            };
            
            const sectionId = sectionMap[sectionName];
            const sectionElement = document.getElementById(sectionId);
            
            if (sectionElement) {
                sectionElement.classList.add('active');
                
                if (event && event.currentTarget) {
                    event.currentTarget.classList.add('active');
                }
                
                if (window.innerWidth <= 1024) {
                    toggleSidebar();
                }

                // Reload members if navigating to members section
                if (sectionName === 'members') {
                    currentPage = 1;
                    displayMembers();
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

        function openProfileModal() {
            document.getElementById('profileModal').classList.add('show');
        }

        function closeProfileModal() {
            document.getElementById('profileModal').classList.remove('show');
        }

        function closeEditMemberModal() {
            document.getElementById('editMemberModal').classList.remove('show');
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
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

            document.getElementById('toastContainer').appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        function showSuccessAnimation(message) {
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            showToast(message, 'success');
        }

        function logout() {
            if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) return;
            
            localStorage.removeItem('mcm_token');
            localStorage.removeItem('mcm_user');
            showToast('Déconnexion réussie', 'info');
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1000);
        }

        // Responsive handling
        window.addEventListener('resize', function() {
            const sidebar = document.getElementById('sidebar');
            const hamburger = document.getElementById('hamburger');
            const mobileItems = document.querySelectorAll('.mobile-only');
            
            if (window.innerWidth > 1024) {
                if (sidebar) sidebar.classList.remove('open');
                if (hamburger) hamburger.classList.remove('active');
                mobileItems.forEach(item => {
                    item.style.display = 'none';
                });
            }
        });
    