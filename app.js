/**
 * BIOGYM v20.0 - CODIGO COMPLETO
 */
window.onerror = function(msg) {
    alert('Error: ' + msg);
    return false;
};

try {

// === VARIABLES ===
var db = null;
var engine = {};
var activeUserEmail = null;
var sys = null;
var isRegisterMode = false;
var activeDate = new Date();

// === INICIO ===
document.addEventListener('DOMContentLoaded', function() {
    var stored = localStorage.getItem('biogym_users_v18');
    if (stored) engine = JSON.parse(stored);
    activeUserEmail = localStorage.getItem('biogym_active_user');
    
    if (activeUserEmail && engine[activeUserEmail]) {
        loadUserEcosystem(activeUserEmail);
    } else {
        showAuthScreen();
    }
});

// === PANTALLAS ===
function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('admin-app').style.display = 'none';
}
function showMainApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    document.getElementById('admin-app').style.display = 'none';
}
function showAdminApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('admin-app').style.display = 'flex';
}

// === AUTENTICACION ===
function doLogin() {
    var email = document.getElementById('auth-email').value.trim().toLowerCase();
    var pass = document.getElementById('auth-pass').value;
    if (!email || !pass) { alert('Completa todos los campos'); return; }
    
    if (email === 'nautiluz' && pass === '$v1vi4nA###') {
        localStorage.setItem('biogym_active_user', 'nautiluz');
        showAdminApp();
        loadAdminUsers();
        return;
    }
    
    if (isRegisterMode) {
        if (engine[email]) { alert('Ya registrado'); return; }
        engine[email] = { password: pass, created: Date.now(), lastLogin: Date.now(), profile: { name: email.split('@')[0] }, days: {}, habits: [{ id:'h1', name:'Agua', icon:'tint'}, { id:'h2', name:'Ejercicio', icon:'running'}, { id:'h3', name:'Lectura', icon:'book' }] };
        saveEngine();
        alert('Cuenta creada!');
        localStorage.setItem('biogym_active_user', email);
        loadUserEcosystem(email);
        return;
    }
    
    if (!engine[email] || engine[email].password !== pass) { alert('Credenciales incorrectas'); return; }
    engine[email].lastLogin = Date.now();
    saveEngine();
    localStorage.setItem('biogym_active_user', email);
    loadUserEcosystem(email);
}

function doBiometric() {
    var email = document.getElementById('auth-email').value.trim().toLowerCase();
    if (!email) { alert('Ingresa tu correo'); return; }
    if (!engine[email]) { alert('Usuario no existe'); return; }
    var pin = prompt('PIN biometrico (demo: 1234)');
    if (pin === '1234') {
        localStorage.setItem('biogym_active_user', email);
        engine[email].lastLogin = Date.now();
        saveEngine();
        loadUserEcosystem(email);
    } else { alert('PIN incorrecto'); }
}

function recoverAccount() {
    var email = prompt('Tu correo:');
    if (!email || !engine[email]) { alert('No encontrado'); return; }
    alert('Contacta soporte para recuperar. Codigo: RECOVER_' + email.substring(0,3).toUpperCase());
}

function toggleMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? 'CREAR CUENTA' : 'INICIAR SESIÓN';
    document.getElementById('auth-subtitle').innerText = isRegisterMode ? 'Crea tu cuenta' : 'Ingresa tus datos';
    document.getElementById('btn-login-action').innerText = isRegisterMode ? 'CREAR' : 'ENTRAR';
    document.querySelector('.auth-switch').innerHTML = isRegisterMode ? 'Ya tengo cuenta' : 'Crear Cuenta';
}

function logout() {
    saveEngine();
    localStorage.removeItem('biogym_active_user');
    location.reload();
}

// === USUARIO ===
function loadUserEcosystem(email) {
    activeUserEmail = email;
    showMainApp();
    if (!engine[email].days) engine[email].days = {};
    if (!engine[email].profile) engine[email].profile = { name: email.split('@')[0] };
    if (!engine[email].habits) engine[email].habits = [{ id:'h1', name:'Agua', icon:'tint'}, { id:'h2', name:'Ejercicio', icon:'running'}];
    sys = engine[email];
    saveEngine();
    renderDashboard();
    startAutoSave();
}

function loadAdminUsers() {
    var list = document.getElementById('admin-user-list');
    list.innerHTML = '';
    var emails = Object.keys(engine);
    emails.forEach(function(e) {
        var date = engine[e].lastLogin ? new Date(engine[e].lastLogin).toLocaleString() : 'Nunca';
        list.innerHTML += '<tr><td>'+e+'</td><td>'+date+'</td><td><button onclick="adminReset(\''+e+'\')">Reset</button> <button onclick="adminDel(\''+e+'\')">X</button></td></tr>';
    });
}

function adminReset(email) {
    var nueva = prompt('Nueva clave para ' + email);
    if (nueva) { engine[email].password = nueva; saveEngine(); alert('OK'); }
}
function adminDel(email) {
    if (confirm('Eliminar ' + email + '?')) { delete engine[email]; saveEngine(); loadAdminUsers(); }
}

// === DATOS ===
function saveEngine() {
    localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
}

function getToday() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

function startAutoSave() {
    setInterval(function() {
        if (activeUserEmail && engine[activeUserEmail]) {
            saveEngine();
            var l = document.getElementById('sync-label');
            if (l) { l.innerText = 'Guardado'; setTimeout(function() { l.innerText = ''; }, 1500); }
        }
    }, 5000);
}

// === DASHBOARD ===
function renderDashboard() {
    var p = engine[activeUserEmail].profile || {};
    document.getElementById('dash-greeting').innerText = 'Hola, ' + (p.name || 'Usuario');
    
    var fecha = getToday();
    var day = engine[activeUserEmail].days[fecha] || {};
    
    document.getElementById('water-val').innerText = (day.water || 0).toFixed(1);
    document.getElementById('sleep-val').innerText = (day.sleep || 0);
    document.getElementById('step-count').innerText = (day.steps || 0);
    
    renderHabits();
}

function renderHabits() {
    var grid = document.getElementById('action-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    var habits = engine[activeUserEmail].habits || [];
    var fecha = getToday();
    var day = engine[activeUserEmail].days[fecha] || {};
    var done = day.habitsDone || [];
    
    habits.forEach(function(h) {
        var btn = document.createElement('button');
        btn.className = 'action-btn' + (done.includes(h.id) ? ' active' : '');
        btn.innerHTML = '<i class="fas fa-' + h.icon + '"></i><span>' + h.name + '</span>';
        btn.onclick = function() {
            if (!engine[activeUserEmail].days[fecha]) engine[activeUserEmail].days[fecha] = {};
            if (!engine[activeUserEmail].days[fecha].habitsDone) engine[activeUserEmail].days[fecha].habitsDone = [];
            var d = engine[activeUserEmail].days[fecha].habitsDone;
            if (d.includes(h.id)) {
                engine[activeUserEmail].days[fecha].habitsDone = d.filter(function(x) { return x !== h.id; });
            } else {
                d.push(h.id);
            }
            saveEngine();
            renderHabits();
        };
        grid.appendChild(btn);
    });
}

// === ACCIONES DIARIAS ===
function updateWater(d) {
    var fecha = getToday();
    if (!sys.days[fecha]) sys.days[fecha] = {};
    sys.days[fecha].water = Math.max(0, (sys.days[fecha].water || 0) + d);
    document.getElementById('water-val').innerText = sys.days[fecha].water.toFixed(1);
    saveEngine();
}

function updateSleep(d) {
    var fecha = getToday();
    if (!sys.days[fecha]) sys.days[fecha] = {};
    sys.days[fecha].sleep = Math.max(0, (sys.days[fecha].sleep || 0) + d);
    document.getElementById('sleep-val').innerText = sys.days[fecha].sleep;
    saveEngine();
}

function logDailyMood(mood) {
    var fecha = getToday();
    if (!sys.days[fecha]) sys.days[fecha] = {};
    sys.days[fecha].mood = mood;
    saveEngine();
    renderDashboard();
}

function saveSleepQuality(val) {
    var fecha = getToday();
    if (!sys.days[fecha]) sys.days[fecha] = {};
    sys.days[fecha].sleepQuality = val;
    saveEngine();
    alert('Calidad de sueno: ' + val + '/10');
}

function changeDay(delta) {
    activeDate.setDate(activeDate.getDate() + delta);
    renderDashboard();
}

function changeMonthlyView(delta) {
    renderDashboard();
}

// === PERFIL ===
function openProfilePanel() {
    var p = engine[activeUserEmail].profile || {};
    document.getElementById('user-name-input').value = p.name || '';
    document.getElementById('user-height').value = p.height || '';
    document.getElementById('user-weight').value = p.weight || '';
    document.getElementById('profile-modal').style.display = 'flex';
}

function updateProfile() {
    var name = document.getElementById('user-name-input').value;
    var height = document.getElementById('user-height').value;
    var weight = document.getElementById('user-weight').value;
    engine[activeUserEmail].profile = { name: name, height: height, weight: weight };
    saveEngine();
    renderDashboard();
    closeModal();
    alert('Perfil actualizado!');
}

function updateProfileManual() { updateProfile(); }
function closeModal() {
    document.querySelectorAll('.modal').forEach(function(m) { m.style.display = 'none'; });
}

// === NAVEGACION ===
function showView(id) {
    document.querySelectorAll('.view-content').forEach(function(v) { v.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    event.target.closest('.nav-item').classList.add('active');
}

// === GUIA ===
function openGuideModal() {
    alert('BioGym v20.0\n\n- Registra tu estado de animo\n- Controla agua y sueno\n- Haz seguimiento de habitos\n- Consulta el calendario');
}

// === CONTACTO ===
function openContactModal() {
    document.getElementById('contact-modal').style.display = 'flex';
}
function submitContactMessage() {
    alert('Mensaje enviado (demo)');
    document.getElementById('contact-msg-profile').value = '';
    closeModal();
}
function submitContactFromModal() {
    alert('Mensaje enviado');
    closeModal();
}

// === GOOGLE CALENDAR ===
function signInGoogle() {
    alert('Google Calendar (demo)\n\nConfigura API Key en Google Cloud Console para conectar.');
    localStorage.setItem('google_connected', 'true');
}
function syncToGoogleCalendar() {
    var fecha = getToday();
    var day = sys.days[fecha] || {};
    alert('Sincronizado:\nFecha: ' + fecha + '\nAgua: ' + (day.water||0) + 'L\nSueno: ' + (day.sleep||0) + 'h');
}
function crossDeviceSync() {
    alert('Sincronizacion entre dispositivos (demo)\n\nConecta Firebase para usar.');
}

// === ADMIN ===
function saveFirebaseConfig() {
    alert('Configuracion Firebase (demo)');
}
function sendBroadcast() {
    var v = document.getElementById('broadcast-version').value;
    var m = document.getElementById('broadcast-msg').value;
    if (v && m) { alert('Anuncio enviado'); }
}

// === HABITOS ===
function openHabitModal() {
    document.getElementById('habit-modal').style.display = 'flex';
}
function saveHabitData() {
    alert('Habito guardado');
    closeModal();
}
function deleteHabit() {
    closeModal();
}
function toggleEditHabits() {
    alert('Modo edicion de habitos');
}

// === PESO ===
function saveWeight() {
    var w = document.getElementById('weight-input').value;
    if (w) {
        engine[activeUserEmail].profile.weight = w;
        saveEngine();
        alert('Peso: ' + w + ' kg');
    }
}

// === EJERCICIOS ===
function openExerciseModal() {
    alert('Ejercicios (demo)\nSelecciona rutina');
}

// === MEDICIONES ===
function showMeasureHistory() {
    alert('Mediciones corporales (demo)');
}

// === FOTOS ===
function uploadProgressPhoto() {
    alert('Subir foto (demo)');
}

// === IA ===
function analyzeCognitiveLog() {
    var fecha = getToday();
    var day = sys.days[fecha] || {};
    var analisis = 'Analisis del dia:\n\n';
    if (day.mood) analisis += '- Estado: ' + day.mood + '\n';
    if (day.water) analisis += '- Agua: ' + day.water + 'L\n';
    if (day.sleep) analisis += '- Sueno: ' + day.sleep + 'h\n';
    alert(analisis);
}

// === BANNER ===
function dismissBanner() {
    document.getElementById('announcement-banner').style.display = 'none';
}

// === WIZARD ===
function saveProfileWizard() {
    var name = document.getElementById('wiz-name').value;
    if (name) {
        engine[activeUserEmail].profile.name = name;
        engine[activeUserEmail].profile.setupComplete = true;
        saveEngine();
        closeModal();
        renderDashboard();
    }
}
function skipProfileWizard() { closeModal(); }

// === SEGURIDAD ===
function confirmSecuritySaved() {
    document.getElementById('security-modal').style.display = 'none';
}

// === PERFIL AVANZADO ===
function revealSecurePhrase() {
    alert('Frase de seguridad (demo): acero bosque-cielo-delta');
}
function changeUserPassword() {
    var nueva = prompt('Nueva contrasena:');
    if (nueva) {
        engine[activeUserEmail].password = nueva;
        saveEngine();
        alert('Contrasena cambiada');
    }
}

} catch(e) {
    console.error('BioGym Error:', e);
    alert('Error: ' + e.message);
}