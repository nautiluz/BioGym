/**
 * BIOGYM OS v20.0 | ECOSYSTEM
 */

// --- VARIABLES GLOBALES ---
const WORDS = ["acero", "bosque", "cielo", "delta", "esfuerzo", "fuego", "gigante", "hierro", "impulso", "juego", "kilo", "luna", "mente", "nube", "oro", "plano", "quantum", "roca", "sol", "tiempo", "universo", "valor", "web", "xenon", "yunque", "zen", "alma", "brote", "cima", "diamante", "eco", "faro"];
let db = null;

// --- FIREBASE CONFIG ---
const BIOGYM_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDPx_bYGHTyyXfJvWAPTJYzOWP_roSQK5I",
    authDomain: "biogym-211d5.firebaseapp.com",
    projectId: "biogym-211d5",
    storageBucket: "biogym-211d5.firebasestorage.app",
    messagingSenderId: "237949737712",
    appId: "1:237949737712:web:c4bd1330ae1c60d7c50035"
};

function initFirebase() {
    if (typeof firebase !== 'undefined') {
        try {
            if (!firebase.apps.length) firebase.initializeApp(BIOGYM_FIREBASE_CONFIG);
            db = firebase.firestore();
        } catch(e) { console.log('Firebase offline'); }
    }
}

// --- ESTADO ---
let engine = JSON.parse(localStorage.getItem('biogym_users_v18')) || {};
let activeUserEmail = localStorage.getItem('biogym_active_user') || null;
let sys = null;
let isRegisterMode = false;
let activeDate = new Date();
let phantomMap = null;

// --- AUTO GUARDADO ---
setInterval(function() {
    if (activeUserEmail && engine[activeUserEmail] && sys) {
        engine[activeUserEmail].sys = sys;
        localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
    }
}, 5000);

// --- LOGIN ---
function appLogin() {
    var email = document.getElementById('auth-email').value.trim().toLowerCase();
    var pass = document.getElementById('auth-pass').value;
    
    if (!email || !pass) {
        alert("Completa todos los campos");
        return;
    }
    
    // ADMIN
    if (email === 'nautiluz' && pass === '$v1vi4nA###') {
        loadAdminDashboard();
        return;
    }
    
    // REGISTRO
    if (isRegisterMode) {
        if (engine[email]) {
            alert("Ya registered");
            return;
        }
        engine[email] = {
            password: pass,
            sys: getEmptySysState(),
            security: generateSecurityMatrix()
        };
        localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
        activeUserEmail = email;
        showSecurityModal(email);
        return;
    }
    
    // LOGIN NORMAL
    if (!engine[email] || engine[email].password !== pass) {
        alert("Credenciales incorrectas");
        return;
    }
    engine[email].security.lastLogin = Date.now();
    localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
    loadUserEcosystem(email);
}

function generateSecurityMatrix() {
    var phrase = [];
    for (var i = 0; i < 12; i++) {
        phrase.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
    }
    var tokens = [
        Math.random().toString(36).substr(2, 6).toUpperCase(),
        Math.random().toString(36).substr(2, 6).toUpperCase(),
        Math.random().toString(36).substr(2, 6).toUpperCase()
    ];
    return { mnemonic: phrase.join(" "), tokens: tokens, lastLogin: Date.now() };
}

function showSecurityModal(email) {
    document.getElementById('sec-phrase').innerText = engine[email].security.mnemonic;
    document.getElementById('sec-tokens').innerText = engine[email].security.tokens.join(', ');
    document.getElementById('security-modal').style.display = 'flex';
}

function confirmSecuritySaved() {
    document.getElementById('security-modal').style.display = 'none';
    loadUserEcosystem(activeUserEmail);
}

// --- DASHBOARD ADMIN ---
function loadAdminDashboard() {
    activeUserEmail = 'nautiluz';
    localStorage.setItem('biogym_active_user', 'nautiluz');
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('admin-app').style.display = 'flex';
    
    var tbody = document.getElementById('admin-user-list');
    tbody.innerHTML = '';
    
    var keys = Object.keys(engine);
    if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay usuarios</td></tr>';
    }
    
    keys.forEach(function(email) {
        var u = engine[email];
        var lastAccess = u.security && u.security.lastLogin ? new Date(u.security.lastLogin).toLocaleString() : 'Nunca';
        tbody.innerHTML += '<tr><td>' + email + '</td><td>' + lastAccess + '</td><td><button onclick="adminReset(\'' + email + '\')">Reset</button> <button onclick="adminDel(\'' + email + '\')">X</button></td></tr>';
    });
}

function adminReset(email) {
    var np = prompt('Nueva clave para ' + email);
    if (np) {
        engine[email].password = np;
        localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
        alert('Clave actualizada');
    }
}

function adminDel(email) {
    if (confirm('Eliminar ' + email + '?')) {
        delete engine[email];
        localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
        loadAdminDashboard();
    }
}

// --- USUARIO NORMAL ---
function loadUserEcosystem(email) {
    activeUserEmail = email;
    localStorage.setItem('biogym_active_user', email);
    
    if (!engine[email].sys) engine[email].sys = getEmptySysState();
    sys = engine[email].sys;
    
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('admin-app').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    
    ensureDayExists(getStrDate(activeDate));
    renderDayView();
    startNotificationEngine();
    showView('dash');
}

function getEmptySysState() {
    return {
        profile: { name: 'Invitado', height: 0, weight: 0, setupComplete: false },
        habits: [
            { id: 'h1', name: 'Agua Extra', icon: 'tint' },
            { id: 'h2', name: 'Lectura', icon: 'book' },
            { id: 'h3', name: 'Entrenamiento', icon: 'running' }
        ],
        days: {}
    };
}

function getStrDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function ensureDayExists(dateStr) {
    if (!sys.days[dateStr]) {
        sys.days[dateStr] = { mood: null, water: 0, sleep: 0, notes: '', steps: 0, habitsDone: [], logs: [] };
    }
}

function renderDayView() {
    var dStr = getStrDate(activeDate);
    var day = sys.days[dStr];
    
    document.getElementById('active-day-label').innerText = dStr === getStrDate(new Date()) ? 'HOY' : dStr;
    document.getElementById('water-val').innerText = (day.water || 0).toFixed(1);
    document.getElementById('sleep-val').innerText = day.sleep || 0;
    document.getElementById('step-count').innerText = day.steps || 0;
    renderHabits();
}

function renderHabits() {
    var grid = document.getElementById('action-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    var dStr = getStrDate(activeDate);
    var day = sys.days[dStr];
    
    sys.habits.forEach(function(h) {
        var isDone = day.habitsDone && day.habitsDone.includes(h.id);
        var btn = document.createElement('button');
        btn.className = 'action-btn' + (isDone ? ' active' : '');
        btn.innerHTML = '<i class="fas fa-' + h.icon + '"></i><span>' + h.name.toUpperCase() + '</span>';
        btn.onclick = function() {
            if (isDone) {
                day.habitsDone = day.habitsDone.filter(function(id) { return id !== h.id; });
            } else {
                if (!day.habitsDone) day.habitsDone = [];
                day.habitsDone.push(h.id);
            }
            triggerSync();
            renderHabits();
        };
        grid.appendChild(btn);
    });
}

function triggerSync() {
    if (activeUserEmail && engine[activeUserEmail]) {
        engine[activeUserEmail].sys = sys;
        localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
        document.getElementById('sync-label').innerText = 'Guardado';
        setTimeout(function() {
            document.getElementById('sync-label').innerText = 'Auto-Sync On';
        }, 2000);
    }
}

// --- ACCIONES DIARIAS ---
function updateWater(d) {
    var dStr = getStrDate(activeDate);
    sys.days[dStr].water = Math.max(0, (sys.days[dStr].water || 0) + d);
    renderDayView();
    triggerSync();
}

function updateSleep(d) {
    var dStr = getStrDate(activeDate);
    sys.days[dStr].sleep = Math.max(0, (sys.days[dStr].sleep || 0) + d);
    renderDayView();
    triggerSync();
}

function logDailyMood(mood) {
    var dStr = getStrDate(activeDate);
    sys.days[dStr].mood = mood;
    renderDayView();
    triggerSync();
}

function saveDailyData() {
    var dStr = getStrDate(activeDate);
    sys.days[dStr].notes = document.getElementById('welfare-notes').value;
    triggerSync();
}

// --- NAVEGACION ---
function showView(id) {
    document.querySelectorAll('.view-content').forEach(function(v) { v.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
}

function changeDay(delta) {
    activeDate.setDate(activeDate.getDate() + delta);
    ensureDayExists(getStrDate(activeDate));
    renderDayView();
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(function(m) { m.style.display = 'none'; });
}

// --- NOTIFICATIONS ---
function requestNotificationPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function startNotificationEngine() {
    setInterval(function() {
        var h = new Date().getHours();
        var msg = '';
        
        if (h === 8) msg = 'Buenos días! Hidrátate';
        else if (h === 13) msg = 'Hora de Bewegung';
        
        if (msg && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('BioGym', { body: msg });
        }
    }, 3600000);
}

// --- INICIO ---
document.addEventListener('DOMContentLoaded', function() {
    initFirebase();
    
    if (activeUserEmail === 'nautiluz') {
        loadAdminDashboard();
    } else if (activeUserEmail && engine[activeUserEmail]) {
        loadUserEcosystem(activeUserEmail);
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
    }
});

function appLogout() {
    activeUserEmail = null;
    sys = null;
    localStorage.removeItem('biogym_active_user');
    location.reload();
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? 'CREAR CUENTA' : 'INICIAR SESIÓN';
    document.getElementById('btn-login-action').innerText = isRegisterMode ? 'REGISTRARME' : 'ENTRAR AL SISTEMA';
    document.querySelector('.auth-switch').innerHTML = isRegisterMode ? 'Ya tengo cuenta' : 'Crear Cuenta';
}