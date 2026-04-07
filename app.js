/**
 * BIOGYM v20.0 - VERSION ESTABLE Y ROBUSTA
 */

// === VARIABLES GLOBALES ===
var db = null;
var engine = {};
var activeUserEmail = null;
var sys = null;
var isRegisterMode = false;
var activeDate = new Date();

// === INICIO ===
document.addEventListener('DOMContentLoaded', function() {
    try {
        var stored = localStorage.getItem('biogym_users_v18');
        if (stored) engine = JSON.parse(stored);
        
        activeUserEmail = localStorage.getItem('biogym_active_user');
        
        if (activeUserEmail && engine[activeUserEmail]) {
            loadUserEcosystem(activeUserEmail);
        } else {
            showAuthScreen();
        }
        
        applyAutoDarkMode();
    } catch(e) {
        console.error('Error:', e);
    }
});

// === FUNCIONES AUXILIARES ===
function $(id) {
    var el = document.getElementById(id);
    return el;
}

function safeAddClass(el, className) {
    if (el && el.classList) el.classList.add(className);
}

function safeRemoveClass(el, className) {
    if (el && el.classList) el.classList.remove(className);
}

// === PANTALLAS ===
function showAuthScreen() {
    var el = $('auth-screen');
    if (el) el.style.display = 'flex';
    el = $('main-app');
    if (el) el.style.display = 'none';
    el = $('admin-app');
    if (el) el.style.display = 'none';
}

function showMainApp() {
    var el = $('auth-screen');
    if (el) el.style.display = 'none';
    el = $('main-app');
    if (el) el.style.display = 'flex';
    el = $('admin-app');
    if (el) el.style.display = 'none';
}

function showAdminApp() {
    var el = $('auth-screen');
    if (el) el.style.display = 'none';
    el = $('main-app');
    if (el) el.style.display = 'none';
    el = $('admin-app');
    if (el) el.style.display = 'flex';
}

// === AUTENTICACION ===
function doLogin() {
    try {
        var email = ($('auth-email') || {}).value.trim().toLowerCase();
        var pass = ($('auth-pass') || {}).value;
        
        if (!email || !pass) { alert('Completa todos los campos'); return; }
        
        if (email === 'nautiluz' && pass === '$v1vi4nA###') {
            localStorage.setItem('biogym_active_user', 'nautiluz');
            showAdminApp();
            loadAdminUsers();
            return;
        }
        
        if (isRegisterMode) {
            if (engine[email]) { alert('Ya registrado'); return; }
            engine[email] = {
                password: pass,
                created: Date.now(),
                lastLogin: Date.now(),
                profile: { name: email.split('@')[0] },
                days: {},
                habits: [{ id:'h1', name:'Agua', icon:'tint'}, { id:'h2', name:'Ejercicio', icon:'running' }]
            };
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
    } catch(e) { alert('Error: ' + e.message); }
}

function doBiometric() {
    var email = ($('auth-email') || {}).value.trim().toLowerCase();
    if (!email) { alert('Ingresa correo'); return; }
    if (!engine[email]) { alert('Usuario no existe'); return; }
    var pin = prompt('PIN (demo: 1234)');
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
    alert('Contacta soporte. Codigo: RECOVER');
}

function toggleMode() {
    isRegisterMode = !isRegisterMode;
    var el = $('auth-title');
    if (el) el.innerText = isRegisterMode ? 'CREAR CUENTA' : 'INICIAR SESIÓN';
    el = $('btn-login-action');
    if (el) el.innerText = isRegisterMode ? 'CREAR' : 'ENTRAR';
    var sw = document.querySelector('.auth-switch');
    if (sw) sw.innerHTML = isRegisterMode ? 'Ya tengo cuenta' : 'Crear Cuenta';
}

function logout() {
    saveEngine();
    localStorage.removeItem('biogym_active_user');
    location.reload();
}

function appLogout() { logout(); }

// === USUARIO ===
function loadUserEcosystem(email) {
    try {
        activeUserEmail = email;
        showMainApp();
        
        if (!engine[email].days) engine[email].days = {};
        if (!engine[email].profile) engine[email].profile = { name: email.split('@')[0] };
        if (!engine[email].habits) engine[email].habits = [{ id:'h1', name:'Agua', icon:'tint' }, { id:'h2', name:'Ejercicio', icon:'running' }];
        
        sys = engine[email];
        saveEngine();
        renderDashboard();
        renderMonthlyCalendar(new Date().getFullYear(), new Date().getMonth());
        startAutoSave();
    } catch(e) { console.error(e); }
}

function loadAdminUsers() {
    var list = $('admin-user-list');
    if (!list) return;
    
    list.innerHTML = '';
    var emails = Object.keys(engine);
    if (emails.length === 0) { list.innerHTML = '<tr><td>Sin usuarios</td></tr>'; return; }
    
    emails.forEach(function(e) {
        var date = engine[e].lastLogin ? new Date(engine[e].lastLogin).toLocaleString() : 'Nunca';
        list.innerHTML += '<tr><td>' + e + '</td><td>' + date + '</td><td><button onclick="adminReset(\''+e+'\')">Reset</button> <button onclick="adminDel(\''+e+'\')">X</button></td></tr>';
    });
}

function adminReset(email) {
    var nueva = prompt('Nueva clave:');
    if (nueva) { engine[email].password = nueva; saveEngine(); alert('OK'); }
}

function adminDel(email) {
    if (confirm('Eliminar?')) { delete engine[email]; saveEngine(); loadAdminUsers(); }
}

function adminAdd() {
    var email = prompt('Correo:');
    if (!email) return;
    email = email.toLowerCase().trim();
    if (engine[email]) { alert('Ya existe'); return; }
    var pass = prompt('Contrasena:');
    if (!pass) return;
    engine[email] = { password: pass, created: Date.now(), lastLogin: null, profile: { name: email.split('@')[0] }, days: {}, habits: [] };
    saveEngine();
    loadAdminUsers();
    alert('Usuario creado');
}

function adminEdit(email) {
    var nombre = prompt('Nombre:', (engine[email].profile && engine[email].profile.name) || '');
    if (nombre !== null) {
        if (!engine[email].profile) engine[email].profile = {};
        engine[email].profile.name = nombre;
    }
    saveEngine();
    loadAdminUsers();
    alert('Actualizado');
}

// === DATOS ===
function saveEngine() {
    try { localStorage.setItem('biogym_users_v18', JSON.stringify(engine)); } catch(e) {}
}

function getToday() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function startAutoSave() {
    setInterval(function() {
        if (activeUserEmail && engine[activeUserEmail]) {
            saveEngine();
            var l = $('sync-label');
            if (l) { l.innerText = 'Guardado'; setTimeout(function() { if (l) l.innerText = ''; }, 1500); }
        }
    }, 5000);
}

// === DASHBOARD ===
function renderDashboard() {
    var greeting = $('dash-greeting');
    if (!greeting) return;
    
    var p = engine[activeUserEmail].profile || {};
    greeting.innerText = 'Hola, ' + (p.name || 'Usuario');
    
    var fecha = getToday();
    var day = engine[activeUserEmail].days[fecha] || {};
    
    var wv = $('water-val');
    var sv = $('sleep-val');
    var sc = $('step-count');
    
    if (wv) wv.innerText = (day.water || 0).toFixed(1);
    if (sv) sv.innerText = (day.sleep || 0);
    if (sc) sc.innerText = (day.steps || 0);
    
    // Actualizar capsula de estado
    var cw = $('capsule-water');
    var cs = $('capsule-steps');
    var cm = $('capsule-mood');
    if (cw) cw.innerText = (day.water || 0).toFixed(1);
    if (cs) cs.innerText = (day.steps || 0);
    if (cm) cm.innerText = (day.mood || '-').substring(0, 1);
    
    // Renderizar fotos de progreso
    renderProgressPhotos();
    
    renderHabits();
}

// === BOTON FLOTANTE ===
function openQuickAdd() {
    var sel = prompt('Que registrar?\n1 = +0.5L Agua\n2 = +1000 pasos\n3 = +1h Sueno\n4 = Estado Feliz');
    if (sel === '1') { updateWater(0.5); alert('+0.5L agua'); }
    else if (sel === '2') { var f=getToday(); if(!sys.days[f])sys.days[f]={}; sys.days[f].steps=(sys.days[f].steps||0)+1000; saveEngine(); alert('+1000 pasos'); }
    else if (sel === '3') { updateSleep(1); alert('+1h sueno'); }
    else if (sel === '4') { logDailyMood('Feliz'); alert('Estado: Feliz'); }
}

function renderHabits() {
    var grid = $('action-grid');
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
            if (d.includes(h.id)) engine[activeUserEmail].days[fecha].habitsDone = d.filter(function(x) { return x !== h.id; });
            else d.push(h.id);
            saveEngine();
            renderHabits();
        };
        grid.appendChild(btn);
    });
}

// === ACCIONES ===
function updateWater(d) {
    var fecha = getToday();
    if (!sys.days[fecha]) sys.days[fecha] = {};
    sys.days[fecha].water = Math.max(0, (sys.days[fecha].water || 0) + d);
    var wv = $('water-val');
    if (wv) wv.innerText = sys.days[fecha].water.toFixed(1);
    saveEngine();
}

function updateSleep(d) {
    var fecha = getToday();
    if (!sys.days[fecha]) sys.days[fecha] = {};
    sys.days[fecha].sleep = Math.max(0, (sys.days[fecha].sleep || 0) + d);
    var sv = $('sleep-val');
    if (sv) sv.innerText = sys.days[fecha].sleep;
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
    alert('Calidad: ' + val + '/10');
}

function changeDay(delta) {
    activeDate.setDate(activeDate.getDate() + delta);
    renderDashboard();
}

// === PERFIL ===
function openProfilePanel() {
    var p = engine[activeUserEmail].profile || {};
    var el = $('user-name-input');
    if (el) el.value = p.name || '';
    el = $('user-height');
    if (el) el.value = p.height || '';
    el = $('user-weight');
    if (el) el.value = p.weight || '';
    el = $('profile-modal');
    if (el) el.style.display = 'flex';
}

function updateProfile() {
    try {
        var name = ($('user-name-input') || {}).value;
        var height = ($('user-height') || {}).value;
        var weight = ($('user-weight') || {}).value;
        engine[activeUserEmail].profile = { name: name, height: height, weight: weight };
        saveEngine();
        renderDashboard();
        alert('Perfil guardado!');
    } catch(e) { alert('Error: ' + e.message); }
}

function updateProfileManual() { updateProfile(); }

function closeModal(id) {
    if (id) {
        var el = $(id);
        if (el) el.style.display = 'none';
    } else {
        var modals = document.querySelectorAll('.modal');
        modals.forEach(function(m) { if (m) m.style.display = 'none'; });
    }
}

// === NAVEGACION ===
function showView(id) {
    try {
        var views = document.querySelectorAll('.view-content');
        if (views) {
            views.forEach(function(v) { 
                if (v && v.classList) v.classList.remove('active'); 
            });
        }
        var view = $(id);
        if (view && view.classList) view.classList.add('active');
    } catch(e) {
        console.error('showView error:', e);
    }
}

function changeMonthlyView(delta) {
    var hoy = new Date();
    hoy.setMonth(hoy.getMonth() + delta);
    renderMonthlyCalendar(hoy.getFullYear(), hoy.getMonth());
}

// === CALENDARIO MENSUAL CLICKABLE ===
function renderMonthlyCalendar(anio, mes) {
    var titulo = $('monthly-title');
    var grid = $('monthly-calendar-grid');
    if (!titulo || !grid) return;
    
    var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    titulo.innerText = meses[mes] + ' ' + anio;
    
    var primerDia = new Date(anio, mes, 1).getDay();
    var diasMes = new Date(anio, mes + 1, 0).getDate();
    
    var html = '';
    ['D','L','M','X','J','V','S'].forEach(function(d) {
        html += '<div style="font-weight:bold; font-size:0.7rem; text-align:center;">' + d + '</div>';
    });
    
    for (var i = 0; i < primerDia; i++) html += '<div></div>';
    
    var fa = new Date();
    for (var dia = 1; dia <= diasMes; dia++) {
        var fs = anio + '-' + String(mes+1).padStart(2,'0') + '-' + String(dia).padStart(2,'0');
        var eh = (fa.getFullYear()===anio && fa.getMonth()===mes && fa.getDate()===dia);
        var col = '#f5f5f5';
        var moodIcon = '';
        if (sys && sys.days && sys.days[fs]) {
            if (sys.days[fs].mood==='Feliz') { col='#C8E6C9'; moodIcon='😊'; }
            else if (sys.days[fs].mood==='Triste') { col='#FFCDD2'; moodIcon='😢'; }
            else if (sys.days[fs].mood==='Ansioso') { col='#FFE0B2'; moodIcon='😰'; }
            else if (sys.days[fs].mood==='Enojado') { col='#FFCDD2'; moodIcon='😠'; }
            else if (sys.days[fs].mood==='Neutral') { col='#E0E0E0'; moodIcon='😐'; }
            else if (sys.days[fs].water>=2) col='#BBDEFB';
        }
        var est = eh ? 'border:2px solid #4285F4;' : '';
        html += '<div class="cal-day" onclick="showDayDetail(\''+fs+'\')" style="cursor:pointer; '+est+'background:'+col+';">'+(moodIcon?moodIcon:dia)+'</div>';
    }
    grid.innerHTML = html;
    
    // Generar reporte mensual
    renderMonthlyReport(anio, mes);
}

function showDayDetail(fecha) {
    var day = sys.days[fecha] || {};
    var water = (day.water || 0).toFixed(1);
    var sleep = day.sleep || 0;
    var steps = day.steps || 0;
    var mood = day.mood || 'No registrado';
    var notes = day.notes || 'Sin notas';
    var habits = (day.habitsDone || []).length;
    var exercises = (day.exercises || []).map(function(e){return e.name+'('+e.cal+'cal)';}).join(', ') || 'Sin ejercicios';
    
    var detail = '📅 ' + fecha + '\n\n' +
        '❤️ Estado: ' + mood + '\n' +
        '💧 Agua: ' + water + 'L\n' +
        '😴 Sueño: ' + sleep + 'H\n' +
        '👟 Pasos: ' + steps + '\n' +
        '✓ Hábitos: ' + habits + '\n' +
        '🏋️ Ejercicios: ' + exercises + '\n\n' +
        '📝 Notas: ' + notes;
    
    alert(detail);
}

function renderMonthlyReport(anio, mes) {
    var report = $('monthly-ai-report');
    if (!report) return;
    
    var totalDays = 0;
    var totalWater = 0;
    var totalSleep = 0;
    var totalSteps = 0;
    var moods = { Feliz:0, Triste:0, Ansioso:0, Enojado:0, Neutral:0 };
    
    for (var d = 1; d <= 31; d++) {
        var fs = anio + '-' + String(mes+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        if (sys.days && sys.days[fs]) {
            totalDays++;
            totalWater += sys.days[fs].water || 0;
            totalSleep += sys.days[fs].sleep || 0;
            totalSteps += sys.days[fs].steps || 0;
            if (sys.days[fs].mood && moods[sys.days[fs].mood] !== undefined) {
                moods[sys.days[fs].mood]++;
            }
        }
    }
    
    var avgWater = totalDays ? (totalWater / totalDays).toFixed(1) : 0;
    var avgSleep = totalDays ? (totalSleep / totalDays).toFixed(1) : 0;
    var dominantMood = Object.keys(moods).reduce(function(a, b){ return moods[a] > moods[b] ? a : b; });
    
    var advice = '';
    if (avgWater < 2) advice += '💧 Hidratación baja. Necesitas más agua.\n';
    if (avgSleep < 7) advice += '😴 Sueño insuficiente. Descansa más.\n';
    if (dominantMood === 'Triste' || dominantMood === 'Ansioso') advice += '🧠 Estado emocional: Considera actividades que mejoren tu ánimo.\n';
    if (dominantMood === 'Feliz') advice += '✅ Buen mes! Sigue así.\n';
    
    report.innerHTML = '<strong>📊 RESUMEN ' + anio + '</strong><br><br>' +
        'Días activos: ' + totalDays + '<br>' +
        'Agua prom: ' + avgWater + 'L | Sueño prom: ' + avgSleep + 'H<br>' +
        'Pasos total: ' + totalSteps.toLocaleString() + '<br><br>' +
        '<strong>Estados:</strong> 😊' + moods.Feliz + ' 😐' + moods.Neutral + ' 😰' + moods.Ansioso + ' 😠' + moods.Enojado + ' 😢' + moods.Triste + '<br><br>' +
        '<strong>💡 Análisis:</strong><br>' + (advice || 'Mes estable. Buen trabajo!');
}

// === OTRAS FUNCIONES ===
function openGuideModal() { alert('BioGym v20.0'); }
function openContactModal() { var m = $('contact-modal'); if(m) m.style.display='flex'; }
function submitContactMessage() { alert('Enviado'); var el=$('contact-msg-profile'); if(el)el.value=''; closeModal(); }
function submitContactFromModal() { alert('Enviado'); closeModal(); }
function signInGoogle() { alert('Google Calendar (demo)'); }
function syncToGoogleCalendar() { alert('Sincronizado: ' + getToday()); }
function crossDeviceSync() { alert('Sync demo'); }
function saveFirebaseConfig() { alert('Firebase (demo)'); }
function sendBroadcast() { alert('Anuncio enviado'); }
function openHabitModal(id) {
    var m = $('habit-modal');
    if (m) m.style.display = 'flex';
    if (id) {
        var h = engine[activeUserEmail].habits.find(function(x){ return x.id === id; });
        if (h) {
            $('habit-modal-title').innerText = 'EDITAR HÁBITO';
            $('edit-habit-id').value = id;
            $('habit-name').value = h.name;
            $('habit-icon').value = h.icon;
            $('btn-del-habit').style.display = 'block';
        }
    } else {
        $('habit-modal-title').innerText = 'NUEVO HÁBITO';
        $('edit-habit-id').value = '';
        $('habit-name').value = '';
        $('habit-icon').value = 'star';
        $('btn-del-habit').style.display = 'none';
    }
}

function saveHabitData() {
    var id = $('edit-habit-id').value;
    var name = $('habit-name').value;
    var icon = $('habit-icon').value || 'star';
    if (!name) { alert('Nombre requerido'); return; }
    
    if (id) {
        var h = engine[activeUserEmail].habits.find(function(x){ return x.id === id; });
        if (h) { h.name = name; h.icon = icon; }
    } else {
        engine[activeUserEmail].habits.push({ id: 'h' + Date.now(), name: name, icon: icon });
    }
    saveEngine();
    closeModal();
    renderHabits();
}

function deleteHabit() {
    var id = $('edit-habit-id').value;
    if (id && confirm('Eliminar hábito?')) {
        engine[activeUserEmail].habits = engine[activeUserEmail].habits.filter(function(h){ return h.id !== id; });
        saveEngine();
        closeModal();
        renderHabits();
    }
}

var editHabitsMode = false;

function toggleEditHabits() {
    editHabitsMode = !editHabitsMode;
    var grid = $('action-grid');
    if (!grid) return;
    var btns = grid.querySelectorAll('.action-btn');
    btns.forEach(function(b){ 
        b.style.border = editHabitsMode ? '2px solid red' : ''; 
        b.style.animation = editHabitsMode ? 'tremble 0.3s infinite' : '';
    });
    if (editHabitsMode) alert('Modo edición: haz clic en un hábito para EDITAR o eliminarlo');
}

function renderHabits() {
    var grid = $('action-grid');
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
            if (editHabitsMode) {
                openHabitModal(h.id);
            } else {
                if (!engine[activeUserEmail].days[fecha]) engine[activeUserEmail].days[fecha] = {};
                if (!engine[activeUserEmail].days[fecha].habitsDone) engine[activeUserEmail].days[fecha].habitsDone = [];
                var d = engine[activeUserEmail].days[fecha].habitsDone;
                if (d.includes(h.id)) engine[activeUserEmail].days[fecha].habitsDone = d.filter(function(x) { return x !== h.id; });
                else d.push(h.id);
                saveEngine();
                renderHabits();
            }
        };
        grid.appendChild(btn);
    });
}
function saveWeight() { var w=($('weight-input')||{}).value; if(w){engine[activeUserEmail].profile.weight=w; saveEngine(); alert('Peso: '+w);} }
// === EJERCICIOS REALES ===
var exerciseTypes = [
    { id: 'cardio', name: 'Cardio', icon: 'heart', cal: 200 },
    { id: 'hiit', name: 'HIIT', icon: 'fire', cal: 350 },
    { id: 'fuerza', name: 'Fuerza', icon: 'dumbbell', cal: 250 },
    { id: 'yoga', name: 'Yoga', icon: 'spa', cal: 100 },
    { id: 'correr', name: 'Correr', icon: 'running', cal: 300 },
    { id: 'nadar', name: 'Natación', icon: 'swimmer', cal: 400 }
];

function openExerciseModal() {
    var list = $('exercise-list');
    if (!list) return;
    list.innerHTML = '';
    exerciseTypes.forEach(function(ex) {
        var btn = document.createElement('button');
        btn.className = 'exercise-btn';
        btn.innerHTML = '<i class="fas fa-'+ex.icon+'"></i><span>'+ex.name+'</span><small>'+ex.cal+' cal</small>';
        btn.onclick = function() { logExercise(ex); };
        list.appendChild(btn);
    });
    var m = $('exercise-modal');
    if (m) m.style.display = 'flex';
}

function logExercise(ex) {
    var fecha = getToday();
    if (!sys.days[fecha]) sys.days[fecha] = {};
    if (!sys.days[fecha].exercises) sys.days[fecha].exercises = [];
    sys.days[fecha].exercises.push({ name: ex.name, cal: ex.cal, time: Date.now() });
    saveEngine();
    alert(ex.name + ' registrado! ~' + ex.cal + ' kcal');
    renderDashboard();
    closeModal();
}
function showMeasureHistory() { alert('Mediciones demo'); }
// === FOTOS DE PROGRESO REALES ===
function uploadProgressPhoto() {
    var inp = $('progress-photo-upload');
    if (!inp) return;
    var file = inp.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { alert('Max 2MB'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
        var fecha = getToday();
        if (!sys.progressPhotos) sys.progressPhotos = [];
        sys.progressPhotos.push({ img: e.target.result, date: fecha, note: '' });
        saveEngine();
        renderProgressPhotos();
        alert('Foto guardada!');
    };
    reader.readAsDataURL(file);
}

function renderProgressPhotos() {
    var grid = $('progress-photos');
    if (!grid) return;
    grid.innerHTML = '';
    var photos = (sys.progressPhotos || []).slice(-6).reverse();
    photos.forEach(function(p) {
        var img = document.createElement('img');
        img.src = p.img;
        img.className = 'progress-thumb';
        img.title = p.date;
        img.onclick = function() { alert('Foto: ' + p.date); };
        grid.appendChild(img);
    });
}
function analyzeCognitiveLog() { alert('Analisis demo'); }
function dismissBanner() { var b=$('announcement-banner'); if(b)b.style.display='none'; }
function saveProfileWizard() { var n=($('wiz-name')||{}).value; if(n){engine[activeUserEmail].profile.name=n; saveEngine(); closeModal(); renderDashboard();} }
function skipProfileWizard() { closeModal(); }
function confirmSecuritySaved() { closeModal('security-modal'); }
function revealSecurePhrase() { alert('Frase demo'); }
function changeUserPassword() { var n=prompt('Nueva:'); if(n){engine[activeUserEmail].password=n; saveEngine(); alert('OK');} }

// === EXPORTAR ===
function exportData(fmt) {
    var d = engine[activeUserData || activeUserEmail];
    var nom = (d.profile && d.profile.name) || 'user';
    var fec = new Date().toISOString().split('T')[0];
    if (fmt==='json') {
        var b = new Blob([JSON.stringify(d)],{type:'application/json'});
        var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='biogym_'+nom+'_'+fec+'.json'; a.click();
    } else {
        var csv='Fecha,Agua,Sueno,Pasos\n';
        Object.keys(d.days||{}).forEach(function(f){csv+=f+','+(d.days[f].water||0)+','+(d.days[f].sleep||0)+','+(d.days[f].steps||0)+'\n';});
        var b = new Blob([csv],{type:'text/csv'});
        var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='biogym_'+nom+'_'+fec+'.csv'; a.click();
    }
    alert('Exportado');
}

// === VOZ ===
function startVoice() { alert('Di "agua", "pasos" o "peso"'); }

// === MODO OSCURO ===
function toggleDarkMode() {
    var b = document.body;
    if (b.classList.contains('dark-mode')) { b.classList.remove('dark-mode'); b.classList.add('light-mode'); localStorage.setItem('biogym_theme','light'); }
    else { b.classList.remove('light-mode'); b.classList.add('dark-mode'); localStorage.setItem('biogym_theme','dark'); }
}

function applyAutoDarkMode() {
    try {
        var h = new Date().getHours();
        var t = localStorage.getItem('biogym_theme');
        var b = document.body;
        if (t) { b.classList.remove('light-mode','dark-mode'); b.classList.add(t+'-mode'); }
        else if (h<7 || h>20) { b.classList.remove('light-mode'); b.classList.add('dark-mode'); }
    } catch(e) {}
}

// === BLUETOOTH ===
function connectBluetooth() { alert(navigator.bluetooth ? 'Buscando...' : 'No soportado'); }
