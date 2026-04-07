// BioGym v21.0 - Simple & Clean

var engine = {};
var activeUserEmail = null;
var sys = null;

document.addEventListener('DOMContentLoaded', function() {
    var stored = localStorage.getItem('biogym_users');
    if (stored) engine = JSON.parse(stored);
    activeUserEmail = localStorage.getItem('biogym_active');
    
    if (activeUserEmail && engine[activeUserEmail]) {
        loadApp();
    } else {
        showLogin();
    }
});

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
}

function loadApp() {
    activeUserEmail = localStorage.getItem('biogym_active');
    if (!engine[activeUserEmail]) { showLogin(); return; }
    
    sys = engine[activeUserEmail];
    if (!sys.days) sys.days = {};
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    
    updateDashboard();
    startAutoSave();
}

function login() {
    var email = document.getElementById('email').value.toLowerCase().trim();
    var pass = document.getElementById('password').value;
    
    if (email === 'admin' && pass === 'admin123') {
        showAdmin();
        return;
    }
    
    if (!engine[email] || engine[email].password !== pass) {
        alert('Usuario o contraseña incorrectos');
        return;
    }
    
    localStorage.setItem('biogym_active', email);
    engine[email].lastLogin = Date.now();
    saveData();
    loadApp();
}

function register() {
    var email = document.getElementById('email').value.toLowerCase().trim();
    var pass = document.getElementById('password').value;
    
    if (!email || !pass) { alert('Completa todos los campos'); return; }
    if (engine[email]) { alert('Ya existe'); return; }
    
    engine[email] = { password: pass, days: {}, habits: ['Agua','Ejercicio','Lectura'] };
    saveData();
    alert('Cuenta creada!');
    login();
}

function showAdmin() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-screen').style.display = 'flex';
    loadAdminUsers();
}

function loadAdminUsers() {
    var list = document.getElementById('user-list');
    list.innerHTML = '';
    Object.keys(engine).forEach(function(e) {
        list.innerHTML += '<div class="user-row"><span>' + e + '</span><button onclick="deleteUser(\''+e+'\')">X</button></div>';
    });
}

function deleteUser(email) {
    if (confirm('Eliminar ' + email + '?')) {
        delete engine[email];
        saveData();
        loadAdminUsers();
    }
}

function saveData() {
    localStorage.setItem('biogym_users', JSON.stringify(engine));
}

function getToday() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

function startAutoSave() {
    setInterval(function() {
        if (activeUserEmail && sys) {
            saveData();
            document.getElementById('sync-status').innerText = '✓';
        }
    }, 5000);
}

function updateDashboard() {
    var today = getToday();
    var day = sys.days[today] || {};
    
    document.getElementById('user-name').innerText = sys.name || 'Usuario';
    document.getElementById('water-display').innerText = (day.water || 0).toFixed(1);
    document.getElementById('sleep-display').innerText = day.sleep || 0;
    document.getElementById('steps-display').innerText = day.steps || 0;
    document.getElementById('mood-display').innerText = day.mood || '-';
    
    renderHabits();
}

function addWater() {
    var today = getToday();
    if (!sys.days[today]) sys.days[today] = {};
    sys.days[today].water = (sys.days[today].water || 0) + 0.5;
    saveData();
    updateDashboard();
}

function addSleep() {
    var today = getToday();
    if (!sys.days[today]) sys.days[today] = {};
    sys.days[today].sleep = (sys.days[today].sleep || 0) + 1;
    saveData();
    updateDashboard();
}

function addSteps() {
    var today = getToday();
    if (!sys.days[today]) sys.days[today] = {};
    sys.days[today].steps = (sys.days[today].steps || 0) + 100;
    saveData();
    updateDashboard();
}

function setMood(mood) {
    var today = getToday();
    if (!sys.days[today]) sys.days[today] = {};
    sys.days[today].mood = mood;
    saveData();
    updateDashboard();
}

function renderHabits() {
    var grid = document.getElementById('habits-grid');
    grid.innerHTML = '';
    var today = getToday();
    var done = sys.days[today]?.habits || [];
    
    (sys.habits || ['Agua','Ejercicio','Lectura']).forEach(function(h) {
        var btn = document.createElement('button');
        btn.className = 'habit-btn ' + (done.includes(h) ? 'active' : '');
        btn.innerText = h;
        btn.onclick = function() {
            if (!sys.days[today].habits) sys.days[today].habits = [];
            var idx = sys.days[today].habits.indexOf(h);
            if (idx > -1) sys.days[today].habits.splice(idx, 1);
            else sys.days[today].habits.push(h);
            saveData();
            renderHabits();
        };
        grid.appendChild(btn);
    });
}

function logout() {
    localStorage.removeItem('biogym_active');
    location.reload();
}
