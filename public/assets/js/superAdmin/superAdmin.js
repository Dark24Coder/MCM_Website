// ========================================
// CONFIGURATION & VARIABLES GLOBALES
// ========================================
const API_BASE = '/api';
let token = null;
let currentUser = null;
let currentEditingMember = null;
let currentSection = 'dashboard';
let selectedMembers = [];
let allMembers = [];
let filteredMembers = [];
let currentPage = 1;
const membersPerPage = 10;

// Messages d'accueil aléatoires
const welcomeMessages = [
  { title: "Bienvenue SuperAdmin ! 🕴️", subtitle: "Vous avez le contrôle total de la plateforme MCM" },
  { title: "Excellente journée à vous ! ⭐", subtitle: "Gérez l'ensemble de l'écosystème MCM avec efficacité" },
  { title: "Ravi de vous revoir ! 🚀", subtitle: "Pilotez votre organisation vers l'excellence" },
  { title: "Bonjour SuperAdmin ! 💎", subtitle: "Votre leadership fait toute la différence" },
  { title: "Prêt à accomplir de grandes choses ! ✨", subtitle: "Supervisez et développez MCM avec passion" },
  { title: "Une nouvelle journée d'opportunités ! 🌟", subtitle: "L'avenir de MCM est entre vos mains" },
  { title: "Bienvenue dans votre empire ! 🏰", subtitle: "Coordonnez commissions et services sans limites" }
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
  
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  toast.innerHTML = `
    <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
    <div class="toast-message">${message}</div>
  `;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => { toast.style.animation = 'slideOutRight 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 4000);
}

function showSuccessAnimation() {
  const overlay = document.getElementById('successOverlay');
  overlay.classList.add('show');
  if (typeof confetti !== 'undefined') {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
  const roles = { 'admin': 'Admin de Service', 'adminCom': 'Admin de Commission', 'superadmin': 'SuperAdmin' };
  return roles[role] || role;
}

// ========================================
// INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  token = window.localStorage.getItem('mcm_token');
  if (!token) { window.location.href = './login.html'; return; }
  await initializeApp();
});

async function initializeApp() {
  try {
    await loadCurrentUser();
    await loadDashboardData();
    await loadServices();
    await loadCommissions();
    await checkBirthdays();
    initializeEventListeners();
    setRandomWelcomeMessage();
  } catch (error) {
    console.error('Erreur initialisation:', error);
    showToast('Erreur lors de l\'initialisation', 'error');
  }
}

function initializeEventListeners() {
  const hamburger = document.getElementById('hamburger');
  if (hamburger) hamburger.addEventListener('click', toggleSidebar);
  
  document.getElementById('userRole').addEventListener('change', handleRoleChange);
  document.getElementById('userCommission').addEventListener('change', handleCommissionChange);
  document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
  document.getElementById('manageUserForm').addEventListener('submit', handleCreateUser);
  document.getElementById('editMemberForm').addEventListener('submit', handleEditMember);
  document.getElementById('userProfileForm').addEventListener('submit', handleUpdateProfile);

  window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) e.target.classList.remove('show'); });
  
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    if (window.innerWidth <= 1024 && sidebar && hamburger && !sidebar.contains(e.target) && !hamburger.contains(e.target) && sidebar.classList.contains('open')) {
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
    currentUser = userDataString && userDataString !== 'null' ? JSON.parse(userDataString) : { nom: 'Admin', prenom: 'Principal', email: 'admin@mcm.com', role: 'superadmin' };
    updateUserDisplay();
  } catch (error) {
    console.error('Erreur chargement utilisateur:', error);
    currentUser = { nom: 'Admin', prenom: 'Principal', email: 'admin@mcm.com', role: 'superadmin' };
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
  if (password) profileData.mot_de_passe = password;
  
  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    
    if (response.status === 404) {
      currentUser = { ...currentUser, ...profileData };
      window.localStorage.setItem('mcm_user', JSON.stringify(currentUser));
      updateUserDisplay();
      showToast('Profil mis à jour localement', 'info');
      closeUserProfileModal();
      return;
    }
    
    if (response.ok) {
      currentUser = { ...currentUser, ...profileData };
      window.localStorage.setItem('mcm_user', JSON.stringify(currentUser));
      updateUserDisplay();
      showSuccessAnimation();
      showToast('Profil mis à jour avec succès!', 'success');
      closeUserProfileModal();
    }
  } catch (error) {
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
  }
}

async function logout() {
  if (!confirm('Êtes-vous sûr de vouloir vous déconnecter?')) return;
  window.localStorage.removeItem('mcm_token');
  window.localStorage.removeItem('mcm_user');
  showToast('Déconnexion réussie', 'info');
  setTimeout(() => { window.location.href = './login.html'; }, 1000);
}

// ========================================
// GESTION DES SECTIONS
// ========================================
function showSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
  
  const sectionMap = {
    'dashboard': 'dashboardSection',
    'members': 'membersSection',
    'addMember': 'addMemberSection',
    'addAdmin': 'addAdminSection',
    'stats': 'statsSection',
    'services': 'servicesSection',
    'commissions': 'commissionsSection'
  };
  
  const sectionId = sectionMap[sectionName];
  const sectionElement = document.getElementById(sectionId);
  
  if (sectionElement) {
    sectionElement.classList.add('active');
    currentSection = sectionName;
    
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    
    if (sectionName === 'members') loadAllMembersList();
    if (sectionName === 'dashboard') setRandomWelcomeMessage();
    if (window.innerWidth <= 1024) toggleSidebar();
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

function setRandomWelcomeMessage() {
  const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  const pageTitle = document.querySelector('.page-title');
  const pageSubtitle = document.querySelector('.page-subtitle');
  if (pageTitle && currentSection === 'dashboard') {
    pageTitle.textContent = message.title;
    if (pageSubtitle) pageSubtitle.textContent = message.subtitle;
  }
}

// ========================================
// VÉRIFICATION DES ANNIVERSAIRES
// ========================================
async function checkBirthdays() {
  try {
    const today = new Date();
    const [membersRes, usersRes] = await Promise.all([
      fetch(`${API_BASE}/membres`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/users`, { headers: getAuthHeaders() })
    ]);

    const members = await membersRes.json();
    const birthdayPeople = [];
    
    members.forEach(member => {
      if (member.date_naissance) {
        const birthDate = new Date(member.date_naissance);
        if (birthDate.getMonth() + 1 === today.getMonth() + 1 && birthDate.getDate() === today.getDate()) {
          const age = today.getFullYear() - birthDate.getFullYear();
          birthdayPeople.push({ ...member, type: 'membre', age });
        }
      }
    });
    
    if (birthdayPeople.length > 0) {
      birthdayPeople.forEach(person => {
        const msg = `🎉 C'est l'anniversaire de ${person.prenom} ${person.nom}! Il/Elle a ${person.age} ans!`;
        showToast(msg, 'info');
      });
    }
  } catch (error) {
    console.error('Erreur vérification anniversaires:', error);
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

    const response = await fetch(`${API_BASE}/membres`, { headers: getAuthHeaders() });

    if (response.ok) {
      allMembers = await response.json();
      filteredMembers = [...allMembers];
      currentPage = 1;
      displayMembersList();
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

function displayMembersList() {
  const container = document.getElementById('membersListContainer');
  
  if (filteredMembers.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 2rem;">Aucun membre trouvé</p>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  const startIndex = (currentPage - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const paginated = filteredMembers.slice(startIndex, endIndex);

  let html = `
    ${selectedMembers.length > 0 ? `
      <div style="margin-bottom: 1rem;">
        <button onclick="deleteSelectedMembers()" class="btn-primary" style="background: var(--error); width: auto;">
          <i class="fas fa-trash"></i> Supprimer ${selectedMembers.length} membre(s)
        </button>
      </div>
    ` : ''}
    <div class="member-list">
  `;

  paginated.forEach(member => {
    const isSelected = selectedMembers.includes(member.id);
    html += `
      <div class="member-item" style="position: relative;">
        <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleMemberSelection(${member.id})" style="position: absolute; left: 1rem; top: 1.5rem;">
        <div class="member-info" style="margin-left: 2rem;">
          <h4>${member.nom} ${member.prenom}</h4>
          <div class="member-details">
            <div class="member-detail"><i class="fas fa-envelope"></i><span>${member.email || 'Pas d\'email'}</span></div>
            <div class="member-detail"><i class="fas fa-phone"></i><span>${member.telephone || 'Pas de téléphone'}</span></div>
            <div class="member-detail"><i class="fas fa-venus-mars"></i><span>${member.sexe || 'Non spécifié'}</span></div>
          </div>
        </div>
        <div class="member-actions">
          <button class="action-btn edit" onclick="editMember(${member.id})" title="Modifier"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete" onclick="deleteMember(${member.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;

  const searchInput = document.getElementById('memberSearch');
  if (searchInput) {
    searchInput.addEventListener('keyup', searchMembers);
  }

  renderPagination();
}

function renderPagination() {
  const container = document.getElementById('pagination');
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="page-btn"><i class="fas fa-chevron-left"></i></button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button onclick="changePage(${i})" class="page-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
    }
  }
  html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="page-btn"><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

function changePage(page) {
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  displayMembersList();
}

function searchMembers() {
  const searchTerm = document.getElementById('memberSearch').value.toLowerCase();
  filteredMembers = allMembers.filter(member => {
    const fullName = `${member.nom} ${member.prenom}`.toLowerCase();
    const email = (member.email || '').toLowerCase();
    return fullName.includes(searchTerm) || email.includes(searchTerm);
  });
  currentPage = 1;
  displayMembersList();
}

function toggleMemberSelection(memberId) {
  const index = selectedMembers.indexOf(memberId);
  if (index > -1) {
    selectedMembers.splice(index, 1);
  } else {
    selectedMembers.push(memberId);
  }
  displayMembersList();
}

async function deleteSelectedMembers() {
  if (selectedMembers.length === 0) {
    showToast('Aucun membre sélectionné', 'info');
    return;
  }

  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedMembers.length} membre(s)?`)) return;

  try {
    for (const memberId of selectedMembers) {
      await fetch(`${API_BASE}/membres/${memberId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    }

    showSuccessAnimation();
    showToast(`${selectedMembers.length} membre(s) supprimé(s) avec succès!`, 'success');
    selectedMembers = [];
    await loadDashboardData();
    await loadAllMembersList();
  } catch (error) {
    showToast('Erreur lors de la suppression', 'error');
  }
}

async function loadServices() {
  try {
    const response = await fetch(`${API_BASE}/services`, { headers: getAuthHeaders() });
    const services = await response.json();

    const servicesGrid = document.getElementById('servicesGrid');
    const selects = ['memberService', 'userService', 'editMemberService', 'statsServiceSelect'];
    
    servicesGrid.innerHTML = '';
    selects.forEach(id => {
      const selectEl = document.getElementById(id);
      if (selectEl) selectEl.innerHTML = '<option value="">Sélectionner un service</option>';
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
          option.textContent = `${service.nom}`;
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
    const response = await fetch(`${API_BASE}/membres/service/${serviceId}`, { headers: getAuthHeaders() });
    const members = await response.json();
    const countEl = document.getElementById(`members-count-${serviceId}`);
    if (countEl) countEl.textContent = members.length;
  } catch (error) {
    console.error(`Erreur comptage membres service ${serviceId}:`, error);
  }
}

async function loadCommissions() {
  try {
    const response = await fetch(`${API_BASE}/commissions`, { headers: getAuthHeaders() });
    const commissions = await response.json();

    const commissionsGrid = document.getElementById('commissionsGrid');
    const commissionSelects = ['userCommission'];
    
    commissionsGrid.innerHTML = '';
    commissionSelects.forEach(id => {
      const selectEl = document.getElementById(id);
      if (selectEl) selectEl.innerHTML = '<option value="">Sélectionner une commission</option>';
    });

    commissions.forEach(commission => {
      const card = document.createElement('div');
      card.className = 'custom-card';
      card.onclick = () => showCommissionMembers(commission.id, commission.nom);
      card.innerHTML = `
        <div class="custom-card-title">${commission.nom}</div>
        <div class="custom-card-footer"><i class="fas fa-sitemap"></i> Voir les détails</div>
      `;
      commissionsGrid.appendChild(card);

      commissionSelects.forEach(id => {
        const selectEl = document.getElementById(id);
        if (selectEl) {
          const option = document.createElement('option');
          option.value = commission.id;
          option.textContent = commission.nom;
          selectEl.appendChild(option);
        }
      });
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
    service_id: parseInt(document.getElementById('memberService').value),
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
    showToast('Erreur lors de l\'ajout du membre', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function editMember(memberId) {
  try {
    const response = await fetch(`${API_BASE}/membres/${memberId}`, { headers: getAuthHeaders() });

    if (response.ok) {
      const member = await response.json();
      currentEditingMember = memberId;

      document.getElementById('editMemberService').value = member.service_id || '';
      document.getElementById('editMemberNom').value = member.nom || '';
      document.getElementById('editMemberPrenom').value = member.prenom || '';
      document.getElementById('editMemberSexe').value = member.sexe || '';
      
      let dateValue = member.date_naissance;
      if (dateValue && dateValue.includes('T')) dateValue = dateValue.split('T')[0];
      document.getElementById('editMemberDateNaissance').value = dateValue || '';
      document.getElementById('editMemberEmail').value = member.email || '';
      document.getElementById('editMemberTelephone').value = member.telephone || '';

      document.getElementById('editMemberModal').classList.add('show');
    } else {
      showToast('Erreur lors du chargement des données du membre', 'error');
    }
  } catch (error) {
    showToast('Erreur de connexion', 'error');
  }
}

async function handleEditMember(e) {
  e.preventDefault();
  if (!currentEditingMember) return;

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
    const response = await fetch(`${API_BASE}/membres/${currentEditingMember}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(memberData)
    });

    if (response.ok) {
      showSuccessAnimation();
      showToast('Membre modifié avec succès!', 'success');
      closeEditMemberModal();
      await loadDashboardData();
      if (currentSection === 'members') await loadAllMembersList();
    } else {
      const error = await response.json();
      showToast('Erreur: ' + error.error, 'error');
    }
  } catch (error) {
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
      await loadDashboardData();
      if (currentSection === 'members') await loadAllMembersList();
    } else {
      const error = await response.json();
      showToast('Erreur: ' + error.error, 'error');
    }
  } catch (error) {
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

  if (role === 'adminCom') {
    commissionGroup.style.display = 'block';
    serviceGroup.style.display = 'none';
    document.getElementById('userService').value = '';
  } else if (role === 'admin') {
    commissionGroup.style.display = 'block';
    serviceGroup.style.display = 'block';
  } else {
    commissionGroup.style.display = 'none';
    serviceGroup.style.display = 'none';
    document.getElementById('userCommission').value = '';
    document.getElementById('userService').value = '';
  }
}

function handleCommissionChange() {
  const commissionId = document.getElementById('userCommission').value;
  const serviceSelect = document.getElementById('userService');
  
  if (!commissionId) {
    serviceSelect.innerHTML = '<option value="">Sélectionner un service</option>';
    return;
  }

  fetch(`${API_BASE}/services`, { headers: getAuthHeaders() })
    .then(res => res.json())
    .then(services => {
      const filtered = services.filter(s => s.commission_id === parseInt(commissionId));
      serviceSelect.innerHTML = '<option value="">Sélectionner un service</option>';
      filtered.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.nom;
        serviceSelect.appendChild(option);
      });
    })
    .catch(error => console.error('Erreur filtre services:', error));
}

async function handleCreateUser(e) {
  e.preventDefault();
  const btn = document.getElementById('createUserBtn');
  setButtonLoading(btn, true);

  const email = document.getElementById('userEmail').value?.trim();
  const nom = document.getElementById('userNom').value?.trim();
  const prenom = document.getElementById('userPrenom').value?.trim();
  const mot_de_passe = document.getElementById('userPassword').value?.trim();
  const role = document.getElementById('userRole').value?.trim();
  const commission_id = document.getElementById('userCommission').value?.trim();
  const service_id = document.getElementById('userService').value?.trim();

  if (!email || !nom || !prenom || !mot_de_passe || !role) {
    showToast('Tous les champs marqués * sont obligatoires', 'error');
    setButtonLoading(btn, false);
    return;
  }

  if (role === 'adminCom' && !commission_id) {
    showToast('Veuillez sélectionner une commission', 'error');
    setButtonLoading(btn, false);
    return;
  }

  if (role === 'admin' && (!commission_id || !service_id)) {
    showToast('Veuillez sélectionner une commission et un service', 'error');
    setButtonLoading(btn, false);
    return;
  }

  const userData = {
    email, nom, prenom, mot_de_passe, role
  };

  if (commission_id) userData.commission_id = parseInt(commission_id);
  if (service_id) userData.service_id = parseInt(service_id);

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
      showToast('Erreur: ' + (error.error || 'Erreur inconnue'), 'error');
    }
  } catch (error) {
    showToast('Erreur lors de la création de l\'utilisateur', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function showAdministrators() {
  try {
    const response = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
    const users = await response.json();
    const administrators = users.filter(u => u.role === 'admin' || u.role === 'adminCom' || u.role === 'superadmin');

    const modalBody = document.getElementById('administratorsBody');
    modalBody.innerHTML = '';

    if (administrators.length === 0) {
      modalBody.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 2rem;">Aucun administrateur</p>';
    } else {
      administrators.forEach(admin => {
        const adminDiv = document.createElement('div');
        adminDiv.className = 'member-item admin';
        adminDiv.innerHTML = `
          <div class="member-info">
            <h4><i class="fas fa-shield-alt" style="color: var(--primary-red);"></i> ${admin.nom} ${admin.prenom}</h4>
            <div class="member-details">
              <div class="member-detail"><i class="fas fa-envelope"></i><span>${admin.email}</span></div>
              <div class="member-detail"><i class="fas fa-user-tag"></i><span>${getRoleDisplayName(admin.role)}</span></div>
            </div>
          </div>
        `;
        modalBody.appendChild(adminDiv);
      });
    }

    document.getElementById('administratorsModal').classList.add('show');
  } catch (error) {
    showToast('Erreur lors du chargement des administrateurs', 'error');
  }
}

// ========================================
// STATISTIQUES
// ========================================
async function loadStatistics() {
  try {
    const response = await fetch(`${API_BASE}/services`, { headers: getAuthHeaders() });
    const services = await response.json();
    const selectEl = document.getElementById('statsServiceSelect');
    if (selectEl) {
      selectEl.innerHTML = '<option value="">Sélectionner un service</option>';
      services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.nom;
        selectEl.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erreur chargement stats:', error);
  }
}

async function displayServiceStatistics() {
  const serviceId = document.getElementById('statsServiceSelect').value;
  
  if (!serviceId) {
    showToast('Veuillez sélectionner un service', 'info');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/membres/service/${serviceId}`, { headers: getAuthHeaders() });
    if (response.ok) {
      const members = await response.json();
      displayStatsPage(members);
    }
  } catch (error) {
    showToast('Erreur lors du chargement des statistiques', 'error');
  }
}

function displayStatsPage(members) {
  const container = document.getElementById('statsContainer');
  const total = members.length;
  const males = members.filter(m => m.sexe === 'Homme').length;
  const females = members.filter(m => m.sexe === 'Femme').length;
  const avgAge = total > 0 ? Math.round(members.reduce((sum, m) => {
    if (!m.date_naissance) return sum;
    const age = new Date().getFullYear() - new Date(m.date_naissance).getFullYear();
    return sum + age;
  }, 0) / total) : 0;

  const emailCount = members.filter(m => m.email && m.email.trim()).length;
  const phoneCount = members.filter(m => m.telephone && m.telephone.trim()).length;

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div><div class="stat-number">${total}</div><div class="stat-label">Total Membres</div></div>
          <div class="stat-icon"><i class="fas fa-users"></i></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <div><div class="stat-number">${males}</div><div class="stat-label">Hommes</div></div>
          <div class="stat-icon"><i class="fas fa-male"></i></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <div><div class="stat-number">${females}</div><div class="stat-label">Femmes</div></div>
          <div class="stat-icon"><i class="fas fa-female"></i></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <div><div class="stat-number">${avgAge}</div><div class="stat-label">Âge Moyen</div></div>
          <div class="stat-icon"><i class="fas fa-birthday-cake"></i></div>
        </div>
      </div>
    </div>
    <div class="section-card">
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--black);"><i class="fas fa-chart-pie" style="color: var(--primary-red);"></i> Détails</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
        <div style="padding: 1.5rem; background: var(--off-white); border-radius: 12px; border-left: 4px solid var(--primary-red);">
          <strong style="color: var(--primary-red); display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;"><i class="fas fa-envelope"></i> Emails</strong>
          <span style="font-size: 1.5rem; font-weight: 700;">${emailCount}/${total}</span>
        </div>
        <div style="padding: 1.5rem; background: var(--off-white); border-radius: 12px; border-left: 4px solid var(--info);">
          <strong style="color: var(--info); display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;"><i class="fas fa-phone"></i> Téléphones</strong>
          <span style="font-size: 1.5rem; font-weight: 700;">${phoneCount}/${total}</span>
        </div>
        <div style="padding: 1.5rem; background: var(--off-white); border-radius: 12px; border-left: 4px solid var(--success);">
          <strong style="color: var(--success); display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;"><i class="fas fa-chart-bar"></i> Hommes/Femmes</strong>
          <span style="font-size: 1.5rem; font-weight: 700;">${total > 0 ? Math.round((males / total) * 100) : 0}% / ${total > 0 ? Math.round((females / total) * 100) : 0}%</span>
        </div>
      </div>
    </div>
    <div class="section-card" style="margin-top: 2rem;">
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--black);"><i class="fas fa-list" style="color: var(--primary-red);"></i> Liste</h3>
      <div style="overflow-x: auto;">
        <table class="members-table">
          <thead>
            <tr>
              <th>Nom & Prénom</th><th>Sexe</th><th>Email</th><th>Téléphone</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(m => `
              <tr>
                <td><strong>${m.nom} ${m.prenom}</strong></td>
                <td><span style="background: ${m.sexe === 'Homme' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)'}; color: ${m.sexe === 'Homme' ? 'var(--info)' : '#EC4899'}; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600;">${m.sexe}</span></td>
                <td>${m.email || '-'}</td>
                <td>${m.telephone || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ========================================
// MODALES
// ========================================
async function showServiceMembers(serviceId, serviceName) {
  try {
    const response = await fetch(`${API_BASE}/membres/service/${serviceId}`, { headers: getAuthHeaders() });
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
              <div class="member-detail"><i class="fas fa-envelope"></i><span>${member.email || 'Pas d\'email'}</span></div>
              <div class="member-detail"><i class="fas fa-phone"></i><span>${member.telephone || 'Pas de téléphone'}</span></div>
              <div class="member-detail"><i class="fas fa-venus-mars"></i><span>${member.sexe || 'Non spécifié'}</span></div>
            </div>
          </div>
          <div class="member-actions">
            <button class="action-btn edit" onclick="editMember(${member.id})" title="Modifier"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" onclick="deleteMember(${member.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
          </div>
        `;
        modalBody.appendChild(memberDiv);
      });
    }

    document.getElementById('serviceModal').classList.add('show');
  } catch (error) {
    showToast('Erreur lors du chargement des membres', 'error');
  }
}

async function showCommissionMembers(commissionId, commissionName) {
  try {
    const servicesRes = await fetch(`${API_BASE}/services`, { headers: getAuthHeaders() });
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
        const membersRes = await fetch(`${API_BASE}/membres/service/${service.id}`, { headers: getAuthHeaders() });
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
                  <div class="member-detail"><i class="fas fa-envelope"></i><span>${member.email || 'Pas d\'email'}</span></div>
                  <div class="member-detail"><i class="fas fa-phone"></i><span>${member.telephone || 'Pas de téléphone'}</span></div>
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
    showToast('Erreur lors du chargement de la commission', 'error');
  }
}

function closeModal() { document.getElementById('serviceModal').classList.remove('show'); }
function closeCommissionModal() { document.getElementById('commissionModal').classList.remove('show'); }
function closeEditMemberModal() { document.getElementById('editMemberModal').classList.remove('show'); currentEditingMember = null; }
function closeAdministratorsModal() { document.getElementById('administratorsModal').classList.remove('show'); }
function closeUserProfileModal() { document.getElementById('userProfileModal').classList.remove('show'); }

// ========================================
// RESPONSIVE
// ========================================
window.addEventListener('resize', function() {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  if (window.innerWidth > 1024) {
    if (sidebar) sidebar.classList.remove('open');
    if (hamburger) hamburger.classList.remove('active');
  }
});