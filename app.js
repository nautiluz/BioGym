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
    
    // Aplicar modo oscuro automático
    applyAutoDarkMode();
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

// Alias
function appLogout() { logout(); }

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
    renderMonthlyCalendar(new Date().getFullYear(), new Date().getMonth());
    startAutoSave();
}

function loadAdminUsers() {
    var list = document.getElementById('admin-user-list');
    if (!list) return;
    
    list.innerHTML = '';
    var emails = Object.keys(engine);
    
    if (emails.length === 0) {
        list.innerHTML = '<tr><td colspan="6">No hay usuarios registrados</td></tr>';
    }
    
    emails.forEach(function(e) {
        var u = engine[e];
        var date = u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Nunca';
        var name = (u.profile && u.profile.name) || e.split('@')[0];
        var peso = (u.profile && u.profile.weight) || '--';
        var ultimo = u.lastLogin ? '✅' : '❌';
        
        list.innerHTML += '<tr style="border-bottom:1px solid #ddd;">' +
            '<td style="padding:8px;"><strong>'+name+'</strong><br><small style="color:#666;">'+e+'</small></td>' +
            '<td style="padding:8px;">'+date+'</td>' +
            '<td style="padding:8px;">'+peso+' kg</td>' +
            '<td style="padding:8px;">'+ultimo+'</td>' +
            '<td style="padding:8px;"><button onclick="adminEdit(\''+e+'\')" style="background:#4285F4; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;">✏️ Editar</button></td>' +
            '<td style="padding:8px;"><button onclick="adminDel(\''+e+'\')" style="background:#EA4335; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;">🗑️</button></td>' +
            '</tr>';
    });
}

function adminAdd() {
    var email = prompt('Correo del nuevo usuario:');
    if (!email) return;
    email = email.toLowerCase().trim();
    
    if (engine[email]) {
        alert('Este usuario ya existe');
        return;
    }
    
    var pass = prompt('Contraseña para ' + email + ':');
    if (!pass) return;
    
    engine[email] = {
        password: pass,
        created: Date.now(),
        lastLogin: null,
        profile: { name: email.split('@')[0] },
        days: {},
        habits: [
            { id: 'h1', name: 'Agua', icon: 'tint' },
            { id: 'h2', name: 'Ejercicio', icon: 'running' },
            { id: 'h3', name: 'Lectura', icon: 'book' }
        ]
    };
    
    saveEngine();
    loadAdminUsers();
    alert('✅ Usuario ' + email + ' creado');
}

function adminEdit(email) {
    var u = engine[email];
    if (!u) return;
    
    var nombre = prompt('Nombre:', u.profile && u.profile.name ? u.profile.name : email.split('@')[0]);
    var peso = prompt('Peso (kg):', u.profile && u.profile.weight ? u.profile.weight : '');
    var pass = prompt('Nueva contraseña (dejar vacío para mantener):');
    
    if (nombre !== null) {
        if (!u.profile) u.profile = {};
        u.profile.name = nombre;
    }
    if (peso !== null && peso !== '') {
        if (!u.profile) u.profile = {};
        u.profile.weight = peso;
    }
    if (pass !== null && pass !== '') {
        u.password = pass;
    }
    
    saveEngine();
    loadAdminUsers();
    alert('✅ Usuario actualizado');
}

function adminReset(email) {
    var nueva = prompt('Nueva contraseña para ' + email + ':');
    if (nueva) { 
        engine[email].password = nueva; 
        saveEngine(); 
        loadAdminUsers();
        alert('✅ Contraseña cambiada'); 
    }
}

function adminDel(email) {
    if (confirm('¿Eliminar usuario ' + email + '? Esta acción no se puede deshacer.')) { 
        delete engine[email]; 
        saveEngine(); 
        loadAdminUsers();
        alert('✅ Usuario eliminado');
    }
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
    
    // Actualizar cápsula de estado
    updateStatusCapsule(day);
    
    renderHabits();
}

function updateStatusCapsule(day) {
    var cw = document.getElementById('capsule-water');
    var cs = document.getElementById('capsule-steps');
    var cm = document.getElementById('capsule-mood');
    
    if (cw) cw.innerText = (day.water || 0).toFixed(1);
    if (cs) cs.innerText = (day.steps || 0);
    
    var mood = day.mood || 'Neutral';
    var moodEmoji = { 'Feliz': '😊', 'Neutral': '😐', 'Ansioso': '😰', 'Triste': '😢', 'Enojado': '😠', 'Happy': '😊', 'Sad': '😢' };
    if (cm) cm.innerText = moodEmoji[mood] || '😐';
}

function openQuickAdd() {
    var opciones = '';
    opciones += '💧 +0.5L agua\n';
    opciones += '👟 +1000 pasos\n';
    opciones += '😴 +1h sueño\n';
    opciones += '😊 Registrar estado\n';
    opciones += '⚖️ Pesarme\n';
    var sel = prompt('¿Qué quieres registrar?\n' + opciones);
    if (!sel) return;
    
    if (sel.includes('agua') || sel.includes('0.5')) {
        updateWater(0.5);
    } else if (sel.includes('pasos') || sel.includes('1000')) {
        var fecha = getToday();
        if (!sys.days[fecha]) sys.days[fecha] = {};
        sys.days[fecha].steps = (sys.days[fecha].steps || 0) + 1000;
        saveEngine();
    } else if (sel.includes('sueño') || sel.includes('1h')) {
        updateSleep(1);
    } else if (sel.includes('estado') || sel.includes('😊')) {
        logDailyMood('Feliz');
    } else if (sel.includes('peso') || sel.includes('Pesar')) {
        openProfilePanel();
    }
}

function analizarBitacora() {
    var texto = document.getElementById('bitacora-input').value;
    if (!texto || texto.length < 5) {
        alert('Escribe más para analizar');
        return;
    }
    
    var resultado = document.getElementById('bitacora-result');
    var textoLower = texto.toLowerCase();
    
    // Análisis simple
    var estado = 'Neutral';
    var energia = 'Media';
    
    if (textoLower.includes('feliz') || textoLower.includes('bien') || textoLower.includes('excelente')) {
        estado = 'Feliz';
    } else if (textoLower.includes('triste') || textoLower.includes('mal') || textoLower.includes('malito')) {
        estado = 'Triste';
    } else if (textoLower.includes('cansado') || textoLower.includes('fatigado')) {
        energia = 'Baja';
    } else if (textoLower.includes('energ') || textoLower.includes('bien')) {
        energia = 'Alta';
    }
    
    var html = '<strong>Resultado:</strong><br>';
    html += '😊 Estado: ' + estado + '<br>';
    html += '⚡ Energía: ' + energia + '<br>';
    html += '<br><em>Nota: Este es un análisis básico. ¡Sigue escribiendo!</em>';
    
    resultado.innerHTML = html;
    resultado.style.display = 'block';
}

// Ver bitácora IA
function showBitacora() {
    alert('🤖 Bitácora Cognitiva:\n\nEscribe tus pensamientos y la IA analizará tu estado emocional.\n\nInspiración: "El ejercicio mueve tu cuerpo, la reflexión mueve tu mente."');
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
    var hoy = new Date();
    var mes = hoy.getMonth() + delta;
    hoy.setMonth(mes);
    renderMonthlyCalendar(hoy.getFullYear(), hoy.getMonth());
}

function renderMonthlyCalendar(anio, mes) {
    var titulo = document.getElementById('monthly-title');
    var grid = document.getElementById('monthly-calendar-grid');
    
    if (!titulo || !grid) return;
    
    var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    titulo.innerText = meses[mes] + ' ' + anio;
    
    var primerDia = new Date(anio, mes, 1).getDay();
    var diasMes = new Date(anio, mes + 1, 0).getDate();
    
    var html = '';
    var diaSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    
    // Encabezados
    diaSemana.forEach(function(d) {
        html += '<div style="font-weight:bold; font-size:0.7rem; text-align:center; padding:5px;">' + d + '</div>';
    });
    
    // Días vacíos
    for (var i = 0; i < primerDia; i++) {
        html += '<div></div>';
    }
    
    // Días del mes
    var fechaActual = new Date();
    
    for (var dia = 1; dia <= diasMes; dia++) {
        var fechaStr = anio + '-' + String(mes+1).padStart(2,'0') + '-' + String(dia).padStart(2,'0');
        var esHoy = (fechaActual.getFullYear() === anio && fechaActual.getMonth() === mes && fechaActual.getDate() === dia);
        var tieneDatos = sys && sys.days && sys.days[fechaStr];
        
        var color = '#f5f5f5';
        if (tieneDatos) {
            if (tieneDatos.mood === 'Feliz' || tieneDatos.mood === 'Happy') color = '#C8E6C9';
            else if (tieneDatos.mood === 'Triste' || tieneDatos.mood === 'Sad') color = '#FFCDD2';
            else if (tieneDatos.water && tieneDatos.water >= 2) color = '#BBDEFB';
        }
        
        var estilo = esHoy ? 'border:2px solid #4285F4;' : '';
        
        html += '<div class="cal-day" style="' + estilo + 'background:' + color + ';" onclick="seleccionarDia(\'' + fechaStr + '\')">' + dia + '</div>';
    }
    
    grid.innerHTML = html;
    
    // Reporte IA del mes
    var reporte = document.getElementById('monthly-ai-report');
    if (reporte) {
        var diasRegistrados = 0;
        var aguaTotal = 0;
        var suenoTotal = 0;
        
        if (sys && sys.days) {
            Object.keys(sys.days).forEach(function(f) {
                var d = sys.days[f];
                if (f.startsWith(anio + '-' + String(mes+1).padStart(2,'0'))) {
                    diasRegistrados++;
                    aguaTotal += d.water || 0;
                    suenoTotal += d.sleep || 0;
                }
            });
        }
        
        var htmlReporte = '<div style="padding:10px; background:rgba(66,133,244,0.1); border-radius:8px;">';
        htmlReporte += '<strong>Resumen ' + meses[mes] + ':</strong><br>';
        htmlReporte += 'Días registrados: ' + diasRegistrados + '<br>';
        htmlReporte += 'Agua promedio: ' + (diasRegistrados ? (aguaTotal/diasRegistrados).toFixed(1) : 0) + ' L<br>';
        htmlReporte += 'Sueño promedio: ' + (diasRegistrados ? (suenoTotal/diasRegistrados).toFixed(1) : 0) + ' h';
        htmlReporte += '</div>';
        reporte.innerHTML = htmlReporte;
    }
}

function seleccionarDia(fechaStr) {
    var partes = fechaStr.split('-');
    activeDate = new Date(partes[0], partes[1]-1, partes[2]);
    renderDashboard();
    showView('dash');
}

// === PERFIL ===
function openProfilePanel() {
    var p = engine[activeUserEmail].profile || {};
    
    document.getElementById('user-name-input').value = p.name || '';
    document.getElementById('user-height').value = p.height || '';
    document.getElementById('user-weight').value = p.weight || '';
    document.getElementById('user-sex').value = p.sex || 'none';
    document.getElementById('user-activity').value = p.activity || 'none';
    
    if (p.weight && p.height) {
        var bmi = (p.weight / (p.height * p.height)).toFixed(1);
        document.getElementById('user-bmi').innerText = 'IMC: ' + bmi;
    } else {
        document.getElementById('user-bmi').innerText = '--';
    }
    
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
    
    // Mostrar confirmacion sin cerrar modal
    var m = document.getElementById('user-bmi');
    if (m) {
        var bmi = weight && height ? (weight / (height * height)).toFixed(1) : '--';
        m.innerText = 'IMC: ' + bmi;
    }
    
    alert('✅ Perfil guardado!');
}

function updateProfileManual() { updateProfile(); }

function closeModal(id) {
    // Si se pasa ID, cerrar solo ese modal
    if (id) {
        document.getElementById(id).style.display = 'none';
    } else {
        // Cerrar todos los modales
        document.querySelectorAll('.modal').forEach(function(m) { m.style.display = 'none'; });
    }
}

// Cerrar modal del perfil especifico
function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
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

// === EXPORTAR DATOS ===
function exportData(format) {
    var datos = engine[activeUserEmail];
    var nombre = datos.profile ? datos.profile.name : 'usuario';
    var fecha = new Date().toISOString().split('T')[0];
    
    if (format === 'json') {
        var blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'biogym_' + nombre + '_' + fecha + '.json';
        a.click();
        alert('✅ Datos exportados en JSON');
    } else {
        // CSV
        var csv = 'Fecha,Agua (L),Sueño (h),Pasos,Estado\n';
        Object.keys(datos.days || {}).forEach(function(d) {
            var day = datos.days[d];
            csv += d + ',' + (day.water || 0) + ',' + (day.sleep || 0) + ',' + (day.steps || 0) + ',' + (day.mood || '') + '\n';
        });
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'biogym_' + nombre + '_' + fecha + '.csv';
        a.click();
        alert('✅ Datos exportados en CSV');
    }
}

// === COMANDOS DE VOZ ===
var recognition = null;
function startVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Tu navegador no soporta comandos de voz');
        return;
    }
    
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    
    recognition.onresult = function(event) {
        var transcript = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
            transcript = event.results[i][0].transcript.toLowerCase();
        }
        
        if (transcript.includes('agua') || transcript.includes('beber')) {
            updateWater(0.5);
            alert('💧 +0.5L registrado');
        } else if (transcript.includes('pasos') || transcript.includes('caminar')) {
            var pasos = prompt('Cuántos pasos?');
            if (pasos) {
                var fecha = getToday();
                if (!sys.days[fecha]) sys.days[fecha] = {};
                sys.days[fecha].steps = parseInt(pasos);
                saveEngine();
                document.getElementById('step-count').innerText = pasos;
                alert('🏃 ' + pasos + ' pasos registrados');
            }
        } else if (transcript.includes('peso')) {
            var peso = prompt('Peso actual?');
            if (peso) {
                engine[activeUserEmail].profile.weight = peso;
                saveEngine();
                alert('⚖️ Peso: ' + peso + ' kg');
            }
        } else {
            alert('Comando no reconocido: ' + transcript);
        }
    };
    
    recognition.start();
    alert('🎤 Escuchando... Di "agua", "pasos" o "peso"');
}

// === MODO OSCURO ===
function toggleDarkMode() {
    var body = document.body;
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        localStorage.setItem('biogym_theme', 'light');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('biogym_theme', 'dark');
    }
}

// Aplicar modo oscuro automáticamente según hora
function applyAutoDarkMode() {
    var hora = new Date().getHours();
    var tema = localStorage.getItem('biogym_theme');
    
    if (tema) {
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(tema + '-mode');
    } else if (hora < 7 || hora > 20) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    }
}

// === WEB BLUETOOTH (Demo) ===
function connectBluetooth() {
    if (!navigator.bluetooth) {
        alert('Tu navegador no soporta Bluetooth Web.\nUsa Chrome en computadora o Android.');
        return;
    }
    
    navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
    })
    .then(device => device.connect())
    .then(gattServer => {
        alert('✅ Dispositivo Bluetooth conectado');
    })
    .catch(error => {
        alert('Error: ' + error.message);
    });
}

} catch(e) {
    console.error('BioGym Error:', e);
    alert('Error: ' + e.message);
}