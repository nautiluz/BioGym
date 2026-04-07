/**
 * BIOGYM v20.0 - SISTEMA DE AUTENTICACION
 */

// BioGym v20.0 - ACTUALIZADO: </span>
alert('BioGym ACTUALIZADO en GitHub');

// === VARIABLES GLOBALES ===
var db = null;
var engine = {};
var activeUserEmail = null;
var sys = null;
var isRegisterMode = false;

// === INICIO ===
document.addEventListener('DOMContentLoaded', function() {
    // Cargar usuarios desde localStorage
    var stored = localStorage.getItem('biogym_users_v18');
    if (stored) {
        engine = JSON.parse(stored);
    }
    
    // Verificar sesión anterior
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

// === LOGIN - CREAR CUENTA - RECUPERAR ===
function doLogin() {
    var emailInput = document.getElementById('auth-email');
    var passInput = document.getElementById('auth-pass');
    
    var email = (emailInput.value || '').trim().toLowerCase();
    var pass = passInput.value || '';
    
    if (!email || !pass) {
        alert('Completa correo y contraseña');
        return;
    }
    
    // Administrador
    if (email === 'nautiluz' && pass === '$v1vi4nA###') {
        localStorage.setItem('biogym_active_user', 'nautiluz');
        showAdminApp();
        loadAdminUsers();
        return;
    }
    
    if (isRegisterMode) {
        // Crear nueva cuenta
        if (engine[email]) {
            alert('Este correo ya tiene cuenta. Inicia sesión.');
            return;
        }
        
        engine[email] = {
            password: pass,
            created: Date.now(),
            lastLogin: Date.now()
        };
        
        saveEngine();
        
        alert('Cuenta creada! Sesión iniciada.');
        localStorage.setItem('biogym_active_user', email);
        loadUserEcosystem(email);
        return;
    }
    
    // Login normal
    if (!engine[email] || engine[email].password !== pass) {
        alert('Credenciales incorrectas.\n\nSi olvidaste tu contraseña, usa "Crear Cuenta" con el mismo correo.');
        return;
    }
    
    engine[email].lastLogin = Date.now();
    saveEngine();
    
    localStorage.setItem('biogym_active_user', email);
    loadUserEcosystem(email);
}

function loadUserEcosystem(email) {
    activeUserEmail = email;
    showMainApp();
    
    // Inicializar datos del usuario
    if (!engine[email].days) {
        engine[email].days = {};
    }
    if (!engine[email].profile) {
        engine[email].profile = { name: 'Usuario', height: 0, weight: 0 };
    }
    if (!engine[email].habits) {
        engine[email].habits = [
            { id: 'h1', name: 'Agua', icon: 'tint' },
            { id: 'h2', name: 'Ejercicio', icon: 'running' },
            { id: 'h3', name: 'Lectura', icon: 'book' }
        ];
    }
    
    sys = engine[email];
    saveEngine();
    
    renderDashboard();
    startAutoSave();
}

function loadAdminUsers() {
    var list = document.getElementById('admin-user-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    var emails = Object.keys(engine);
    if (emails.length === 0) {
        list.innerHTML = '<tr><td>Sin usuarios</td></tr>';
        return;
    }
    
    emails.forEach(function(e) {
        var u = engine[e];
        var date = u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Nunca';
        list.innerHTML += '<tr><td>' + e + '</td><td>' + date + '</td><td><button onclick="adminReset(\'' + e + '\')">Clave</button> <button onclick="adminDel(\'' + e + '\')">X</button></td></tr>';
    });
}

function adminReset(email) {
    var nueva = prompt('Nueva contraseña para ' + email);
    if (nueva) {
        engine[email].password = nueva;
        saveEngine();
        alert('Contraseña cambiada');
    }
}

function adminDel(email) {
    if (confirm('Eliminar usuario ' + email + '?')) {
        delete engine[engine[email]];
        saveEngine();
        loadAdminUsers();
    }
}

// === BIOMETRICO (SIMULADO) ===
function doBiometric() {
    var emailInput = document.getElementById('auth-email');
    var email = (emailInput.value || '').trim().toLowerCase();
    
    if (!email) {
        alert('Ingresa tu correo primero');
        return;
    }
    
    if (!engine[email]) {
        alert('Usuario no encontrado. Crea una cuenta.');
        return;
    }
    
    // Simular biométrico con PIN 1234
    var pin = prompt('PIN Biométrico (demo: 1234)');
    if (pin === '1234') {
        localStorage.setItem('biogym_active_user', email);
        engine[email].lastLogin = Date.now();
        saveEngine();
        loadUserEcosystem(email);
    } else {
        alert('PIN incorrecto');
    }
}

// === RECUPERAR CUENTA ===
function recoverAccount() {
    var email = prompt('Ingresa tu correo electrónico:');
    
    if (!email || !engine[email]) {
        alert('Correo no encontrado. Crea nueva cuenta.');
        return;
    }
    
    var code = prompt('Ingresa código de recuperación:\n(Busca en tu correo original)');
    
    if (code === 'recovery') {
        var nueva = prompt('Nueva contraseña:');
        engine[email].password = nueva;
        saveEngine();
        alert('Contraseña restaurada!');
    } else {
        alert('Código incorrecto');
    }
}

// === GUARDADO ===
function saveEngine() {
    localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
}

function startAutoSave() {
    setInterval(function() {
        if (activeUserEmail && engine[activeUserEmail]) {
            saveEngine();
            var label = document.getElementById('sync-label');
            if (label) {
                label.innerText = 'Guardado';
                setTimeout(function() { label.innerText = 'Auto'; }, 1500);
            }
        }
    }, 5000);
}

// === DASHBOARD ===
function renderDashboard() {
    document.getElementById('dash-greeting').innerText = 'Hola, ' + (engine[activeUserEmail].profile.name || 'Usuario');
    document.getElementById('water-val').innerText = '0';
    document.getElementById('sleep-val').innerText = '0';
    document.getElementById('step-count').innerText = '0';
    renderHabits();
}

function renderHabits() {
    var grid = document.getElementById('action-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    var habits = engine[activeUserEmail].habits || [];
    
    habits.forEach(function(h) {
        var btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.innerHTML = '<i class="fas fa-' + h.icon + '"></i><span>' + h.name + '</span>';
        btn.onclick = function() {
            btn.classList.toggle('active');
            saveEngine();
        };
        grid.appendChild(btn);
    });
}

// === ACCIONES ===
function changeWater(amount) {
    var fecha = getToday();
    if (!sys.days[fecha]) sys.days[fecha] = {};
    sys.days[fecha].water = (sys.days[fecha].water || 0) + amount;
    document.getElementById('water-val').innerText = sys.days[fecha].water.toFixed(1);
    saveEngine();
}

function changeSleep(amount) {
    var fecha = getToday();
    if (!sys.days[fecha]) sys.days[fecha] = {};
    sys.days[fecha].sleep = (sys.days[fecha].sleep || 0) + amount;
    document.getElementById('sleep-val').innerText = sys.days[fecha].sleep;
    saveEngine();
}

function setMood(mood) {
    var fecha = getToday();
    if (!sys.days[fecha]) sys.days[fecha] = {};
    sys.days[fecha].mood = mood;
    saveEngine();
    alert('Estado: ' + mood);
}

function getToday() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

// === NAVEGACION ===
function showView(id) {
    document.querySelectorAll('.view-content').forEach(function(v) { v.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
}

function logout() {
    saveEngine();
    localStorage.removeItem('biogym_active_user');
    activeUserEmail = null;
    sys = null;
    location.reload();
}

function toggleMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? 'CREAR CUENTA' : 'INICIAR SESIÓN';
    document.getElementById('auth-subtitle').innerText = isRegisterMode ? 'Crea tu cuenta' : 'Ingresa tus datos';
    document.getElementById('btn-login-action').innerText = isRegisterMode ? 'CREAR CUENTA' : 'ENTRAR';
    document.querySelector('.auth-switch').innerText = isRegisterMode ? 'Ya tengo cuenta' : 'Crear Cuenta';
}

// === FUNCIONES DEL PERFIL ===
function openProfilePanel() {
    var profile = engine[activeUserEmail].profile || {};
    document.getElementById('user-name-input').value = profile.name || '';
    document.getElementById('user-height').value = profile.height || '';
    document.getElementById('user-weight').value = profile.weight || '';
    document.getElementById('profile-modal').style.display = 'flex';
}

function updateProfile() {
    var name = document.getElementById('user-name-input').value;
    var height = document.getElementById('user-height').value;
    var weight = document.getElementById('user-weight').value;
    
    engine[activeUserEmail].profile = {
        name: name,
        height: height,
        weight: weight
    };
    
    saveEngine();
    renderDashboard();
    closeModal();
    alert('Perfil actualizado!');
}

function closeModal() {
    var modals = document.querySelectorAll('.modal');
    modals.forEach(function(m) { m.style.display = 'none'; });
}

function changeDay(delta) {
    var fecha = getToday();
    // Por ahora solo muestra hoy
    renderDashboard();
}