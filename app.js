/**
 * ============================================================================
 * MDT - LSPD / SASP / DOJ - SCRIPT PRINCIPAL & BASE DE DONNÉES SUPABASE
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // ========================================================================
    // 0. MOTEUR DE BASE DE DONNÉES (SUPABASE TEMPS RÉEL)
    // ========================================================================
    const SUPABASE_URL = 'https://fbabjudjpficzkwthzfi.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYWJqdWRqcGZpY3prd3RoemZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzk3NDcsImV4cCI6MjA5MDY1NTc0N30.qFcwkYeiLbnAqw6XoajtWD-fx3VpYyLVBrC2ISVNMOQ';
    
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const baseSchema = {
        citoyens: [], effectifs: [], poles: [], opReports: [],
        armes: [], bracelets: [], vehicules: [], dossiersPreuves: [],
        interrogatoires: [], plaintes: [], incidents: []
    };

    const MDT_Database = {
        data: { ...baseSchema },

        async init() {
            console.log("Tentative de connexion à Supabase en cours...");
            
            const { data, error } = await supabase
                .from('mdt_storage')
                .select('data')
                .eq('id', 1)
                .single();

            if (error) console.error("Erreur lors de la récupération des données :", error);

            if (data && data.data && Object.keys(data.data).length > 0) {
                this.data = Object.assign({}, baseSchema, data.data);
                console.log("Données chargées avec succès depuis Supabase !");
            } else {
                console.log("Base de données vide, création des données par défaut...");
                this.data.effectifs = [
                    { firstname: "John", lastname: "Doe", grade: "Officier II", matricule: "45", iban: "LS-112233", birthdate: "05/08/1995" },
                    { firstname: "DEV", lastname: "Photon", grade: "Capitaine SASP", matricule: "21", iban: "LS-998877", birthdate: "12/01/2000" }
                ];
                this.sync(); 
            }

            supabase.channel('custom-all-channel')
              .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'mdt_storage', filter: 'id=eq.1' },
                (payload) => {
                  console.log("Mise à jour en temps réel reçue d'un autre joueur !");
                  this.data = Object.assign({}, baseSchema, payload.new.data);
                  if (currentUserProfile) refreshAllViews();
                }
              )
              .subscribe();
        },

        async sync() {
            const { error } = await supabase
                .from('mdt_storage')
                .update({ data: this.data })
                .eq('id', 1);

            if (error) {
                console.error("Erreur lors de la sauvegarde Supabase :", error);
            } else {
                if (currentUserProfile) refreshAllViews();
            }
        }
    };

    MDT_Database.init();


    // ========================================================================
    // 1. SYSTÈME DE CONNEXION & UTILISATEURS (AJOUT DES 5 SUPERVISEURS)
    // ========================================================================
    const loginScreen = document.getElementById('login-screen');
    const mdtApp = document.getElementById('mdt-app');
    const btnLogin = document.getElementById('btn-login');
    const inputUser = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const togglePassword = document.getElementById('toggle-password');

    const mdtUsers = {
        'officier': { pwd: 'mdp', name: 'John Doe', grade: 'Officier II', matricule: '45', permissions: ['general', 'registres', 'preuves', 'mes_dossiers'] },
        
        // --- LES 5 NOUVEAUX COMPTES SUPERVISEURS (ACCÈS TOTAL) ---
        'chef': { pwd: 'mdp1', name: 'Leon Kennedy', grade: 'Chef de la Police', matricule: '01', permissions: ['general', 'registres', 'preuves', 'mes_dossiers', 'superviseur'] },
        'commandant': { pwd: 'mdp2', name: 'Sarah Connor', grade: 'Commandant', matricule: '02', permissions: ['general', 'registres', 'preuves', 'mes_dossiers', 'superviseur'] },
        'capitaine': { pwd: 'mdp3', name: 'David Anderson', grade: 'Capitaine', matricule: '15', permissions: ['general', 'registres', 'preuves', 'mes_dossiers', 'superviseur'] },
        'lieutenant': { pwd: 'mdp4', name: 'Olivia Benson', grade: 'Lieutenant', matricule: '22', permissions: ['general', 'registres', 'preuves', 'mes_dossiers', 'superviseur'] },
        'sergent': { pwd: 'mdp5', name: 'Hank Voight', grade: 'Sergent-Chef', matricule: '33', permissions: ['general', 'registres', 'preuves', 'mes_dossiers', 'superviseur'] },
        
        'superviseur': { pwd: 'mdp', name: 'DEV Photon', grade: 'Capitaine SASP', matricule: '21', permissions: ['general', 'registres', 'preuves', 'mes_dossiers', 'superviseur'] }
    };

    let currentUserProfile = null;

    function handleLogin() {
        const username = inputUser.value.trim().toLowerCase();
        const pwd = passwordInput.value;
        const user = mdtUsers[username];

        if (user && user.pwd === pwd) {
            currentUserProfile = user;
            loginError.classList.add('hidden');
            loginScreen.classList.add('hidden');
            mdtApp.classList.remove('hidden');

            document.querySelector('.user-name').innerHTML = `${currentUserProfile.name} <i class="fa-solid fa-gear" id="btn-settings" style="cursor: pointer; margin-left: 5px;" title="Mon Profil"></i> <i class="fa-solid fa-power-off" id="btn-logout" style="cursor: pointer; margin-left: 5px;" title="Se déconnecter"></i>`;
            document.querySelector('.user-rank').textContent = `${currentUserProfile.grade} - Mat: ${currentUserProfile.matricule}`;

            document.querySelectorAll('.nav-section').forEach(section => {
                const sectionId = section.getAttribute('data-section');
                if (currentUserProfile.permissions.includes(sectionId)) section.style.display = 'block';
                else section.style.display = 'none';
            });

            refreshAllViews();
        } else {
            loginError.classList.remove('hidden');
        }
    }

    if (btnLogin) btnLogin.addEventListener('click', handleLogin);
    if (passwordInput) passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
    if (inputUser) inputUser.addEventListener('keydown', (e) => { if (e.key === 'Enter') passwordInput.focus(); });

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            if (passwordInput.getAttribute('type') === 'password') {
                passwordInput.setAttribute('type', 'text');
                togglePassword.classList.remove('fa-eye');
                togglePassword.classList.add('fa-eye-slash');
            } else {
                passwordInput.setAttribute('type', 'password');
                togglePassword.classList.remove('fa-eye-slash');
                togglePassword.classList.add('fa-eye');
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('#btn-logout')) {
            mdtApp.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            inputUser.value = ''; passwordInput.value = '';
            currentUserProfile = null;
        }
        
        if (e.target.closest('#btn-settings')) {
            document.getElementById('profile-setting-name').value = currentUserProfile.name;
            document.getElementById('profile-setting-matricule').value = currentUserProfile.matricule;
            document.getElementById('profile-setting-phone').value = currentUserProfile.phone || '';
            document.getElementById('profile-setting-iban').value = currentUserProfile.iban || '';
            document.getElementById('profile-setting-email').value = currentUserProfile.email || '';
            openModal('modal-edit-profile');
        }
    });

    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', () => {
            currentUserProfile.name = document.getElementById('profile-setting-name').value;
            currentUserProfile.matricule = document.getElementById('profile-setting-matricule').value;
            currentUserProfile.phone = document.getElementById('profile-setting-phone').value;
            currentUserProfile.iban = document.getElementById('profile-setting-iban').value;
            currentUserProfile.email = document.getElementById('profile-setting-email').value;
            
            if (!MDT_Database.data.effectifs) MDT_Database.data.effectifs = [];
            
            let agentIndex = MDT_Database.data.effectifs.findIndex(e => e.matricule === currentUserProfile.matricule || (e.firstname + " " + e.lastname) === currentUserProfile.name);
            
            const nameParts = currentUserProfile.name.split(' ');
            const newFirstname = nameParts[0] || '';
            const newLastname = nameParts.slice(1).join(' ') || '';

            if (agentIndex !== -1) {
                MDT_Database.data.effectifs[agentIndex].firstname = newFirstname;
                MDT_Database.data.effectifs[agentIndex].lastname = newLastname;
                MDT_Database.data.effectifs[agentIndex].matricule = currentUserProfile.matricule;
                MDT_Database.data.effectifs[agentIndex].iban = currentUserProfile.iban;
            } else {
                MDT_Database.data.effectifs.push({
                    firstname: newFirstname, lastname: newLastname, grade: currentUserProfile.grade,
                    matricule: currentUserProfile.matricule, iban: currentUserProfile.iban, birthdate: "Non précisée"
                });
            }

            MDT_Database.sync();
            document.querySelector('.user-name').innerHTML = `${currentUserProfile.name} <i class="fa-solid fa-gear" id="btn-settings" style="cursor: pointer; margin-left: 5px;"></i> <i class="fa-solid fa-power-off" id="btn-logout" style="cursor: pointer; margin-left: 5px;"></i>`;
            document.querySelector('.user-rank').textContent = `${currentUserProfile.grade} - Mat: ${currentUserProfile.matricule}`;
            closeModals();
        });
    }


    // ========================================================================
    // 2. NAVIGATION LATÉRALE
    // ========================================================================
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const views = document.querySelectorAll('.view-page');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active'); 
            
            const target = item.getAttribute('data-target');
            views.forEach(view => view.classList.remove('active'));
            
            const targetView = document.getElementById(`view-${target}`);
            if (targetView) targetView.classList.add('active'); 

            if (target === 'preuves') {
                document.getElementById('preuves-list-state').classList.remove('hidden');
                document.getElementById('preuves-open-state').classList.add('hidden');
                currentOpenDossierId = null;
            }

            document.querySelectorAll('.search-container input').forEach(inp => {
                if(!inp.closest(`#view-${target}`)) inp.value = ''; 
            });

            refreshAllViews();
        });
    });

    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(header => {
        header.addEventListener('click', () => {
            const list = header.nextElementSibling;
            const icon = header.querySelector('i');
            if (list && list.classList.contains('nav-list')) {
                list.classList.toggle('collapsed');
                if (icon) icon.className = list.classList.contains('collapsed') ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up'; 
            }
        });
    });

    function refreshAllViews() {
        if (!currentUserProfile) return;
        
        const valCitoyens = document.getElementById('search-citizen-input')?.value || '';
        const valEffectifs = document.getElementById('search-effectifs-input')?.value || '';
        const valRapports = document.getElementById('search-op-report-input')?.value || '';
        const valArmes = document.getElementById('search-arme-input')?.value || '';
        const valBracelets = document.getElementById('search-bracelet-input')?.value || '';
        const valVehicules = document.getElementById('search-vehicule-input')?.value || '';
        const valDossiers = document.getElementById('search-dossier-input')?.value || '';
        const valMesInt = document.getElementById('search-mes-interrogatoires')?.value || '';
        const valMesPla = document.getElementById('search-mes-plaintes')?.value || '';
        const valMesInc = document.getElementById('search-mes-incidents')?.value || '';

        updateDashboardWanted();
        renderCitizenList(valCitoyens);
        renderEffectifsList(valEffectifs);
        renderPoles();
        renderOpReportsList(valRapports);
        renderArmesList(valArmes);
        renderBraceletsList(valBracelets);
        renderVehiculesList(valVehicules);
        renderPreuvesDossiers(valDossiers);
        
        renderMesInterrogatoires(valMesInt);
        renderMesPlaintes(valMesPla);
        renderMesIncidents(valMesInc);

        if (currentUserProfile.permissions.includes('superviseur')) {
            const valSupPla = document.getElementById('search-sup-plaintes')?.value || '';
            const valSupInt = document.getElementById('search-sup-interrogatoires')?.value || '';
            const valSupInc = document.getElementById('search-sup-incidents')?.value || '';
            const valStats = document.getElementById('search-stats-agent')?.value || '';

            renderSupPlaintes(valSupPla);
            renderSupInterrogatoires(valSupInt);
            renderSupIncidents(valSupInc);
            renderAgentStatsList(valStats);
            renderSupArrestations(); // Les arrestations
        }
    }


    // ========================================================================
    // 3. VUE ACCUEIL & EFFECTIFS
    // ========================================================================
    function updateDashboardWanted() {
        const dashboardWantedList = document.getElementById('dashboard-wanted-list');
        const dashboardWantedCount = document.getElementById('dashboard-wanted-count');
        if (!dashboardWantedList || !dashboardWantedCount) return;

        const citoyens = MDT_Database.data.citoyens || [];
        const wantedCitizens = citoyens.filter(c => c.wanted === true);
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

    function renderEffectifsList(filterTerm = '') {
        const container = document.getElementById('effectifs-list-container');
        if (!container) return;
        
        container.innerHTML = '';
        const effectifs = MDT_Database.data.effectifs || [];
        const filtered = effectifs.filter(agent => {
            const fullName = `${agent.firstname} ${agent.lastname}`.toLowerCase();
            return fullName.includes(filterTerm.toLowerCase());
        });

        if (filtered.length === 0) {
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
                        <p style="margin-bottom: 8px;"><strong>Matricule :</strong> ${agent.matricule}</p>
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
                details.classList.toggle('hidden');
                icon.style.transform = details.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
            });
        });
    }

    const searchEffectifsInput = document.getElementById('search-effectifs-input');
    if (searchEffectifsInput) searchEffectifsInput.addEventListener('input', (e) => renderEffectifsList(e.target.value));


    // ========================================================================
    // 4. GESTION DES PÔLES
    // ========================================================================
    let editingPoleIndex = null;

    function renderPoles() {
        const container = document.getElementById('poles-container');
        const emptyState = document.getElementById('poles-empty-state');
        if (!container || !emptyState) return;

        container.innerHTML = '';
        const poles = MDT_Database.data.poles || [];

        if (poles.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            poles.forEach((pole, index) => {
                let membresHtml = '';
                if (pole.membres) {
                    pole.membres.split('\n').forEach(line => { if(line.trim() !== "") membresHtml += `<li>${line}</li>`; });
                }

                container.innerHTML += `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 20px; position: relative;">
                        <div style="position: absolute; top: 15px; right: 15px; cursor: pointer;" class="pole-options" data-index="${index}">
                            <i class="fa-solid fa-ellipsis-vertical" style="color: var(--text-muted); font-size: 1.2rem; padding: 5px;"></i>
                            <div class="context-menu hidden pole-menu" id="menu-pole-${index}" style="top: 25px; right: 0; width: 120px;">
                                <button class="menu-item btn-edit-pole" data-index="${index}"><i class="fa-solid fa-pen"></i> Modifier</button>
                                <button class="menu-item danger btn-delete-pole" data-index="${index}"><i class="fa-solid fa-trash"></i> Supprimer</button>
                            </div>
                        </div>
                        <h3 style="color: white; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 15px; text-transform: uppercase;">${pole.title}</h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;"><strong>Lead :</strong> <span style="color:white;">${pole.lead || '-'}</span></p>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;"><strong>Co-Lead :</strong> <span style="color:white;">${pole.colead || '-'}</span></p>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px;"><strong>Superviseur :</strong> <span style="color:white;">${pole.superviseur || '-'}</span></p>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;"><strong>Membres :</strong></p>
                        <ul style="font-size: 0.85rem; color: white; margin-left: 20px; list-style-type: disc;">${membresHtml}</ul>
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
                    openEditPole(btn.getAttribute('data-index')); 
                });
            });

            container.querySelectorAll('.btn-delete-pole').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm("Voulez-vous vraiment supprimer ce pôle ?")) {
                        MDT_Database.data.poles.splice(btn.getAttribute('data-index'), 1);
                        MDT_Database.sync();
                    }
                });
            });
        }
    }

    const btnOpenPoleModal = document.getElementById('btn-open-pole-modal');
    if (btnOpenPoleModal) {
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
        const pole = MDT_Database.data.poles[index];
        document.getElementById('pole-modal-title').textContent = "Modifier le pôle";
        document.getElementById('pole-title').value = pole.title;
        document.getElementById('pole-lead').value = pole.lead;
        document.getElementById('pole-colead').value = pole.colead;
        document.getElementById('pole-superviseur').value = pole.superviseur;
        document.getElementById('pole-membres').value = pole.membres;
        openModal('modal-pole');
    }

    const btnSavePole = document.getElementById('btn-save-pole');
    if (btnSavePole) {
        btnSavePole.addEventListener('click', () => {
            const title = document.getElementById('pole-title').value.trim();
            if (!title) return alert("Le titre du pôle est obligatoire.");

            if (!MDT_Database.data.poles) MDT_Database.data.poles = [];

            const poleData = {
                title: title, lead: document.getElementById('pole-lead').value,
                colead: document.getElementById('pole-colead').value,
                superviseur: document.getElementById('pole-superviseur').value,
                membres: document.getElementById('pole-membres').value
            };

            if (editingPoleIndex !== null) MDT_Database.data.poles[editingPoleIndex] = poleData;
            else MDT_Database.data.poles.push(poleData);

            MDT_Database.sync();
            closeModals();
        });
    }


    // ========================================================================
    // 5. GESTION DES RAPPORTS D'OPÉRATION
    // ========================================================================
    let currentOpReportImages = [];
    let currentActiveOpReport = null;
    let editingOpReportId = null;

    function renderOpReportsList(filterTerm = '') {
        const container = document.getElementById('op-report-list-container');
        if (!container) return;
        
        container.innerHTML = '';
        const opReports = MDT_Database.data.opReports || [];
        const filtered = opReports.filter(r => r.id.toLowerCase().includes(filterTerm.toLowerCase()));

        filtered.forEach(r => {
            const isActive = currentActiveOpReport && currentActiveOpReport.id === r.id ? 'active' : '';
            container.innerHTML += `
                <div class="citoyen-list-item ${isActive}" data-id="${r.id}" style="position: relative;">
                    <div class="citoyen-list-info" style="width: 100%; padding-right: 25px;">
                        <h4 style="color:var(--text-main); font-size: 0.95rem;">${r.id}</h4>
                        <span style="display:block; color:white;">Par ${r.redacteur}</span>
                        <span style="display:block; color:var(--text-muted);">${r.type}</span>
                        <span style="display:block; color:var(--text-muted);">Le ${r.date}</span>
                    </div>
                    <div style="position: absolute; top: 10px; right: 10px; cursor: pointer;" class="op-list-options" data-id="${r.id}">
                        <i class="fa-solid fa-ellipsis-vertical" style="color: var(--text-muted); font-size: 1.2rem; padding: 5px;"></i>
                        <div class="context-menu hidden op-report-menu" id="menu-op-${r.id}" style="top: 25px; right: 0; width: 120px;">
                            <button class="menu-item btn-edit-op" data-id="${r.id}"><i class="fa-solid fa-pen"></i> Modifier</button>
                            <button class="menu-item danger btn-delete-op" data-id="${r.id}"><i class="fa-solid fa-trash"></i> Supprimer</button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.querySelectorAll('.citoyen-list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.op-list-options')) return; 
                const id = item.getAttribute('data-id');
                currentActiveOpReport = MDT_Database.data.opReports.find(r => r.id === id);
                renderOpReportDetails();
                
                const searchInput = document.getElementById('search-op-report-input');
                renderOpReportsList(searchInput ? searchInput.value : '');
            });
        });

        container.querySelectorAll('.op-list-options').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = opt.getAttribute('data-id');
                const menu = document.getElementById(`menu-op-${id}`);
                document.querySelectorAll('.op-report-menu').forEach(m => { if(m !== menu) m.classList.add('hidden'); });
                menu.classList.toggle('hidden');
            });
        });

        container.querySelectorAll('.btn-edit-op').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const report = MDT_Database.data.opReports.find(r => r.id === id);
                if (report) {
                    editingOpReportId = id;
                    document.getElementById('op-date').value = report.date;
                    document.getElementById('op-type').value = report.type;
                    document.getElementById('op-officiers').value = report.officiers;
                    document.getElementById('op-otages').value = report.otages || '';
                    document.getElementById('op-lieu').value = report.lieu;
                    document.getElementById('op-revendications').value = report.revendications || '';
                    document.getElementById('op-lead-nego').value = report.leadNego || '';
                    document.getElementById('op-lead-terrain').value = report.leadTerrain || '';
                    document.getElementById('op-text').value = report.text;
                    document.getElementById('op-dossier').value = report.dossier || '';
                    currentOpReportImages = [...(report.images || [])];
                    
                    const photosContainer = document.getElementById('op-photos-container');
                    photosContainer.innerHTML = '';
                    currentOpReportImages.forEach(src => {
                        const img = document.createElement('img'); img.src = src; img.style.width = '70px'; img.style.height = '70px'; img.style.objectFit = 'cover'; img.style.borderRadius = '4px'; img.style.border = '2px solid var(--accent-primary)';
                        photosContainer.appendChild(img);
                    });
                    openModal('modal-op-report');
                }
            });
        });

        container.querySelectorAll('.btn-delete-op').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (confirm("Voulez-vous vraiment supprimer ce rapport ?")) {
                    MDT_Database.data.opReports = MDT_Database.data.opReports.filter(r => r.id !== id);
                    if (currentActiveOpReport && currentActiveOpReport.id === id) currentActiveOpReport = null;
                    MDT_Database.sync();
                    renderOpReportDetails();
                }
            });
        });
    }

    const searchOpReportInput = document.getElementById('search-op-report-input');
    if (searchOpReportInput) searchOpReportInput.addEventListener('input', (e) => renderOpReportsList(e.target.value));

    function renderOpReportDetails() {
        const emptyState = document.getElementById('op-report-empty-state');
        const detailsState = document.getElementById('op-report-details-state');
        
        if (!currentActiveOpReport) {
            emptyState.classList.remove('hidden');
            detailsState.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        detailsState.classList.remove('hidden');

        const r = currentActiveOpReport;
        let photosHtml = '';
        if (r.images && r.images.length > 0) {
            photosHtml = r.images.map(img => `<img src="${img}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">`).join('');
        }
        
        detailsState.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px;">
                <div><h2 style="color: white; font-size: 1.5rem; margin-bottom: 5px;">${r.type}</h2><p style="color: var(--text-muted); font-size: 0.9rem;">${r.id} • ${r.lieu}</p></div>
                <div style="color: var(--text-muted); font-size: 0.85rem; text-align: right;">${r.date}</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 15px;">
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);"><span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Rédacteur</span><p style="color: white; font-weight: 600; margin-top: 5px;">${r.redacteur}</p></div>
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);"><span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Lead négociateur</span><p style="color: white; font-weight: 600; margin-top: 5px;">${r.leadNego || '-'}</p></div>
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);"><span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Lead terrain</span><p style="color: white; font-weight: 600; margin-top: 5px;">${r.leadTerrain || '-'}</p></div>
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);"><span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Otages</span><p style="color: white; font-weight: 600; margin-top: 5px;">${r.otages || '-'}</p></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);"><span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Officiers impliqués</span><p style="color: var(--accent-light); margin-top: 5px;"><span style="background: rgba(92, 84, 237, 0.2); padding: 4px 8px; border-radius: 4px; color: #a5b4fc; font-size: 0.85rem;">${r.officiers}</span></p></div>
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);"><span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Revendications</span><p style="color: white; margin-top: 5px;">${r.revendications || '-'}</p></div>
            </div>
            <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 15px;"><span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Rapport complet</span><p style="color: white; margin-top: 10px; white-space: pre-wrap; font-size: 0.95rem; line-height: 1.5;">${r.text}</p></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);"><span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Dossiers preuves</span><p style="color: var(--text-muted); margin-top: 5px;">${r.dossier || 'Aucun dossier lié'}</p></div>
                <div style="background: var(--bg-input); padding: 15px; border-radius: 4px; border: 1px solid var(--border-color);"><span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Photos preuves</span><div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">${photosHtml !== '' ? photosHtml : '<p style="color: var(--text-muted); font-size: 0.85rem;">Aucune photo attachée.</p>'}</div></div>
            </div>
        `;
    }

    const btnOpenOpReport = document.getElementById('btn-open-op-report');
    if (btnOpenOpReport) {
        btnOpenOpReport.addEventListener('click', () => {
            editingOpReportId = null;
            currentOpReportImages = [];
            document.querySelectorAll('#modal-op-report input, #modal-op-report textarea').forEach(i => i.value = '');
            document.getElementById('op-photos-container').innerHTML = '';
            openModal('modal-op-report');
        });
    }

    const btnSaveOpReport = document.getElementById('btn-save-op-report');
    if (btnSaveOpReport) {
        btnSaveOpReport.addEventListener('click', () => {
            const date = document.getElementById('op-date').value;
            const type = document.getElementById('op-type').value;
            const lieu = document.getElementById('op-lieu').value;
            const officiers = document.getElementById('op-officiers').value;
            const text = document.getElementById('op-text').value;

            if (!date || !type || !lieu || !officiers || !text) return alert("Veuillez remplir tous les champs marqués d'un *.");

            if (!MDT_Database.data.opReports) MDT_Database.data.opReports = [];

            const reportData = {
                id: editingOpReportId || ('#OP-' + Math.floor(Math.random() * 9000 + 1000)),
                redacteur: currentUserProfile.name, date: date, type: type, lieu: lieu, officiers: officiers,
                otages: document.getElementById('op-otages').value, revendications: document.getElementById('op-revendications').value,
                leadNego: document.getElementById('op-lead-nego').value, leadTerrain: document.getElementById('op-lead-terrain').value,
                text: text, dossier: document.getElementById('op-dossier').value, images: [...currentOpReportImages]
            };

            if (editingOpReportId) {
                const index = MDT_Database.data.opReports.findIndex(r => r.id === editingOpReportId);
                if (index !== -1) MDT_Database.data.opReports[index] = reportData;
            } else {
                MDT_Database.data.opReports.unshift(reportData);
            }

            currentActiveOpReport = reportData;
            MDT_Database.sync();
            closeModals();
        });
    }


    // ========================================================================
    // 6. GESTION DES CITOYENS
    // ========================================================================
    let currentCitizenData = null;
    let currentActiveTab = 'rapports';

    function renderCitizenList(filterTerm = '') {
        const container = document.getElementById('citoyen-list-container');
        if (!container) return;
        
        container.innerHTML = '';
        const citoyens = MDT_Database.data.citoyens || [];
        const filteredCitizens = citoyens.filter(c => {
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
                const foundCitizen = MDT_Database.data.citoyens.find(c => c.id === citizenId);
                
                if (foundCitizen) {
                    document.getElementById('citoyen-empty-state').classList.add('hidden');
                    document.getElementById('citoyen-profile-state').classList.remove('hidden');
                    currentCitizenData = foundCitizen;
                    updateCitizenUI(currentCitizenData);
                    
                    const searchInput = document.getElementById('search-citizen-input');
                    renderCitizenList(searchInput ? searchInput.value : '');
                }
            });
        });
    }

    const searchCitizenInput = document.getElementById('search-citizen-input');
    if (searchCitizenInput) searchCitizenInput.addEventListener('input', (e) => renderCitizenList(e.target.value));

    function renderTabContent(tab) {
        const contentArea = document.getElementById('profile-content-area');
        if (!contentArea || !currentCitizenData) return;
        
        contentArea.innerHTML = ''; 
        
        if (tab === 'rapports') {
            if (!currentCitizenData.rapports || currentCitizenData.rapports.length === 0) return contentArea.innerHTML = '<p class="text-muted" style="padding: 20px;">Aucun rapport d\'arrestation enregistré.</p>';
            
            let html = '';
            currentCitizenData.rapports.forEach((r, index) => {
                let photosHtml = '';
                if (r.images && r.images.length > 0) {
                    photosHtml = r.images.map(img => `<img src="${img}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">`).join('');
                }
                
                html += `
                <div class="history-card" style="border-left-color: var(--accent-primary); position: relative;">
                    <div style="position: absolute; top: 15px; right: 15px; cursor: pointer;" class="rapport-options" data-index="${index}">
                        <i class="fa-solid fa-ellipsis-vertical" style="color: var(--text-muted); font-size: 1.2rem; padding: 5px;"></i>
                        <div class="context-menu hidden rapport-menu" id="menu-rapport-${index}" style="top: 25px; right: 0; width: 120px;">
                            <button class="menu-item btn-edit-rapport" data-index="${index}"><i class="fa-solid fa-pen"></i> Modifier</button>
                        </div>
                    </div>
                    <div class="history-header" style="padding-right: 30px;"><h4>Rapport d'arrestation</h4><span class="history-date">Le ${r.date}</span></div>
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
                    openEditRapport(btn.getAttribute('data-index')); 
                });
            });
        }
        else if (tab === 'mandats') {
            if (!currentCitizenData.mandats || currentCitizenData.mandats.length === 0) return contentArea.innerHTML = '<p class="text-muted" style="padding: 20px;">Aucun mandat d\'arrêt n\'a été émis pour ce citoyen.</p>';
            let html = '';
            currentCitizenData.mandats.forEach(mandat => {
                html += `<div class="history-card" style="border-left-color: var(--warning);"><div class="history-header"><h4>Mandat d'arrêt</h4><span class="history-date">Le ${mandat.date}</span></div><p class="history-author">Demandé par : ${mandat.officiers}</p><p class="history-desc"><strong>Motif :</strong> ${mandat.motif}</p><p class="history-desc" style="margin-top:8px; color:var(--text-muted); font-size: 0.85rem;">${mandat.desc}</p></div>`;
            });
            contentArea.innerHTML = html;
        } 
        else if (tab === 'tickets') {
            if (!currentCitizenData.tickets || currentCitizenData.tickets.length === 0) return contentArea.innerHTML = '<p class="text-muted" style="padding: 20px;">Aucun ticket routier n\'a été émis pour ce citoyen.</p>';
            let html = '';
            currentCitizenData.tickets.forEach(ticket => {
                html += `<div class="history-card" style="border-left-color: var(--success);"><div class="history-header"><h4>Ticket routier</h4><span class="history-date">Le ${ticket.date}</span></div><p class="history-author">Dressé par : ${ticket.officiers} | Lieu : ${ticket.lieu}</p><p class="history-desc"><strong>Infraction(s) :</strong> ${ticket.infraction}</p><p class="history-desc" style="margin-top:8px; color:var(--success); font-weight:600;">Amende : $${ticket.amende} | Points retirés : ${ticket.points}</p></div>`;
            });
            contentArea.innerHTML = html;
        }
        else if (tab === 'plaintes') {
            if (!currentCitizenData.plaintes || currentCitizenData.plaintes.length === 0) return contentArea.innerHTML = '<p class="text-muted" style="padding: 20px;">Aucune plainte n\'a été déposée.</p>';
            let html = '';
            currentCitizenData.plaintes.forEach(p => {
                let photosHtml = '';
                if (p.images && p.images.length > 0) photosHtml = p.images.map(img => `<img src="${img}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">`).join('');
                
                html += `<div class="history-card" style="border-left-color: var(--warning);"><div class="history-header"><h4>Plainte : ${p.raison}</h4><span class="history-date">Le ${p.date}</span></div><p class="history-author">Prise par : ${p.officiers} | Déposée contre : <span style="color:var(--danger); font-weight:600;">${p.contre}</span></p>${p.avocat ? `<p class="history-desc" style="color: var(--warning); margin-top: 5px;"><strong>Avocat :</strong> ${p.avocat}</p>` : ''}<p class="history-desc" style="margin-top:10px;"><strong>Récit :</strong> ${p.text}</p>${photosHtml ? `<div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">${photosHtml}</div>` : ''}</div>`;
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

    function updateCitizenUI(data) {
        if (!data) return;

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

        const setStat = (id, val, condition) => {
            const el = document.getElementById(id);
            if (el) { el.textContent = val; el.className = condition ? 'text-success' : 'text-danger'; }
        };

        setStat('stat-permis', data.permisConduire, data.permisConduire === 'Valide');
        setStat('stat-ppa-civil', data.ppaCivil, data.ppaCivil === 'Oui');
        setStat('stat-ppa-chasse', data.ppaChasse, data.ppaChasse === 'Oui');
        setStat('stat-decede', data.decede, data.decede === 'Non');
        setStat('stat-wanted', data.wanted ? 'Oui' : 'Non', !data.wanted);
        
        const profileWantedLabel = document.getElementById('profile-wanted-label');
        if (profileWantedLabel) {
            if (data.wanted) profileWantedLabel.classList.remove('hidden');
            else profileWantedLabel.classList.add('hidden');
        }

        const btnWanted = document.getElementById('menu-remove-wanted');
        if (btnWanted) { 
            if (data.wanted) { btnWanted.innerHTML = '<i class="fa-solid fa-handcuffs"></i> Retirer du Wanted'; btnWanted.className = 'menu-item success'; } 
            else { btnWanted.innerHTML = '<i class="fa-solid fa-person-rays"></i> Ajouter au Wanted'; btnWanted.className = 'menu-item danger'; } 
        }
        
        const mandatModalName = document.getElementById('mandat-modal-name');
        if (mandatModalName) mandatModalName.textContent = `${data.firstname} ${data.lastname}`;
        const ticketModalName = document.getElementById('ticket-modal-name');
        if (ticketModalName) ticketModalName.textContent = `${data.firstname} ${data.lastname}`;
        const arrestModalName = document.getElementById('arrest-modal-name');
        if (arrestModalName) arrestModalName.textContent = `${data.firstname} ${data.lastname}`;
        const plainteModalName = document.getElementById('plainte-modal-name');
        if (plainteModalName) plainteModalName.textContent = `${data.firstname} ${data.lastname}`;

        renderTabContent(currentActiveTab);
    }

    const btnSubmitCreate = document.getElementById('btn-submit-create');
    if (btnSubmitCreate) {
        btnSubmitCreate.addEventListener('click', () => {
            const firstname = document.getElementById('create-firstname').value.trim().toUpperCase();
            const lastname = document.getElementById('create-lastname').value.trim().toUpperCase();
            
            if (!firstname || !lastname) return alert("Le prénom et le nom sont obligatoires.");
            if (!MDT_Database.data.citoyens) MDT_Database.data.citoyens = [];

            let previewSrc = document.getElementById('create-photo-preview').src;
            if (previewSrc.includes('Nouveau+Citoyen')) previewSrc = `https://ui-avatars.com/api/?name=${firstname}+${lastname}&background=1e1b4b&color=fff`;

            const newCitizen = {
                id: 'cit_' + Date.now(), avatar: previewSrc, firstname: firstname, lastname: lastname,
                phone: document.getElementById('create-phone').value || "Non précisé", birthdate: document.getElementById('create-birthdate').value || "Non précisée",
                gender: document.getElementById('create-gender').value, email: document.getElementById('create-email').value || "Non précisé",
                pesos: document.getElementById('create-poids').value || "0", taille: document.getElementById('create-taille').value || "0",
                address: document.getElementById('create-address').value || "Non précisée", ethnie: document.getElementById('create-ethnie').value,
                hair: document.getElementById('create-hair').value || "Non précisé", eyes: document.getElementById('create-eyes').value || "Non précisé",
                appartenance: document.getElementById('create-appartenance').value || "Aucune", job: document.getElementById('create-job').value || "Aucun",
                permisConduire: document.getElementById('create-permis').value, ppaCivil: "Non", ppaChasse: "Non", decede: "Non", wanted: false,
                mandats: [], tickets: [], rapports: [], plaintes: []
            };

            MDT_Database.data.citoyens.unshift(newCitizen); 
            MDT_Database.sync();

            currentCitizenData = newCitizen;
            document.getElementById('citoyen-empty-state').classList.add('hidden');
            document.getElementById('citoyen-profile-state').classList.remove('hidden');
            updateCitizenUI(currentCitizenData);

            document.querySelectorAll('#modal-citizen-create input').forEach(i => i.value = '');
            document.getElementById('create-photo-preview').src = 'https://ui-avatars.com/api/?name=Nouveau+Citoyen&background=1e1b4b&color=fff';
            closeModals();
        });
    }

    const btnRevokePpaCivil = document.getElementById('menu-revoke-ppa-civil');
    if (btnRevokePpaCivil) { btnRevokePpaCivil.addEventListener('click', () => { if (currentCitizenData) { currentCitizenData.ppaCivil = (currentCitizenData.ppaCivil === "Oui") ? "Non" : "Oui"; MDT_Database.sync(); updateCitizenUI(currentCitizenData); } }); }
    
    const btnRevokePpaChasse = document.getElementById('menu-revoke-ppa-chasse');
    if (btnRevokePpaChasse) { btnRevokePpaChasse.addEventListener('click', () => { if (currentCitizenData) { currentCitizenData.ppaChasse = (currentCitizenData.ppaChasse === "Oui") ? "Non" : "Oui"; MDT_Database.sync(); updateCitizenUI(currentCitizenData); } }); }

    const btnRemoveWanted = document.getElementById('menu-remove-wanted');
    if (btnRemoveWanted) { btnRemoveWanted.addEventListener('click', () => { if (currentCitizenData) { currentCitizenData.wanted = !currentCitizenData.wanted; MDT_Database.sync(); updateCitizenUI(currentCitizenData); updateDashboardWanted(); } }); }

    const btnEditCitizenMenu = document.getElementById('btn-edit-citizen-menu');
    if (btnEditCitizenMenu) { btnEditCitizenMenu.addEventListener('click', (e) => { e.stopPropagation(); const menu = document.getElementById('edit-citizen-context-menu'); if (menu) menu.classList.toggle('hidden'); }); }

    function fillEditModalData() {
        if (currentCitizenData) {
            document.getElementById('edit-firstname').value = currentCitizenData.firstname; document.getElementById('edit-lastname').value = currentCitizenData.lastname;
            document.getElementById('edit-phone').value = currentCitizenData.phone; document.getElementById('edit-birthdate').value = currentCitizenData.birthdate;
            document.getElementById('edit-gender').value = currentCitizenData.gender; document.getElementById('edit-email').value = currentCitizenData.email;
            document.getElementById('edit-poids').value = currentCitizenData.pesos; document.getElementById('edit-taille').value = currentCitizenData.taille;
            document.getElementById('edit-address').value = currentCitizenData.address; document.getElementById('edit-ethnie').value = currentCitizenData.ethnie;
            document.getElementById('edit-hair').value = currentCitizenData.hair; document.getElementById('edit-eyes').value = currentCitizenData.eyes;
            document.getElementById('edit-appartenance').value = currentCitizenData.appartenance; document.getElementById('edit-job').value = currentCitizenData.job;
            document.getElementById('edit-photo-preview').src = currentCitizenData.avatar; document.getElementById('edit-permis-conduire').value = currentCitizenData.permisConduire;
        }
    }

    const menuEditInfo = document.getElementById('menu-edit-info');
    if (menuEditInfo) { menuEditInfo.addEventListener('click', () => { fillEditModalData(); document.getElementById('edit-section-info').classList.remove('hidden'); document.getElementById('edit-section-photo').classList.add('hidden'); document.getElementById('edit-modal-main-title').innerHTML = `Modifier les informations - <span style="color:var(--accent-primary);">${currentCitizenData.firstname} ${currentCitizenData.lastname}</span>`; openModal('modal-citizen-edit'); }); }
    
    const menuEditPhoto = document.getElementById('menu-edit-photo');
    if (menuEditPhoto) { menuEditPhoto.addEventListener('click', () => { fillEditModalData(); document.getElementById('edit-section-info').classList.add('hidden'); document.getElementById('edit-section-photo').classList.remove('hidden'); document.getElementById('edit-modal-main-title').innerHTML = `Modifier la photo - <span style="color:var(--accent-primary);">${currentCitizenData.firstname} ${currentCitizenData.lastname}</span>`; openModal('modal-citizen-edit'); }); }

    const btnSaveEdit = document.getElementById('btn-save-edit');
    if (btnSaveEdit) {
        btnSaveEdit.addEventListener('click', () => {
            if (currentCitizenData) {
                currentCitizenData.firstname = document.getElementById('edit-firstname').value.toUpperCase(); currentCitizenData.lastname = document.getElementById('edit-lastname').value.toUpperCase();
                currentCitizenData.phone = document.getElementById('edit-phone').value; currentCitizenData.birthdate = document.getElementById('edit-birthdate').value;
                currentCitizenData.gender = document.getElementById('edit-gender').value; currentCitizenData.email = document.getElementById('edit-email').value;
                currentCitizenData.pesos = document.getElementById('edit-poids').value; currentCitizenData.taille = document.getElementById('edit-taille').value;
                currentCitizenData.address = document.getElementById('edit-address').value; currentCitizenData.ethnie = document.getElementById('edit-ethnie').value;
                currentCitizenData.hair = document.getElementById('edit-hair').value; currentCitizenData.eyes = document.getElementById('edit-eyes').value;
                currentCitizenData.appartenance = document.getElementById('edit-appartenance').value; currentCitizenData.job = document.getElementById('edit-job').value;
                currentCitizenData.permisConduire = document.getElementById('edit-permis-conduire').value;
                const editPhotoPreview = document.getElementById('edit-photo-preview');
                if (editPhotoPreview && editPhotoPreview.src) currentCitizenData.avatar = editPhotoPreview.src;
                MDT_Database.sync(); closeModals();
            }
        });
    }

    let arrestImagesList = [];
    let editingRapportIndex = null;

    function renderArrestImages() {
        const container = document.getElementById('arrest-photos-container');
        if (!container) return;
        container.innerHTML = '';
        arrestImagesList.forEach(imgSrc => {
            const img = document.createElement('img');
            img.src = imgSrc; img.style.width = '70px'; img.style.height = '70px'; img.style.objectFit = 'cover'; img.style.borderRadius = '4px'; img.style.border = '2px solid var(--accent-primary)';
            container.appendChild(img);
        });
    }

    function openEditRapport(index) {
        editingRapportIndex = index;
        const rapport = currentCitizenData.rapports[index];
        document.getElementById('arrest-date').value = rapport.date; document.getElementById('arrest-station').value = rapport.station;
        document.getElementById('arrest-officiers').value = rapport.officiers; document.getElementById('arrest-avocat').value = rapport.avocat;
        document.getElementById('arrest-possessions').value = rapport.possessions; document.getElementById('arrest-text').value = rapport.text;
        document.getElementById('arrest-charges').value = rapport.charges; document.getElementById('arrest-fine').value = rapport.fine;
        document.getElementById('arrest-time').value = rapport.time; 
        arrestImagesList = [...(rapport.images || [])];
        renderArrestImages(); openModal('modal-arrest-report');
    }

    const btnOpenArrestCitizen = document.getElementById('btn-open-arrest-citizen');
    if (btnOpenArrestCitizen) {
        btnOpenArrestCitizen.addEventListener('click', () => {
            if (!currentCitizenData) return;
            arrestImagesList = []; document.getElementById('arrest-photos-container').innerHTML = '';
            document.querySelectorAll('#modal-arrest-report input, #modal-arrest-report textarea').forEach(i => i.value = '');
            openModal('modal-arrest-report');
        });
    }

    const btnSubmitArrest = document.getElementById('btn-submit-arrest');
    if (btnSubmitArrest) {
        btnSubmitArrest.addEventListener('click', () => {
            if (!currentCitizenData) return;
            const r = {
                date: document.getElementById('arrest-date').value, station: document.getElementById('arrest-station').value,
                officiers: document.getElementById('arrest-officiers').value, avocat: document.getElementById('arrest-avocat').value,
                possessions: document.getElementById('arrest-possessions').value, text: document.getElementById('arrest-text').value,
                charges: document.getElementById('arrest-charges').value, fine: document.getElementById('arrest-fine').value,
                time: document.getElementById('arrest-time').value, images: [...arrestImagesList]
            };

            if (!r.date || !r.text || !r.charges) return alert("Les champs avec * sont requis.");

            if (editingRapportIndex !== null) {
                currentCitizenData.rapports[editingRapportIndex] = r;
            } else {
                if (!currentCitizenData.rapports) currentCitizenData.rapports = [];
                currentCitizenData.rapports.unshift(r);
                if (!MDT_Database.data.opReports) MDT_Database.data.opReports = [];
                MDT_Database.data.opReports.push({ id: '#ARR-' + Date.now(), type: 'Arrestation', redacteur: currentUserProfile.name, date: r.date, lieu: r.station, text: r.text, officiers: r.officiers, images: r.images, dossier: '' });
            }
            MDT_Database.sync(); const tabRapports = document.querySelector('.tab-link[data-tab="rapports"]'); if (tabRapports) tabRapports.click(); closeModals();
        });
    }

    let plainteImagesList = [];
    const btnOpenPlainteCitizen = document.getElementById('btn-open-plainte-citizen');
    if (btnOpenPlainteCitizen) {
        btnOpenPlainteCitizen.addEventListener('click', () => {
            if (!currentCitizenData) return;
            plainteImagesList = []; document.getElementById('plainte-photos-container').innerHTML = '';
            document.querySelectorAll('#modal-plainte-create input, #modal-plainte-create textarea').forEach(i => i.value = '');
            editingPlainteId = null;
            openModal('modal-plainte-create');
        });
    }

    const btnSubmitTicket = document.getElementById('btn-submit-ticket');
    if (btnSubmitTicket) {
        btnSubmitTicket.addEventListener('click', () => {
            if (!currentCitizenData) return;
            const t = { date: document.getElementById('ticket-date').value, lieu: document.getElementById('ticket-lieu').value, infraction: document.getElementById('ticket-infraction').value, amende: document.getElementById('ticket-amende').value, points: document.getElementById('ticket-points').value, officiers: document.getElementById('ticket-officiers').value };
            if (!t.date || !t.infraction) return alert("Les champs avec * sont requis.");
            if (!currentCitizenData.tickets) currentCitizenData.tickets = [];
            currentCitizenData.tickets.unshift(t); MDT_Database.sync(); const tabTickets = document.querySelector('.tab-link[data-tab="tickets"]'); if (tabTickets) tabTickets.click(); closeModals();
        });
    }

    const btnSubmitMandat = document.getElementById('btn-submit-mandat');
    if (btnSubmitMandat) {
        btnSubmitMandat.addEventListener('click', () => {
            if (!currentCitizenData) return;
            const m = { date: document.getElementById('mandat-date').value, officiers: document.getElementById('mandat-officiers').value, motif: document.getElementById('mandat-motif').value, desc: document.getElementById('mandat-desc').value };
            if (!m.date || !m.motif) return alert("Les champs avec * sont requis.");
            if (!currentCitizenData.mandats) currentCitizenData.mandats = [];
            currentCitizenData.mandats.unshift(m); MDT_Database.sync(); const tabMandats = document.querySelector('.tab-link[data-tab="mandats"]'); if (tabMandats) tabMandats.click(); closeModals();
        });
    }


    // ========================================================================
    // 7. REGISTRE DES ARMES
    // ========================================================================
    function renderArmesList(filterTerm = '') {
        const container = document.getElementById('armes-list-container');
        if (!container) return;
        
        container.innerHTML = '';
        const armes = MDT_Database.data.armes || [];
        
        const filtered = armes.filter(a => 
            (a.modele || '').toLowerCase().includes(filterTerm.toLowerCase()) || 
            (a.serie || '').toLowerCase().includes(filterTerm.toLowerCase()) ||
            (a.citoyen || '').toLowerCase().includes(filterTerm.toLowerCase())
        );
        
        filtered.forEach(arme => {
            let badgeHtml = arme.statut === "Légal" ? `<span class="badge success">Légal</span>` : `<span class="badge danger">${arme.statut}</span>`;
            let delitHtml = arme.delit ? `<span class="badge danger">OUI</span>` : `<span class="badge success">NON</span>`;
            
            container.innerHTML += `
                <tr class="expandable-row" data-target="details-arme-${arme.id}" style="cursor: pointer;">
                    <td style="width: 30px;"><i class="fa-solid fa-chevron-right toggle-icon" style="transition: 0.3s;"></i></td>
                    <td>Le ${arme.date}</td>
                    <td>${arme.serie}</td>
                    <td>${arme.modele}</td>
                    <td>${badgeHtml}</td>
                    <td><button class="btn-icon"><i class="fa-solid fa-eye"></i></button></td>
                </tr>
                <tr id="details-arme-${arme.id}" class="hidden nested-row">
                    <td colspan="6" style="padding: 0; border: none;">
                        <div style="background: var(--bg-input); padding: 20px; border-bottom: 1px solid var(--border-color); display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div><p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px;">ORIGINE :</p><p style="margin-bottom: 15px; color:white;">${arme.origine}</p><p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px;">POLICIER ASSIGNÉ :</p><p style="margin-bottom: 15px; color: var(--accent-primary); font-weight: 600;">${arme.officier}</p><p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px;">LIÉ À UN DÉLIT :</p><p>${delitHtml}</p></div>
                            <div><p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px;">RAISON ENCODAGE :</p><p style="margin-bottom: 15px; color:white;">${arme.motifs || "Aucune"}</p><p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px;">CITOYEN LIÉ :</p><p style="margin-bottom: 15px; color:white;">${arme.citoyen || "Non assigné"}</p></div>
                        </div>
                    </td>
                </tr>
            `;
        });
        setupExpandableRows(container);
    }

    const searchArmeInput = document.getElementById('search-arme-input');
    if (searchArmeInput) searchArmeInput.addEventListener('input', (e) => renderArmesList(e.target.value));

    const btnSubmitArme = document.getElementById('btn-submit-arme');
    if (btnSubmitArme) {
        btnSubmitArme.addEventListener('click', () => {
            if (!MDT_Database.data.armes) MDT_Database.data.armes = [];
            const newArme = {
                id: Date.now(), date: document.getElementById('arme-date').value || new Date().toLocaleString(), origine: document.getElementById('arme-origine').value, 
                modele: document.getElementById('arme-modele').value, serie: document.getElementById('arme-serie').value, motifs: document.getElementById('arme-motifs').value,
                citoyen: document.getElementById('arme-citoyen').value, delit: document.getElementById('arme-delit').checked,
                officier: currentUserProfile.grade + " | " + currentUserProfile.name, statut: document.getElementById('arme-citoyen').value ? "Saisie" : "Légal"
            };
            if (!newArme.origine || !newArme.modele || !newArme.serie) return alert("Les champs obligatoires avec * ne sont pas remplis.");
            MDT_Database.data.armes.unshift(newArme); MDT_Database.sync(); closeModals();
        });
    }


    // ========================================================================
    // 8. REGISTRES : BRACELETS ÉLECTRONIQUES
    // ========================================================================
    function renderBraceletsList(filterTerm = '') {
        const container = document.getElementById('bracelets-list-container');
        if (!container) return;
        
        container.innerHTML = '';
        const bracelets = MDT_Database.data.bracelets || [];
        const filtered = bracelets.filter(b => (b.citoyen || '').toLowerCase().includes(filterTerm.toLowerCase()));

        filtered.forEach(b => {
            container.innerHTML += `
                <tr class="expandable-row" data-target="details-bracelet-${b.id}" style="cursor: pointer;">
                    <td style="width: 30px;"><i class="fa-solid fa-chevron-right toggle-icon" style="transition: 0.3s;"></i></td>
                    <td><strong>${b.citoyen}</strong></td>
                    <td>${b.officier}</td>
                    <td><span style="color:var(--warning); font-weight:600;">${b.npre}</span></td>
                    <td>${b.dateExpire}</td>
                    <td><button class="btn-icon"><i class="fa-solid fa-eye"></i></button></td>
                </tr>
                <tr id="details-bracelet-${b.id}" class="hidden nested-row">
                    <td colspan="6" style="padding: 0; border: none;">
                        <div style="background: var(--bg-input); padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; gap: 40px;">
                            <div><p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px;">DATE DE POSE</p><p style="margin-bottom: 15px; color:white;">Le ${b.datePose}</p></div>
                            <div style="flex: 1;"><p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px;">MOTIFS</p><p style="background: var(--bg-card); padding: 10px; border-radius: 4px; border: 1px solid var(--border-color); color:white;">${b.motifs}</p></div>
                        </div>
                    </td>
                </tr>
            `;
        });
        setupExpandableRows(container);
    }

    const searchBraceletInput = document.getElementById('search-bracelet-input');
    if (searchBraceletInput) searchBraceletInput.addEventListener('input', (e) => renderBraceletsList(e.target.value));

    const btnSubmitBracelet = document.getElementById('btn-submit-bracelet');
    if (btnSubmitBracelet) {
        btnSubmitBracelet.addEventListener('click', () => {
            if (!MDT_Database.data.bracelets) MDT_Database.data.bracelets = [];
            const b = {
                id: Date.now(), citoyen: document.getElementById('bracelet-citoyen').value, officier: document.getElementById('bracelet-officier').value,
                npre: document.getElementById('bracelet-npre').value, datePose: document.getElementById('bracelet-date-pose').value,
                dateExpire: document.getElementById('bracelet-date-expire').value, motifs: document.getElementById('bracelet-motifs').value
            };
            if (!b.citoyen || !b.npre || !b.officier) return alert("Les champs avec un * sont obligatoires.");
            MDT_Database.data.bracelets.unshift(b); MDT_Database.sync(); closeModals();
        });
    }


    // ========================================================================
    // 9. REGISTRES : VÉHICULES EN INFRACTION (EX-SABOTS)
    // ========================================================================
    let currentVehiculeImage = null;

    function renderVehiculesList(filterTerm = '') {
        const container = document.getElementById('vehicules-list-container');
        if (!container) return;
        
        container.innerHTML = '';
        const vehicules = MDT_Database.data.vehicules || [];
        const filtered = vehicules.filter(v => (v.plaque || '').toLowerCase().includes(filterTerm.toLowerCase()));

        filtered.forEach(v => {
            container.innerHTML += `
                <tr class="expandable-row" data-target="details-vehicule-${v.id}" style="cursor: pointer;">
                    <td style="width: 30px;"><i class="fa-solid fa-chevron-right toggle-icon" style="transition: 0.3s;"></i></td>
                    <td>${v.type}</td>
                    <td><strong>${v.plaque}</strong></td>
                    <td>Le ${v.date}</td>
                    <td>1</td>
                    <td><button class="btn-icon"><i class="fa-solid fa-eye"></i></button></td>
                </tr>
                <tr id="details-vehicule-${v.id}" class="hidden nested-row">
                    <td colspan="6" style="padding: 0; border: none;">
                        <div style="background: var(--bg-input); padding: 20px; border-bottom: 1px solid var(--border-color);">
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 10px;">PROPRIÉTAIRE ACTUEL</p><p style="margin-bottom: 15px; color:white;"><strong>${v.proprio || 'Inconnu'}</strong></p>
                            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 200px;">
                                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px;">FAITS LIÉS</p>
                                    <div style="background: var(--bg-card); padding: 10px; border-radius: 4px; border: 1px solid var(--border-color);">
                                        <p style="color: white; margin-bottom: 5px;">${v.infraction}</p>
                                        <div style="display:flex; gap:10px;">${v.rapport ? `<span class="badge" style="background: rgba(92, 84, 237, 0.2); color: #a5b4fc;">Rapport: ${v.rapport}</span>` : ''}${v.dossier ? `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fcd34d;">Preuves: ${v.dossier}</span>` : ''}</div>
                                    </div>
                                </div>
                                ${v.photo ? `<div style="flex: 1; min-width: 200px;"><p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px;">PREUVE PHOTO</p><img src="${v.photo}" style="height: 100px; border-radius: 4px; border: 1px solid var(--border-color);"></div>` : ''}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
        setupExpandableRows(container);
    }

    const searchVehiculeInput = document.getElementById('search-vehicule-input');
    if (searchVehiculeInput) searchVehiculeInput.addEventListener('input', (e) => renderVehiculesList(e.target.value));

    const btnSubmitVehicule = document.getElementById('btn-submit-vehicule');
    if (btnSubmitVehicule) {
        btnSubmitVehicule.addEventListener('click', () => {
            if (!MDT_Database.data.vehicules) MDT_Database.data.vehicules = [];
            const v = {
                id: Date.now(), date: new Date().toLocaleString(), type: document.getElementById('vehicule-type').value,
                plaque: document.getElementById('vehicule-plaque').value.toUpperCase(), infraction: document.getElementById('vehicule-infraction').value,
                proprio: document.getElementById('vehicule-proprio').value, rapport: document.getElementById('vehicule-rapport').value,
                dossier: document.getElementById('vehicule-dossier').value, photo: currentVehiculeImage, author: currentUserProfile.name
            };
            if (!v.type || !v.plaque || !v.infraction) return alert("Les champs avec * sont obligatoires.");
            MDT_Database.data.vehicules.unshift(v); currentVehiculeImage = null; 
            const photoContainer = document.getElementById('vehicule-photos-container'); if (photoContainer) photoContainer.innerHTML = '';
            MDT_Database.sync(); closeModals();
        });
    }


    // ========================================================================
    // 10. PREUVES & DOSSIERS PHOTOS
    // ========================================================================
    let currentOpenDossierId = null;

    function renderPreuvesDossiers(filterTerm = '') {
        const container = document.getElementById('dossiers-container');
        if (!container) return;
        
        container.innerHTML = '';
        const dossiersPreuves = MDT_Database.data.dossiersPreuves || [];
        const filtered = dossiersPreuves.filter(d => (d.name || '').toLowerCase().includes(filterTerm.toLowerCase()));

        filtered.forEach(d => {
            container.innerHTML += `
                <div class="dossier-card cursor-pointer" data-id="${d.id}" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; text-align: center; transition: 0.2s;">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 15px;"></i>
                    <h4 style="color: white; font-size: 1rem; margin-bottom: 5px; text-transform: uppercase;">${d.name}</h4>
                    <p style="color: var(--text-muted); font-size: 0.8rem;">${d.images ? d.images.length : 0} photo(s)</p>
                    <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 5px;">Par ${d.author}</p>
                </div>
            `;
        });

        container.querySelectorAll('.dossier-card').forEach(card => {
            card.addEventListener('mouseover', () => card.style.borderColor = 'var(--accent-primary)');
            card.addEventListener('mouseout', () => card.style.borderColor = 'var(--border-color)');
            card.addEventListener('click', () => {
                currentOpenDossierId = Number(card.getAttribute('data-id'));
                document.getElementById('preuves-list-state').classList.add('hidden');
                document.getElementById('preuves-open-state').classList.remove('hidden');
                const dossier = MDT_Database.data.dossiersPreuves.find(d => d.id === currentOpenDossierId);
                if (dossier) {
                    document.getElementById('opened-dossier-title').textContent = dossier.name;
                    document.getElementById('opened-dossier-meta').textContent = `Créé le ${dossier.date} par ${dossier.author}`;
                    renderDossierImages();
                }
            });
        });
    }

    const searchDossierInput = document.getElementById('search-dossier-input');
    if (searchDossierInput) searchDossierInput.addEventListener('input', (e) => renderPreuvesDossiers(e.target.value));

    const btnSubmitDossier = document.getElementById('btn-submit-dossier');
    if (btnSubmitDossier) {
        btnSubmitDossier.addEventListener('click', () => {
            const name = document.getElementById('dossier-name').value;
            if (!name) return alert("Le nom du dossier est requis.");
            if (!MDT_Database.data.dossiersPreuves) MDT_Database.data.dossiersPreuves = [];
            MDT_Database.data.dossiersPreuves.unshift({ id: Date.now(), name: name, date: new Date().toLocaleDateString(), author: currentUserProfile.name, images: [] });
            MDT_Database.sync(); closeModals();
        });
    }

    function renderDossierImages() {
        const container = document.getElementById('opened-dossier-photos');
        if (!container) return;
        
        container.innerHTML = '';
        const dossier = MDT_Database.data.dossiersPreuves.find(d => d.id === currentOpenDossierId);
        
        if (dossier && dossier.images) {
            dossier.images.forEach((img, idx) => {
                container.innerHTML += `
                    <div style="position: relative; border: 2px solid var(--border-color); border-radius: 4px; overflow: hidden;">
                        <img src="${img}" style="height: 180px; width: auto; max-width: 100%; object-fit: contain;">
                        <button class="btn-icon danger" onclick="deleteImageFromDossier(${idx})" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); border: none;"><i class="fa-solid fa-trash" style="color: #ef4444;"></i></button>
                    </div>
                `;
            });
        }
    }

    window.deleteImageFromDossier = function(idx) {
        if (confirm("Voulez-vous vraiment supprimer cette photo ?")) {
            const dossier = MDT_Database.data.dossiersPreuves.find(d => d.id === currentOpenDossierId);
            if (dossier && dossier.images) dossier.images.splice(idx, 1);
            MDT_Database.sync(); renderDossierImages();
        }
    };

    const btnCloseDossier = document.getElementById('btn-close-dossier');
    if (btnCloseDossier) {
        btnCloseDossier.addEventListener('click', () => {
            currentOpenDossierId = null;
            document.getElementById('preuves-list-state').classList.remove('hidden');
            document.getElementById('preuves-open-state').classList.add('hidden');
            MDT_Database.sync();
        });
    }


    // ========================================================================
    // 11. MES DOSSIERS & ÉDITION (Interrogatoires, Plaintes, Incidents)
    // ========================================================================
    
    // NOUVELLES VARIABLES DE TRACKING POUR L'ÉDITION
    let editingInterroId = null;
    let editingPlainteId = null;
    let editingIncidentId = null;

    // FONCTION QUI OUVRE LE BON MODAL ET PRÉ-REMPLI LES DONNÉES
    window.openEditModalForType = function(type, id) {
        const dataList = MDT_Database.data[type];
        if (!dataList) return;
        const item = dataList.find(x => x.id === id);
        if (!item) return;

        if (type === 'interrogatoires') {
            editingInterroId = id;
            document.getElementById('inter-citoyen').value = item.citoyen || '';
            document.getElementById('inter-debut').value = item.debut || '';
            document.getElementById('inter-fin').value = item.fin || '';
            document.getElementById('inter-presents').value = item.presents || '';
            document.getElementById('inter-poste').value = item.poste || '';
            document.getElementById('inter-text').value = item.text || '';
            openModal('modal-interrogatoire-create');
        } 
        else if (type === 'plaintes') {
            editingPlainteId = id;
            document.getElementById('plainte-date').value = item.date || '';
            document.getElementById('plainte-contre').value = item.contre || '';
            document.getElementById('plainte-raison').value = item.raison || '';
            document.getElementById('plainte-text').value = item.text || '';
            document.getElementById('plainte-officiers').value = item.officiers || '';
            document.getElementById('plainte-avocat').value = item.avocat || '';
            plainteImagesList = [...(item.images || [])];
            
            const photosContainer = document.getElementById('plainte-photos-container');
            if (photosContainer) {
                photosContainer.innerHTML = '';
                plainteImagesList.forEach(src => {
                    const img = document.createElement('img'); 
                    img.src = src; img.style.width = '70px'; img.style.height = '70px'; img.style.objectFit = 'cover'; img.style.borderRadius = '4px'; img.style.border = '2px solid var(--accent-primary)';
                    photosContainer.appendChild(img);
                });
            }
            openModal('modal-plainte-create');
        } 
        else if (type === 'incidents') {
            editingIncidentId = id;
            document.getElementById('incident-date').value = item.date || '';
            document.getElementById('incident-titre').value = item.titre || '';
            document.getElementById('incident-officiers').value = item.officiers || '';
            document.getElementById('incident-text').value = item.text || '';
            openModal('modal-incident-create');
        }
    };

    // Vider les variables si on clique sur "Créer" pour un nouveau dossier
    const btnCreateInterro = document.querySelector('#view-mes-interrogatoires .btn-primary');
    if (btnCreateInterro) {
        btnCreateInterro.addEventListener('click', () => {
            editingInterroId = null;
            document.querySelectorAll('#modal-interrogatoire-create input, #modal-interrogatoire-create textarea').forEach(i => i.value = '');
        });
    }

    const btnCreatePlainteMesDossiers = document.querySelector('#view-mes-plaintes .btn-primary');
    if (btnCreatePlainteMesDossiers) {
        btnCreatePlainteMesDossiers.addEventListener('click', () => {
            editingPlainteId = null;
            plainteImagesList = [];
            const pCont = document.getElementById('plainte-photos-container'); if(pCont) pCont.innerHTML = '';
            document.querySelectorAll('#modal-plainte-create input, #modal-plainte-create textarea').forEach(i => i.value = '');
        });
    }

    const btnCreateIncident = document.querySelector('#view-mes-incidents .btn-primary');
    if (btnCreateIncident) {
        btnCreateIncident.addEventListener('click', () => {
            editingIncidentId = null;
            document.querySelectorAll('#modal-incident-create input, #modal-incident-create textarea').forEach(i => i.value = '');
        });
    }


    // Fonction de génération des tableaux avec les nouveaux boutons Modifier
    function generateTableRows(dataArray, columns, showAuthor = false, type = '') {
        let html = '';
        dataArray.forEach(item => {
            html += `<tr style="position:relative;">`;
            columns.forEach(col => { html += `<td>${item[col] || '-'}</td>`; });
            if (showAuthor) html += `<td>${item.author || item.redacteur || '-'}</td>`;
            html += `
                <td style="text-align:right;">
                    <i class="fa-solid fa-ellipsis-vertical cursor-pointer row-options" style="padding: 5px; color:var(--text-muted);" data-id="${item.id}"></i>
                    <div class="context-menu hidden row-menu" id="menu-row-${item.id}" style="right: 30px; top: 10px; width:150px; text-align:left;">
                        <button class="menu-item btn-edit-row" data-id="${item.id}" data-type="${type}"><i class="fa-solid fa-pen"></i> Modifier</button>
                        <button class="menu-item danger btn-delete-row" data-id="${item.id}" data-type="${type}"><i class="fa-solid fa-trash"></i> Supprimer</button>
                    </div>
                </td>
            </tr>`;
        });
        return html;
    }

    function setupRowMenus(container) {
        container.querySelectorAll('.row-options').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = opt.getAttribute('data-id');
                const menu = document.getElementById(`menu-row-${id}`);
                document.querySelectorAll('.row-menu').forEach(m => { if(m !== menu) m.classList.add('hidden'); });
                if (menu) menu.classList.toggle('hidden');
            });
        });

        container.querySelectorAll('.btn-edit-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const type = btn.getAttribute('data-type');
                
                // Fermer le menu déroulant
                const menu = document.getElementById(`menu-row-${id}`);
                if (menu) menu.classList.add('hidden');

                // Si c'est un rapport d'arrestation dans le superviseur, on utilise la logique existante
                if (type === 'opReports') {
                    const report = MDT_Database.data.opReports.find(r => r.id === id);
                    if (report) {
                        editingOpReportId = id;
                        document.getElementById('op-date').value = report.date;
                        document.getElementById('op-type').value = report.type;
                        document.getElementById('op-officiers').value = report.officiers;
                        document.getElementById('op-otages').value = report.otages || '';
                        document.getElementById('op-lieu').value = report.lieu;
                        document.getElementById('op-revendications').value = report.revendications || '';
                        document.getElementById('op-lead-nego').value = report.leadNego || '';
                        document.getElementById('op-lead-terrain').value = report.leadTerrain || '';
                        document.getElementById('op-text').value = report.text;
                        document.getElementById('op-dossier').value = report.dossier || '';
                        currentOpReportImages = [...(report.images || [])];
                        const photosContainer = document.getElementById('op-photos-container');
                        photosContainer.innerHTML = '';
                        currentOpReportImages.forEach(src => {
                            const img = document.createElement('img'); img.src = src; img.style.width = '70px'; img.style.height = '70px'; img.style.objectFit = 'cover'; img.style.borderRadius = '4px'; img.style.border = '2px solid var(--accent-primary)';
                            photosContainer.appendChild(img);
                        });
                        openModal('modal-op-report');
                    }
                } else {
                    // Sinon, on utilise la nouvelle fonction
                    window.openEditModalForType(type, id);
                }
            });
        });
        
        container.querySelectorAll('.btn-delete-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm("Supprimer définitivement cet élément ?")) {
                    const id = btn.getAttribute('data-id');
                    const type = btn.getAttribute('data-type');
                    MDT_Database.data[type] = MDT_Database.data[type].filter(item => item.id !== id);
                    MDT_Database.sync();
                }
            });
        });
    }

    // --- SAUVEGARDE INTERROGATOIRES ---
    function renderMesInterrogatoires(filterTerm = '') {
        const c = document.getElementById('mes-interrogatoires-list'); if (!c) return;
        const interrogatoires = MDT_Database.data.interrogatoires || [];
        let myInterros = interrogatoires.filter(i => i.author === currentUserProfile.name);
        
        if (filterTerm) myInterros = myInterros.filter(i => (i.citoyen || '').toLowerCase().includes(filterTerm.toLowerCase()) || (i.id || '').toLowerCase().includes(filterTerm.toLowerCase()));
        
        c.innerHTML = generateTableRows(myInterros, ['id', 'date', 'citoyen'], false, 'interrogatoires');
        setupRowMenus(c);
    }
    const searchMesInterrogatoires = document.getElementById('search-mes-interrogatoires');
    if (searchMesInterrogatoires) searchMesInterrogatoires.addEventListener('input', (e) => renderMesInterrogatoires(e.target.value));

    if (document.getElementById('btn-submit-interrogatoire')) {
        document.getElementById('btn-submit-interrogatoire').addEventListener('click', () => {
            if (!MDT_Database.data.interrogatoires) MDT_Database.data.interrogatoires = [];

            const iData = {
                date: document.getElementById('inter-debut').value || new Date().toLocaleString(), // Fallback
                citoyen: document.getElementById('inter-citoyen').value,
                debut: document.getElementById('inter-debut').value, 
                fin: document.getElementById('inter-fin').value, 
                presents: document.getElementById('inter-presents').value,
                poste: document.getElementById('inter-poste').value, 
                text: document.getElementById('inter-text').value, 
            };

            if (editingInterroId) {
                const idx = MDT_Database.data.interrogatoires.findIndex(x => x.id === editingInterroId);
                if (idx !== -1) {
                    MDT_Database.data.interrogatoires[idx] = { 
                        ...MDT_Database.data.interrogatoires[idx], 
                        ...iData, 
                        id: editingInterroId
                    };
                }
            } else {
                MDT_Database.data.interrogatoires.unshift({
                    ...iData,
                    id: '#INT-' + Math.floor(Math.random() * 9000), 
                    author: currentUserProfile.name
                });
            }
            MDT_Database.sync(); 
            closeModals();
        });
    }

    // --- SAUVEGARDE PLAINTES ---
    function renderMesPlaintes(filterTerm = '') {
        const c = document.getElementById('mes-plaintes-list'); if (!c) return;
        const plaintes = MDT_Database.data.plaintes || [];
        let myPlaintes = plaintes.filter(p => p.author === currentUserProfile.name);
        
        if (filterTerm) myPlaintes = myPlaintes.filter(p => (p.contre || '').toLowerCase().includes(filterTerm.toLowerCase()) || (p.id || '').toLowerCase().includes(filterTerm.toLowerCase()));
        
        c.innerHTML = generateTableRows(myPlaintes, ['id', 'date', 'contre', 'raison'], false, 'plaintes');
        setupRowMenus(c);
    }
    const searchMesPlaintes = document.getElementById('search-mes-plaintes');
    if (searchMesPlaintes) searchMesPlaintes.addEventListener('input', (e) => renderMesPlaintes(e.target.value));

    if (document.getElementById('btn-submit-plainte')) {
        // Supprime l'ancien event listener et remplace avec la logique d'édition
        const btnSubmitPlainte = document.getElementById('btn-submit-plainte');
        const newBtnSubmitPlainte = btnSubmitPlainte.cloneNode(true);
        btnSubmitPlainte.parentNode.replaceChild(newBtnSubmitPlainte, btnSubmitPlainte);

        newBtnSubmitPlainte.addEventListener('click', () => {
            const date = document.getElementById('plainte-date').value;
            const raison = document.getElementById('plainte-raison').value;
            const contre = document.getElementById('plainte-contre').value;
            const text = document.getElementById('plainte-text').value;

            if (!date || !raison || !text || !contre) {
                alert("Les champs avec * sont obligatoires.");
                return;
            }

            if (!MDT_Database.data.plaintes) MDT_Database.data.plaintes = [];

            const pData = {
                date: date, 
                contre: contre,
                raison: raison, 
                text: text, 
                officiers: document.getElementById('plainte-officiers').value || "Non précisé",
                avocat: document.getElementById('plainte-avocat').value || "", 
                images: [...plainteImagesList]
            };

            if (editingPlainteId) {
                const idx = MDT_Database.data.plaintes.findIndex(x => x.id === editingPlainteId);
                if (idx !== -1) {
                    MDT_Database.data.plaintes[idx] = { 
                        ...MDT_Database.data.plaintes[idx], 
                        ...pData, 
                        id: editingPlainteId
                    };
                }
            } else {
                const fullPData = {
                    ...pData,
                    id: '#PL-' + Math.floor(Math.random() * 9000), 
                    author: currentUserProfile.name
                };
                MDT_Database.data.plaintes.unshift(fullPData);
                
                // Lie également au citoyen si ouvert depuis la fiche
                if (currentCitizenData && !document.getElementById('view-mes-plaintes').classList.contains('active')) {
                    if (!currentCitizenData.plaintes) currentCitizenData.plaintes = [];
                    currentCitizenData.plaintes.unshift(fullPData); 
                }
            }
            
            MDT_Database.sync(); 
            if (currentCitizenData) { 
                const pt = document.querySelector('.tab-link[data-tab="plaintes"]'); 
                if (pt) pt.click(); 
            } 
            closeModals();
        });
    }

    // --- SAUVEGARDE INCIDENTS ---
    function renderMesIncidents(filterTerm = '') {
        const c = document.getElementById('mes-incidents-list'); if (!c) return;
        const incidents = MDT_Database.data.incidents || [];
        let myIncidents = incidents.filter(i => i.author === currentUserProfile.name);
        
        if (filterTerm) myIncidents = myIncidents.filter(i => (i.titre || '').toLowerCase().includes(filterTerm.toLowerCase()) || (i.id || '').toLowerCase().includes(filterTerm.toLowerCase()));
        
        c.innerHTML = generateTableRows(myIncidents, ['id', 'date', 'titre'], false, 'incidents');
        setupRowMenus(c);
    }
    const searchMesIncidents = document.getElementById('search-mes-incidents');
    if (searchMesIncidents) searchMesIncidents.addEventListener('input', (e) => renderMesIncidents(e.target.value));

    if (document.getElementById('btn-submit-incident')) {
        document.getElementById('btn-submit-incident').addEventListener('click', () => {
            if (!MDT_Database.data.incidents) MDT_Database.data.incidents = [];

            const iData = {
                date: document.getElementById('incident-date').value, 
                titre: document.getElementById('incident-titre').value,
                officiers: document.getElementById('incident-officiers').value, 
                text: document.getElementById('incident-text').value, 
            };

            if (editingIncidentId) {
                const idx = MDT_Database.data.incidents.findIndex(x => x.id === editingIncidentId);
                if (idx !== -1) {
                    MDT_Database.data.incidents[idx] = { 
                        ...MDT_Database.data.incidents[idx], 
                        ...iData, 
                        id: editingIncidentId
                    };
                }
            } else {
                MDT_Database.data.incidents.unshift({
                    ...iData,
                    id: '#INC-' + Math.floor(Math.random() * 9000),
                    author: currentUserProfile.name
                }); 
            }
            MDT_Database.sync(); 
            closeModals();
        });
    }


    // ========================================================================
    // 12. SUPERVISEUR (Vues globales & Statistiques)
    // ========================================================================
    
    // --- LISTE GLOBALE DES PLAINTES ---
    function renderSupPlaintes(filterTerm = '') {
        const container = document.getElementById('sup-plaintes-list'); 
        if (!container) return;
        
        const plaintes = MDT_Database.data.plaintes || [];
        let allPlaintes = [...plaintes];
        
        if (filterTerm) {
            allPlaintes = allPlaintes.filter(p => 
                (p.contre || '').toLowerCase().includes(filterTerm.toLowerCase()) || 
                (p.id || '').toLowerCase().includes(filterTerm.toLowerCase()) ||
                (p.author || '').toLowerCase().includes(filterTerm.toLowerCase())
            );
        }
        
        container.innerHTML = generateTableRows(allPlaintes, ['id', 'date', 'contre', 'raison'], true, 'plaintes'); 
        setupRowMenus(container);
    }

    const searchSupPlaintes = document.getElementById('search-sup-plaintes');
    if (searchSupPlaintes) {
        searchSupPlaintes.addEventListener('input', (e) => renderSupPlaintes(e.target.value));
    }

    // --- LISTE GLOBALE DES INTERROGATOIRES ---
    function renderSupInterrogatoires(filterTerm = '') {
        const container = document.getElementById('sup-interrogatoires-list'); 
        if (!container) return;
        
        let interros = MDT_Database.data.interrogatoires || [];
        
        if (filterTerm) {
            interros = interros.filter(i => 
                (i.citoyen || '').toLowerCase().includes(filterTerm.toLowerCase()) || 
                (i.author || '').toLowerCase().includes(filterTerm.toLowerCase())
            );
        }
        
        container.innerHTML = generateTableRows(interros, ['id', 'date', 'citoyen'], true, 'interrogatoires');
        setupRowMenus(container);
    }

    const searchSupInterrogatoires = document.getElementById('search-sup-interrogatoires');
    if (searchSupInterrogatoires) {
        searchSupInterrogatoires.addEventListener('input', (e) => renderSupInterrogatoires(e.target.value));
    }

    // --- LISTE GLOBALE DES INCIDENTS ---
    function renderSupIncidents(filterTerm = '') {
        const container = document.getElementById('sup-incidents-list'); 
        if (!container) return;
        
        let inc = MDT_Database.data.incidents || [];
        
        if (filterTerm) {
            inc = inc.filter(i => 
                (i.titre || '').toLowerCase().includes(filterTerm.toLowerCase()) || 
                (i.author || '').toLowerCase().includes(filterTerm.toLowerCase())
            );
        }
        
        container.innerHTML = generateTableRows(inc, ['id', 'date', 'titre'], true, 'incidents');
        setupRowMenus(container);
    }

    const searchSupIncidents = document.getElementById('search-sup-incidents');
    if (searchSupIncidents) {
        searchSupIncidents.addEventListener('input', (e) => renderSupIncidents(e.target.value));
    }

    // --- LISTE GLOBALE DES ARRESTATIONS ---
    function renderSupArrestations(filterTerm = '') {
        const container = document.getElementById('sup-arrestations-list'); 
        if (!container) return;
        
        const opReports = MDT_Database.data.opReports || [];
        let arr = opReports.filter(r => r.id.startsWith('#ARR'));
        
        if (filterTerm) {
            arr = arr.filter(r => 
                (r.officiers || '').toLowerCase().includes(filterTerm.toLowerCase()) || 
                (r.id || '').toLowerCase().includes(filterTerm.toLowerCase())
            );
        }
        
        // Pour les opReports, l'auteur s'appelle 'redacteur'
        container.innerHTML = generateTableRows(arr, ['id', 'date', 'lieu'], true, 'opReports'); 
        setupRowMenus(container);
    }

    const searchSupArrestations = document.getElementById('search-sup-arrestations');
    if (searchSupArrestations) searchSupArrestations.addEventListener('input', (e) => renderSupArrestations(e.target.value));


    // --- Statistiques des Agents ---
    function renderAgentStatsList(filterTerm = '') {
        const container = document.getElementById('stats-agents-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        const effectifs = MDT_Database.data.effectifs || [];
        const filtered = effectifs.filter(a => {
            const name = `${a.firstname} ${a.lastname}`.toLowerCase();
            return name.includes(filterTerm.toLowerCase());
        });

        filtered.forEach((agent, index) => {
            container.innerHTML += `
                <div class="citoyen-list-item" data-index="${index}">
                    <div class="citoyen-list-info">
                        <h4 style="color:white;">${agent.firstname} ${agent.lastname}</h4>
                        <span>${agent.grade}</span>
                    </div>
                </div>
            `;
        });

        container.querySelectorAll('.citoyen-list-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('#stats-agents-list .citoyen-list-item').forEach(i => {
                    i.classList.remove('active');
                });
                item.classList.add('active');
                
                const agentIndex = item.getAttribute('data-index');
                renderAgentStatsDetails(filtered[agentIndex]);
            });
        });
    }

    const searchStatsAgent = document.getElementById('search-stats-agent');
    if (searchStatsAgent) {
        searchStatsAgent.addEventListener('input', (e) => {
            renderAgentStatsList(e.target.value);
        });
    }

    function renderAgentStatsDetails(agent) {
        document.getElementById('stats-empty-state').classList.add('hidden');
        document.getElementById('stats-details-state').classList.remove('hidden');
        
        const fullName = `${agent.firstname} ${agent.lastname}`;
        const lastName = agent.lastname;
        
        document.getElementById('stat-agent-name').textContent = fullName;
        document.getElementById('stat-agent-grade').textContent = agent.grade;

        const citoyens = MDT_Database.data.citoyens || [];
        const plaintes = MDT_Database.data.plaintes || [];
        const opReports = MDT_Database.data.opReports || [];
        const incidents = MDT_Database.data.incidents || [];
        const armes = MDT_Database.data.armes || [];
        const interrogatoires = MDT_Database.data.interrogatoires || [];
        const vehicules = MDT_Database.data.vehicules || [];
        const bracelets = MDT_Database.data.bracelets || [];

        let stats = {
            mandat: 0, 
            ticket: 0, 
            arrestation: 0, 
            plainte: plaintes.filter(p => (p.author || '').includes(fullName)).length,
            operation: opReports.filter(r => (r.redacteur || '').includes(fullName)).length,
            incident: incidents.filter(i => (i.author || '').includes(fullName)).length,
            arme: armes.filter(a => (a.officier || '').includes(lastName)).length,
            interrogatoire: interrogatoires.filter(i => (i.author || '').includes(fullName)).length,
            sabot: vehicules.filter(v => (v.author || '').includes(fullName)).length,
            bracelet: bracelets.filter(b => (b.officier || '').includes(lastName)).length
        };

        citoyens.forEach(c => {
            if (c.mandats) {
                stats.mandat += c.mandats.filter(m => (m.officiers || '').includes(lastName)).length;
            }
            if (c.tickets) {
                stats.ticket += c.tickets.filter(t => (t.officiers || '').includes(lastName)).length;
            }
            if (c.rapports) {
                stats.arrestation += c.rapports.filter(r => (r.officiers || '').includes(lastName)).length;
            }
        });

        const grid = document.getElementById('stat-agent-grid');
        grid.innerHTML = '';
        
        const buildCard = (label, value) => {
            return `<div class="admin-stat-card">
                        <h3>${label}</h3>
                        <span class="big-num" style="font-size:2rem;">${value}</span>
                    </div>`;
        };
        
        grid.innerHTML += buildCard("Rapports d'opération", stats.operation);
        grid.innerHTML += buildCard("Rapports d'arrestation", stats.arrestation);
        grid.innerHTML += buildCard("Tickets routiers", stats.ticket);
        grid.innerHTML += buildCard("Plaintes encodées", stats.plainte);
        grid.innerHTML += buildCard("Interrogatoires", stats.interrogatoire);
        grid.innerHTML += buildCard("Mandats demandés", stats.mandat);
        grid.innerHTML += buildCard("Rapports d'incident", stats.incident);
        grid.innerHTML += buildCard("Armes saisies", stats.arme);
        grid.innerHTML += buildCard("Bracelets posés", stats.bracelet);
        grid.innerHTML += buildCard("Véhicules infraction", stats.sabot);
    }


    // ========================================================================
    // 13. GESTION DES IMAGES GLOBALES (CTRL+V)
    // ========================================================================
    const uploadBoxes = document.querySelectorAll('.upload-box');
    
    uploadBoxes.forEach(box => {
        box.setAttribute('tabindex', '0'); 
        
        box.addEventListener('click', () => {
            box.focus();
        });

        box.addEventListener('paste', function(e) {
            e.preventDefault();
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    const reader = new FileReader();
                    
                    reader.onload = function(event) {
                        const imgData = event.target.result;
                        const imgHTML = `<img src="${imgData}" style="width:70px; height:70px; object-fit:cover; border-radius:4px; border:2px solid var(--accent-primary);">`;
                        
                        if (box.id === 'op-upload-box') { 
                            currentOpReportImages.push(imgData);
                            document.getElementById('op-photos-container').innerHTML += imgHTML;
                        }
                        else if (box.id === 'arrest-upload-box') { 
                            arrestImagesList.push(imgData);
                            document.getElementById('arrest-photos-container').innerHTML += imgHTML;
                        } 
                        else if (box.id === 'plainte-upload-box') {
                            plainteImagesList.push(imgData);
                            document.getElementById('plainte-photos-container').innerHTML += imgHTML;
                        }
                        else if (box.id === 'create-upload-box') {
                            const preview = document.getElementById('create-photo-preview');
                            if(preview) preview.src = imgData;
                        }
                        else if (box.closest('#modal-citizen-edit')) {
                            const preview = document.getElementById('edit-photo-preview');
                            if(preview) preview.src = imgData;
                        }
                        else if (box.id === 'vehicule-upload-box') {
                            currentVehiculeImage = imgData;
                            document.getElementById('vehicule-photos-container').innerHTML = `<img src="${currentVehiculeImage}" style="height:80px; object-fit:cover; border-radius:4px; border:2px solid var(--accent-primary);">`;
                        }
                        else if (box.id === 'dossier-upload-box' && currentOpenDossierId !== null) {
                            const dossiers = MDT_Database.data.dossiersPreuves || [];
                            const dossier = dossiers.find(d => d.id === currentOpenDossierId);
                            if (dossier) {
                                if (!dossier.images) dossier.images = [];
                                dossier.images.push(imgData);
                                MDT_Database.sync();
                                renderDossierImages();
                            }
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            }
        });
    });


    // ========================================================================
    // 14. FONCTIONS UTILITAIRES (MODALES ET CLICS GLOBAUX)
    // ========================================================================
    
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    }

    window.closeModals = function() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.add('hidden');
        });
        
        document.querySelectorAll('.context-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    }

    function setupExpandableRows(container) {
        container.querySelectorAll('.expandable-row').forEach(row => {
            row.addEventListener('click', () => {
                const targetId = row.getAttribute('data-target');
                const detailsRow = document.getElementById(targetId);
                const icon = row.querySelector('.toggle-icon');
                
                detailsRow.classList.toggle('hidden');
                
                if (detailsRow.classList.contains('hidden')) {
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    icon.style.transform = 'rotate(90deg)';
                }
            });
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModals();
        }
        
        const isClickInsideMenuOption = (
            e.target.closest('.pole-options') || 
            e.target.closest('.op-list-options') || 
            e.target.closest('.profile-edit-container') || 
            e.target.closest('.rapport-options') || 
            e.target.closest('.row-options')
        );

        if (!isClickInsideMenuOption) {
            document.querySelectorAll('.context-menu').forEach(menu => {
                menu.classList.add('hidden');
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModals();
        }
    });

});