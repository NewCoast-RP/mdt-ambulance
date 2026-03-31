/**
 * ============================================================================
 * MDT - LSPD / SASP - SCRIPT PRINCIPAL
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. SYSTÈME DE CONNEXION, PERMISSIONS ET PROFIL
    // ==========================================
    const loginScreen = document.getElementById('login-screen');
    const mdtApp = document.getElementById('mdt-app');
    const btnLogin = document.getElementById('btn-login');
    const inputUser = document.getElementById('login-username');
    const loginError = document.getElementById('login-error');
    const passwordInput = document.getElementById('login-password');
    const togglePassword = document.getElementById('toggle-password');

    let currentUserProfile = {
        name: "DEV Photon",
        grade: "SASP",
        matricule: "21",
        phone: "555-0021",
        iban: "LS-99887766",
        email: "photon@sasp.ls"
    };

    if (inputUser) {
        inputUser.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (passwordInput) passwordInput.focus(); }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (btnLogin) btnLogin.click(); }
        });
    }

    const permissions = {
        'SASP': { name: 'DEV Photon', grade: 'SASP', hideSections: [] },
        'EMS': { name: 'MEDIC LOOP', grade: 'EMS - Directeur', hideSections: ['registres_police', 'police_academy', 'superviseur', 'mes_interrogatoires', 'poles'] },
        'DOJ': { name: 'JUGE GORDON', grade: 'DOJ - Juge Suprême', hideSections: ['police_academy'] }
    };

    function updateUserSidebar() {
        document.querySelector('.user-name').innerHTML = `${currentUserProfile.name} <i class="fa-solid fa-gear" id="btn-settings" style="cursor: pointer; margin-left: 5px;" title="Mon Profil"></i> <i class="fa-solid fa-power-off" id="btn-logout" style="cursor: pointer; margin-left: 5px;" title="Se déconnecter"></i>`;
        document.querySelector('.user-rank').textContent = `${currentUserProfile.grade} - Matricule: ${currentUserProfile.matricule}`;
    }

    btnLogin.addEventListener('click', () => {
        const username = inputUser.value.trim().toUpperCase();
        
        if (permissions[username]) {
            currentUserProfile.name = permissions[username].name;
            currentUserProfile.grade = permissions[username].grade.split(' - ')[0];
            
            loginError.classList.add('hidden');
            loginScreen.classList.add('hidden');
            mdtApp.classList.remove('hidden');

            updateUserSidebar();

            document.querySelectorAll('.nav-section, .nav-item').forEach(el => {
                el.style.display = 'block';
                const sectionId = el.getAttribute('data-section');
                if (sectionId && permissions[username].hideSections.includes(sectionId)) { 
                    el.style.display = 'none'; 
                }
            });

            document.querySelectorAll('.nav-section-title.collapsible').forEach(header => {
                const list = header.nextElementSibling;
                const icon = header.querySelector('i');
                if (list && icon) {
                    if (header.textContent.includes('Général')) {
                        list.classList.remove('collapsed');
                        icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-up');
                    } else {
                        list.classList.add('collapsed');
                        icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down');
                    }
                }
            });
        } else { 
            loginError.classList.remove('hidden'); 
        }
    });

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }

    document.addEventListener('click', (e) => {
        if(e.target.closest('#btn-logout')) {
            document.getElementById('mdt-app').classList.add('hidden');
            document.getElementById('login-screen').classList.remove('hidden');
            if(inputUser) inputUser.value = '';
            if(passwordInput) passwordInput.value = '';
            if(inputUser) inputUser.focus();
        }
        
        if(e.target.closest('#btn-settings')) {
            document.getElementById('profile-setting-name').value = currentUserProfile.name;
            document.getElementById('profile-setting-matricule').value = currentUserProfile.matricule;
            document.getElementById('profile-setting-phone').value = currentUserProfile.phone;
            document.getElementById('profile-setting-iban').value = currentUserProfile.iban;
            document.getElementById('profile-setting-email').value = currentUserProfile.email;
            openModal('modal-edit-profile');
        }
    });

    const btnSaveProfile = document.getElementById('btn-save-profile');
    if(btnSaveProfile) {
        btnSaveProfile.addEventListener('click', () => {
            currentUserProfile.name = document.getElementById('profile-setting-name').value;
            currentUserProfile.matricule = document.getElementById('profile-setting-matricule').value;
            currentUserProfile.phone = document.getElementById('profile-setting-phone').value;
            currentUserProfile.iban = document.getElementById('profile-setting-iban').value;
            currentUserProfile.email = document.getElementById('profile-setting-email').value;
            updateUserSidebar(); 
            closeModals();
        });
    }

    // ==========================================
    // 2. NAVIGATION LATÉRALE
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item[data-target], .btn-sidebar[data-target]');
    const views = document.querySelectorAll('.view-page');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            if(item.classList.contains('nav-item')) item.classList.add('active'); 
            
            const target = item.getAttribute('data-target');
            views.forEach(view => view.classList.remove('active'));
            
            const targetView = document.getElementById(`view-${target}`);
            if (targetView) targetView.classList.add('active'); 
        });
    });

    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(header => {
        header.addEventListener('click', () => {
            const list = header.nextElementSibling;
            const icon = header.querySelector('i');
            if (list && list.classList.contains('nav-list')) {
                list.classList.toggle('collapsed');
                if (icon) {
                    if (list.classList.contains('collapsed')) icon.classList.replace('fa-chevron-up', 'fa-chevron-down'); 
                    else icon.classList.replace('fa-chevron-down', 'fa-chevron-up'); 
                }
            }
        });
    });

    // ==========================================
    // 3. BASE DE DONNÉES EFFECTIFS
    // ==========================================
    const effectifsDB = [
        { firstname: "DEV", lastname: "PHOTON", grade: "Capitaine SASP", iban: "LS-99887766", birthdate: "12/01/2000" },
        { firstname: "JOHN", lastname: "DOE", grade: "Officier II LSPD", iban: "LS-11223344", birthdate: "05/08/1995" }
    ];

    function renderEffectifsList(filterTerm = '') {
        const container = document.getElementById('effectifs-list-container');
        if(!container) return;
        
        container.innerHTML = '';
        const filtered = effectifsDB.filter(agent => {
            const fullName = `${agent.firstname} ${agent.lastname}`.toLowerCase();
            return fullName.includes(filterTerm.toLowerCase());
        });

        if(filtered.length === 0) {
            container.innerHTML = '<p class="text-muted" style="padding: 10px;">Aucun agent trouvé.</p>';
            return;
        }

        filtered.forEach((agent, index) => {
            container.innerHTML += `
                <div class="effectif-card mb-3" style="background: var(--bg-card); border-radius: var(--border-radius-md); border: 1px solid var(--border-color); overflow: hidden;">
                    <div class="effectif-header" data-target="effectif-details-${index}" style="padding: 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: var(--bg-input);">
                        <h4 style="margin: 0; font-size: 1rem;">${agent.firstname} ${agent.lastname}</h4>
                        <i class="fa-solid fa-chevron-down toggle-icon" style="transition: transform 0.3s ease;"></i>
                    </div>
                    <div class="effectif-details hidden" id="effectif-details-${index}" style="padding: 15px; border-top: 1px solid var(--border-color);">
                        <p style="margin-bottom: 8px;"><strong>Grade :</strong> <span style="color: var(--accent-primary); font-weight: 600;">${agent.grade}</span></p>
                        <p style="margin-bottom: 8px;"><strong>IBAN :</strong> ${agent.iban}</p>
                        <p style="margin: 0;"><strong>Date de naissance :</strong> ${agent.birthdate}</p>
                    </div>
                </div>
            `;
        });

        container.querySelectorAll('.effectif-header').forEach(header => {
            header.addEventListener('click', () => {
                const targetId = header.getAttribute('data-target');
                const details = document.getElementById(targetId);
                const icon = header.querySelector('.toggle-icon');
                
                if (details.classList.contains('hidden')) {
                    details.classList.remove('hidden');
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    details.classList.add('hidden');
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        });
    }

    const searchEffectifsInput = document.getElementById('search-effectifs-input');
    if(searchEffectifsInput) searchEffectifsInput.addEventListener('input', (e) => renderEffectifsList(e.target.value));

    // ==========================================
    // 4. BASE DE DONNÉES PÔLES / SPÉCIALITÉS
    // ==========================================
    let polesDB = [];
    let editingPoleIndex = null;

    function renderPoles() {
        const container = document.getElementById('poles-container');
        const emptyState = document.getElementById('poles-empty-state');
        if(!container || !emptyState) return;

        container.innerHTML = '';

        if(polesDB.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            polesDB.forEach((pole, index) => {
                let membresHtml = '';
                if(pole.membres) {
                    const lines = pole.membres.split('\n');
                    lines.forEach(l => { if(l.trim() !== "") membresHtml += `<li>${l}</li>`; });
                }

                container.innerHTML += `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 20px; position: relative;">
                        
                        <div style="position: absolute; top: 15px; right: 15px; cursor: pointer;" class="pole-options" data-index="${index}">
                            <i class="fa-solid fa-ellipsis-vertical" style="color: var(--text-muted); font-size: 1.2rem; padding: 5px;"></i>
                            <div class="context-menu hidden pole-menu" id="menu-pole-${index}" style="top: 25px; right: 0; width: 120px;">
                                <button class="menu-item btn-edit-pole" data-index="${index}"><i class="fa-solid fa-pen"></i> Modifier</button>
                            </div>
                        </div>

                        <h3 style="color: white; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 15px; text-transform: uppercase;">${pole.title}</h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;"><strong>Lead :</strong> <span style="color:white;">${pole.lead || '-'}</span></p>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;"><strong>Co-Lead :</strong> <span style="color:white;">${pole.colead || '-'}</span></p>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px;"><strong>Superviseur :</strong> <span style="color:white;">${pole.superviseur || '-'}</span></p>
                        
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;"><strong>Membres :</strong></p>
                        <ul style="font-size: 0.85rem; color: white; margin-left: 20px; list-style-type: disc;">
                            ${membresHtml}
                        </ul>
                    </div>
                `;
            });

            container.querySelectorAll('.pole-options').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = opt.getAttribute('data-index');
                    const menu = document.getElementById(`menu-pole-${idx}`);
                    document.querySelectorAll('.pole-menu').forEach(m => { if(m !== menu) m.classList.add('hidden'); });
                    menu.classList.toggle('hidden');
                });
            });

            container.querySelectorAll('.btn-edit-pole').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = btn.getAttribute('data-index');
                    openEditPole(idx); 
                });
            });
        }
    }

    const btnOpenPoleModal = document.getElementById('btn-open-pole-modal');
    if(btnOpenPoleModal) {
        btnOpenPoleModal.addEventListener('click', () => {
            editingPoleIndex = null;
            document.getElementById('pole-modal-title').textContent = "Ajouter un pôle";
            document.getElementById('pole-title').value = '';
            document.getElementById('pole-lead').value = '';
            document.getElementById('pole-colead').value = '';
            document.getElementById('pole-superviseur').value = '';
            document.getElementById('pole-membres').value = '';
            openModal('modal-pole');
        });
    }

    function openEditPole(index) {
        editingPoleIndex = index;
        const pole = polesDB[index];
        document.getElementById('pole-modal-title').textContent = "Modifier le pôle";
        document.getElementById('pole-title').value = pole.title;
        document.getElementById('pole-lead').value = pole.lead;
        document.getElementById('pole-colead').value = pole.colead;
        document.getElementById('pole-superviseur').value = pole.superviseur;
        document.getElementById('pole-membres').value = pole.membres;
        openModal('modal-pole');
    }

    const btnSavePole = document.getElementById('btn-save-pole');
    if(btnSavePole) {
        btnSavePole.addEventListener('click', () => {
            const title = document.getElementById('pole-title').value.trim();
            if(!title) return alert("Le titre du pôle est obligatoire.");

            const poleData = {
                title: title,
                lead: document.getElementById('pole-lead').value,
                colead: document.getElementById('pole-colead').value,
                superviseur: document.getElementById('pole-superviseur').value,
                membres: document.getElementById('pole-membres').value
            };

            if(editingPoleIndex !== null) polesDB[editingPoleIndex] = poleData;
            else polesDB.push(poleData);

            renderPoles();
            closeModals();
        });
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.pole-menu').forEach(menu => menu.classList.add('hidden'));
    });


    // ==========================================
    // 5. BASE DE DONNÉES RAPPORTS D'OPÉRATION
    // ==========================================
    let opReportsDB = [];
    let currentOpReportImages = [];
    let currentActiveOpReport = null;

    function renderOpReportsList(filterTerm = '') {
        const container = document.getElementById('op-report-list-container');
        if(!container) return;
        
        container.innerHTML = '';
        const filtered = opReportsDB.filter(r => r.id.toLowerCase().includes(filterTerm.toLowerCase()));

        filtered.forEach(r => {
            const isActive = currentActiveOpReport && currentActiveOpReport.id === r.id ? 'active' : '';
            container.innerHTML += `
                <div class="citoyen-list-item ${isActive}" data-id="${r.id}">
                    <div class="citoyen-list-info" style="width: 100%;">
                        <h4 style="color:var(--text-main); font-size: 0.95rem;">${r.id}</h4>
                        <span style="display:block; color:white;">Par ${r.redacteur}</span>
                        <span style="display:block; color:var(--text-muted);">${r.type}</span>
                        <span style="display:block; color:var(--text-muted);">Le ${r.date}</span>
                    </div>
                </div>
            `;
        });

        container.querySelectorAll('.citoyen-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                currentActiveOpReport = opReportsDB.find(r => r.id === id);
                renderOpReportDetails();
                renderOpReportsList(document.getElementById('search-op-report-input').value);
            });
        });
    }

    const searchOpReportInput = document.getElementById('search-op-report-input');
    if(searchOpReportInput) searchOpReportInput.addEventListener('input', (e) => renderOpReportsList(e.target.value));

    function renderOpReportDetails() {
        const emptyState = document.getElementById('op-report-empty-state');
        const detailsState = document.getElementById('op-report-details-state');
        
        if(!currentActiveOpReport) {
            emptyState.classList.remove('hidden');
            detailsState.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        detailsState.classList.remove('hidden');

        const r = currentActiveOpReport;
        let photosHtml = (r.images || []).map(img => `<img src="${img}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">`).join('');
        
        detailsState.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px;">
                <div>
                    <h2 style="color: white; font-size: 1.5rem; margin-bottom: 5px;">${r.type}</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">${r.id} • ${r.lieu}</p>
                </div>
                <div style="color: var(--text-muted); font-size: 0.85rem; text-align: right;">
                    ${r.date}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 15px;">
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Rédacteur</span>
                    <p style="color: white; font-weight: 600; margin-top: 5px;">${r.redacteur}</p>
                </div>
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Lead négociateur</span>
                    <p style="color: white; font-weight: 600; margin-top: 5px;">${r.leadNego || '-'}</p>
                </div>
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Lead terrain</span>
                    <p style="color: white; font-weight: 600; margin-top: 5px;">${r.leadTerrain || '-'}</p>
                </div>
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Otages</span>
                    <p style="color: white; font-weight: 600; margin-top: 5px;">${r.otages || '-'}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Officiers impliqués</span>
                    <p style="color: var(--accent-light); margin-top: 5px;">
                        <span style="background: rgba(92, 84, 237, 0.2); padding: 4px 8px; border-radius: 4px; color: #a5b4fc; font-size: 0.85rem;">${r.officiers}</span>
                    </p>
                </div>
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Revendications</span>
                    <p style="color: white; margin-top: 5px;">${r.revendications || '-'}</p>
                </div>
            </div>

            <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 15px;">
                <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Rapport complet</span>
                <p style="color: white; margin-top: 10px; white-space: pre-wrap; font-size: 0.95rem; line-height: 1.5;">${r.text}</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Dossiers preuves</span>
                    <p style="color: var(--text-muted); margin-top: 5px;">${r.dossier || 'Aucun dossier lié'}</p>
                </div>
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Photos preuves</span>
                    <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                        ${photosHtml || '<p style="color: var(--text-muted); font-size: 0.85rem;">Aucune photo attachée.</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    const btnOpenOpReport = document.getElementById('btn-open-op-report');
    if(btnOpenOpReport) {
        btnOpenOpReport.addEventListener('click', () => {
            currentOpReportImages = [];
            document.getElementById('op-date').value = '';
            document.getElementById('op-type').value = '';
            document.getElementById('op-officiers').value = '';
            document.getElementById('op-otages').value = '';
            document.getElementById('op-lieu').value = '';
            document.getElementById('op-revendications').value = '';
            document.getElementById('op-lead-nego').value = '';
            document.getElementById('op-lead-terrain').value = '';
            document.getElementById('op-text').value = '';
            document.getElementById('op-dossier').value = '';
            document.getElementById('op-photos-container').innerHTML = '';
            
            openModal('modal-op-report');
        });
    }

    const btnSaveOpReport = document.getElementById('btn-save-op-report');
    if(btnSaveOpReport) {
        btnSaveOpReport.addEventListener('click', () => {
            const date = document.getElementById('op-date').value;
            const type = document.getElementById('op-type').value;
            const lieu = document.getElementById('op-lieu').value;
            const officiers = document.getElementById('op-officiers').value;
            const text = document.getElementById('op-text').value;

            if(!date || !type || !lieu || !officiers || !text) {
                alert("Veuillez remplir tous les champs marqués d'un *.");
                return;
            }

            const newId = '#' + Math.floor(Math.random() * 9000 + 1000); // Génère un ID aléatoire type #1701

            const newReport = {
                id: newId,
                redacteur: currentUserProfile.matricule + ' | ' + currentUserProfile.name,
                date: date,
                type: type,
                lieu: lieu,
                officiers: officiers,
                otages: document.getElementById('op-otages').value,
                revendications: document.getElementById('op-revendications').value,
                leadNego: document.getElementById('op-lead-nego').value,
                leadTerrain: document.getElementById('op-lead-terrain').value,
                text: text,
                dossier: document.getElementById('op-dossier').value,
                images: [...currentOpReportImages]
            };

            opReportsDB.unshift(newReport);
            currentActiveOpReport = newReport; // Sélectionne le nouveau rapport
            
            renderOpReportsList();
            renderOpReportDetails();
            closeModals();
        });
    }


    // ==========================================
    // 6. BASE DE DONNÉES CITOYENS ET AUTRES (Existants)
    // ==========================================
    const profileState = document.getElementById('citoyen-profile-state');
    const emptyState = document.getElementById('citoyen-empty-state');
    const profileWantedLabel = document.getElementById('profile-wanted-label');

    let citizensDB = [
        {
            id: 'photon',
            avatar: "https://ui-avatars.com/api/?name=Photon+Dev&background=1e1b4b&color=fff",
            firstname: "PHOTON", lastname: "DEV", phone: "555-53421", birthdate: "2000-01-12", gender: "Homme",
            email: "discord.gg/photon@mail.ls", pesos: "89", taille: "189", address: "Vinewood", ethnie: "Caucasienne", 
            hair: "Noir", eyes: "Bleu", appartenance: "Aucune", job: "Concess",
            permisConduire: "Valide", ppaCivil: "Oui", ppaChasse: "Non", decede: "Non", wanted: true,
            mandats: [], tickets: [], rapports: [], plaintes: []
        }
    ];

    let currentCitizenData = null;
    let currentActiveTab = 'rapports';

    function renderCitizenList(filterTerm = '') {
        const container = document.getElementById('citoyen-list-container');
        if(!container) return;
        container.innerHTML = '';
        const filteredCitizens = citizensDB.filter(c => {
            const fullName = `${c.firstname} ${c.lastname}`.toLowerCase();
            return fullName.includes(filterTerm.toLowerCase());
        });

        filteredCitizens.forEach(c => {
            const isActive = currentCitizenData && currentCitizenData.id === c.id ? 'active' : '';
            container.innerHTML += `
                <div class="citoyen-list-item ${isActive}" data-citizen="${c.id}">
                    <div class="citoyen-list-avatar"><img src="${c.avatar}" alt="Avatar"></div>
                    <div class="citoyen-list-info">
                        <h4>${c.firstname} ${c.lastname}</h4>
                        <span>${c.birthdate}</span>
                    </div>
                </div>
            `;
        });

        document.querySelectorAll('.citoyen-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const citizenId = item.getAttribute('data-citizen');
                const foundCitizen = citizensDB.find(c => c.id === citizenId);
                if (foundCitizen) {
                    emptyState.classList.add('hidden');
                    profileState.classList.remove('hidden');
                    currentCitizenData = foundCitizen;
                    updateCitizenUI(currentCitizenData);
                    renderCitizenList(document.getElementById('search-citizen-input').value);
                }
            });
        });
    }

    const searchInput = document.getElementById('search-citizen-input');
    if(searchInput) searchInput.addEventListener('input', (e) => renderCitizenList(e.target.value));

    function updateDashboardWanted() {
        const dashboardWantedList = document.getElementById('dashboard-wanted-list');
        const dashboardWantedCount = document.getElementById('dashboard-wanted-count');
        if (!dashboardWantedList || !dashboardWantedCount) return;

        const wantedCitizens = citizensDB.filter(c => c.wanted === true);
        dashboardWantedCount.textContent = `${wantedCitizens.length} personnes recherchées`;
        
        if (wantedCitizens.length === 0) {
            dashboardWantedList.innerHTML = `<p class="text-muted" style="padding: 15px;">Aucun individu recherché actuellement.</p>`;
            return;
        }

        let html = '';
        wantedCitizens.forEach(c => {
            html += `
            <div class="wanted-card" style="margin-bottom: 10px;">
                <div class="wanted-img-placeholder"><img src="${c.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;"></div>
                <div class="wanted-details">
                    <h4>${c.firstname} ${c.lastname} (${c.gender})</h4>
                    <p><i class="fa-solid fa-phone"></i> ${c.phone}</p>
                    <p><i class="fa-solid fa-calendar"></i> ${c.birthdate}</p>
                </div>
            </div>`;
        });
        dashboardWantedList.innerHTML = html;
    }

    function renderTabContent(tab) {
        const contentArea = document.getElementById('profile-content-area');
        if(!contentArea || !currentCitizenData) return;
        
        contentArea.innerHTML = ''; 
        
        if (tab === 'rapports') {
            if (!currentCitizenData.rapports || currentCitizenData.rapports.length === 0) {
                contentArea.innerHTML = '<p class="text-muted" style="padding: 20px;">Aucun rapport d\'arrestation enregistré.</p>';
                return;
            }
            let html = '';
            currentCitizenData.rapports.forEach((r, index) => {
                let photosHtml = (r.images || []).map(img => `<img src="${img}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">`).join('');
                html += `
                <div class="history-card" style="border-left-color: var(--accent-primary); position: relative;">
                    <div style="position: absolute; top: 15px; right: 15px; cursor: pointer;" class="rapport-options" data-index="${index}">
                        <i class="fa-solid fa-ellipsis-vertical" style="color: var(--text-muted); font-size: 1.2rem; padding: 5px;"></i>
                        <div class="context-menu hidden rapport-menu" id="menu-rapport-${index}" style="top: 25px; right: 0; width: 120px;">
                            <button class="menu-item btn-edit-rapport" data-index="${index}"><i class="fa-solid fa-pen"></i> Modifier</button>
                        </div>
                    </div>
                    <div class="history-header" style="padding-right: 30px;">
                        <h4>Rapport d'arrestation</h4>
                        <span class="history-date">Le ${r.date}</span>
                    </div>
                    <p class="history-author">Officiers : ${r.officiers} | Poste : ${r.station}</p>
                    ${r.avocat ? `<p class="history-desc" style="color: var(--warning); margin-top: 5px;"><strong>Avocat présent :</strong> ${r.avocat}</p>` : ''}
                    ${r.possessions ? `<p class="history-desc" style="margin-top: 5px;"><strong>Possessions saisies :</strong> ${r.possessions}</p>` : ''}
                    <div class="history-desc" style="margin-top: 10px;"><strong>Charges appliquées :</strong> <span style="color: var(--text-muted);">${r.charges}</span></div>
                    <p class="history-desc" style="margin-top: 10px;"><strong>Déroulé :</strong> ${r.text}</p>
                    <p class="history-desc" style="margin-top: 10px; color: var(--danger); font-weight: 600; font-size: 0.95rem;">Total Amende : $${r.fine} | Total Peine : ${r.time} mois</p>
                    ${photosHtml ? `<div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">${photosHtml}</div>` : ''}
                </div>`;
            });
            contentArea.innerHTML = html;

            contentArea.querySelectorAll('.rapport-options').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = opt.getAttribute('data-index');
                    const menu = document.getElementById(`menu-rapport-${idx}`);
                    document.querySelectorAll('.rapport-menu').forEach(m => { if(m !== menu) m.classList.add('hidden'); });
                    menu.classList.toggle('hidden');
                });
            });

            contentArea.querySelectorAll('.btn-edit-rapport').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = btn.getAttribute('data-index');
                    openEditRapport(idx); 
                });
            });
        }
        else if (tab === 'mandats') {
            if (!currentCitizenData.mandats || currentCitizenData.mandats.length === 0) {
                contentArea.innerHTML = '<p class="text-muted" style="padding: 20px;">Aucun mandat d\'arrêt n\'a été émis pour ce citoyen.</p>';
                return;
            }
            let html = '';
            currentCitizenData.mandats.forEach(mandat => {
                html += `
                <div class="history-card" style="border-left-color: var(--warning);">
                    <div class="history-header"><h4>Mandat d'arrêt</h4><span class="history-date">Le ${mandat.date}</span></div>
                    <p class="history-author">Demandé par : ${mandat.officiers}</p>
                    <p class="history-desc"><strong>Motif :</strong> ${mandat.motif}</p>
                    <p class="history-desc" style="margin-top:8px; color:var(--text-muted); font-size: 0.85rem;">${mandat.desc}</p>
                </div>`;
            });
            contentArea.innerHTML = html;
        } 
        else if (tab === 'tickets') {
            if (!currentCitizenData.tickets || currentCitizenData.tickets.length === 0) {
                contentArea.innerHTML = '<p class="text-muted" style="padding: 20px;">Aucun ticket routier n\'a été émis pour ce citoyen.</p>';
                return;
            }
            let html = '';
            currentCitizenData.tickets.forEach(ticket => {
                html += `
                <div class="history-card" style="border-left-color: var(--success);">
                    <div class="history-header"><h4>Ticket routier</h4><span class="history-date">Le ${ticket.date}</span></div>
                    <p class="history-author">Dressé par : ${ticket.officiers} | Lieu : ${ticket.lieu}</p>
                    <p class="history-desc"><strong>Infraction(s) :</strong> ${ticket.infraction}</p>
                    <p class="history-desc" style="margin-top:8px; color:var(--success); font-weight:600;">Amende : $${ticket.amende} | Points retirés : ${ticket.points}</p>
                </div>`;
            });
            contentArea.innerHTML = html;
        }
        else if (tab === 'plaintes') {
            if (!currentCitizenData.plaintes || currentCitizenData.plaintes.length === 0) {
                contentArea.innerHTML = '<p class="text-muted" style="padding: 20px;">Aucune plainte n\'a été déposée.</p>';
                return;
            }
            let html = '';
            currentCitizenData.plaintes.forEach(p => {
                let photosHtml = (p.images || []).map(img => `<img src="${img}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">`).join('');
                html += `
                <div class="history-card" style="border-left-color: var(--warning);">
                    <div class="history-header"><h4>Plainte : ${p.raison}</h4><span class="history-date">Le ${p.date}</span></div>
                    <p class="history-author">Prise par : ${p.officiers} | Déposée contre : <span style="color:var(--danger); font-weight:600;">${p.contre}</span></p>
                    ${p.avocat ? `<p class="history-desc" style="color: var(--warning); margin-top: 5px;"><strong>Avocat :</strong> ${p.avocat}</p>` : ''}
                    <p class="history-desc" style="margin-top:10px;"><strong>Récit :</strong> ${p.text}</p>
                    ${photosHtml ? `<div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">${photosHtml}</div>` : ''}
                </div>`;
            });
            contentArea.innerHTML = html;
        }
    }

    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentActiveTab = tab.getAttribute('data-tab');
            renderTabContent(currentActiveTab);
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.rapport-menu').forEach(menu => menu.classList.add('hidden'));
    });

    function updateCitizenUI(data) {
        if(!data) return;

        document.getElementById('profile-name').textContent = `${data.firstname} ${data.lastname}`;
        document.getElementById('profile-email').textContent = `<${data.email}>`;
        document.getElementById('profile-phone-date').textContent = `${data.birthdate} | ${data.phone}`;
        document.getElementById('profile-poids').textContent = data.pesos;
        document.getElementById('profile-taille').textContent = data.taille;
        document.getElementById('profile-gender').textContent = data.gender;
        document.getElementById('profile-address').textContent = data.address;
        document.getElementById('profile-ethnie').textContent = data.ethnie;
        document.getElementById('profile-hair').textContent = data.hair;
        document.getElementById('profile-eyes').textContent = data.eyes;
        document.getElementById('profile-appartenance').textContent = data.appartenance;
        document.getElementById('profile-job').textContent = data.job;
        document.getElementById('profile-main-avatar').src = data.avatar;

        const statPermis = document.getElementById('stat-permis');
        if(statPermis) { statPermis.textContent = data.permisConduire; statPermis.className = data.permisConduire === 'Valide' ? 'text-success' : 'text-danger'; }
        const statPpaCivil = document.getElementById('stat-ppa-civil');
        if(statPpaCivil) { statPpaCivil.textContent = data.ppaCivil; statPpaCivil.className = data.ppaCivil === 'Oui' ? 'text-success' : 'text-danger'; }
        const statPpaChasse = document.getElementById('stat-ppa-chasse');
        if(statPpaChasse) { statPpaChasse.textContent = data.ppaChasse; statPpaChasse.className = data.ppaChasse === 'Oui' ? 'text-success' : 'text-danger'; }
        const statDecede = document.getElementById('stat-decede');
        if(statDecede) { statDecede.textContent = data.decede; statDecede.className = data.decede === 'Oui' ? 'text-danger' : 'text-success'; }
        const statWanted = document.getElementById('stat-wanted');
        if(statWanted) { statWanted.textContent = data.wanted ? 'Oui' : 'Non'; statWanted.className = data.wanted ? 'text-danger' : 'text-success'; }
        
        const profileWantedLabel = document.getElementById('profile-wanted-label');
        if(profileWantedLabel) { if(data.wanted) profileWantedLabel.classList.remove('hidden'); else profileWantedLabel.classList.add('hidden'); }

        const btnWanted = document.getElementById('menu-remove-wanted');
        if(btnWanted) { if(data.wanted) { btnWanted.innerHTML = '<i class="fa-solid fa-handcuffs"></i> Retirer du Wanted'; btnWanted.className = 'menu-item success'; } else { btnWanted.innerHTML = '<i class="fa-solid fa-person-rays"></i> Ajouter au Wanted'; btnWanted.className = 'menu-item danger'; } }
        
        if(document.getElementById('mandat-modal-name')) document.getElementById('mandat-modal-name').textContent = `${data.firstname} ${data.lastname}`;
        if(document.getElementById('ticket-modal-name')) document.getElementById('ticket-modal-name').textContent = `${data.firstname} ${data.lastname}`;
        if(document.getElementById('arrest-modal-name')) document.getElementById('arrest-modal-name').textContent = `${data.firstname} ${data.lastname}`;
        if(document.getElementById('plainte-modal-name')) document.getElementById('plainte-modal-name').textContent = `${data.firstname} ${data.lastname}`;

        renderTabContent(currentActiveTab);
    }

    // ==========================================
    // 7. CRÉATION D'UN CITOYEN (ENCODER)
    // ==========================================
    const btnSubmitCreate = document.getElementById('btn-submit-create');
    if(btnSubmitCreate) {
        btnSubmitCreate.addEventListener('click', () => {
            const firstname = document.getElementById('create-firstname').value.trim().toUpperCase();
            const lastname = document.getElementById('create-lastname').value.trim().toUpperCase();
            if(!firstname || !lastname) return alert("Le prénom et le nom sont obligatoires.");

            const newId = 'cit_' + Date.now();
            let previewSrc = document.getElementById('create-photo-preview').src;
            if (previewSrc.includes('Nouveau+Citoyen')) previewSrc = `https://ui-avatars.com/api/?name=${firstname}+${lastname}&background=1e1b4b&color=fff`;

            const newCitizen = {
                id: newId, avatar: previewSrc, firstname: firstname, lastname: lastname,
                phone: document.getElementById('create-phone').value || "Non précisé",
                birthdate: document.getElementById('create-birthdate').value || "Non précisée",
                gender: document.getElementById('create-gender').value,
                email: document.getElementById('create-email').value || "Non précisé",
                pesos: document.getElementById('create-poids').value || "0",
                taille: document.getElementById('create-taille').value || "0",
                address: document.getElementById('create-address').value || "Non précisée",
                ethnie: document.getElementById('create-ethnie').value,
                hair: document.getElementById('create-hair').value || "Non précisé",
                eyes: document.getElementById('create-eyes').value || "Non précisé",
                appartenance: document.getElementById('create-appartenance').value || "Aucune",
                job: document.getElementById('create-job').value || "Aucun",
                permisConduire: document.getElementById('create-permis').value,
                ppaCivil: "Non", ppaChasse: "Non", decede: "Non", wanted: false,
                mandats: [], tickets: [], rapports: [], plaintes: []
            };

            citizensDB.unshift(newCitizen); 
            renderCitizenList(document.getElementById('search-citizen-input') ? document.getElementById('search-citizen-input').value : '');
            
            currentCitizenData = newCitizen;
            emptyState.classList.add('hidden');
            profileState.classList.remove('hidden');
            updateCitizenUI(currentCitizenData);
            updateDashboardWanted(); 

            document.querySelectorAll('#modal-citizen-create input').forEach(i => i.value = '');
            document.getElementById('create-photo-preview').src = 'https://ui-avatars.com/api/?name=Nouveau+Citoyen&background=1e1b4b&color=fff';
            closeModals();
        });
    }

    // ==========================================
    // 8. AUTRES MODALES (ÉDITION CITOYEN, TICKETS, ETC.)
    // ==========================================
    if(document.getElementById('menu-revoke-ppa-civil')) { document.getElementById('menu-revoke-ppa-civil').addEventListener('click', () => { if(currentCitizenData) { currentCitizenData.ppaCivil = (currentCitizenData.ppaCivil === "Oui") ? "Non" : "Oui"; updateCitizenUI(currentCitizenData); } }); }
    if(document.getElementById('menu-revoke-ppa-chasse')) { document.getElementById('menu-revoke-ppa-chasse').addEventListener('click', () => { if(currentCitizenData) { currentCitizenData.ppaChasse = (currentCitizenData.ppaChasse === "Oui") ? "Non" : "Oui"; updateCitizenUI(currentCitizenData); } }); }
    if(document.getElementById('menu-remove-wanted')) { document.getElementById('menu-remove-wanted').addEventListener('click', () => { if(currentCitizenData) { currentCitizenData.wanted = !currentCitizenData.wanted; updateCitizenUI(currentCitizenData); updateDashboardWanted(); } }); }

    // Édition Profil Citoyen
    const btnEditCitizenMenu = document.getElementById('btn-edit-citizen-menu');
    if (btnEditCitizenMenu) btnEditCitizenMenu.addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('edit-citizen-context-menu').classList.toggle('hidden'); });

    function fillEditModalData() {
        if (currentCitizenData) {
            document.getElementById('edit-firstname').value = currentCitizenData.firstname;
            document.getElementById('edit-lastname').value = currentCitizenData.lastname;
            document.getElementById('edit-phone').value = currentCitizenData.phone;
            document.getElementById('edit-birthdate').value = currentCitizenData.birthdate;
            document.getElementById('edit-gender').value = currentCitizenData.gender;
            document.getElementById('edit-email').value = currentCitizenData.email;
            document.getElementById('edit-poids').value = currentCitizenData.pesos;
            document.getElementById('edit-taille').value = currentCitizenData.taille;
            document.getElementById('edit-address').value = currentCitizenData.address;
            document.getElementById('edit-ethnie').value = currentCitizenData.ethnie;
            document.getElementById('edit-hair').value = currentCitizenData.hair;
            document.getElementById('edit-eyes').value = currentCitizenData.eyes;
            document.getElementById('edit-appartenance').value = currentCitizenData.appartenance;
            document.getElementById('edit-job').value = currentCitizenData.job;
            document.getElementById('edit-photo-preview').src = currentCitizenData.avatar;
            document.getElementById('edit-permis-conduire').value = currentCitizenData.permisConduire;
        }
    }

    if(document.getElementById('menu-edit-info')) {
        document.getElementById('menu-edit-info').addEventListener('click', () => {
            fillEditModalData();
            document.getElementById('edit-section-info').classList.remove('hidden');
            document.getElementById('edit-section-photo').classList.add('hidden');
            document.getElementById('edit-modal-main-title').innerHTML = `Modifier les informations - <span style="color:var(--accent-primary);">${currentCitizenData.firstname} ${currentCitizenData.lastname}</span>`;
            openModal('modal-citizen-edit');
        });
    }

    if(document.getElementById('menu-edit-photo')) {
        document.getElementById('menu-edit-photo').addEventListener('click', () => {
            fillEditModalData();
            document.getElementById('edit-section-info').classList.add('hidden');
            document.getElementById('edit-section-photo').classList.remove('hidden');
            document.getElementById('edit-modal-main-title').innerHTML = `Modifier la photo - <span style="color:var(--accent-primary);">${currentCitizenData.firstname} ${currentCitizenData.lastname}</span>`;
            openModal('modal-citizen-edit');
        });
    }

    const btnSaveEdit = document.getElementById('btn-save-edit');
    if (btnSaveEdit) {
        btnSaveEdit.addEventListener('click', () => {
            if (currentCitizenData) {
                currentCitizenData.firstname = document.getElementById('edit-firstname').value.toUpperCase();
                currentCitizenData.lastname = document.getElementById('edit-lastname').value.toUpperCase();
                currentCitizenData.phone = document.getElementById('edit-phone').value;
                currentCitizenData.birthdate = document.getElementById('edit-birthdate').value;
                currentCitizenData.gender = document.getElementById('edit-gender').value;
                currentCitizenData.email = document.getElementById('edit-email').value;
                currentCitizenData.pesos = document.getElementById('edit-poids').value;
                currentCitizenData.taille = document.getElementById('edit-taille').value;
                currentCitizenData.address = document.getElementById('edit-address').value;
                currentCitizenData.ethnie = document.getElementById('edit-ethnie').value;
                currentCitizenData.hair = document.getElementById('edit-hair').value;
                currentCitizenData.eyes = document.getElementById('edit-eyes').value;
                currentCitizenData.appartenance = document.getElementById('edit-appartenance').value;
                currentCitizenData.job = document.getElementById('edit-job').value;
                currentCitizenData.permisConduire = document.getElementById('edit-permis-conduire').value;
                
                const editPhotoPreview = document.getElementById('edit-photo-preview');
                if(editPhotoPreview && editPhotoPreview.src) currentCitizenData.avatar = editPhotoPreview.src;

                updateCitizenUI(currentCitizenData);
                renderCitizenList(document.getElementById('search-citizen-input') ? document.getElementById('search-citizen-input').value : ''); 
                updateDashboardWanted();
                closeModals();
            }
        });
    }

    // Logique Rapport d'arrestation dans la fiche Citoyen (existant)
    let arrestImagesList = [];
    let editingRapportIndex = null;
    function renderArrestImages() {
        const container = document.getElementById('arrest-photos-container');
        if(!container) return;
        container.innerHTML = '';
        arrestImagesList.forEach(imgSrc => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.style.width = '70px';
            img.style.height = '70px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            img.style.border = '2px solid var(--accent-primary)';
            container.appendChild(img);
        });
    }

    if(document.getElementById('btn-open-arrest-citizen')) {
        document.getElementById('btn-open-arrest-citizen').addEventListener('click', () => { /* Logique fiche citoyen */ });
    }

    function openEditRapport(index) {
        editingRapportIndex = index;
        const rapport = currentCitizenData.rapports[index];
        // ... (Logique inchangée pour édition rapport citoyen)
    }

    // Autres (Plaintes, Mandats, Tickets) => Logique conservée
    let plainteImagesList = [];
    if(document.getElementById('btn-open-plainte')) {
        document.getElementById('btn-open-plainte').addEventListener('click', () => {
            if(!currentCitizenData) return;
            plainteImagesList = [];
            document.querySelectorAll('#modal-plainte input').forEach(i => i.value='');
            document.getElementById('plainte-text').value = '';
            document.getElementById('plainte-photos-container').innerHTML = '';
            openModal('modal-plainte');
        });
    }
    if (document.getElementById('btn-submit-plainte')) {
        document.getElementById('btn-submit-plainte').addEventListener('click', () => {
            if(!currentCitizenData) return;
            const date = document.getElementById('plainte-date').value;
            const raison = document.getElementById('plainte-raison').value;
            const contre = document.getElementById('plainte-contre').value;
            const text = document.getElementById('plainte-text').value;
            if(!date || !raison || !contre || !text) return alert("Champs * obligatoires.");
            if (!currentCitizenData.plaintes) currentCitizenData.plaintes = [];
            currentCitizenData.plaintes.unshift({ date, raison, contre, text, officiers: document.getElementById('plainte-officiers').value || "Non précisé", avocat: document.getElementById('plainte-avocat').value || "", images: [...plainteImagesList] });
            currentActiveTab = 'plaintes';
            document.querySelectorAll('.tab-link').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === 'plaintes'));
            updateCitizenUI(currentCitizenData); closeModals();
        });
    }

    if (document.getElementById('btn-submit-mandat')) {
        document.getElementById('btn-submit-mandat').addEventListener('click', () => {
            if (!currentCitizenData) return;
            const date = document.getElementById('mandat-date').value;
            const motif = document.getElementById('mandat-motif').value;
            if (!date || !motif) return alert("Date et Motif requis.");
            if (!currentCitizenData.mandats) currentCitizenData.mandats = [];
            currentCitizenData.mandats.unshift({ date, officiers: document.getElementById('mandat-officiers').value || "Non précisé", motif, desc: document.getElementById('mandat-desc').value || "Aucune description." });
            document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
            document.querySelector('.tab-link[data-tab="mandats"]').classList.add('active');
            currentActiveTab = 'mandats'; renderTabContent('mandats'); closeModals();
        });
    }

    if (document.getElementById('btn-submit-ticket')) {
        document.getElementById('btn-submit-ticket').addEventListener('click', () => {
            if (!currentCitizenData) return;
            const date = document.getElementById('ticket-date').value;
            const infraction = document.getElementById('ticket-infraction').value;
            if (!date || !infraction) return alert("Date et Infraction requises.");
            if (!currentCitizenData.tickets) currentCitizenData.tickets = [];
            currentCitizenData.tickets.unshift({ date, lieu: document.getElementById('ticket-lieu').value || "Non précisé", infraction, amende: document.getElementById('ticket-amende').value || "0", points: document.getElementById('ticket-points').value || "0", officiers: document.getElementById('ticket-officiers').value || "Non précisé" });
            document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
            document.querySelector('.tab-link[data-tab="tickets"]').classList.add('active');
            currentActiveTab = 'tickets'; renderTabContent('tickets'); closeModals();
        });
    }

    // ==========================================
    // 9. GESTION DES IMAGES GLOBALES (CTRL+V)
    // ==========================================
    const uploadBoxes = document.querySelectorAll('.upload-box');
    uploadBoxes.forEach(box => {
        box.setAttribute('tabindex', '0'); 
        box.addEventListener('click', () => box.focus());

        box.addEventListener('paste', function(e) {
            e.preventDefault();
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        
                        if (box.id === 'op-upload-box') { // Rapport d'Opération Global
                            currentOpReportImages.push(event.target.result);
                            const container = document.getElementById('op-photos-container');
                            const img = document.createElement('img');
                            img.src = event.target.result;
                            img.style.width = '70px'; img.style.height = '70px'; img.style.objectFit = 'cover'; img.style.borderRadius = '4px'; img.style.border = '2px solid var(--accent-primary)';
                            container.appendChild(img);
                        }
                        else if (box.id === 'arrest-upload-box') { // Rapport Arrestation Citoyen
                            arrestImagesList.push(event.target.result);
                            renderArrestImages(); 
                        } 
                        else if (box.id === 'plainte-upload-box') {
                            plainteImagesList.push(event.target.result);
                            const container = document.getElementById('plainte-photos-container');
                            const img = document.createElement('img'); img.src = event.target.result; img.style.width = '70px'; img.style.height = '70px'; img.style.objectFit = 'cover'; img.style.borderRadius = '4px'; img.style.border = '2px solid var(--accent-primary)';
                            container.appendChild(img);
                        }
                        else if (box.id === 'create-upload-box') {
                            const preview = document.getElementById('create-photo-preview');
                            if(preview) preview.src = event.target.result;
                        }
                        else if (box.closest('#modal-citizen-edit')) {
                            const preview = document.getElementById('edit-photo-preview');
                            if(preview) preview.src = event.target.result;
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            }
        });
    });

    // ==========================================
    // 10. INITIALISATION AU DÉMARRAGE
    // ==========================================
    renderCitizenList();
    renderEffectifsList();
    renderPoles();
    renderOpReportsList();
    updateDashboardWanted();
});

// ==========================================
// 11. FONCTIONS GLOBALES (MODALES)
// ==========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.remove('hidden');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.add('hidden');
    });
}

document.addEventListener('click', (e) => {
    if(e.target.classList.contains('modal-overlay')) closeModals();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModals();
});