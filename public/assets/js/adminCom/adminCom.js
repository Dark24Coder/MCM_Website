// ========================================
        // CONFIGURATION
        // ========================================
        const API_BASE = '/api';
        let currentUser = null;
        let authToken = window.localStorage.getItem('mcm_token');
        let services = [];
        let allMembers = [];
        let filteredMembers = [];
        let currentPage = 1;
        const membersPerPage = 10;

        // Welcome messages
        const welcomeMessages = [
            {
                title: "Bienvenue dans votre espace Commission ! 🎯",
                subtitle: "Pilotez vos services avec efficacité et vision stratégique"
            },
            {
                title: "Excellente journée à vous ! ⭐",
                subtitle: "Votre leadership fait la différence dans cette commission"
            },
            {
                title: "Ravi de vous revoir ! 👋",
                subtitle: "Continuez votre excellent travail de coordination"
            },
            {
                title: "Bonjour Admin de Commission ! 🚀",
                subtitle: "Ensemble, construisons une commission forte et unie"
            },
            {
                title: "Prêt à accomplir de grandes choses ! ✨",
                subtitle: "Votre commission compte sur votre dévouement"
            },
            {
                title: "Une nouvelle journée pleine d'opportunités ! 🌟",
                subtitle: "Supervisez et développez votre commission avec passion"
            }
        ];

        const getAuthHeaders = () => ({
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        });

        // ========================================
        // INITIALIZATION
        // ========================================
        document.addEventListener('DOMContentLoaded', function() {
            if (!authToken || authToken === 'null' || authToken === 'undefined') {
                window.location.href = './login.html';
                return;
            }
            initializeApp();
        });

        async function initializeApp() {
            try {
                await loadUserProfile();
                displayRandomWelcome();
                await loadServices();
                initializeEventListeners();
            } catch (error) {
                console.error('Erreur initialisation:', error);
                showToast('Erreur lors de l\'initialisation', 'error');
            }
        }

        function displayRandomWelcome() {
            const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
            document.getElementById('welcomeMessage').textContent = randomMessage.title;
            document.getElementById('welcomeSubtext').textContent = randomMessage.subtitle;
        }

        function initializeEventListeners() {
            const hamburger = document.getElementById('hamburger');
            if (hamburger) {
                hamburger.addEventListener('click', toggleSidebar);
            }

            document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
            document.getElementById('profileForm').addEventListener('submit', handleUpdateProfile);
            document.getElementById('editMemberForm').addEventListener('submit', handleEditMember);

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
        // SECTION MANAGEMENT
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
                'services': 'servicesSection',
                'members': 'membersSection',
                'addMember': 'addMemberSection',
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

                // Reload data when navigating to members
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

        // ========================================
        // USER PROFILE
        // ========================================
        async function loadUserProfile() {
            try {
                const userDataString = window.localStorage.getItem('mcm_user');
                
                if (!userDataString || userDataString === 'null' || userDataString === 'undefined') {
                    currentUser = {
                        nom: 'Admin',
                        prenom: 'Commission',
                        email: 'admincom@mcm.com',
                        commission_id: 1
                    };
                } else {
                    currentUser = JSON.parse(userDataString);
                }
                
                const fullName = `${currentUser.prenom} ${currentUser.nom}`;
                document.getElementById('userName').textContent = fullName;
                
                const initials = `${currentUser.prenom.charAt(0)}${currentUser.nom.charAt(0)}`;
                document.getElementById('userInitials').textContent = initials.toUpperCase();
                
                document.getElementById('profileNom').value = currentUser.nom || '';
                document.getElementById('profilePrenom').value = currentUser.prenom || '';
                document.getElementById('profileEmail').value = currentUser.email || '';
                
                if (currentUser.commission_id) {
                    await loadCommissionName(currentUser.commission_id);
                }
                
            } catch (error) {
                console.error('Erreur chargement profil:', error);
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

        function openProfileModal() {
            document.getElementById('profileModal').classList.add('show');
        }

        function closeProfileModal() {
            document.getElementById('profileModal').classList.remove('show');
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
                    headers: getAuthHeaders(),
                    body: JSON.stringify(profileData)
                });

                if (response.ok) {
                    currentUser.nom = profileData.nom;
                    currentUser.prenom = profileData.prenom;
                    currentUser.email = profileData.email;
                    window.localStorage.setItem('mcm_user', JSON.stringify(currentUser));
                    
                    showSuccessAnimation();
                    showToast('Profil mis à jour avec succès!', 'success');
                    await loadUserProfile();
                    closeProfileModal();
                } else {
                    throw new Error('Erreur lors de la mise à jour');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur: ' + error.message, 'error');
            }
        }

        // ========================================
        // SERVICES
        // ========================================
        async function loadServices() {
            try {
                if (!currentUser || !currentUser.commission_id) {
                    showToast('Erreur: Commission ID non trouvée', 'error');
                    return;
                }

                const response = await fetch(`${API_BASE}/services`, {
                    headers: getAuthHeaders()
                });
                
                if (response.status === 401) {
                    window.localStorage.removeItem('mcm_token');
                    window.localStorage.removeItem('mcm_user');
                    window.location.href = './login.html';
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                
                const allServices = await response.json();
                services = allServices.filter(s => s.commission_id === currentUser.commission_id);
                
                displayServices();
                populateServiceSelect();
                await loadAllMembers();
                updateStats();
                
            } catch (error) {
                console.error('Erreur chargement services:', error);
                showToast('Erreur: ' + error.message, 'error');
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
                
                const initials = service.nom.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
                
                serviceCard.innerHTML = `
                    <div class="service-header">
                        <div class="service-icon">${initials}</div>
                        <div style="flex: 1;">
                            <div class="service-title">${service.nom}</div>
                        </div>
                    </div>
                    <div class="service-count" id="count-${service.id}">
                        <i class="fas fa-users"></i>
                        <span>Chargement...</span>
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
            const selects = ['serviceSelect', 'editMemberService'];
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (!select) return;
                
                select.innerHTML = '<option value="">Choisir un service</option>';
                
                services.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.id;
                    option.textContent = service.nom;
                    select.appendChild(option);
                });
            });
        }

        // ========================================
        // MEMBERS
        // ========================================
        async function loadAllMembers() {
            try {
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
                                member.service_id = service.id;
                            });
                            allMembers = allMembers.concat(serviceMembers);
                        }
                    } catch (error) {
                        console.error(`Erreur membres service ${service.id}:`, error);
                    }
                }

                filteredMembers = [...allMembers];
                displayMembers();
                updateStats();
                updateReportsStats();
                
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

        function updateStats() {
            const totalServicesEl = document.getElementById('totalServices');
            const totalMembersEl = document.getElementById('totalMembers');
            const avgEl = document.getElementById('avgMembersPerService');
            const maleEl = document.getElementById('maleMembers');
            
            if (totalServicesEl) totalServicesEl.textContent = services.length;
            if (totalMembersEl) totalMembersEl.textContent = allMembers.length;
            
            const avg = services.length > 0 ? Math.round(allMembers.length / services.length) : 0;
            if (avgEl) avgEl.textContent = avg;
            
            const males = allMembers.filter(m => m.sexe === 'Homme').length;
            if (maleEl) maleEl.textContent = males;
        }

        function updateReportsStats() {
            const total = allMembers.length;
            const males = allMembers.filter(m => m.sexe === 'Homme').length;
            const females = allMembers.filter(m => m.sexe === 'Femme').length;
            
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

            // Additional stats
            const emailCount = allMembers.filter(m => m.email && m.email.trim()).length;
            const phoneCount = allMembers.filter(m => m.telephone && m.telephone.trim()).length;
            const completionRate = total > 0 ? Math.round(((emailCount + phoneCount) / (total * 2)) * 100) : 0;

            document.getElementById('reportEmailCount').textContent = emailCount;
            document.getElementById('reportPhoneCount').textContent = phoneCount;
            document.getElementById('reportCompletionRate').textContent = completionRate + '%';

            // Service stats
            displayServiceStats();
        }

        function displayServiceStats() {
            const container = document.getElementById('serviceStatsGrid');
            if (!container) return;
            
            container.innerHTML = '';
            
            services.forEach(service => {
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
        // ADD MEMBER
        // ========================================
        async function handleAddMember(e) {
            e.preventDefault();
            
            const btn = document.getElementById('addMemberBtn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Ajout en cours...</span>';
            btn.disabled = true;
            
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
                console.error('Erreur ajout:', error);
                showToast('Erreur: ' + error.message, 'error');
            } finally {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        }

        // ========================================
        // EDIT MEMBER
        // ========================================
        async function editMember(id) {
            try {
                const member = allMembers.find(m => m.id === id);
                
                if (!member) {
                    showToast('Membre non trouvé', 'error');
                    return;
                }
                
                document.getElementById('editMemberId').value = member.id;
                document.getElementById('editMemberService').value = member.service_id || '';
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
                
                document.getElementById('editMemberModal').classList.add('show');
            } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur de chargement', 'error');
            }
        }

        function closeEditMemberModal() {
            document.getElementById('editMemberModal').classList.remove('show');
        }

        async function handleEditMember(e) {
            e.preventDefault();
            
            const id = document.getElementById('editMemberId').value;
            const memberData = {
                service_id: parseInt(document.getElementById('editMemberService').value),
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

        // ========================================
        // DELETE MEMBER
        // ========================================
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

        // ========================================
        // UTILITY FUNCTIONS
        // ========================================
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
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }

        function logout() {
            if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) return;
            
            window.localStorage.removeItem('mcm_token');
            window.localStorage.removeItem('mcm_user');
            showToast('Déconnexion réussie', 'info');
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1000);
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
    