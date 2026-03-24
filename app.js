/**
 * BIOGYM OS v18.0 | ADMIN PANEL & SECURITY MATRIX
 */

window.onerror = function (msg, url, line) {
    console.error("OS CRASH:", msg, "at line", line);
    return false;
};

const WORDS = ["acero", "bosque", "cielo", "delta", "esfuerzo", "fuego", "gigante", "hierro", "impulso", "juego", "kilo", "luna", "mente", "nube", "oro", "plano", "quantum", "roca", "sol", "tiempo", "universo", "valor", "web", "xenon", "yunque", "zen", "alma", "brote", "cima", "diamante", "eco", "faro"];

function generateSecurityMatrix() {
    let phrase = [];
    for (let i = 0; i < 12; i++) phrase.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
    let tokens = [Math.random().toString(36).substr(2, 6).toUpperCase(), Math.random().toString(36).substr(2, 6).toUpperCase(), Math.random().toString(36).substr(2, 6).toUpperCase()];
    return { mnemonic: phrase.join(" "), tokens: tokens, lastLogin: Date.now() };
}

// --- DATA MIGRATION (v15 to v17/v18) ---
function runLegacyMigration() {
    let oldEngineV15 = JSON.parse(localStorage.getItem('phantom_users_v15'));
    let oldEngineAcc = JSON.parse(localStorage.getItem('phantom_accounts'));
    let oldEngineV17 = JSON.parse(localStorage.getItem('biogym_users_v17'));

    let oldEngine = oldEngineV15 || oldEngineAcc || oldEngineV17 || null;

    if (oldEngine) {
        let currentEngine = JSON.parse(localStorage.getItem('biogym_users_v18')) || {};
        let migrated = 0;
        Object.keys(oldEngine).forEach(email => {
            if (!currentEngine[email]) {
                currentEngine[email] = oldEngine[email];
                if (!currentEngine[email].security) currentEngine[email].security = generateSecurityMatrix();
                migrated++;
            }
        });
        localStorage.setItem('biogym_users_v18', JSON.stringify(currentEngine));
        localStorage.removeItem('phantom_users_v15');
        localStorage.removeItem('phantom_accounts');
        localStorage.removeItem('biogym_users_v17');
        if (migrated > 0) console.info(`Migrados ${migrated} usuarios legacy a BioGym v18.`);
    }
}
runLegacyMigration();

// --- STATE MANAGEMENT ---
let engine = JSON.parse(localStorage.getItem('biogym_users_v18')) || {};
let activeUserEmail = localStorage.getItem('biogym_active_user') || null;
let sys = null;

let isRegisterMode = false;
let activeDate = new Date();
let monthlyDate = new Date();
let editMode = false;
let phantomMap = null;
let routeLine = null;
let lastKnownPos = null;
let lastNotifiedHour = null;

const MOTIVATIONS = [
    "El progreso no es lineal, es constante.",
    "La disciplina pesa onzas, el arrepentimiento toneladas.",
    "Mueve tu cuerpo hoy, tu mente te lo agradecerá mañana.",
    "El metabolismo de un atleta se forja un día a la vez.",
    "El dolor que sientes hoy es la fuerza que sentirás mañana.",
    "Reescribe tu mapa neuronal a través del esfuerzo."
];

document.addEventListener('DOMContentLoaded', () => {
    // Check if hard admin wants to auto-login
    if (activeUserEmail === 'admin') { loadAdminDashboard(); return; }

    if (activeUserEmail && engine[activeUserEmail]) {
        loadUserEcosystem(activeUserEmail);
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('admin-app').style.display = 'none';
    }
});

// --- SECURITY & ADMIN ---

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? "CREAR CUENTA" : "INICIAR SESIÓN";
    document.getElementById('auth-subtitle').innerText = isRegisterMode ? "Abre un nuevo perfil local." : "Ingresa para aislar tu biometría.";
    document.getElementById('btn-login-action').innerText = isRegisterMode ? "REGISTRARME" : "ENTRAR AL SISTEMA";
    document.querySelector('.auth-switch').innerHTML = isRegisterMode ? '<i class="fas fa-sign-in-alt"></i> Ya tengo cuenta' : '<i class="fas fa-user-plus"></i> Crear Cuenta';
}

function appLogin() {
    const email = document.getElementById('auth-email').value.trim().toLowerCase();
    const pass = document.getElementById('auth-pass').value;
    if (!email || !pass) { alert("Completa todos los campos."); return; }

    // Master Admin Login
    if (email === 'admin' && pass === 'admin') { loadAdminDashboard(); return; }

    if (isRegisterMode) {
        if (engine[email]) { alert("El correo ya está registrado."); return; }
        engine[email] = { password: pass, sys: getEmptySysState(), security: generateSecurityMatrix() };
        localStorage.setItem('biogym_users_v18', JSON.stringify(engine));

        // Show Security Matrix on Registration
        document.getElementById('sec-phrase').innerText = engine[email].security.mnemonic;
        document.getElementById('sec-tokens').innerHTML = engine[email].security.tokens.map(t => `<li>${t}</li>`).join('');
        document.getElementById('security-modal').style.display = 'flex';
        activeUserEmail = email; // Stage for Ecosystem boot

    } else {
        if (!engine[email] || engine[email].password !== pass) { alert("Credenciales incorrectas."); return; }
        engine[email].security.lastLogin = Date.now(); localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
        loadUserEcosystem(email);
    }
}

function confirmSecuritySaved() {
    document.getElementById('security-modal').style.display = 'none';
    loadUserEcosystem(activeUserEmail);
}

// Biometric Mock/Local WebAuthn wrapper
async function triggerBiometricLogin() {
    if (!window.PublicKeyCredential) {
        alert("Tu navegador no soporta WebAuthn/Biometría de hardware. Mostrando Pin Local.");
        const pin = prompt("Simulador de Biometría (PIN): 1234");
        if (pin === "1234" && engine[document.getElementById('auth-email').value.trim().toLowerCase()]) {
            loadUserEcosystem(document.getElementById('auth-email').value.trim().toLowerCase());
        } else { alert("Fallo de Biometría / Pin o Usuario no existe."); }
        return;
    }

    alert("Iniciando validación Biométrica Local...");
    setTimeout(() => {
        const u = document.getElementById('auth-email').value.trim().toLowerCase();
        if (engine[u]) {
            engine[u].security.lastLogin = Date.now();
            localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
            loadUserEcosystem(u);
        } else {
            alert("Usuario no insertado o no existe en la bóveda local.");
        }
    }, 1500);
}

// Recovery Flow
function openRecoveryFlow() {
    document.getElementById('recovery-modal').style.display = 'flex';
}
function executeRecovery() {
    const e = document.getElementById('rec-email').value.trim().toLowerCase();
    const code = document.getElementById('rec-code').value.trim().toLowerCase();
    if (!engine[e]) { alert("Usuario Inexistente."); return; }

    if (engine[e].security.mnemonic === code || engine[e].security.tokens.map(t => t.toLowerCase()).includes(code)) {
        const newPass = prompt("Autenticidad Comprobada. Ingresa tu NUEVA CONTRASEÑA:");
        if (newPass) {
            engine[e].password = newPass;
            localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
            alert("Contraseña actualizada con éxito en la bóveda.");
            closeModal();
        }
    } else {
        alert("Frase Mnemotécnica o Token Inválido.");
    }
}

// Admin Panel
function loadAdminDashboard() {
    activeUserEmail = 'nautiluz';
    localStorage.setItem('biogym_active_user', 'nautiluz');
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('admin-app').style.display = 'flex';

    const tbody = document.getElementById('admin-user-list');
    tbody.innerHTML = '';

    Object.keys(engine).forEach(email => {
        const u = engine[email];
        const lastAccess = u.security?.lastLogin ? new Date(u.security.lastLogin).toLocaleString() : "Desconocido";
        const hasMnem = u.security?.mnemonic ? '<i class="fas fa-check-circle" style="color:var(--green)"></i>' : '<i class="fas fa-times-circle" style="color:var(--red)"></i>';

        tbody.innerHTML += `
            <tr style="border-bottom:1px solid #ddd;">
                <td style="padding:15px; font-weight:bold;">${email}</td>
                <td style="padding:15px;">${lastAccess}</td>
                <td style="padding:15px; text-align:center;">${hasMnem}</td>
                <td style="padding:15px;">
                    <button class="g-btn-main" style="padding:5px 10px; font-size:0.8rem;" onclick="adminReset('${email}')"><i class="fas fa-key"></i> Reiniciar Clave</button>
                    <button class="g-btn-del" style="padding:5px 10px; font-size:0.8rem;" onclick="adminDel('${email}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}
window.adminReset = function (e) {
    const np = prompt(`Nueva clave para ${e}:`);
    if (np) { engine[e].password = np; localStorage.setItem('biogym_users_v18', JSON.stringify(engine)); alert(`Clave reiniciada.`); }
};
window.adminDel = function (e) {
    if (confirm(`¿ELIMINAR ${e} permanentemente?`)) { delete engine[e]; localStorage.setItem('biogym_users_v18', JSON.stringify(engine)); loadAdminDashboard(); }
};

function appLogout() {
    activeUserEmail = null;
    sys = null;
    localStorage.removeItem('biogym_active_user');
    window.location.reload();
}

function loadUserEcosystem(email) {
    activeUserEmail = email;
    if (!engine[email].sys.profile.activity) engine[email].sys.profile.activity = 'none';
    sys = engine[email].sys;
    localStorage.setItem('biogym_active_user', email);

    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('admin-app').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';

    document.getElementById('dash-motd').innerText = `"${MOTIVATIONS[new Date().getDate() % MOTIVATIONS.length]}"`;

    bootPhantomEcosystem();
    requestNotificationPermission();
}

function getEmptySysState() {
    return {
        profile: { name: 'Invitado', avatar: '', height: 0, weight: 0, bmi: 0, gps: false, sex: 'none', activity: 'none' },
        habits: [
            { id: 'h1', name: 'Agua Extra', icon: 'tint' },
            { id: 'h2', name: 'Lectura', icon: 'book' },
            { id: 'h3', name: 'Entrenamiento', icon: 'running' }
        ],
        days: {}
    };
}

function bootPhantomEcosystem() {
    ensureDayExists(getStrDate(activeDate));
    renderProfile();
    renderDayView();
    renderChart();

    try { initMap(); } catch (e) { console.warn("Leaflet skipped"); }
    try { startGPSListener(); } catch (e) { console.warn("GPS Engine offline"); }

    startNotificationEngine();

    showView('dash');
    console.info(`BIOGYM v18.0: User [${activeUserEmail}] Online.`);
}

function ensureDayExists(dateStr) {
    if (!sys.days[dateStr]) {
        sys.days[dateStr] = {
            mood: null, water: 0, sleep: 0, notes: '',
            nutrition: { b: '', l: '', d: '' }, habitsDone: [], logs: [], route: [], aiResponse: ''
        };
    } else {
        if (!sys.days[dateStr].nutrition) sys.days[dateStr].nutrition = { b: '', l: '', d: '' };
        if (!sys.days[dateStr].habitsDone) sys.days[dateStr].habitsDone = [];
        if (!sys.days[dateStr].logs) sys.days[dateStr].logs = [];
        if (!sys.days[dateStr].route) sys.days[dateStr].route = [];
        if (sys.days[dateStr].water === undefined) sys.days[dateStr].water = 0;
        if (sys.days[dateStr].sleep === undefined) sys.days[dateStr].sleep = 0;
    }
}

function changeDay(delta) {
    activeDate.setDate(activeDate.getDate() + delta);
    ensureDayExists(getStrDate(activeDate));
    renderDayView();
    if (phantomMap) renderMapForActiveDay();
}

function renderDayView() {
    const dStr = getStrDate(activeDate);
    const isToday = dStr === getStrDate(new Date());

    document.getElementById('active-day-label').innerText = isToday ? "HOY" : activeDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });

    const dayData = sys.days[dStr];

    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    if (dayData.mood) {
        const btn = document.getElementById(`mood-${dayData.mood}`);
        if (btn) btn.classList.add('active');
    }

    document.getElementById('water-val').innerText = (dayData.water || 0).toFixed(1);
    document.getElementById('bar-water').style.width = `${Math.min(100, ((dayData.water || 0) / 2.5) * 100)}%`;
    document.getElementById('sleep-val').innerText = (dayData.sleep || 0);
    document.getElementById('bar-sleep').style.width = `${Math.min(100, ((dayData.sleep || 0) / 8) * 100)}%`;

    document.getElementById('nut-breakfast').value = dayData.nutrition.b || '';
    document.getElementById('nut-lunch').value = dayData.nutrition.l || '';
    document.getElementById('nut-dinner').value = dayData.nutrition.d || '';
    document.getElementById('welfare-notes').value = dayData.notes || '';

    const aiBox = document.getElementById('ai-analysis-result');
    if (dayData.aiResponse) {
        aiBox.innerHTML = dayData.aiResponse;
        aiBox.style.display = 'block';
    } else { aiBox.style.display = 'none'; }

    const logEl = document.getElementById('daily-log');
    if (logEl) {
        logEl.innerHTML = (dayData.logs && dayData.logs.length) ?
            dayData.logs.map(l => {
                const geoTag = l.loc ? ` <i class="fas fa-map-marker-alt" style="color:var(--primary); font-size:0.7em;" title="${l.loc[0].toFixed(4)}, ${l.loc[1].toFixed(4)}"></i>` : '';
                return `<div><strong>${l.t}</strong>: ${l.m}${geoTag}</div>`;
            }).join('') :
            '<div style="opacity:0.5; padding-top:10px;">Sin registros cronológicos aún.</div>';
    }

    renderHabits();
    runAICopilot();
}

function logEvent(msg) {
    const dStr = getStrDate(activeDate);
    const t = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const logItem = { t, m: msg };
    if (lastKnownPos) logItem.loc = [...lastKnownPos];

    sys.days[dStr].logs.unshift(logItem);
    if (sys.days[dStr].logs.length > 25) sys.days[dStr].logs.pop();
}

function logDailyMood(mood) {
    sys.days[getStrDate(activeDate)].mood = mood;
    logEvent(`Emoción Registrada: ${mood.toUpperCase()}`);
    renderDayView(); triggerSync();
}

function updateWater(d) {
    const dStr = getStrDate(activeDate);
    sys.days[dStr].water = Math.max(0, (sys.days[dStr].water || 0) + d);
    logEvent(`Agua ajustada a: ${(sys.days[dStr].water).toFixed(1)}L`);
    renderDayView(); triggerSync();
}

function updateSleep(d) {
    const dStr = getStrDate(activeDate);
    sys.days[dStr].sleep = Math.max(0, (sys.days[dStr].sleep || 0) + d);
    logEvent(`Sueño ajustado: ${sys.days[dStr].sleep}H`);
    renderDayView(); triggerSync();
}

function saveDailyData() {
    const dStr = getStrDate(activeDate);
    sys.days[dStr].nutrition.b = document.getElementById('nut-breakfast').value;
    sys.days[dStr].nutrition.l = document.getElementById('nut-lunch').value;
    sys.days[dStr].nutrition.d = document.getElementById('nut-dinner').value;
    sys.days[dStr].notes = document.getElementById('welfare-notes').value;
    triggerSync();
}

// --- V17 ENHANCED AI HEURISTICS & ACTIVITY LOGIC ---
function analyzeCognitiveLog() {
    const dStr = getStrDate(activeDate);
    const day = sys.days[dStr];
    const notes = day.notes.trim().toLowerCase();

    if (!notes) { alert("Registra tus notas en la bitácora primero."); return; }

    let analysis = "<strong style='color:var(--primary); font-size:0.9rem;'><i class='fas fa-brain'></i> DIAGNÓSTICO BIOGYM DEL DÍA:</strong><br><br>";

    // Emotion Location Logic
    const locMissions = day.logs.filter(l => l.loc && l.m.includes('Emoción Registrada'));
    let locStr = "";
    if (locMissions.length > 0) {
        locStr = `(Noté que presentaste ${locMissions.length} estados emocionales en diferentes coordenadas GPS. El cambio físico influye directamente en tu neuroquímica). `;
    }

    // Emotion Logic (Spanish)
    if (day.mood === 'Ansioso') analysis += `Detecto un pico de estrés/ansiedad latente hoy. ${locStr}`;
    else if (day.mood === 'Triste') analysis += `Tu metabolismo cognitivo está bajo (Tristeza). ${locStr}`;
    else if (day.mood === 'Enojado') analysis += `Tus niveles de enojo indican un fuerte caudal de adrenalina acumulada. Necesitas canalizar esta agresividad motora. ${locStr}`;
    else if (day.mood === 'Feliz') analysis += `Tu estado anímico óptimo está presente de manera eufórica. ${locStr}`;
    else analysis += `Tu patrón emocional se muestra estable y basal. ${locStr}`;

    // Habits Logic
    const doneHabits = day.habitsDone.map(id => { const h = sys.habits.find(x => x.id === id); return h ? h.name : ''; }).filter(Boolean);
    if (doneHabits.length === 0) {
        analysis += "<br><br><strong>Hábitos:</strong> No has ejecutado ningún hábito de tu rutina hoy. Sugiero empezar por uno elemental ahora mismo.";
    } else {
        analysis += `<br><br><strong>Estructura:</strong> Has logrado dominar: ${doneHabits.join(', ')}. `;
    }

    // Bio Logic & Activity Level
    if (day.water < 2.0) analysis += `El agua (${(day.water || 0)}L) es insuficiente para que tu cerebro transporte neurotransmisores asertivamente. `;
    if (day.sleep < 7) analysis += `Con solo ${day.sleep}H de sueño tu memoria a corto plazo no se ha consolidado correctamente. `;
    if (sys.profile.bmi > 25) analysis += `(Alerta IMC Sobrepeso): Requieres reajuste termogénico en tu nutrición. `;

    // Sex & Activity-Based Heuristics
    analysis += "<br><br><strong>Guía Física Recomendada:</strong> ";
    const sex = sys.profile.sex || 'none';
    const activity = sys.profile.activity || 'none';

    // Tailor activity advice
    if (activity === 'sedentary') analysis += "(Por tu sedentarismo en oficina): Levántate y haz rotación de hombros y estiramiento de cuádriceps cada 2 horas. ";
    else if (activity === 'active') analysis += "(Por tu trabajo físico continuo): Hoy prioriza movilidad articular dinámica en lugar de cargas pesadas directas. ";
    else if (activity === 'student') analysis += "(Por tu fatiga académica): Usa la regla 20-20-20 visual y corre 15 minutos para oxigenar el cerebro. ";
    else if (activity === 'athlete') analysis += "(Por tu demanda deportiva): Focaliza tu nutrición post-entreno y recuperación del sistema nervioso central (SNC). ";

    // Tailor Sex advice based on mood
    if (sex === 'male') {
        if (day.mood === 'Ansioso' || day.mood === 'Triste' || day.mood === 'Enojado') analysis += "Varón, metaboliza este remanente de cortisol/adrenalina ejecutando levantamiento hipertrófico pesado (Sentadillas o Press) que estimule un boost de testosterona.";
        else analysis += "Excelente margen para sumar rutinas de fuerza máxima sin comprometer tu eje hormonal estable.";
    } else if (sex === 'female') {
        if (day.mood === 'Ansioso' || day.mood === 'Triste' || day.mood === 'Enojado') analysis += "Por tu bio-ritmo femenino, te sugiero rutinas de Yoga activo, Pilates o baja densidad (LISS) para quemar la tensión emocional sin generar picos extra de cortisol.";
        else analysis += "Día impecable para trabajar musculatura pélvica, entrenamiento enfocado en glúteos y resistencia de densidad ósea.";
    }

    sys.days[dStr].aiResponse = analysis;
    logEvent("Análisis BioGym IA Completado.");
    renderDayView(); triggerSync();
}

// --- HABITS ---
function renderHabits() {
    const grid = document.getElementById('action-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const dStr = getStrDate(activeDate);
    sys.habits.forEach(h => {
        const isDone = (sys.days[dStr].habitsDone || []).includes(h.id);
        const btn = document.createElement('button');
        btn.className = `action-btn ${isDone ? 'active' : ''} ${editMode ? 'edit-mode' : ''}`;
        btn.onclick = () => {
            if (editMode) openHabitModal(h.id);
            else {
                if (isDone) sys.days[dStr].habitsDone = sys.days[dStr].habitsDone.filter(id => id !== h.id);
                else {
                    if (!sys.days[dStr].habitsDone) sys.days[dStr].habitsDone = [];
                    sys.days[dStr].habitsDone.push(h.id);
                }
                logEvent(`Hábito: ${h.name.toUpperCase()} -> ${!isDone ? 'COMPLETADO' : 'REVOCADO'}`);
                renderDayView(); triggerSync();
            }
        };
        btn.innerHTML = `<i class="fas fa-${h.icon}"></i><span>${h.name.toUpperCase()}</span>`;
        grid.appendChild(btn);
    });
}
function toggleEditHabits() { editMode = !editMode; renderHabits(); }
function openHabitModal(id = null) {
    document.getElementById('habit-modal').style.display = 'flex';
    if (id) {
        const h = sys.habits.find(x => x.id === id);
        document.getElementById('habit-modal-title').innerText = "EDITAR HÁBITO";
        document.getElementById('edit-habit-id').value = id;
        document.getElementById('habit-name').value = h.name;
        document.getElementById('habit-icon').value = h.icon;
        document.getElementById('btn-del-habit').style.display = 'block';
    } else {
        document.getElementById('habit-modal-title').innerText = "NUEVO HÁBITO";
        document.getElementById('edit-habit-id').value = '';
        document.getElementById('habit-name').value = '';
        document.getElementById('habit-icon').value = 'star';
        document.getElementById('btn-del-habit').style.display = 'none';
    }
}
function saveHabitData() {
    const id = document.getElementById('edit-habit-id').value;
    const name = document.getElementById('habit-name').value;
    const icon = document.getElementById('habit-icon').value || 'star';
    if (!name) return;
    if (id) { const h = sys.habits.find(x => x.id === id); if (h) { h.name = name; h.icon = icon; } }
    else { sys.habits.push({ id: 'h' + Date.now(), name, icon }); }
    closeModal(); editMode = false; renderHabits(); triggerSync();
}
function deleteHabit() {
    const id = document.getElementById('edit-habit-id').value;
    sys.habits = sys.habits.filter(x => x.id !== id);
    closeModal(); editMode = false; renderHabits(); triggerSync();
}

// --- PROFILE & SETTINGS ---
function openProfilePanel() {
    if (!sys.profile.sex) sys.profile.sex = 'none';
    if (!sys.profile.activity) sys.profile.activity = 'none';
    document.getElementById('user-name-input').value = sys.profile.name !== 'Invitado' ? sys.profile.name : '';
    document.getElementById('user-height').value = sys.profile.height || '';
    document.getElementById('user-weight').value = sys.profile.weight || '';
    document.getElementById('user-sex').value = sys.profile.sex;
    document.getElementById('user-activity').value = sys.profile.activity;
    document.getElementById('gps-toggle').checked = sys.profile.gps;
    calcBMI();
    document.getElementById('profile-modal').style.display = 'flex';
}

function updateProfileManual() {
    const n = document.getElementById('user-name-input').value.trim();
    if (n) { sys.profile.name = n; document.getElementById('dash-greeting').innerText = `¡Hola, ${n}!`; }
    sys.profile.sex = document.getElementById('user-sex').value;
    sys.profile.activity = document.getElementById('user-activity').value;
    renderProfile(); triggerSync();
}

function uploadAvatarLocal() {
    const filep = document.getElementById('user-avatar-upload').files[0];
    if (!filep) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        sys.profile.avatar = e.target.result;
        renderProfile();
        triggerSync();
    };
    reader.readAsDataURL(filep);
}

function calcBMI() {
    const h = parseFloat(document.getElementById('user-height').value) || 0;
    const w = parseFloat(document.getElementById('user-weight').value) || 0;
    sys.profile.height = h; sys.profile.weight = w;
    if (h > 0 && w > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        sys.profile.bmi = bmi;
        document.getElementById('user-bmi').innerText = bmi;
        const bStatus = document.getElementById('bmi-status');
        if (bmi < 18.5) { bStatus.innerText = "BAJO PESO"; bStatus.style.color = "gray"; }
        else if (bmi < 25) { bStatus.innerText = "PESO NORMAL"; bStatus.style.color = "var(--green)"; }
        else { bStatus.innerText = "SOBREPESO (Alerta)"; bStatus.style.color = "var(--red)"; }
    }
    triggerSync();
}
function toggleGPS() { sys.profile.gps = document.getElementById('gps-toggle').checked; if (sys.profile.gps) startGPSListener(); triggerSync(); }

function renderProfile() {
    const a = document.getElementById('user-avatar');
    if (a && sys.profile.avatar) a.src = sys.profile.avatar;
    document.getElementById('dash-greeting').innerText = `¡Hola, ${sys.profile.name === 'Invitado' ? activeUserEmail.split('@')[0] : sys.profile.name}!`;
}

// --- V17 MULTI-DIMENSIONAL MONTHLY REPORT ---
function changeMonthlyView(d) {
    monthlyDate.setMonth(monthlyDate.getMonth() + d);
    renderMonthlySummaryGrid();
}

function renderMonthlySummaryGrid() {
    const grid = document.getElementById('monthly-calendar-grid');
    if (!grid) return;
    const y = monthlyDate.getFullYear();
    const m = monthlyDate.getMonth();
    const days = new Date(y, m + 1, 0).getDate();

    document.getElementById('monthly-title').innerText = monthlyDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    grid.innerHTML = "";

    for (let d = 1; d <= days; d++) {
        const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const calDay = document.createElement('div');
        calDay.className = 'cal-day';
        calDay.innerText = d;

        let hasData = false;

        if (sys.days[key]) {
            const mood = sys.days[key].mood;
            if (mood === 'Feliz') calDay.style.background = "var(--green)";
            else if (mood === 'Neutral') calDay.style.background = "var(--primary)";
            else if (mood === 'Ansioso') calDay.style.background = "#FF9800";
            else if (mood === 'Triste') calDay.style.background = "#00bcd4";
            else if (mood === 'Enojado') calDay.style.background = "var(--red)";

            if (mood) { calDay.style.color = "white"; calDay.style.boxShadow = "var(--shadow)"; hasData = true; }
            if (sys.days[key].habitsDone && sys.days[key].habitsDone.length > 0 && !mood) { calDay.style.background = "#DDD"; calDay.style.border = "1px solid var(--primary)"; hasData = true; }
        }

        if (key === getStrDate(new Date())) calDay.style.border = "3px solid #000";

        calDay.onclick = () => {
            if (!hasData) return;
            activeDate = new Date(y, m, d);
            ensureDayExists(key);
            showView('dash');
            renderDayView();
            document.getElementById('main-scroll') ? document.getElementById('main-scroll').scrollTo(0, 0) : null;
        };

        grid.appendChild(calDay);
    }

    // Comprehensive Monthly Dynamic AI Analysis
    const repBox = document.getElementById('monthly-ai-report');
    if (!repBox) return;

    const activeDaysCount = Object.keys(sys.days).filter(k => k.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)).length;
    if (activeDaysCount === 0) {
        repBox.innerHTML = "Aún no hay suficiente actividad este mes para generar informe BioGym.";
        return;
    }

    let mText = `<strong style="color:var(--primary); font-size:1rem;"><i class="fas fa-chart-line"></i> INFORME BIOGYM DEL MES:</strong><br><br>`;

    const moods = Object.values(sys.days).filter(d => d.mood && kBelongsToMount(d, y, m)).map(d => d.mood);
    const mCounts = { Feliz: 0, Neutral: 0, Ansioso: 0, Triste: 0, Enojado: 0 };
    Object.keys(sys.days).filter(k => k.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)).forEach(k => {
        if (sys.days[k].mood) mCounts[sys.days[k].mood]++;
    });

    const stressZone = mCounts.Triste + mCounts.Ansioso + mCounts.Enojado;

    mText += `<strong>Telemetría General:</strong> Registraste actividad durante ${activeDaysCount} días este mes. <br>`;
    mText += `[ Feliz: ${mCounts.Feliz} | Neutral: ${mCounts.Neutral} | Ansioso: ${mCounts.Ansioso} | Enojado: ${mCounts.Enojado} | Triste: ${mCounts.Triste} ]<br><br>`;

    mText += `<strong>Análisis y Guía de Progreso:</strong><br>`;
    if (mCounts.Feliz >= stressZone && mCounts.Feliz > 2) {
        mText += `Tu mes se ha mostrado enérgico y tu adaptación al estrés es formidable. Continúa manteniendo tu constancia.<br>`;
        mText += `🟢 <em>Plan Físico:</em> Mantén rutinas de esfuerzo cardiovascular (Trotar 5km) y levante de peso libre.`;
    } else if (stressZone > mCounts.Feliz && stressZone > 2) {
        mText += `🚨 <em>Alerta de Recuperación:</em> Tienes un ciclo dominado por cortisol y estrés activo. Si no implementas períodos de silencio mental, tu cuerpo inflamará tus articulaciones.<br>`;
        mText += `🔴 <em>Plan Físico Urgente:</em> Pausa las rutinas HIIT. Haz caminatas estructuradas durante los atardeceres y aplica estiramiento estático 15 min antes de dormir.`;
    } else {
        mText += `Tu flujo de ánimo no tiene fluctuaciones extremas generalizadas. Ideal para cimentar nuevos hábitos sólidos.<br>`;
        mText += `🟡 <em>Plan Físico:</em> Entrenamiento cruzado (2 días de cardio ligero, 2 de peso corporal estructural).`;
    }

    mText += `<br><br><div style="font-weight:bold;"><i class="fas fa-headphones"></i> TERAPIA ACÚSTICA RECOMENDADA:</div>`;
    if (stressZone > mCounts.Feliz) {
        mText += `<div style="margin-top:10px;"><iframe width="100%" height="150" src="https://www.youtube.com/embed/1ZYbU82GVz4" title="Deep Relaxation" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:12px;"></iframe></div>`;
    } else {
        mText += `<div style="margin-top:10px;"><iframe width="100%" height="150" src="https://www.youtube.com/embed/jfKfPfyJRdk" title="Lofi beats" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:12px;"></iframe></div>`;
    }

    repBox.innerHTML = mText;
}

function kBelongsToMount(d, y, m) { return true; }

// --- CHARTS & MAPS ---
function runAICopilot() {
    const tipEl = document.getElementById('ai-health-tip');
    if (!tipEl) return;
    const day = sys.days[getStrDate(activeDate)];
    let tip = "Ecosistema estable operado por BioGym.";
    if (day.sleep > 0 && day.sleep < 6) tip = `Déficit letal: Has dormido solo ${day.sleep}H. Reposa tu SNC hoy.`;
    else if (day.water < 1.0 && new Date().getHours() > 14) tip = `Hidratación Urgente: Bebe agua, lubrica tus músculos.`;
    else if (sys.profile.bmi > 25 && day.habitsDone.length === 0) tip = "Atención: Tu IMC marca Sobrepeso. Muévete, ejecuta tu plan celular hoy.";
    else if (day.sleep >= 7 && day.water >= 2) tip = "Biometría balanceada y lista para operación pico BioGym.";
    tipEl.innerText = tip;
}

function initMap() {
    if (typeof L === 'undefined' || !document.getElementById('phantom-map') || phantomMap) return;
    phantomMap = L.map('phantom-map').setView([0, 0], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OSM' }).addTo(phantomMap);
}
function renderMapForActiveDay() {
    if (!phantomMap || typeof L === 'undefined') return;
    const key = getStrDate(activeDate);
    const dayRoute = sys.days[key] ? sys.days[key].route : [];
    if (routeLine) phantomMap.removeLayer(routeLine);
    if (dayRoute && dayRoute.length > 0) {
        phantomMap.setView(dayRoute[0], 15);
        if (dayRoute.length > 1) routeLine = L.polyline(dayRoute, { color: 'var(--primary)', weight: 5 }).addTo(phantomMap);
    }
}
function startGPSListener() {
    if (!sys.profile.gps || !navigator.geolocation) return;
    navigator.geolocation.watchPosition(pos => {
        const lat = pos.coords.latitude; const lon = pos.coords.longitude;
        const speed = (pos.coords.speed * 3.6) || 0;
        lastKnownPos = [lat, lon];

        const gm = document.getElementById('gps-mode'); const gs = document.getElementById('gps-speed');
        if (gm) gm.innerText = speed > 8 ? "VEHÍCULO" : (speed > 1 ? "CAMINANDO" : "ESTÁTICO");
        if (gs) gs.innerText = `${speed.toFixed(1)} km/h`;

        const tKey = getStrDate(new Date()); ensureDayExists(tKey);
        sys.days[tKey].route.push([lat, lon]);

        if (tKey === getStrDate(activeDate)) {
            renderMapForActiveDay();
            if (phantomMap) phantomMap.setView([lat, lon], 16);
        }
        triggerSync();
    }, null, { enableHighAccuracy: true });
}

function renderChart() {
    if (typeof Chart === 'undefined') return;
    const ctx = document.getElementById('chart-bio');
    if (!ctx) return;
    const labels = []; const wData = []; const sData = [];
    const moodCounts = { Feliz: 0, Neutral: 0, Ansioso: 0, Enojado: 0, Triste: 0 };

    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = getStrDate(d);
        labels.push(k.substring(5));
        wData.push(sys.days[k] ? (sys.days[k].water || 0) : 0);
        sData.push(sys.days[k] ? (sys.days[k].sleep || 0) : 0);

        if (sys.days[k] && sys.days[k].mood && moodCounts[sys.days[k].mood] !== undefined) moodCounts[sys.days[k].mood]++;
    }

    const mbox = document.getElementById('mood-bars');
    if (mbox) {
        mbox.innerHTML = `
            <div style="text-align:center; font-size:0.75rem;"><div style="height:${moodCounts.Feliz * 10}px; width:20px; background:var(--green); margin:0 auto;"></div><i class="fas fa-smile" style="color:var(--green)"></i></div>
            <div style="text-align:center; font-size:0.75rem;"><div style="height:${moodCounts.Neutral * 10}px; width:20px; background:var(--primary); margin:0 auto;"></div><i class="fas fa-meh" style="color:var(--primary)"></i></div>
            <div style="text-align:center; font-size:0.75rem;"><div style="height:${moodCounts.Ansioso * 10}px; width:20px; background:#FF9800; margin:0 auto;"></div><i class="fas fa-bolt" style="color:#FF9800"></i></div>
            <div style="text-align:center; font-size:0.75rem;"><div style="height:${moodCounts.Enojado * 10}px; width:20px; background:var(--red); margin:0 auto;"></div><i class="fas fa-angry" style="color:var(--red)"></i></div>
            <div style="text-align:center; font-size:0.75rem;"><div style="height:${moodCounts.Triste * 10}px; width:20px; background:#00bcd4; margin:0 auto;"></div><i class="fas fa-frown" style="color:#00bcd4"></i></div>
        `;
    }

    if (window.phantomChartInstance) window.phantomChartInstance.destroy();
    window.phantomChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ label: 'Agua (L)', data: wData, backgroundColor: '#4285F4' }, { label: 'Sueño (H)', data: sData, backgroundColor: '#A142F4' }] },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// --- NOTIFICATION ENGINE ---
function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

function startNotificationEngine() {
    setInterval(() => {
        const h = new Date().getHours();
        if (h === lastNotifiedHour) return;

        let msg = "";
        let title = "BioGym Recomendación";

        if (h === 8 && !sys.days[getStrDate(new Date())].habitsDone.length) {
            msg = "Comienza tu día hidratándote y marcando tu primer hábito para activar neuroplasticidad.";
        } else if (h === 13) {
            msg = "Tu digestión necesita proceso. Intenta hacer una caminata breve después del almuerzo.";
        } else if (h === 18 && sys.profile.activity === 'sedentary') {
            msg = "Has estado mucho en oficina. ¡Es tu hora crucial para movilidad física y separar la tensión!";
        } else if (h === 21) {
            msg = "Prepara tu descanso. Evita pantallas brillantes para bajar el cortisol.";
        }

        if (msg) {
            lastNotifiedHour = h;
            if (Notification.permission === "granted") {
                new Notification(title, { body: msg, icon: 'https://cdn-icons-png.flaticon.com/512/3208/3208759.png' });
            } else {
                const dashTip = document.getElementById('ai-health-tip');
                if (dashTip) dashTip.innerText = "ALERTA TEMPORAL: " + msg;
            }
        }
    }, 60000);
}

function triggerSync() {
    engine[activeUserEmail].sys = sys;
    localStorage.setItem('biogym_users_v18', JSON.stringify(engine));
    const label = document.getElementById('sync-label');
    if (label) label.innerText = "Sincronizado Localmente";
}

// --- UTILS ---
function showView(id) {
    document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
    const histNav = document.getElementById('hist-nav-bar');
    if (histNav) histNav.style.display = id === 'dash' ? 'flex' : 'none';

    const target = document.getElementById(id);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(id)) b.classList.add('active');
    });

    if (id === 'stats') renderChart();
    if (id === 'monthly') renderMonthlySummaryGrid();
    if (id === 'stats' && phantomMap) setTimeout(() => phantomMap.invalidateSize(), 300);
}
function closeModal() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); editMode = false; renderHabits(); }
function openGuideModal() { document.getElementById('guide-modal').style.display = 'flex'; }
function getStrDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
