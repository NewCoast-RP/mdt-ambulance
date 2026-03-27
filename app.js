const STORAGE_KEY = "ems_mdt_web_v6";

const defaultState = {
    currentUser: null, 
    onDuty: false,
    isDarkMode: false,
    patients: [
        { id: 1, prenom: "Jams", nom: "Rydberg", origine: "Américaine", dateNaissance: "11/02/1981", sang: "O+", telephone: "555-0128", notes: "Allergie à la pénicilline." },
        { id: 2, prenom: "Mlk", nom: "Imkjmlk", origine: "Inconnue", dateNaissance: "01/01/1990", sang: "Inconnu", telephone: "Non renseigné", notes: "Aucun antécédent." }
    ],
    reports: [
        { id: 1, patientId: 2, date: "27/03/2026", type: "Malaise vagal", blessures: "klj", details: "Intervention rapide.", author: "KMA" },
        { id: 2, patientId: 1, date: "27/03/2026", type: "Accident de la route", blessures: "Jambe cassée", details: "Véhicule contre un arbre.", author: "KMA" }
    ]
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;

const views = [
    { id: "home", label: "Accueil", icon: "fa-house" },
    { id: "patients", label: "Fiches Patients", icon: "fa-users" },
    { id: "reports", label: "Rapports", icon: "fa-folder-open" }
];

let currentView = state.currentUser ? "home" : "login";
let viewParams = {}; 
let searchQuery = "";
let reportSearchQuery = "";
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

const appWrapper = document.getElementById("app-wrapper");
const navEl = document.getElementById("nav");
const viewEl = document.getElementById("view");
const clockEl = document.getElementById("clock");
const dutyBtn = document.getElementById("duty-toggle");
const dutyText = document.getElementById("duty-text");
const userNameEl = document.getElementById("logged-user-name");
const logoutBtn = document.getElementById("btn-logout");
const themeToggleBtn = document.getElementById("theme-toggle");

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function esc(text) { return String(text || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])); }
function getPatient(id) { return state.patients.find(p => p.id === parseInt(id)); }
function getPatientName(id) { const p = getPatient(id); return p ? `${p.prenom} ${p.nom}` : "Inconnu"; }

// ==========================================
// SYSTEME DE NOTIFICATIONS & MODALS
// ==========================================
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

window.customConfirm = function(title, message, onConfirm) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-message').innerText = message;
    
    modal.classList.remove('hidden');
    
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');
    
    // Clean old event listeners
    const newConfirm = confirmBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    
    newCancel.addEventListener('click', () => modal.classList.add('hidden'));
    newConfirm.addEventListener('click', () => {
        modal.classList.add('hidden');
        onConfirm();
    });
};

// --- THEME ---
function applyTheme() {
    if (state.isDarkMode) {
        document.body.classList.add("dark-mode");
        if(themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove("dark-mode");
        if(themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}
if(themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        state.isDarkMode = !state.isDarkMode;
        save();
        applyTheme();
    });
}

function changeView(viewId, params = {}) {
    currentView = viewId;
    viewParams = params;
    searchQuery = "";
    reportSearchQuery = "";
    currentPage = 1;
    renderApp();
}

function updateDutyUI() {
    if (state.onDuty) {
        dutyBtn.classList.add("on-duty");
        dutyText.innerText = "En service";
    } else {
        dutyBtn.classList.remove("on-duty");
        dutyText.innerText = "Hors service";
    }
}

dutyBtn.addEventListener("click", () => {
    state.onDuty = !state.onDuty;
    save();
    updateDutyUI();
    showToast(state.onDuty ? "Prise de service effectuée" : "Fin de service", "success");
    if(currentView === 'home') renderView();
});

logoutBtn.addEventListener("click", () => {
    state.currentUser = null;
    state.onDuty = false;
    save();
    changeView("login");
    showToast("Déconnexion réussie", "success");
});

window.deleteReport = function(id) {
    customConfirm('<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i> Suppression du rapport', 
                 "Êtes-vous sûr de vouloir supprimer définitivement ce rapport ? Cette action est irréversible.", 
                 () => {
        state.reports = state.reports.filter(r => r.id !== id);
        save();
        changeView('reports');
        showToast("Rapport supprimé avec succès", "success");
    });
};

window.deletePatient = function(id) {
    customConfirm('<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i> Suppression du patient', 
                 "Attention : Supprimer ce patient supprimera aussi TOUS ses rapports associés de la base de données. Continuer ?", 
                 () => {
        state.patients = state.patients.filter(p => p.id !== id);
        state.reports = state.reports.filter(r => r.patientId !== id);
        save();
        changeView('patients');
        showToast("Patient et rapports liés supprimés", "success");
    });
};

// ==========================================
// VUES (VIEWS)
// ==========================================

function loginView() {
    return `
        <div class="login-container">
            <div class="logo-icon"><i class="fa-solid fa-asterisk"></i></div>
            <h2>Services Médicaux</h2>
            <p>Connexion au MDT</p>
            <form id="login-form" class="form">
                <div>
                    <label>Identifiant</label>
                    <input type="text" name="username" placeholder="Saisir Identifiant" required autocomplete="off"/>
                </div>
                <div>
                    <label>Mot de passe</label>
                    <div class="pwd-wrapper">
                        <input type="password" id="login-pwd" name="password" placeholder="Saisir MDP" required />
                        <i class="fa-solid fa-eye pwd-toggle" id="toggle-pwd" title="Afficher le mot de passe"></i>
                    </div>
                </div>
                <button type="submit" class="btn btn-blue" style="width: 100%; margin-top: 10px;">Se connecter</button>
            </form>
        </div>
    `;
}

function homeView() {
    return `
        <div class="page-header"><h2>Tableau de bord</h2></div>
        <div class="grid three" style="margin-bottom: 24px;">
            <div class="card stat-card"><h3>Patients Enregistrés</h3><h2>${state.patients.length}</h2></div>
            <div class="card stat-card"><h3>Rapports Rédigés</h3><h2>${state.reports.length}</h2></div>
            <div class="card stat-card"><h3>Statut Actuel</h3>
                <h2 style="color: ${state.onDuty ? '#166534' : '#ef4444'};">${state.onDuty ? 'En Service' : 'Hors Service'}</h2>
            </div>
        </div>
        <div class="card">
            <h3>Derniers rapports (Général)</h3>
            <table>
                <thead><tr><th>Date</th><th>Type</th><th>Patient Concerné</th><th>Blessures</th></tr></thead>
                <tbody>
                    ${state.reports.slice(-5).reverse().map(r => `
                        <tr class="clickable-row" onclick="changeView('report_form', {id: ${r.id}})">
                            <td>${esc(r.date)}</td>
                            <td><span class="tag red">${esc(r.type)}</span></td>
                            <td><strong>${esc(getPatientName(r.patientId))}</strong></td>
                            <td><span class="tag orange">${esc(r.blessures)}</span></td>
                        </tr>
                    `).join("") || "<tr><td colspan='4'>Aucun rapport récent.</td></tr>"}
                </tbody>
            </table>
        </div>
    `;
}

function patientsView() {
    const q = searchQuery.toLowerCase();
    const filtered = state.patients.filter(p => {
        const fullName = `${p.prenom} ${p.nom}`.toLowerCase();
        const reversedName = `${p.nom} ${p.prenom}`.toLowerCase();
        return fullName.includes(q) || reversedName.includes(q);
    });
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return `
    <div class="page-header">
        <h2>Fiches Patients</h2>
        <button class="btn btn-blue" onclick="changeView('patient_detail', {mode: 'new'})"><i class="fa-solid fa-plus"></i> Nouveau Patient</button>
    </div>
    <div class="card" style="margin-bottom: 20px;">
        <input type="text" id="patient-search" placeholder="Rechercher un patient (ex: Jams Rydberg)..." value="${esc(searchQuery)}" style="width: 100%; max-width: 500px;">
    </div>
    <div class="card">
        <table>
            <thead><tr><th>ID</th><th>Identité</th><th>Naissance</th><th>Origine</th><th>Téléphone</th></tr></thead>
            <tbody>
                ${paginated.map(p => `
                    <tr class="clickable-row" onclick="changeView('patient_detail', {id: ${p.id}})">
                        <td>#${p.id}</td>
                        <td><strong>${esc(p.prenom)} ${esc(p.nom)}</strong></td>
                        <td>${esc(p.dateNaissance)}</td>
                        <td>${esc(p.origine)}</td>
                        <td>${esc(p.telephone)}</td>
                    </tr>
                `).join("") || "<tr><td colspan='5'>Aucun patient trouvé.</td></tr>"}
            </tbody>
        </table>
        ${renderPagination(filtered.length)}
    </div>`;
}

function patientDetailView() {
    const isNew = viewParams.mode === 'new';
    const p = isNew ? {} : getPatient(viewParams.id);
    const patientReports = isNew ? [] : state.reports.filter(r => r.patientId === p.id).reverse();

    return `
    <div class="page-header">
        <h2>${isNew ? "Création Dossier Patient" : `Dossier: ${esc(p.prenom)} ${esc(p.nom)}`}</h2>
        <button class="btn btn-light" onclick="changeView('patients')"><i class="fa-solid fa-arrow-left"></i> Retour</button>
    </div>

    <div class="grid ${isNew ? '' : 'sidebar-layout'}">
        <div class="card">
            <h3>Informations Médicales</h3>
            <form id="patient-form" class="form">
                <div class="form-row">
                    <div><label>Prénom</label><input name="prenom" value="${esc(p.prenom)}" required /></div>
                    <div><label>Nom</label><input name="nom" value="${esc(p.nom)}" required /></div>
                </div>
                <div class="form-row">
                    <div><label>Date de naissance</label><input type="text" placeholder="JJ/MM/AAAA" name="dateNaissance" value="${esc(p.dateNaissance)}" required /></div>
                    <div><label>Origine</label><input name="origine" value="${esc(p.origine)}" required /></div>
                </div>
                <div class="form-row">
                    <div><label>Groupe Sanguin</label><input name="sang" value="${esc(p.sang)}" placeholder="Ex: O+" /></div>
                    <div><label>Numéro de téléphone</label><input name="telephone" value="${esc(p.telephone)}" placeholder="Ex: 555-0123" /></div>
                </div>
                <div><label>Antécédents / Allergies / Notes</label><textarea name="notes">${esc(p.notes)}</textarea></div>
                
                <div class="btn-group between" style="margin-top: 20px;">
                    ${!isNew ? `<button type="button" class="btn btn-red" onclick="deletePatient(${p.id})"><i class="fa-solid fa-trash"></i> Supprimer</button>` : `<div></div>`}
                    <button type="submit" class="btn btn-blue"><i class="fa-solid fa-save"></i> Enregistrer</button>
                </div>
            </form>
        </div>

        ${!isNew ? `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0;">Historique Médical</h3>
                <button class="btn btn-light" style="padding: 4px 8px;" onclick="changeView('report_form', {patientId: ${p.id}})"><i class="fa-solid fa-plus"></i></button>
            </div>
            <div class="history-widget" style="max-height: 400px; overflow-y: auto;">
                ${patientReports.map(r => `
                    <div class="history-item clickable-row" onclick="changeView('report_form', {id: ${r.id}})">
                        <div style="display:flex; justify-content:space-between;">
                            <span class="tag red">${esc(r.type)}</span>
                            <span style="color:#6b7280;">${esc(r.date)}</span>
                        </div>
                        <p style="margin: 8px 0 0; font-weight:600;">Blessures: ${esc(r.blessures)}</p>
                    </div>
                `).join("") || "<p>Aucun rapport pour ce patient.</p>"}
            </div>
        </div>
        ` : ''}
    </div>`;
}

function reportsView() {
    const rq = reportSearchQuery.toLowerCase();
    const filteredReports = state.reports.filter(r => {
        const patientName = getPatientName(r.patientId).toLowerCase();
        return patientName.includes(rq) || r.type.toLowerCase().includes(rq) || r.blessures.toLowerCase().includes(rq);
    }).reverse();
    const paginated = filteredReports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return `
    <div class="page-header">
        <h2>Tous les Rapports</h2>
        <button class="btn btn-blue" onclick="changeView('report_form')"><i class="fa-solid fa-plus"></i> Rédiger un rapport</button>
    </div>

    <div class="card" style="margin-bottom: 20px;">
        <input type="text" id="report-search" placeholder="Rechercher par patient, type de rapport ou blessure..." value="${esc(reportSearchQuery)}" style="width: 100%; max-width: 500px;">
    </div>
    
    <div class="card">
        <table>
            <thead><tr><th>Date</th><th>Auteur</th><th>Patient</th><th>Type</th></tr></thead>
            <tbody>
                ${paginated.map(r => `
                    <tr class="clickable-row" onclick="changeView('report_form', {id: ${r.id}})">
                        <td>${esc(r.date)}</td>
                        <td>${esc(r.author)}</td>
                        <td><strong>${esc(getPatientName(r.patientId))}</strong></td>
                        <td><span class="tag red">${esc(r.type)}</span></td>
                    </tr>
                `).join("") || "<tr><td colspan='4'>Aucun rapport trouvé.</td></tr>"}
            </tbody>
        </table>
        ${renderPagination(filteredReports.length)}
    </div>`;
}

function reportFormView() {
    const isEdit = !!viewParams.id;
    const r = isEdit ? state.reports.find(rep => rep.id === viewParams.id) : { patientId: viewParams.patientId || "" };
    const selectedPatient = r.patientId ? getPatient(r.patientId) : null;
    const patientNameInitial = selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom}` : "";

    return `
    <div class="page-header">
        <h2>${isEdit ? "Modification du Rapport #" + r.id : "Nouveau Rapport"}</h2>
        <button class="btn btn-light" onclick="changeView('reports')"><i class="fa-solid fa-arrow-left"></i> Retour</button>
    </div>

    <div class="grid sidebar-layout">
        <div class="card">
            <form id="report-form" class="form">
                <div class="form-row">
                    <div>
                        <label>Patient Concerné</label>
                        <div class="autocomplete-wrapper">
                            <input type="text" id="custom-patient-search" value="${esc(patientNameInitial)}" placeholder="Rechercher (ex: Jams)..." autocomplete="off" required ${isEdit ? 'disabled' : ''}>
                            <div id="custom-patient-dropdown" class="autocomplete-items"></div>
                            <input type="hidden" name="patientId" id="hidden-patient-id" value="${r.patientId}" required>
                        </div>
                    </div>
                    <div>
                        <label>Type d'incident (Saisie libre)</label>
                        <input name="type" value="${esc(r.type)}" placeholder="Ex: Accident, Malaise, Blessure..." required />
                    </div>
                </div>
                <div>
                    <label>Blessures constatées</label>
                    <input name="blessures" value="${esc(r.blessures)}" placeholder="Ex: Jambe cassée, Hémorragie..." required />
                </div>
                <div>
                    <label>Détails complets de l'intervention</label>
                    <textarea name="details" required>${esc(r.details)}</textarea>
                </div>
                
                <div class="btn-group between" style="margin-top: 20px;">
                    ${isEdit ? `<button type="button" class="btn btn-red" onclick="deleteReport(${r.id})"><i class="fa-solid fa-trash"></i> Supprimer ce rapport</button>` : `<div></div>`}
                    <button type="submit" class="btn btn-blue"><i class="fa-solid fa-save"></i> ${isEdit ? 'Mettre à jour' : 'Sauvegarder'}</button>
                </div>
            </form>
        </div>

        <div class="card" id="patient-context-panel">
            ${selectedPatient ? generatePatientContext(selectedPatient) : '<p style="color:#6b7280; text-align:center; margin-top:50px;">Sélectionnez ou recherchez un patient pour voir ses antécédents.</p>'}
        </div>
    </div>`;
}

function generatePatientContext(p) {
    const previousReports = state.reports.filter(rep => rep.patientId === p.id).reverse();
    return `
        <h3>Aperçu Patient</h3>
        <div class="history-widget" style="margin-bottom: 20px;">
            <h4>${esc(p.prenom)} ${esc(p.nom)}</h4>
            <p><strong>Né(e) le:</strong> ${esc(p.dateNaissance)}</p>
            <p><strong>Sang:</strong> <span class="tag blue">${esc(p.sang)}</span></p>
            <p><strong>Tél:</strong> ${esc(p.telephone)}</p>
            <p style="margin-top: 10px; color: #ef4444;"><strong>Antécédents:</strong><br>${esc(p.notes)}</p>
        </div>
        <h3>Anciens Rapports (${previousReports.length})</h3>
        <div class="history-widget" style="max-height: 250px; overflow-y:auto;">
            ${previousReports.map(rep => `
                <div class="history-item">
                    <strong>${esc(rep.date)}</strong> - <span class="tag red">${esc(rep.type)}</span><br>
                    <small>${esc(rep.blessures)}</small>
                </div>
            `).join("") || "Aucun rapport."}
        </div>
    `;
}

// ==========================================
// RENDU & ÉVÉNEMENTS
// ==========================================

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    return `
        <div class="pagination">
            <span>Affichage de ${totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} à ${Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} sur ${totalItems}</span>
            <div class="pagination-controls">
                <button class="page-btn" id="btn-prev" ${currentPage === 1 ? 'disabled' : ''}>Précédent</button>
                <button class="page-btn" id="btn-next" ${currentPage === totalPages ? 'disabled' : ''}>Suivant</button>
            </div>
        </div>
    `;
}

function bindPagination(totalItems, reRenderCallback) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    if (btnPrev) btnPrev.addEventListener("click", () => { if (currentPage > 1) { currentPage--; reRenderCallback(); } });
    if (btnNext) btnNext.addEventListener("click", () => { if (currentPage < totalPages) { currentPage++; reRenderCallback(); } });
}

function bindEvents() {
    if (currentView === "login") {
        const loginForm = document.getElementById("login-form");
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const u = new FormData(loginForm).get("username");
            const p = new FormData(loginForm).get("password");
            if (u === "KMA" && p === "KMA") {
                state.currentUser = "KMA";
                save();
                changeView("home");
                showToast("Connexion réussie", "success");
            } else {
                showToast("Identifiants incorrects", "error");
            }
        });

        const togglePwd = document.getElementById("toggle-pwd");
        const pwdInput = document.getElementById("login-pwd");
        if (togglePwd && pwdInput) {
            togglePwd.addEventListener("click", () => {
                if (pwdInput.type === "password") {
                    pwdInput.type = "text";
                    togglePwd.classList.replace("fa-eye", "fa-eye-slash");
                } else {
                    pwdInput.type = "password";
                    togglePwd.classList.replace("fa-eye-slash", "fa-eye");
                }
            });
        }
        return; 
    }

    if (currentView === "patients") {
        const q = searchQuery.toLowerCase();
        bindPagination(state.patients.filter(p => (`${p.prenom} ${p.nom}`).toLowerCase().includes(q) || (`${p.nom} ${p.prenom}`).toLowerCase().includes(q)).length, renderView);
    }
    if (currentView === "reports") {
        const rq = reportSearchQuery.toLowerCase();
        bindPagination(state.reports.filter(r => getPatientName(r.patientId).toLowerCase().includes(rq) || r.type.toLowerCase().includes(rq) || r.blessures.toLowerCase().includes(rq)).length, renderView);
    }

    const searchInput = document.getElementById("patient-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            currentPage = 1;
            renderView();
            const ni = document.getElementById("patient-search");
            if(ni) { ni.focus(); ni.setSelectionRange(ni.value.length, ni.value.length); }
        });
    }

    const reportSearchInput = document.getElementById("report-search");
    if (reportSearchInput) {
        reportSearchInput.addEventListener("input", (e) => {
            reportSearchQuery = e.target.value;
            currentPage = 1;
            renderView();
            const ni = document.getElementById("report-search");
            if(ni) { ni.focus(); ni.setSelectionRange(ni.value.length, ni.value.length); }
        });
    }

    const patientForm = document.getElementById("patient-form");
    if (patientForm) {
        patientForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const fd = new FormData(patientForm);
            if (viewParams.mode === 'new') {
                const newId = state.patients.length > 0 ? Math.max(...state.patients.map(p => p.id)) + 1 : 1;
                state.patients.push({
                    id: newId, prenom: fd.get("prenom"), nom: fd.get("nom"), origine: fd.get("origine"), 
                    dateNaissance: fd.get("dateNaissance"), sang: fd.get("sang"), telephone: fd.get("telephone"), notes: fd.get("notes")
                });
                save();
                changeView('patient_detail', {id: newId});
                showToast("Patient créé avec succès", "success");
            } else {
                const pIndex = state.patients.findIndex(p => p.id === viewParams.id);
                if (pIndex > -1) {
                    state.patients[pIndex] = { ...state.patients[pIndex],
                        prenom: fd.get("prenom"), nom: fd.get("nom"), origine: fd.get("origine"),
                        dateNaissance: fd.get("dateNaissance"), sang: fd.get("sang"), telephone: fd.get("telephone"), notes: fd.get("notes")
                    };
                    save();
                    renderView();
                    showToast("Modifications sauvegardées", "success");
                }
            }
        });
    }

    const reportForm = document.getElementById("report-form");
    if (reportForm) {
        // UI COMPONENT : Auto-complétion maison pour la recherche de patient
        const customSearchInput = document.getElementById("custom-patient-search");
        const customDropdown = document.getElementById("custom-patient-dropdown");
        const hiddenId = document.getElementById("hidden-patient-id");
        const panel = document.getElementById("patient-context-panel");

        if (customSearchInput && !viewParams.id) { // Ne s'applique pas en mode édition (désactivé)
            customSearchInput.addEventListener("input", function(e) {
                const val = this.value.toLowerCase();
                customDropdown.innerHTML = "";
                
                if (!val) {
                    customDropdown.style.display = "none";
                    hiddenId.value = "";
                    panel.innerHTML = '<p style="color:#6b7280; text-align:center; margin-top:50px;">Sélectionnez ou recherchez un patient pour voir ses antécédents.</p>';
                    return;
                }
                
                const matches = state.patients.filter(p => `${p.prenom} ${p.nom}`.toLowerCase().includes(val) || `${p.nom} ${p.prenom}`.toLowerCase().includes(val));
                
                if (matches.length > 0) {
                    matches.forEach(p => {
                        const div = document.createElement("div");
                        div.className = "autocomplete-item";
                        div.innerHTML = `<span><strong>${esc(p.prenom)} ${esc(p.nom)}</strong></span><span style="font-size:11px; color:#6b7280;">Né(e) le ${esc(p.dateNaissance)}</span>`;
                        
                        div.addEventListener("click", () => {
                            customSearchInput.value = `${p.prenom} ${p.nom}`;
                            hiddenId.value = p.id;
                            customDropdown.style.display = "none";
                            panel.innerHTML = generatePatientContext(p);
                        });
                        customDropdown.appendChild(div);
                    });
                    customDropdown.style.display = "block";
                } else {
                    const div = document.createElement("div");
                    div.className = "autocomplete-item";
                    div.innerHTML = `<span style="color:#6b7280; font-style:italic;">Aucun patient trouvé...</span>`;
                    customDropdown.appendChild(div);
                    customDropdown.style.display = "block";
                    hiddenId.value = "";
                }
            });

            // Fermer le menu déroulant si on clique en dehors
            document.addEventListener("click", function (e) {
                if (e.target !== customSearchInput && customDropdown) {
                    customDropdown.style.display = "none";
                }
            });
        }

        reportForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const fd = new FormData(reportForm);
            
            if (!fd.get("patientId")) {
                showToast("Veuillez sélectionner un patient valide de la liste.", "error");
                return;
            }

            if (viewParams.id) {
                const rIndex = state.reports.findIndex(r => r.id === viewParams.id);
                if (rIndex > -1) state.reports[rIndex] = { ...state.reports[rIndex], type: fd.get("type"), blessures: fd.get("blessures"), details: fd.get("details") };
                showToast("Rapport mis à jour", "success");
            } else {
                state.reports.push({
                    id: Date.now(), patientId: parseInt(fd.get("patientId")),
                    type: fd.get("type"), blessures: fd.get("blessures"), details: fd.get("details"),
                    date: new Date().toLocaleDateString("fr-FR"), author: state.currentUser || "Inconnu"
                });
                showToast("Nouveau rapport sauvegardé", "success");
            }
            save();
            changeView('reports');
        });
    }
}

function renderNav() {
    if (currentView === "login") return;
    const activeNavId = (currentView === "patient_detail") ? "patients" : (currentView === "report_form" ? "reports" : currentView);
    navEl.innerHTML = views.map(v => 
        `<button class="nav-btn ${activeNavId === v.id ? "active" : ""}" data-view="${v.id}"><i class="fa-solid ${v.icon}"></i> ${v.label}</button>`
    ).join("");
    navEl.querySelectorAll(".nav-btn").forEach((btn) => btn.addEventListener("click", () => changeView(btn.dataset.view)));
}

function renderView() {
    const map = { login: loginView, home: homeView, patients: patientsView, patient_detail: patientDetailView, reports: reportsView, report_form: reportFormView };
    viewEl.innerHTML = map[currentView]();
    bindEvents();
}

function renderApp() {
    applyTheme();
    if (!state.currentUser || currentView === "login") {
        appWrapper.classList.add("logged-out");
        currentView = "login";
    } else {
        appWrapper.classList.remove("logged-out");
        userNameEl.textContent = state.currentUser;
        renderNav();
        updateDutyUI();
    }
    renderView();
}

setInterval(() => {
    const now = new Date();
    clockEl.textContent = now.toLocaleDateString("fr-FR") + " " + now.toLocaleTimeString("fr-FR");
}, 1000);

renderApp();