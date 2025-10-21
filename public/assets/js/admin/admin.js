        const API_BASE = '/api';
        const MEMBERS_PER_PAGE = 10;

        const app = {
            token: window.localStorage.getItem('mcm_token'),
            user: null,
            members: [],
            filtered: [],
            selected: [],
            page: 1,

            async init() {
                if (!this.token) {
                    window.location.href = './login.html';
                    return;
                }

                await this.loadUser();
                await this.loadMembers();
                this.setupEvents();
                this.showWelcome();
                this.checkBirthdays();
            },

            async loadUser() {
                try {
                    const data = window.localStorage.getItem('mcm_user');
                    this.user = data ? JSON.parse(data) : { nom: 'Admin', prenom: 'User', email: 'admin@mcm.com', service_id: 1 };
                    
                    const initials = this.user.prenom.charAt(0) + this.user.nom.charAt(0);
                    document.getElementById('userAvatar').textContent = initials.toUpperCase();
                    document.getElementById('userName').textContent = `${this.user.prenom} ${this.user.nom}`;
                    
                    document.getElementById('profNom').value = this.user.nom;
                    document.getElementById('profPrenom').value = this.user.prenom;
                    document.getElementById('profEmail').value = this.user.email;
                } catch (e) {
                    console.error('Erreur profil:', e);
                }
            },

            async loadMembers() {
                try {
                    const res = await fetch(`${API_BASE}/membres`, {
                        headers: { 'Authorization': `Bearer ${this.token}` }
                    });

                    if (res.status === 401) {
                        window.localStorage.removeItem('mcm_token');
                        window.location.href = './login.html';
                        return;
                    }

                    this.members = await res.json() || [];
                    this.filtered = [...this.members];
                    this.updateStats();
                    this.renderMembers();
                } catch (e) {
                    this.toast('Erreur chargement', 'error');
                }
            },

            updateStats() {
                const total = this.members.length;
                const males = this.members.filter(m => m.sexe === 'Homme').length;
                const females = total - males;
                
                const now = new Date();
                const thisMonth = this.members.filter(m => {
                    const d = new Date(m.created_at || m.date_naissance);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length;

                document.getElementById('totalMembers').textContent = total;
                document.getElementById('maleCount').textContent = males;
                document.getElementById('femaleCount').textContent = females;
                document.getElementById('thisMonth').textContent = thisMonth;

                document.getElementById('reportTotal').textContent = total;
                document.getElementById('reportMale').textContent = total > 0 ? Math.round((males / total) * 100) + '%' : '0%';
                document.getElementById('reportFemale').textContent = total > 0 ? Math.round((females / total) * 100) + '%' : '0%';

                const avgAge = total > 0 ? Math.round(this.members.reduce((sum, m) => {
                    if (!m.date_naissance) return sum;
                    const age = new Date().getFullYear() - new Date(m.date_naissance).getFullYear();
                    return sum + age;
                }, 0) / total) : 0;
                document.getElementById('reportAge').textContent = avgAge;

                const emails = this.members.filter(m => m.email).length;
                const phones = this.members.filter(m => m.telephone).length;
                const completion = total > 0 ? Math.round(((emails + phones) / (total * 2)) * 100) : 0;

                document.getElementById('emailCount').textContent = emails;
                document.getElementById('phoneCount').textContent = phones;
                document.getElementById('completionRate').textContent = completion + '%';
            },

            checkBirthdays() {
                const now = new Date();
                const bdays = this.members.filter(m => {
                    if (!m.date_naissance) return false;
                    const d = new Date(m.date_naissance);
                    let next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
                    if (next < now) next.setFullYear(now.getFullYear() + 1);
                    const days = Math.floor((next - now) / (1000 * 60 * 60 * 24));
                    return days >= 0 && days <= 30;
                }).sort((a, b) => {
                    const da = new Date(a.date_naissance);
                    const db = new Date(b.date_naissance);
                    return da.getMonth() - db.getMonth() || da.getDate() - db.getDate();
                });

                const div = document.getElementById('birthdaysDiv');
                if (bdays.length === 0) {
                    div.innerHTML = '<p style="color: var(--gray); grid-column: 1/-1; text-align: center;">Aucun anniversaire ce mois</p>';
                } else {
                    div.innerHTML = bdays.map(m => {
                        const d = new Date(m.date_naissance);
                        const age = now.getFullYear() - d.getFullYear();
                        const dateStr = d.toLocaleDateString('fr-FR', {month: 'long', day: 'numeric'});
                        
                        // Notification toast pour les anniversaires aujourd'hui
                        if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth()) {
                            this.toast(`🎉 C'est l'anniversaire de ${m.prenom} ${m.nom}! Il/Elle a ${age} ans!`, 'info');
                        }
                        
                        return `<div class="birthday-card">
                            <strong>🎂 ${m.prenom} ${m.nom}</strong>
                            <div class="birthday-date">${dateStr} - ${age} ans</div>
                        </div>`;
                    }).join('');
                }
            },

            renderMembers() {
                const start = (this.page - 1) * MEMBERS_PER_PAGE;
                const page = this.filtered.slice(start, start + MEMBERS_PER_PAGE);

                let bulk = '';
                if (this.selected.length) {
                    bulk = `<div class="bulk-actions">
                        <span class="bulk-actions-text">
                            <i class="fas fa-check-circle"></i> ${this.selected.length} sélectionné(s)
                        </span>
                        <button type="button" class="btn-primary btn-danger" style="width: 200px;" onclick="app.deleteSelected()">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>`;
                }
                document.getElementById('bulkActionsDiv').innerHTML = bulk;

                let html = `<table class="members-table">
                    <thead>
                        <tr>
                            <th style="width: 30px;">
                                <input type="checkbox" id="checkAll" onchange="app.toggleAll()">
                            </th>
                            <th>Nom</th>
                            <th>Sexe</th>
                            <th>Naissance</th>
                            <th>Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>`;
                
                page.forEach(m => {
                    const sel = this.selected.includes(m.id);
                    html += `<tr>
                        <td><input type="checkbox" ${sel ? 'checked' : ''} onchange="app.toggleMember(${m.id})"></td>
                        <td><strong>${m.nom} ${m.prenom}</strong></td>
                        <td>
                            <span class="member-badge ${m.sexe.toLowerCase()}">
                                <i class="fas fa-${m.sexe === 'Homme' ? 'male' : 'female'}"></i>
                                ${m.sexe}
                            </span>
                        </td>
                        <td>${this.formatDate(m.date_naissance)}</td>
                        <td>
                            <div style="font-size:0.875rem;">
                                <div><i class="fas fa-envelope" style="color: var(--primary-red); width: 16px;"></i> ${m.email || '-'}</div>
                                <div><i class="fas fa-phone" style="color: var(--primary-red); width: 16px;"></i> ${m.telephone || '-'}</div>
                            </div>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn edit" onclick="app.editMember(${m.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="app.deleteMember(${m.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>`;
                });
                
                html += '</tbody></table>';
                document.getElementById('membersDiv').innerHTML = html;

                this.renderPagination();
                this.updateCheckAll();
            },

            renderPagination() {
                const total = Math.ceil(this.filtered.length / MEMBERS_PER_PAGE);
                let html = `<button onclick="app.setPage(${this.page - 1})" ${this.page === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>`;
                
                for (let i = 1; i <= total; i++) {
                    if (i === 1 || i === total || (i >= this.page - 1 && i <= this.page + 1)) {
                        html += `<button onclick="app.setPage(${i})" ${i === this.page ? 'class="active"' : ''}>
                            ${i}
                        </button>`;
                    } else if (i === this.page - 2 || i === this.page + 2) {
                        html += '<span style="padding: 0.5rem;">...</span>';
                    }
                }
                
                html += `<button onclick="app.setPage(${this.page + 1})" ${this.page === total ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>`;
                
                document.getElementById('paginationDiv').innerHTML = html;
            },

            updateCheckAll() {
                const start = (this.page - 1) * MEMBERS_PER_PAGE;
                const page = this.filtered.slice(start, start + MEMBERS_PER_PAGE);
                const checkAll = document.getElementById('checkAll');
                if (checkAll) checkAll.checked = page.length > 0 && page.every(m => this.selected.includes(m.id));
            },

            toggleAll() {
                const start = (this.page - 1) * MEMBERS_PER_PAGE;
                const page = this.filtered.slice(start, start + MEMBERS_PER_PAGE);
                const checked = document.getElementById('checkAll').checked;
                page.forEach(m => {
                    const idx = this.selected.indexOf(m.id);
                    if (checked && idx === -1) this.selected.push(m.id);
                    if (!checked && idx !== -1) this.selected.splice(idx, 1);
                });
                this.renderMembers();
            },

            toggleMember(id) {
                const idx = this.selected.indexOf(id);
                if (idx === -1) this.selected.push(id);
                else this.selected.splice(idx, 1);
                this.renderMembers();
            },

            filterMembers() {
                const search = document.getElementById('searchInput').value.toLowerCase();
                this.filtered = this.members.filter(m => 
                    `${m.nom} ${m.prenom}`.toLowerCase().includes(search) || 
                    (m.email || '').toLowerCase().includes(search)
                );
                this.page = 1;
                this.selected = [];
                this.renderMembers();
            },

            formatDate(d) {
                return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
            },

            setPage(p) {
                const max = Math.ceil(this.filtered.length / MEMBERS_PER_PAGE);
                if (p < 1 || p > max) return;
                this.page = p;
                this.renderMembers();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },

            showSection(name) {
                document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
                document.getElementById(name + 'Section').classList.add('active');
                if (event && event.currentTarget) event.currentTarget.classList.add('active');
                if (window.innerWidth <= 1024) this.toggleSidebar();
            },

            toggleSidebar() {
                const sidebar = document.getElementById('sidebar');
                const hamburger = document.getElementById('hamburger');
                sidebar.classList.toggle('open');
                hamburger.classList.toggle('active');
            },

            showWelcome() {
                const msgs = [
                    { title: "Excellente journée ! 🌟", sub: "Prêt à gérer votre service ?" },
                    { title: "Bienvenue ! 👋", sub: "Continuez votre excellent travail" },
                    { title: "Ravi de vous revoir ! 😊", sub: "Gérez vos membres efficacement" },
                    { title: "Bonjour Admin ! ✨", sub: "Votre service compte sur vous" }
                ];
                const m = msgs[Math.floor(Math.random() * msgs.length)];
                document.getElementById('welcomeMessage').textContent = m.title;
                document.getElementById('welcomeSubtext').textContent = m.sub;
            },

            async addMember(e) {
                e.preventDefault();
                const data = {
                    nom: document.getElementById('addNom').value,
                    prenom: document.getElementById('addPrenom').value,
                    sexe: document.getElementById('addSexe').value,
                    date_naissance: document.getElementById('addDateNaissance').value,
                    email: document.getElementById('addEmail').value,
                    telephone: document.getElementById('addTelephone').value,
                    service_id: this.user.service_id || 1
                };

                try {
                    const res = await fetch(`${API_BASE}/membres`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (res.ok) {
                        document.getElementById('addMemberForm').reset();
                        this.toast('Membre ajouté avec succès!', 'success');
                        this.confetti();
                        await this.loadMembers();
                    } else {
                        const err = await res.json();
                        this.toast('Erreur: ' + (err.error || 'Erreur inconnue'), 'error');
                    }
                } catch (e) {
                    this.toast('Erreur de connexion', 'error');
                }
            },

            async updateMember(e) {
                e.preventDefault();
                const id = document.getElementById('editId').value;
                const data = {
                    nom: document.getElementById('editNom').value,
                    prenom: document.getElementById('editPrenom').value,
                    sexe: document.getElementById('editSexe').value,
                    date_naissance: document.getElementById('editDateNaissance').value,
                    email: document.getElementById('editEmail').value,
                    telephone: document.getElementById('editTelephone').value,
                    service_id: this.user.service_id || 1
                };

                try {
                    const res = await fetch(`${API_BASE}/membres/${id}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (res.ok) {
                        this.toast('Membre modifié avec succès!', 'success');
                        this.confetti();
                        this.closeModal('editModal');
                        await this.loadMembers();
                    } else {
                        this.toast('Erreur modification', 'error');
                    }
                } catch (e) {
                    this.toast('Erreur de connexion', 'error');
                }
            },

            async updateProfile(e) {
                e.preventDefault();
                const data = {
                    nom: document.getElementById('profNom').value,
                    prenom: document.getElementById('profPrenom').value,
                    email: document.getElementById('profEmail').value
                };
                const pwd = document.getElementById('profPassword').value;
                if (pwd) data.mot_de_passe = pwd;

                try {
                    const res = await fetch(`${API_BASE}/auth/profile`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (res.ok || res.status === 404) {
                        this.user = { ...this.user, ...data };
                        window.localStorage.setItem('mcm_user', JSON.stringify(this.user));
                        await this.loadUser();
                        this.toast('Profil mis à jour avec succès!', 'success');
                        this.confetti();
                        this.closeModal('profileModal');
                    }
                } catch (e) {
                    this.toast('Erreur de mise à jour', 'error');
                }
            },

            async deleteMember(id) {
                if (!confirm('Supprimer ce membre ?')) return;
                try {
                    const res = await fetch(`${API_BASE}/membres/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${this.token}` }
                    });

                    if (res.ok) {
                        this.toast('Membre supprimé avec succès!', 'success');
                        this.confetti();
                        await this.loadMembers();
                    }
                } catch (e) {
                    this.toast('Erreur de suppression', 'error');
                }
            },

            async deleteSelected() {
                if (!confirm(`Supprimer ${this.selected.length} membre(s) ?`)) return;
                try {
                    for (const id of this.selected) {
                        await fetch(`${API_BASE}/membres/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${this.token}` }
                        });
                    }
                    this.toast(`${this.selected.length} membre(s) supprimé(s)!`, 'success');
                    this.confetti();
                    this.selected = [];
                    await this.loadMembers();
                } catch (e) {
                    this.toast('Erreur de suppression', 'error');
                }
            },

            editMember(id) {
                const m = this.members.find(x => x.id === id);
                if (!m) return;
                document.getElementById('editId').value = m.id;
                document.getElementById('editNom').value = m.nom;
                document.getElementById('editPrenom').value = m.prenom;
                document.getElementById('editSexe').value = m.sexe;
                document.getElementById('editDateNaissance').value = m.date_naissance.split('T')[0];
                document.getElementById('editEmail').value = m.email || '';
                document.getElementById('editTelephone').value = m.telephone || '';
                this.openModal('editModal');
            },

            openProfileModal() {
                this.openModal('profileModal');
            },

            openModal(name) {
                document.getElementById(name).classList.add('show');
            },

            closeModal(name) {
                document.getElementById(name).classList.remove('show');
            },

            logout() {
                if (!confirm('Déconnecter ?')) return;
                window.localStorage.removeItem('mcm_token');
                window.localStorage.removeItem('mcm_user');
                this.toast('Déconnecté', 'info');
                setTimeout(() => window.location.href = './login.html', 1000);
            },

            toast(msg, type) {
                const div = document.createElement('div');
                div.className = `toast ${type}`;
                const icons = {
                    success: 'check-circle',
                    error: 'exclamation-circle',
                    warning: 'exclamation-triangle',
                    info: 'info-circle'
                };
                div.innerHTML = `
                    <div class="toast-icon">
                        <i class="fas fa-${icons[type]}"></i>
                    </div>
                    <div class="toast-message">${msg}</div>
                `;
                document.getElementById('toastContainer').appendChild(div);
                setTimeout(() => div.remove(), 4000);
            },

            confetti() {
                if (typeof confetti !== 'undefined') {
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
            },

            setupEvents() {
                document.getElementById('hamburger').addEventListener('click', () => this.toggleSidebar());
                
                window.addEventListener('click', (e) => {
                    if (e.target.classList.contains('modal')) {
                        e.target.classList.remove('show');
                    }
                });

                window.addEventListener('resize', () => {
                    if (window.innerWidth > 1024) {
                        document.getElementById('sidebar').classList.remove('open');
                        document.getElementById('hamburger').classList.remove('active');
                    }
                });
            }
        };

        document.addEventListener('DOMContentLoaded', () => app.init());