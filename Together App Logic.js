import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

// 1. Supabase Initialization
// Cloudflare Pages: ใส่ค่าจาก Supabase Dashboard > Project Settings > API
const SUPABASE_URL = 'https://vpybtmzoezjcajzcvwfd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WO9uj7HXQZCXKrKH5_cHMw_F3pGVjh5';
const isConfigured = !SUPABASE_URL.includes('YOUR_PROJECT_REF') && !SUPABASE_ANON_KEY.startsWith('YOUR_');

let supabase = null;
let clientError = null;
try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
    });
} catch (e) {
    clientError = e;
    console.error("Supabase client init failed:", e);
}

// 2. Application State
const state = {
    user: null,
    userProfile: null,
    roomId: null,
    roomData: null,
    dailyLogs: [],
    somedayItems: [],
    quizzes: [],
    activities: [],
    selectedMood: 'happy',
    calendarDate: new Date(),
    somedayFilter: 'all',
    unsubscribers: []
};

// Preset Question Bank for "How Well Do You Know Me?"
const PRESET_QUESTIONS = [
    { category: 'ความชอบ', q: 'เครื่องดื่มแก้วโปรดที่ฉันสั่งบ่อยที่สุดคืออะไร?' },
    { category: 'ความชอบ', q: 'อาหารจานโปรดที่ฉันกินได้ไม่มีเบื่อคืออะไร?' },
    { category: 'ความทรงจำ', q: 'สถานที่แรกที่เราสองคนไปเที่ยวด้วยกันคือที่ไหน?' },
    { category: 'ความทรงจำ', q: 'ความประทับใจแรกตอนที่เราเจอกันคืออะไร?' },
    { category: 'นิสัย', q: 'เวลาฉันเครียดหรือไม่สบายใจ ฉันมักจะทำอะไร?' },
    { category: 'นิสัย', q: 'สิ่งเล็กๆ น้อยๆ ที่ทำให้ฉันยิ้มได้ทันทีคืออะไร?' },
    { category: 'เรื่องราวส่วนตัว', q: 'ประเทศหรือเมืองในฝันที่ฉันอยากไปสักครั้งในชีวิตคือที่ไหน?' },
    { category: 'เรื่องราวส่วนตัว', q: 'ถ้ามีเวลาว่าง 1 วันเต็มๆ ฉันอยากทำอะไรมากที่สุด?' }
];

// Shop Items for "Two Little Pets"
const SHOP_ITEMS = [
    { id: 'crown', name: 'มงกุฎจิ๋ว', icon: '👑', price: 50, type: 'accessory' },
    { id: 'scarf', name: 'ผ้าพันคออุ่นๆ', icon: '🧣', price: 40, type: 'accessory' },
    { id: 'glasses', name: 'แว่นกันแดดเท่ๆ', icon: '🕶️', price: 60, type: 'accessory' },
    { id: 'plant', name: 'ต้นไม้ในห้อง', icon: '🪴', price: 30, type: 'decor' },
    { id: 'bed', name: 'เบาะนอนนุ่มนิ่ม', icon: '🛋️', price: 80, type: 'decor' },
    { id: 'lamp', name: 'โคมไฟพระจันทร์', icon: '🌙', price: 70, type: 'decor' },
    { id: 'cake', name: 'เค้กพิเศษ (+30 อิ่ม/สุข)', icon: '🍰', price: 25, type: 'consumable' },
    { id: 'toy', name: 'ของเล่นชิ้นโปรด (+30 สุข)', icon: '🧸', price: 25, type: 'consumable' }
];

const MOOD_MAP = {
    happy: { emoji: '😊', label: 'มีความสุข' },
    miss: { emoji: '🥺', label: 'คิดถึง' },
    normal: { emoji: '😌', label: 'ปกติ' },
    tired: { emoji: '😫', label: 'เหนื่อย' },
    sad: { emoji: '😢', label: 'เศร้า' }
};

// 3. Authentication & Bootstrapping (anonymous sign-in, session persisted in localStorage)
async function initApp() {
    if (!isConfigured || !supabase) {
        showView('auth');
        showToast(clientError
            ? "ค่า Supabase URL / key ไม่ถูกต้อง: " + clientError.message
            : "ยังไม่ได้ตั้งค่า Supabase URL / anon key ในไฟล์ app.js", "error");
        return;
    }
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        let session = sessionData?.session;
        if (!session) {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) throw error;
            session = data.session;
        }
        state.user = { uid: session.user.id };
        await checkUserRoomStatus(state.user.uid);
    } catch (error) {
        console.error("Auth Error:", error);
        showToast("เกิดข้อผิดพลาดในการเชื่อมต่อระบบยืนยันตัวตน", "error");
        showView('auth');
    }
}

async function checkUserRoomStatus(uid) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles').select('uid, name, room_code').eq('uid', uid).maybeSingle();
        if (error) throw error;

        if (profile && profile.room_code) {
            state.userProfile = { uid, name: profile.name, roomId: profile.room_code };
            state.roomId = profile.room_code;
            await subscribeToRoom(state.roomId);
            if (state.roomId) showView('app');
        } else {
            showView('auth');
        }
    } catch (err) {
        console.error("Check Profile Error:", err);
        showView('auth');
    }
}

// ---------- Data layer helpers ----------
async function saveProfile(name, roomCode) {
    const { error } = await supabase.from('profiles')
        .upsert({ uid: state.user.uid, name, room_code: roomCode }, { onConflict: 'uid' });
    if (error) throw error;
}

async function dbFetchRoom(code) {
    const { data, error } = await supabase.from('rooms')
        .select('room_code, member_ids, data').eq('room_code', code).maybeSingle();
    if (error) throw error;
    return data;
}

async function dbPatchRoom(patch) {
    const { error } = await supabase.rpc('patch_room', { p_code: state.roomId, p_patch: patch });
    if (error) throw error;
}

async function dbListDocs(kind) {
    const { data, error } = await supabase.from('room_docs')
        .select('id, data').eq('room_code', state.roomId).eq('kind', kind);
    if (error) throw error;
    return (data || []).map(r => ({ id: r.id, ...r.data }));
}

async function dbGetDoc(kind, id) {
    const { data, error } = await supabase.from('room_docs')
        .select('id, data').eq('room_code', state.roomId).eq('kind', kind).eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? { id: data.id, ...data.data } : null;
}

async function dbAddDoc(kind, data) {
    const { error } = await supabase.from('room_docs')
        .insert({ room_code: state.roomId, kind, id: crypto.randomUUID(), data });
    if (error) throw error;
}

async function dbUpsertDoc(kind, id, data) {
    const { error } = await supabase.from('room_docs')
        .upsert({ room_code: state.roomId, kind, id, data }, { onConflict: 'room_code,kind,id' });
    if (error) throw error;
}

async function dbPatchDoc(kind, id, patch) {
    const { error } = await supabase.rpc('patch_doc', {
        p_code: state.roomId, p_kind: kind, p_id: id, p_patch: patch
    });
    if (error) throw error;
}

async function dbDeleteDoc(kind, id) {
    const { error } = await supabase.from('room_docs')
        .delete().eq('room_code', state.roomId).eq('kind', kind).eq('id', id);
    if (error) throw error;
}

// 4. Room Creation & Joining
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

window.handleCreateRoom = async () => {
    if (!state.user) return;
    const name = document.getElementById('auth-name').value.trim();
    const worldName = document.getElementById('auth-world-name').value.trim() || 'Our Little World';

    if (!name) {
        showToast("กรุณากรอกชื่อเรียกของคุณก่อนนะ", "error");
        return;
    }

    setLoading(true);
    try {
        const uid = state.user.uid;
        let roomCode = null;

        for (let attempt = 0; attempt < 5 && !roomCode; attempt++) {
            const code = generateRoomCode();
            const { error } = await supabase.from('rooms').insert({
                room_code: code,
                member_ids: [uid],
                data: {
                    roomCode: code,
                    worldName,
                    createdAt: Date.now(),
                    members: {
                        [uid]: { uid, name, role: 'creator', joinedAt: Date.now() }
                    },
                    coins: 100,
                    pet: {
                        name: 'เจ้าตัวน้อย',
                        emoji: '🐱',
                        hunger: 80,
                        happiness: 85,
                        energy: 90,
                        unlockedItems: [],
                        equippedAccessory: '',
                        equippedDecor: []
                    }
                }
            });
            if (!error) roomCode = code;
            else if (error.code !== '23505') throw error;
        }
        if (!roomCode) throw new Error('Could not allocate a room code');

        await saveProfile(name, roomCode);
        state.userProfile = { uid, name, roomId: roomCode };
        state.roomId = roomCode;

        await logActivity(`${name} ได้สร้างพื้นที่ "${worldName}" ขึ้นมา`);
        await subscribeToRoom(roomCode);
        showView('app');
        showToast("สร้างพื้นที่ส่วนตัวเรียบร้อยแล้ว!", "success");
    } catch (err) {
        console.error("Create Room Error:", err);
        showToast("ไม่สามารถสร้างห้องได้ กรุณาลองใหม่", "error");
        setLoading(false);
    }
};

window.handleJoinRoom = async () => {
    if (!state.user) return;
    const name = document.getElementById('auth-name').value.trim();
    const code = document.getElementById('auth-invite-code').value.trim().toUpperCase();

    if (!name) {
        showToast("กรุณากรอกชื่อเรียกของคุณก่อนนะ", "error");
        return;
    }
    if (code.length !== 6) {
        showToast("กรุณากรอกรหัสห้อง 6 หลักให้ถูกต้อง", "error");
        return;
    }

    setLoading(true);
    try {
        const { error } = await supabase.rpc('join_room', { p_code: code, p_name: name });
        if (error) {
            setLoading(false);
            const msg = error.message || '';
            if (msg.includes('room_not_found')) {
                showToast("ไม่พบห้องนี้ กรุณาตรวจสอบรหัสอีกครั้ง", "error");
            } else if (msg.includes('room_full')) {
                showToast("ห้องนี้มีผู้ใช้งานครบ 2 คนแล้ว", "error");
            } else {
                console.error("Join Room Error:", error);
                showToast("เกิดข้อผิดพลาดในการเข้าร่วมห้อง", "error");
            }
            return;
        }

        await saveProfile(name, code);
        state.userProfile = { uid: state.user.uid, name, roomId: code };
        state.roomId = code;

        await logActivity(`${name} ได้เข้าร่วมพื้นที่ของเราแล้ว! ❤️`);
        await subscribeToRoom(code);
        showView('app');
        showToast("เชื่อมต่อกับคนพิเศษสำเร็จ!", "success");
    } catch (err) {
        console.error("Join Room Error:", err);
        showToast("เกิดข้อผิดพลาดในการเข้าร่วมห้อง", "error");
        setLoading(false);
    }
};

// 5. Real-time Subscriptions
async function refreshRoom() {
    const code = state.roomId;
    if (!code) return;
    try {
        const row = await dbFetchRoom(code);
        if (code !== state.roomId) return;
        if (!row) {
            showToast("ห้องนี้ถูกลบหรือไม่พบข้อมูล", "error");
            handleLeaveRoom(true);
            return;
        }
        state.roomData = { ...row.data, roomCode: row.room_code, memberIds: row.member_ids };
        renderAllUI();
        setLoading(false);
    } catch (err) {
        console.error("Room Fetch Error:", err);
    }
}

async function refreshKind(kind) {
    const code = state.roomId;
    if (!code) return;
    try {
        const items = await dbListDocs(kind);
        if (code !== state.roomId) return;

        if (kind === 'daily') {
            items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            state.dailyLogs = items;
            renderDailyUI();
            renderDashboardUI();
        } else if (kind === 'someday') {
            items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            state.somedayItems = items;
            renderSomedayUI();
            renderDashboardUI();
        } else if (kind === 'quizzes') {
            items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            state.quizzes = items;
            renderQuizUI();
            renderDashboardUI();
        } else if (kind === 'activities') {
            items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            if (state.activities.length > 0 && items.length > state.activities.length) {
                const latest = items[0];
                if (latest.actorUid !== state.user?.uid) {
                    showToast(latest.message, "info");
                    document.getElementById('notif-dot').classList.remove('hidden');
                }
            }
            state.activities = items;
            renderDashboardUI();
        }
    } catch (err) {
        console.error(`Fetch ${kind} Error:`, err);
    }
}

const ALL_KINDS = ['daily', 'someday', 'quizzes', 'activities'];
async function refreshAll() {
    await refreshRoom();
    await Promise.all(ALL_KINDS.map(refreshKind));
}

async function subscribeToRoom(roomCode) {
    clearSubscriptions();
    state.roomId = roomCode;
    state.dailyLogs = [];
    state.somedayItems = [];
    state.quizzes = [];
    state.activities = [];

    await refreshRoom();
    if (state.roomId !== roomCode) return;
    await Promise.all(ALL_KINDS.map(refreshKind));

    let firstSubscribe = true;
    const channel = supabase.channel(`room-${roomCode}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'rooms', filter: `room_code=eq.${roomCode}` },
            () => refreshRoom())
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'room_docs', filter: `room_code=eq.${roomCode}` },
            (payload) => {
                const kind = payload.new?.kind || payload.old?.kind;
                if (kind) refreshKind(kind);
                else ALL_KINDS.forEach(refreshKind);
            })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                if (!firstSubscribe) refreshAll();
                firstSubscribe = false;
            }
        });

    state.unsubscribers.push(() => supabase.removeChannel(channel));
}

function clearSubscriptions() {
    state.unsubscribers.forEach(unsub => { try { unsub(); } catch (e) {} });
    state.unsubscribers = [];
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.roomId && state.user) refreshAll();
});

async function logActivity(message) {
    if (!state.user || !state.roomId) return;
    try {
        await dbAddDoc('activities', {
            message,
            actorUid: state.user.uid,
            timestamp: Date.now()
        });
    } catch (e) {
        console.error("Log Activity Error:", e);
    }
}

async function addCoins(amount) {
    if (!state.user || !state.roomId || !state.roomData) return;
    const { error } = await supabase.rpc('add_coins', { p_code: state.roomId, p_amount: amount });
    if (error) console.error("Add Coins Error:", error);
}

function getPartnersInfo() {
    const members = state.roomData?.members || {};
    const myUid = state.user?.uid;
    const me = members[myUid] || { uid: myUid, name: state.userProfile?.name || 'คุณ' };
    const partnerUid = Object.keys(members).find(id => id !== myUid);
    const partner = partnerUid ? members[partnerUid] : null;
    return { me, partner };
}

function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==========================================
// FEATURE 1: DAILY US LOGIC
// ==========================================
window.selectMood = (moodKey) => {
    state.selectedMood = moodKey;
    document.querySelectorAll('.mood-btn').forEach(btn => {
        if (btn.dataset.mood === moodKey) {
            btn.classList.add('border-zinc-900', 'bg-zinc-900', 'text-white');
            btn.querySelector('span:last-child').classList.replace('text-zinc-700', 'text-white');
        } else {
            btn.classList.remove('border-zinc-900', 'bg-zinc-900', 'text-white');
            btn.querySelector('span:last-child').classList.replace('text-white', 'text-zinc-700');
        }
    });
};

window.submitDailyCheckin = async () => {
    if (!state.user || !state.roomId) return;
    const note = document.getElementById('daily-note-input').value.trim();
    const todayStr = getTodayDateString();
    const { me } = getPartnersInfo();

    try {
        const docId = `${todayStr}_${state.user.uid}`;
        const existing = await dbGetDoc('daily', docId);
        const isFirstTimeToday = !existing;
        await dbUpsertDoc('daily', docId, {
            date: todayStr,
            uid: state.user.uid,
            userName: me.name,
            mood: state.selectedMood,
            note: note,
            timestamp: Date.now()
        });

        document.getElementById('daily-note-input').value = '';

        if (isFirstTimeToday) {
            await addCoins(15);
            showToast("เช็กอินสำเร็จ! ได้รับ +15 เหรียญ", "success");
        } else {
            showToast("อัปเดตความรู้สึกวันนี้เรียบร้อย", "success");
        }

        const moodLabel = MOOD_MAP[state.selectedMood]?.label || '';
        await logActivity(`${me.name} เช็กอินความรู้สึกวันนี้: ${moodLabel} ${MOOD_MAP[state.selectedMood]?.emoji}`);
    } catch (err) {
        console.error("Daily Checkin Error:", err);
        showToast("บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    }
};

window.changeCalendarMonth = (delta) => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() + delta);
    renderCalendar();
};

function renderDailyUI() {
    const { me, partner } = getPartnersInfo();
    const todayStr = getTodayDateString();

    const myToday = state.dailyLogs.find(l => l.date === todayStr && l.uid === me.uid);
    const partnerToday = partner ? state.dailyLogs.find(l => l.date === todayStr && l.uid === partner.uid) : null;

    const cardsContainer = document.getElementById('daily-today-cards');
    cardsContainer.innerHTML = `
        ${renderTodayPersonCard(me.name + ' (คุณ)', myToday)}
        ${partner ? renderTodayPersonCard(partner.name, partnerToday) : `
            <div class="bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <p class="text-sm font-medium text-zinc-600">รอคนพิเศษเข้าร่วมห้อง</p>
                <p class="text-xs text-zinc-400 mt-1">แชร์รหัสห้อง ${state.roomId} เพื่อดูความรู้สึกของอีกฝ่าย</p>
            </div>
        `}
    `;

    const historyList = document.getElementById('daily-history-list');
    if (state.dailyLogs.length === 0) {
        historyList.innerHTML = `<p class="text-xs text-zinc-400 text-center py-8">ยังไม่มีประวัติการเช็กอิน เริ่มบันทึกวันแรกของคุณได้เลย!</p>`;
    } else {
        historyList.innerHTML = state.dailyLogs.map(log => {
            const m = MOOD_MAP[log.mood] || { emoji: '😊', label: 'ปกติ' };
            const timeStr = new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-xl shrink-0">
                        ${m.emoji}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                            <p class="text-xs font-semibold text-zinc-900">${escapeHTML(log.userName)} • <span class="text-zinc-500 font-normal">${m.label}</span></p>
                            <span class="text-[11px] text-zinc-400">${log.date} (${timeStr})</span>
                        </div>
                        ${log.note ? `<p class="text-sm text-zinc-700 mt-1 break-words">${escapeHTML(log.note)}</p>` : `<p class="text-xs text-zinc-400 italic mt-1">ไม่ได้เขียนข้อความเพิ่มเติม</p>`}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCalendar();
}

function renderTodayPersonCard(title, log) {
    if (!log) {
        return `
            <div class="bg-white border border-zinc-200 rounded-2xl p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 text-xl">?</div>
                <div>
                    <p class="text-xs font-semibold text-zinc-500">${escapeHTML(title)}</p>
                    <p class="text-sm font-medium text-zinc-400 mt-0.5">ยังไม่ได้เช็กอินวันนี้</p>
                </div>
            </div>
        `;
    }
    const m = MOOD_MAP[log.mood] || { emoji: '😊', label: 'ปกติ' };
    return `
        <div class="bg-white border border-zinc-200 rounded-2xl p-5">
            <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-2xl shrink-0">
                    ${m.emoji}
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold text-zinc-500">${escapeHTML(title)}</p>
                        <span class="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium">${m.label}</span>
                    </div>
                    <p class="text-sm text-zinc-900 mt-1 break-words">${log.note ? escapeHTML(log.note) : '<span class="text-zinc-400 text-xs">เช็กอินความรู้สึกแล้ว</span>'}</p>
                </div>
            </div>
        </div>
    `;
}

function renderCalendar() {
    const year = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth();
    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    document.getElementById('calendar-month-label').textContent = `${monthNames[month]} ${year + 543}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="p-1.5"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayLogs = state.dailyLogs.filter(l => l.date === dateStr);
        const isToday = dateStr === getTodayDateString();

        let emojiBadge = '';
        if (dayLogs.length > 0) {
            const m = MOOD_MAP[dayLogs[0].mood];
            emojiBadge = `<span class="text-xs leading-none">${m ? m.emoji : '•'}</span>`;
        }

        grid.innerHTML += `
            <div class="aspect-square rounded-xl flex flex-col items-center justify-center text-xs border ${isToday ? 'border-zinc-900 font-bold bg-zinc-50' : 'border-transparent hover:bg-zinc-50'}">
                <span class="text-[11px] text-zinc-700">${d}</span>
                ${emojiBadge}
            </div>
        `;
    }
}

// ==========================================
// FEATURE 2: SOMEDAY TOGETHER LOGIC
// ==========================================
window.filterSomeday = (category) => {
    state.somedayFilter = category;
    document.querySelectorAll('.someday-filter-btn').forEach(btn => {
        if (btn.dataset.filter === category) {
            btn.className = 'someday-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 text-white shrink-0';
        } else {
            btn.className = 'someday-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 shrink-0';
        }
    });
    renderSomedayUI();
};

window.openSomedayModal = (editItem = null) => {
    const isEdit = !!editItem;
    openModal(`
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-zinc-900">${isEdit ? 'แก้ไขรายการ' : 'เพิ่มสิ่งที่อยากทำด้วยกัน'}</h3>
            <button onclick="closeModal()" class="text-zinc-400 hover:text-zinc-900"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="space-y-4">
            <div>
                <label class="block text-xs font-semibold text-zinc-500 mb-1.5">หมวดหมู่</label>
                <select id="sd-category" class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:border-zinc-900">
                    <option value="place" ${editItem?.category === 'place' ? 'selected' : ''}>📍 สถานที่ที่อยากไป</option>
                    <option value="food" ${editItem?.category === 'food' ? 'selected' : ''}>🍜 อาหารที่อยากกิน</option>
                    <option value="movie" ${editItem?.category === 'movie' ? 'selected' : ''}>🎬 หนัง/ซีรีส์ที่อยากดู</option>
                    <option value="activity" ${editItem?.category === 'activity' ? 'selected' : ''}>✨ กิจกรรมที่อยากทำ</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-500 mb-1.5">ชื่อรายการ *</label>
                <input type="text" id="sd-title" value="${isEdit ? escapeHTML(editItem.title) : ''}" placeholder="เช่น ไปดูดาวที่ดอยอ่างขาง, กินโอมากาเสะ" 
                    class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900">
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-500 mb-1.5">รายละเอียดเพิ่มเติม</label>
                <textarea id="sd-desc" rows="2" placeholder="รายละเอียด หรือช่วงเวลาที่อยากไป..." 
                    class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900 resize-none">${isEdit ? escapeHTML(editItem.description || '') : ''}</textarea>
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-500 mb-1.5">ลิงก์รูปภาพประกอบ (ไม่บังคับ)</label>
                <input type="url" id="sd-image" value="${isEdit ? escapeHTML(editItem.imageUrl || '') : ''}" placeholder="https://..." 
                    class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900">
            </div>
            <div class="pt-2 flex gap-2 justify-end">
                <button onclick="closeModal()" class="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">ยกเลิก</button>
                <button onclick="saveSomedayItem('${isEdit ? editItem.id : ''}')" class="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800">
                    ${isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
                </button>
            </div>
        </div>
    `);
    lucide.createIcons();
};

window.saveSomedayItem = async (editId) => {
    if (!state.user || !state.roomId) return;
    const category = document.getElementById('sd-category').value;
    const title = document.getElementById('sd-title').value.trim();
    const description = document.getElementById('sd-desc').value.trim();
    const imageUrl = document.getElementById('sd-image').value.trim();

    if (!title) {
        showToast("กรุณากรอกชื่อรายการ", "error");
        return;
    }

    const { me } = getPartnersInfo();
    try {
        if (editId) {
            await dbPatchDoc('someday', editId, { category, title, description, imageUrl });
            showToast("แก้ไขรายการเรียบร้อย", "success");
        } else {
            await dbAddDoc('someday', {
                category,
                title,
                description,
                imageUrl,
                completed: false,
                createdBy: me.name,
                createdAt: Date.now()
            });
            await logActivity(`${me.name} เพิ่มสิ่งที่อยากทำด้วยกัน: "${title}"`);
            showToast("เพิ่มรายการเรียบร้อยแล้ว!", "success");
        }
        closeModal();
    } catch (err) {
        console.error("Save Someday Error:", err);
        showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
};

window.toggleSomedayComplete = async (id, currentStatus, title) => {
    if (!state.user || !state.roomId) return;
    const { me } = getPartnersInfo();
    try {
        await dbPatchDoc('someday', id, {
            completed: !currentStatus,
            completedAt: !currentStatus ? Date.now() : null
        });

        if (!currentStatus) {
            await addCoins(30);
            await logActivity(`${me.name} ทำเครื่องหมายสำเร็จ: "${title}" 🎉 (+30 เหรียญ)`);
            showToast("ยินดีด้วย! ทำสำเร็จไปอีกหนึ่งอย่าง (+30 เหรียญ)", "success");
        }
    } catch (err) {
        console.error("Toggle Someday Error:", err);
    }
};

window.deleteSomedayItem = async (id) => {
    if (!state.user || !state.roomId) return;
    try {
        await dbDeleteDoc('someday', id);
        showToast("ลบรายการแล้ว", "info");
    } catch (err) {
        console.error("Delete Someday Error:", err);
    }
};

function renderSomedayUI() {
    const total = state.somedayItems.length;
    const completed = state.somedayItems.filter(i => i.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById('someday-stats-text').textContent = `${completed} / ${total} สำเร็จ (${percent}%)`;
    document.getElementById('someday-progress-bar').style.width = `${percent}%`;

    const filtered = state.somedayFilter === 'all' 
        ? state.somedayItems 
        : state.somedayItems.filter(i => i.category === state.somedayFilter);

    const grid = document.getElementById('someday-grid');
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full bg-white border border-zinc-200 rounded-2xl p-10 text-center">
                <p class="text-sm font-medium text-zinc-600">ยังไม่มีรายการในหมวดหมู่นี้</p>
                <p class="text-xs text-zinc-400 mt-1">กดปุ่ม "เพิ่มรายการใหม่" เพื่อเริ่มวางแผนอนาคตด้วยกัน</p>
            </div>
        `;
        return;
    }

    const catLabels = {
        place: '📍 สถานที่',
        food: '🍜 อาหาร',
        movie: '🎬 หนัง/ซีรีส์',
        activity: '✨ กิจกรรม'
    };

    grid.innerHTML = filtered.map(item => {
        const safeItemJson = encodeURIComponent(JSON.stringify(item));
        return `
            <div class="bg-white border ${item.completed ? 'border-zinc-200 bg-zinc-50/60' : 'border-zinc-200'} rounded-2xl overflow-hidden flex flex-col justify-between transition-all">
                <div>
                    ${item.imageUrl ? `
                        <div class="h-40 w-full bg-zinc-100 overflow-hidden border-b border-zinc-100">
                            <img src="${escapeHTML(item.imageUrl)}" alt="${escapeHTML(item.title)}" 
                                onerror="this.parentElement.style.display='none'"
                                class="w-full h-full object-cover ${item.completed ? 'grayscale opacity-75' : ''}">
                        </div>
                    ` : ''}
                    <div class="p-5">
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700">${catLabels[item.category] || '✨ อื่นๆ'}</span>
                            <div class="flex items-center gap-1">
                                <button onclick="openSomedayModal(JSON.parse(decodeURIComponent('${safeItemJson}')))" class="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg" title="แก้ไข">
                                    <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                                </button>
                                <button onclick="deleteSomedayItem('${item.id}')" class="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg" title="ลบ">
                                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        </div>
                        <h4 class="font-bold text-base ${item.completed ? 'line-through text-zinc-400' : 'text-zinc-900'}">${escapeHTML(item.title)}</h4>
                        ${item.description ? `<p class="text-xs text-zinc-500 mt-1.5 leading-relaxed">${escapeHTML(item.description)}</p>` : ''}
                    </div>
                </div>
                <div class="px-5 py-3 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between">
                    <span class="text-[11px] text-zinc-400">เพิ่มโดย ${escapeHTML(item.createdBy || 'สมาชิก')}</span>
                    <button onclick="toggleSomedayComplete('${item.id}', ${item.completed}, '${escapeHTML(item.title).replace(/'/g, "\\'")}')" 
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${item.completed ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-900'}">
                        <i data-lucide="${item.completed ? 'check-circle-2' : 'circle'}" class="w-3.5 h-3.5"></i>
                        ${item.completed ? 'สำเร็จแล้ว' : 'ทำเครื่องหมายสำเร็จ'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

// ==========================================
// FEATURE 3: HOW WELL DO YOU KNOW ME? LOGIC
// (รองรับทั้งแบบเลือกคำตอบ และแบบกรอกคำตอบเอง)
// ==========================================
window.openCreateQuizModal = () => {
    openModal(`
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-zinc-900">สร้างคำถามทายใจให้อีกฝ่าย</h3>
            <button onclick="closeModal()" class="text-zinc-400 hover:text-zinc-900"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="space-y-4">
            <!-- เลือกรูปแบบคำถาม -->
            <div>
                <label class="block text-xs font-semibold text-zinc-500 mb-1.5">รูปแบบการตอบคำถาม</label>
                <div class="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl">
                    <button type="button" id="qz-type-choice-btn" onclick="switchQuizType('choice')" class="py-2 text-xs font-semibold rounded-lg bg-white text-zinc-900 shadow-2xs transition-all">
                        🔘 แบบเลือกคำตอบ
                    </button>
                    <button type="button" id="qz-type-text-btn" onclick="switchQuizType('text')" class="py-2 text-xs font-semibold rounded-lg text-zinc-500 hover:text-zinc-900 transition-all">
                        ✍️ แบบกรอกคำตอบเอง
                    </button>
                </div>
                <input type="hidden" id="qz-type" value="choice">
            </div>

            <div class="flex items-center justify-between bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <span class="text-xs text-zinc-600">คิดคำถามไม่ออกใช่ไหม?</span>
                <button type="button" onclick="fillRandomQuestion()" class="px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 flex items-center gap-1.5">
                    <i data-lucide="shuffle" class="w-3.5 h-3.5"></i> สุ่มคำถาม
                </button>
            </div>

            <div>
                <label class="block text-xs font-semibold text-zinc-500 mb-1.5">หมวดหมู่คำถาม</label>
                <select id="qz-category" class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:border-zinc-900">
                    <option value="ความชอบ">ความชอบ</option>
                    <option value="ความทรงจำ">ความทรงจำ</option>
                    <option value="นิสัย">นิสัย</option>
                    <option value="เรื่องราวส่วนตัว">เรื่องราวส่วนตัว</option>
                </select>
            </div>

            <div>
                <label class="block text-xs font-semibold text-zinc-500 mb-1.5">คำถามของคุณ *</label>
                <input type="text" id="qz-question" placeholder="เช่น ฉันชอบกินอะไรเวลาฝนตก?" 
                    class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900">
            </div>

            <div>
                <label class="block text-xs font-semibold text-zinc-500 mb-1.5">คำตอบที่ถูกต้อง (เฉลยของฉัน) *</label>
                <input type="text" id="qz-correct" placeholder="คำตอบที่แท้จริงของคุณ" 
                    class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900">
                <p id="qz-text-hint" class="hidden text-[11px] text-zinc-400 mt-1">ระบบจะตรวจคำตอบโดยตัดช่องว่างหัว-ท้ายและไม่แยกตัวพิมพ์เล็ก-ใหญ่</p>
            </div>

            <!-- ส่วนตัวเลือกหลอก (แสดงเฉพาะแบบเลือกคำตอบ) -->
            <div id="qz-choices-panel" class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block text-xs font-semibold text-zinc-500 mb-1.5">ตัวเลือกหลอก 1 *</label>
                    <input type="text" id="qz-wrong1" placeholder="ตัวเลือกที่ 2" 
                        class="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-zinc-500 mb-1.5">ตัวเลือกหลอก 2 *</label>
                    <input type="text" id="qz-wrong2" placeholder="ตัวเลือกที่ 3" 
                        class="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900">
                </div>
            </div>

            <div class="pt-2 flex gap-2 justify-end">
                <button onclick="closeModal()" class="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600">ยกเลิก</button>
                <button onclick="submitNewQuiz()" class="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800">ส่งคำถาม</button>
            </div>
        </div>
    `);
    lucide.createIcons();
};

window.switchQuizType = (type) => {
    document.getElementById('qz-type').value = type;
    const choiceBtn = document.getElementById('qz-type-choice-btn');
    const textBtn = document.getElementById('qz-type-text-btn');
    const choicesPanel = document.getElementById('qz-choices-panel');
    const textHint = document.getElementById('qz-text-hint');

    if (type === 'choice') {
        choiceBtn.className = 'py-2 text-xs font-semibold rounded-lg bg-white text-zinc-900 shadow-2xs transition-all';
        textBtn.className = 'py-2 text-xs font-semibold rounded-lg text-zinc-500 hover:text-zinc-900 transition-all';
        choicesPanel.classList.remove('hidden');
        textHint.classList.add('hidden');
    } else {
        textBtn.className = 'py-2 text-xs font-semibold rounded-lg bg-white text-zinc-900 shadow-2xs transition-all';
        choiceBtn.className = 'py-2 text-xs font-semibold rounded-lg text-zinc-500 hover:text-zinc-900 transition-all';
        choicesPanel.classList.add('hidden');
        textHint.classList.remove('hidden');
    }
};

window.fillRandomQuestion = () => {
    const rand = PRESET_QUESTIONS[Math.floor(Math.random() * PRESET_QUESTIONS.length)];
    document.getElementById('qz-category').value = rand.category;
    document.getElementById('qz-question').value = rand.q;
};

window.submitNewQuiz = async () => {
    if (!state.user || !state.roomId) return;
    const type = document.getElementById('qz-type')?.value || 'choice';
    const category = document.getElementById('qz-category').value;
    const question = document.getElementById('qz-question').value.trim();
    const correct = document.getElementById('qz-correct').value.trim();

    if (!question || !correct) {
        showToast("กรุณากรอกคำถามและคำตอบที่ถูกต้อง", "error");
        return;
    }

    let options = [];
    if (type === 'choice') {
        const wrong1 = document.getElementById('qz-wrong1').value.trim();
        const wrong2 = document.getElementById('qz-wrong2').value.trim();
        if (!wrong1 || !wrong2) {
            showToast("กรุณากรอกตัวเลือกหลอกให้ครบทุกช่อง", "error");
            return;
        }
        options = [correct, wrong1, wrong2].sort(() => Math.random() - 0.5);
    }

    const { me } = getPartnersInfo();
    const typeLabel = type === 'text' ? 'แบบกรอกคำตอบเอง' : 'แบบเลือกคำตอบ';

    try {
        await dbAddDoc('quizzes', {
            type,
            category,
            question,
            correctAnswer: correct,
            options,
            creatorUid: state.user.uid,
            creatorName: me.name,
            answeredByUid: null,
            selectedAnswer: null,
            isCorrect: null,
            createdAt: Date.now()
        });

        await logActivity(`${me.name} ตั้งคำถามทายใจ (${typeLabel}) ในหมวด "${category}"`);
        closeModal();
        showToast("ส่งคำถามให้อีกฝ่ายเรียบร้อย!", "success");
    } catch (err) {
        console.error("Create Quiz Error:", err);
        showToast("เกิดข้อผิดพลาดในการสร้างคำถาม", "error");
    }
};

window.toggleQuizAnswerReveal = (quizId) => {
    const el = document.getElementById(`quiz-reveal-${quizId}`);
    if (el) el.classList.toggle('hidden');
};

window.submitTextQuizAnswer = async (quizId) => {
    const input = document.getElementById(`quiz-text-input-${quizId}`);
    if (!input) return;
    const answer = input.value.trim();
    if (!answer) {
        showToast("กรุณาพิมพ์คำตอบก่อนส่งนะ", "error");
        return;
    }
    await window.answerQuiz(quizId, answer);
};

window.answerQuiz = async (quizId, chosenOption) => {
    if (!state.user || !state.roomId) return;
    const quiz = state.quizzes.find(q => q.id === quizId);
    if (!quiz || quiz.answeredByUid) return;

    // ตรวจคำตอบ (ตัดช่องว่างหัว-ท้าย และเปรียบเทียบแบบไม่สนตัวพิมพ์เล็ก-ใหญ่)
    const normalizedChosen = String(chosenOption).trim().toLowerCase();
    const normalizedCorrect = String(quiz.correctAnswer).trim().toLowerCase();
    const isCorrect = normalizedChosen === normalizedCorrect;
    const { me } = getPartnersInfo();

    try {
        await dbPatchDoc('quizzes', quizId, {
            answeredByUid: state.user.uid,
            answeredByName: me.name,
            selectedAnswer: String(chosenOption).trim(),
            isCorrect,
            answeredAt: Date.now()
        });

        if (isCorrect) {
            await addCoins(20);
            await logActivity(`${me.name} ตอบคำถามของ ${quiz.creatorName} ถูกต้อง! (+20 เหรียญ)`);
            showToast("ถูกต้อง! คุณรู้จักอีกฝ่ายดีมาก (+20 เหรียญ)", "success");
        } else {
            await logActivity(`${me.name} ตอบคำถามของ ${quiz.creatorName} ผิด (เฉลย: ${quiz.correctAnswer})`);
            showToast(`ยังไม่ถูก! คำตอบที่ถูกคือ "${quiz.correctAnswer}"`, "info");
        }
    } catch (err) {
        console.error("Answer Quiz Error:", err);
    }
};

function renderQuizUI() {
    const { me, partner } = getPartnersInfo();

    // Calculate Scores
    const myScore = state.quizzes.filter(q => q.answeredByUid === me.uid && q.isCorrect).length;
    const partnerScore = partner ? state.quizzes.filter(q => q.answeredByUid === partner.uid && q.isCorrect).length : 0;

    document.getElementById('quiz-p1-name').textContent = me.name;
    document.getElementById('quiz-p1-avatar').textContent = me.name.charAt(0).toUpperCase();
    document.getElementById('quiz-p1-score').innerHTML = `${myScore} <span class="text-xs font-normal text-zinc-400">คะแนน</span>`;

    const p2Name = partner ? partner.name : 'รอคนพิเศษ';
    document.getElementById('quiz-p2-name').textContent = p2Name;
    document.getElementById('quiz-p2-avatar').textContent = p2Name.charAt(0).toUpperCase();
    document.getElementById('quiz-p2-score').innerHTML = `${partnerScore} <span class="text-xs font-normal text-zinc-400">คะแนน</span>`;

    const activeQuizzes = state.quizzes.filter(q => !q.answeredByUid);
    const pastQuizzes = state.quizzes.filter(q => q.answeredByUid);

    const activeContainer = document.getElementById('quiz-active-list');
    if (activeQuizzes.length === 0) {
        activeContainer.innerHTML = `<div class="bg-white border border-zinc-200 rounded-2xl p-6 text-center text-xs text-zinc-400">ไม่มีคำถามที่รอคำตอบ กด "ตั้งคำถามทายใจ" เพื่อเริ่มเล่น!</div>`;
    } else {
        activeContainer.innerHTML = activeQuizzes.map(q => {
            const isMyQuestion = q.creatorUid === me.uid;
            const isTextType = q.type === 'text' || !q.options || q.options.length === 0;
            const typeBadge = isTextType
                ? `<span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-900 text-white">✍️ พิมพ์ตอบ</span>`
                : `<span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">🔘 ตัวเลือก</span>`;

            return `
                <div class="bg-white border border-zinc-200 rounded-2xl p-5">
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700">${escapeHTML(q.category)}</span>
                            ${typeBadge}
                        </div>
                        <span class="text-xs text-zinc-400 shrink-0">ถามโดย ${escapeHTML(q.creatorName)}</span>
                    </div>
                    <h4 class="font-bold text-base text-zinc-900 mb-4">${escapeHTML(q.question)}</h4>

                    ${isTextType ? `
                        <div class="flex flex-col sm:flex-row gap-2">
                            <input type="text" id="quiz-text-input-${q.id}" placeholder="พิมพ์คำตอบของคุณที่นี่..."
                                onkeydown="if(event.key==='Enter') submitTextQuizAnswer('${q.id}')"
                                class="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm focus:outline-none focus:border-zinc-900 focus:bg-white transition-colors">
                            <button onclick="submitTextQuizAnswer('${q.id}')"
                                class="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shrink-0">
                                ส่งคำตอบ
                            </button>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            ${(q.options || []).map(opt => `
                                <button onclick="answerQuiz('${q.id}', '${escapeHTML(opt).replace(/'/g, "\\'")}')" 
                                    class="p-3 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white text-sm font-medium text-left transition-all">
                                    ${escapeHTML(opt)}
                                </button>
                            `).join('')}
                        </div>
                    `}

                    ${isMyQuestion ? `
                        <div class="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                            <span>คุณเป็นคนตั้งคำถามนี้ (สามารถพิมพ์/เลือกตอบเล่นด้วยกันได้)</span>
                            <button type="button" onclick="toggleQuizAnswerReveal('${q.id}')" class="text-zinc-700 font-medium underline hover:text-zinc-900">
                                ดู/ซ่อนเฉลย
                            </button>
                        </div>
                        <div id="quiz-reveal-${q.id}" class="hidden mt-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
                            เฉลยที่ตั้งไว้: <strong>${escapeHTML(q.correctAnswer)}</strong>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    const historyContainer = document.getElementById('quiz-history-list');
    if (pastQuizzes.length === 0) {
        historyContainer.innerHTML = `<div class="bg-white border border-zinc-200 rounded-2xl p-6 text-center text-xs text-zinc-400">ยังไม่มีประวัติการเล่น</div>`;
    } else {
        historyContainer.innerHTML = pastQuizzes.map(q => {
            const isTextType = q.type === 'text' || !q.options || q.options.length === 0;
            const modeText = isTextType ? 'พิมพ์ตอบ' : 'ตัวเลือก';
            return `
                <div class="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 text-[11px] text-zinc-400 mb-1">
                            <span>${escapeHTML(q.category)}</span> • <span>${modeText}</span> • <span>ถามโดย ${escapeHTML(q.creatorName)}</span>
                        </div>
                        <p class="text-sm font-semibold text-zinc-900 truncate">${escapeHTML(q.question)}</p>
                        <p class="text-xs text-zinc-500 mt-1">
                            ${escapeHTML(q.answeredByName)} ตอบ: <strong class="text-zinc-800">${escapeHTML(q.selectedAnswer)}</strong> 
                            ${!q.isCorrect ? `(เฉลย: ${escapeHTML(q.correctAnswer)})` : ''}
                        </p>
                    </div>
                    <div class="shrink-0">
                        ${q.isCorrect 
                            ? `<span class="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-medium">ถูกต้อง ✓</span>` 
                            : `<span class="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-500 text-xs font-medium">ตอบผิด ✕</span>`}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ==========================================
// FEATURE 4: TWO LITTLE PETS LOGIC
// ==========================================
window.openRenamePetModal = () => {
    const currentName = state.roomData?.pet?.name || 'เจ้าตัวน้อย';
    const currentEmoji = state.roomData?.pet?.emoji || '🐱';
    openModal(`
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-zinc-900">ตั้งชื่อ & เลือกสัตว์เลี้ยงของเรา</h3>
            <button onclick="closeModal()" class="text-zinc-400 hover:text-zinc-900"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="space-y-4">
            <div>
                <label class="block text-xs font-semibold text-zinc-500 mb-2">เลือกรูปร่างสัตว์เลี้ยง</label>
                <div class="grid grid-cols-5 gap-2">
                    ${['🐱', '🐶', '🐰', '🐻', '🦊'].map(em => `
                        <button type="button" onclick="selectPetEmoji('${em}')" class="pet-em-btn p-3 rounded-xl border ${em === currentEmoji ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-200'} text-2xl">
                            ${em}
                        </button>
                    `).join('')}
                </div>
                <input type="hidden" id="pet-selected-emoji" value="${currentEmoji}">
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-500 mb-1.5">ชื่อสัตว์เลี้ยง</label>
                <input type="text" id="pet-new-name" value="${escapeHTML(currentName)}" maxlength="20"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900">
            </div>
            <div class="pt-2 flex gap-2 justify-end">
                <button onclick="closeModal()" class="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600">ยกเลิก</button>
                <button onclick="savePetIdentity()" class="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800">บันทึก</button>
            </div>
        </div>
    `);
    lucide.createIcons();
};

window.selectPetEmoji = (em) => {
    document.getElementById('pet-selected-emoji').value = em;
    document.querySelectorAll('.pet-em-btn').forEach(btn => {
        if (btn.textContent.trim() === em) {
            btn.classList.add('border-zinc-900', 'bg-zinc-100');
        } else {
            btn.classList.remove('border-zinc-900', 'bg-zinc-100');
        }
    });
};

window.savePetIdentity = async () => {
    if (!state.user || !state.roomId || !state.roomData) return;
    const newName = document.getElementById('pet-new-name').value.trim();
    const newEmoji = document.getElementById('pet-selected-emoji').value;
    if (!newName) return;

    const { me } = getPartnersInfo();
    const pet = { ...state.roomData.pet, name: newName, emoji: newEmoji };
    await dbPatchRoom({ pet });
    await logActivity(`${me.name} เปลี่ยนชื่อสัตว์เลี้ยงของเราเป็น "${newName}" ${newEmoji}`);
    closeModal();
    showToast("บันทึกข้อมูลสัตว์เลี้ยงแล้ว", "success");
};

window.interactPet = async (action) => {
    if (!state.user || !state.roomId || !state.roomData) return;
    const pet = { ...state.roomData.pet };
    let coins = state.roomData.coins || 0;
    const { me } = getPartnersInfo();

    if (action === 'feed') {
        if (coins < 10) {
            showToast("เหรียญไม่พอ! (ต้องใช้ 10 เหรียญ) ลองเช็กอินหรือเล่นเกมเพื่อสะสมเหรียญนะ", "error");
            return;
        }
        coins -= 10;
        pet.hunger = Math.min(100, (pet.hunger || 50) + 25);
        pet.happiness = Math.min(100, (pet.happiness || 50) + 5);
        await logActivity(`${me.name} ให้อาหาร ${pet.name} 🐟`);
        showToast(`ป้อนอาหารให้ ${pet.name} แล้ว!`, "success");
    } else if (action === 'play') {
        if ((pet.energy || 0) < 15) {
            showToast(`${pet.name} เหนื่อยเกินไปแล้ว ให้นอนพักก่อนนะ!`, "info");
            return;
        }
        coins += 5;
        pet.happiness = Math.min(100, (pet.happiness || 50) + 20);
        pet.energy = Math.max(0, (pet.energy || 50) - 15);
        pet.hunger = Math.max(0, (pet.hunger || 50) - 10);
        await logActivity(`${me.name} เล่นกับ ${pet.name} อย่างสนุกสนาน 🧶`);
        showToast(`เล่นกับ ${pet.name} ได้รับ +5 เหรียญ!`, "success");
    } else if (action === 'sleep') {
        pet.energy = Math.min(100, (pet.energy || 50) + 35);
        pet.hunger = Math.max(0, (pet.hunger || 50) - 5);
        await logActivity(`${me.name} พา ${pet.name} เข้านอนพักผ่อน 💤`);
        showToast(`${pet.name} ได้พักผ่อนเต็มที่แล้ว!`, "success");
    }

    await dbPatchRoom({ pet, coins });
};

window.buyOrEquipShopItem = async (itemId) => {
    if (!state.user || !state.roomId || !state.roomData) return;
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const pet = { ...state.roomData.pet };
    const unlocked = pet.unlockedItems || [];
    let coins = state.roomData.coins || 0;
    const { me } = getPartnersInfo();

    if (item.type === 'consumable') {
        if (coins < item.price) {
            showToast("เหรียญไม่เพียงพอ", "error");
            return;
        }
        coins -= item.price;
        if (item.id === 'cake') {
            pet.hunger = Math.min(100, pet.hunger + 30);
            pet.happiness = Math.min(100, pet.happiness + 30);
        } else {
            pet.happiness = Math.min(100, pet.happiness + 35);
        }
        await dbPatchRoom({ pet, coins });
        await logActivity(`${me.name} ซื้อ ${item.name} ให้ ${pet.name}`);
        showToast(`ใช้ ${item.name} เรียบร้อย!`, "success");
        return;
    }

    if (!unlocked.includes(itemId)) {
        if (coins < item.price) {
            showToast("เหรียญไม่เพียงพอ", "error");
            return;
        }
        coins -= item.price;
        unlocked.push(itemId);
        pet.unlockedItems = unlocked;
        await logActivity(`${me.name} ปลดล็อกไอเทม "${item.name}" ${item.icon}`);
        showToast(`ปลดล็อก ${item.name} สำเร็จ!`, "success");
    }

    if (item.type === 'accessory') {
        pet.equippedAccessory = pet.equippedAccessory === item.icon ? '' : item.icon;
    } else if (item.type === 'decor') {
        const decorList = pet.equippedDecor || [];
        if (decorList.includes(item.icon)) {
            pet.equippedDecor = decorList.filter(d => d !== item.icon);
        } else {
            pet.equippedDecor = [...decorList, item.icon];
        }
    }

    await dbPatchRoom({ pet, coins });
};

function renderPetUI() {
    const pet = state.roomData?.pet;
    if (!pet) return;

    document.getElementById('pet-name-display').textContent = pet.name;
    document.getElementById('pet-emoji').textContent = pet.emoji || '🐱';
    document.getElementById('pet-accessory-badge').textContent = pet.equippedAccessory || '';

    const decorContainer = document.getElementById('pet-decor-display');
    decorContainer.innerHTML = (pet.equippedDecor || []).map(icon => `<span>${icon}</span>`).join('');

    let statusMsg = `${pet.name} กำลังอารมณ์ดีและคิดถึงพวกคุณ!`;
    if (pet.hunger < 30) statusMsg = `${pet.name} ท้องร้องแล้ว! รีบให้อาหารหน่อยนะ`;
    else if (pet.energy < 25) statusMsg = `${pet.name} ง่วงนอนมากเลย พาไปพักผ่อนเถอะ`;
    else if (pet.happiness > 85) statusMsg = `${pet.name} มีความสุขสุดๆ ที่ได้อยู่กับคุณสองคน!`;
    document.getElementById('pet-status-text').textContent = statusMsg;

    document.getElementById('pet-stat-hunger').textContent = `${pet.hunger}%`;
    document.getElementById('pet-bar-hunger').style.width = `${pet.hunger}%`;
    document.getElementById('pet-stat-happy').textContent = `${pet.happiness}%`;
    document.getElementById('pet-bar-happy').style.width = `${pet.happiness}%`;
    document.getElementById('pet-stat-energy').textContent = `${pet.energy}%`;
    document.getElementById('pet-bar-energy').style.width = `${pet.energy}%`;

    const unlocked = pet.unlockedItems || [];
    const shopGrid = document.getElementById('pet-shop-grid');
    shopGrid.innerHTML = SHOP_ITEMS.map(item => {
        const isUnlocked = unlocked.includes(item.id);
        const isEquipped = pet.equippedAccessory === item.icon || (pet.equippedDecor || []).includes(item.icon);

        let btnText = `${item.price} เหรียญ`;
        let btnStyle = 'bg-zinc-900 text-white';
        if (item.type !== 'consumable' && isUnlocked) {
            btnText = isEquipped ? 'สวมใส่อยู่' : 'สวมใส่';
            btnStyle = isEquipped ? 'bg-zinc-200 text-zinc-900' : 'bg-white border border-zinc-300 text-zinc-800';
        }

        return `
            <div class="p-3.5 rounded-2xl border border-zinc-200 flex flex-col items-center text-center justify-between">
                <div>
                    <div class="text-3xl mb-2">${item.icon}</div>
                    <p class="text-xs font-semibold text-zinc-900">${item.name}</p>
                </div>
                <button onclick="buyOrEquipShopItem('${item.id}')" class="mt-3 w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors ${btnStyle}">
                    ${btnText}
                </button>
            </div>
        `;
    }).join('');
}

// ==========================================
// DASHBOARD & GLOBAL UI RENDERING
// ==========================================
function renderAllUI() {
    if (!state.roomData) return;
    const { me, partner } = getPartnersInfo();

    document.getElementById('header-world-name').textContent = state.roomData.worldName || 'Our Little World';
    document.getElementById('header-room-code').textContent = state.roomId;
    document.getElementById('header-coins').textContent = state.roomData.coins || 0;
    document.getElementById('shop-coins-display').textContent = state.roomData.coins || 0;

    const badge = document.getElementById('partner-status-badge');
    if (partner) {
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-zinc-900"></span> เชื่อมต่อกับ ${escapeHTML(partner.name)}`;
        document.getElementById('dash-invite-box').classList.add('hidden');
    } else {
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span> รออีกฝ่ายเข้าร่วม`;
        document.getElementById('dash-invite-box').classList.remove('hidden');
        document.getElementById('dash-code-display').textContent = state.roomId;
    }

    renderDashboardUI();
    renderDailyUI();
    renderSomedayUI();
    renderQuizUI();
    renderPetUI();
}

function renderDashboardUI() {
    if (!state.roomData) return;
    const { me, partner } = getPartnersInfo();

    const todayFormatted = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('dash-date').textContent = todayFormatted;
    document.getElementById('dash-greeting').textContent = `สวัสดี ${me.name}${partner ? ` & ${partner.name}` : ''}`;

    const todayStr = getTodayDateString();
    const myToday = state.dailyLogs.find(l => l.date === todayStr && l.uid === me.uid);
    const partnerToday = partner ? state.dailyLogs.find(l => l.date === todayStr && l.uid === partner.uid) : null;

    document.getElementById('dash-daily-preview').innerHTML = `
        <div class="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <p class="text-[11px] text-zinc-400 truncate">${escapeHTML(me.name)}</p>
            <p class="text-sm font-semibold text-zinc-900 mt-1">
                ${myToday ? `${MOOD_MAP[myToday.mood]?.emoji} ${MOOD_MAP[myToday.mood]?.label}` : 'ยังไม่เช็กอิน'}
            </p>
        </div>
        <div class="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <p class="text-[11px] text-zinc-400 truncate">${partner ? escapeHTML(partner.name) : 'คนพิเศษ'}</p>
            <p class="text-sm font-semibold text-zinc-900 mt-1">
                ${partnerToday ? `${MOOD_MAP[partnerToday.mood]?.emoji} ${MOOD_MAP[partnerToday.mood]?.label}` : 'ยังไม่เช็กอิน'}
            </p>
        </div>
    `;

    const pet = state.roomData.pet;
    if (pet) {
        document.getElementById('dash-pet-name').textContent = pet.name;
        document.getElementById('dash-pet-avatar').textContent = pet.emoji || '🐱';
        document.getElementById('dash-pet-hunger').textContent = `${pet.hunger}%`;
        document.getElementById('dash-pet-hunger-bar').style.width = `${pet.hunger}%`;
        document.getElementById('dash-pet-happy').textContent = `${pet.happiness}%`;
        document.getElementById('dash-pet-happy-bar').style.width = `${pet.happiness}%`;
    }

    const totalSomeday = state.somedayItems.length;
    const doneSomeday = state.somedayItems.filter(i => i.completed).length;
    const pctSomeday = totalSomeday === 0 ? 0 : Math.round((doneSomeday / totalSomeday) * 100);
    document.getElementById('dash-someday-percent').textContent = `${pctSomeday}%`;
    document.getElementById('dash-someday-bar').style.width = `${pctSomeday}%`;
    document.getElementById('dash-someday-summary').textContent = totalSomeday === 0 
        ? 'ยังไม่มีรายการสิ่งที่อยากทำด้วยกัน' 
        : `ทำสำเร็จแล้ว ${doneSomeday} จากทั้งหมด ${totalSomeday} รายการ`;

    const myScore = state.quizzes.filter(q => q.answeredByUid === me.uid && q.isCorrect).length;
    const partnerScore = partner ? state.quizzes.filter(q => q.answeredByUid === partner.uid && q.isCorrect).length : 0;
    const pendingQuiz = state.quizzes.filter(q => !q.answeredByUid && q.creatorUid !== me.uid).length;

    document.getElementById('dash-score-p1-name').textContent = me.name;
    document.getElementById('dash-score-p1').textContent = myScore;
    document.getElementById('dash-score-p2-name').textContent = partner ? partner.name : 'คนพิเศษ';
    document.getElementById('dash-score-p2').textContent = partnerScore;
    document.getElementById('dash-quiz-status').textContent = pendingQuiz > 0 
        ? `มี ${pendingQuiz} คำถามใหม่รอให้คุณตอบ!` 
        : 'ทายใจกันผ่านคำถามสนุกๆ';

    const actList = document.getElementById('dash-activity-list');
    if (state.activities.length === 0) {
        actList.innerHTML = `<p class="text-xs text-zinc-400">ยังไม่มีความเคลื่อนไหว</p>`;
    } else {
        actList.innerHTML = state.activities.slice(0, 5).map(a => {
            const time = new Date(a.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="flex items-center justify-between py-2 border-b border-zinc-100 last:border-none">
                    <span class="text-xs text-zinc-700">${escapeHTML(a.message)}</span>
                    <span class="text-[11px] text-zinc-400 shrink-0 ml-2">${time}</span>
                </div>
            `;
        }).join('');
    }
}

// ==========================================
// NAVIGATION, MODALS & UTILITIES
// ==========================================
window.navigateTo = (sectionId) => {
    ['dashboard', 'daily', 'someday', 'quiz', 'pet'].forEach(sec => {
        const el = document.getElementById(`sec-${sec}`);
        if (sec === sectionId) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.nav === sectionId) {
            btn.className = 'nav-btn px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 bg-zinc-900 text-white';
        } else {
            btn.className = 'nav-btn px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 text-zinc-600 hover:bg-zinc-200/60';
        }
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        if (btn.dataset.nav === sectionId) {
            btn.classList.replace('text-zinc-400', 'text-zinc-900');
        } else {
            btn.classList.replace('text-zinc-900', 'text-zinc-400');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.switchAuthTab = (tab) => {
    if (tab === 'create') {
        document.getElementById('tab-create-room').className = 'py-2 text-xs font-semibold rounded-lg bg-white text-zinc-900 shadow-2xs transition-all';
        document.getElementById('tab-join-room').className = 'py-2 text-xs font-semibold rounded-lg text-zinc-500 hover:text-zinc-900 transition-all';
        document.getElementById('panel-create-room').classList.remove('hidden');
        document.getElementById('panel-join-room').classList.add('hidden');
    } else {
        document.getElementById('tab-join-room').className = 'py-2 text-xs font-semibold rounded-lg bg-white text-zinc-900 shadow-2xs transition-all';
        document.getElementById('tab-create-room').className = 'py-2 text-xs font-semibold rounded-lg text-zinc-500 hover:text-zinc-900 transition-all';
        document.getElementById('panel-join-room').classList.remove('hidden');
        document.getElementById('panel-create-room').classList.add('hidden');
    }
};

window.copyInviteCode = () => {
    if (!state.roomId) return;
    const tempInput = document.createElement('input');
    tempInput.value = state.roomId;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast(`คัดลอกรหัสห้อง ${state.roomId} แล้ว!`, "success");
};

window.openActivityModal = () => {
    document.getElementById('notif-dot').classList.add('hidden');
    openModal(`
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-zinc-900">การแจ้งเตือนทั้งหมด</h3>
            <button onclick="closeModal()" class="text-zinc-400 hover:text-zinc-900"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            ${state.activities.length === 0 
                ? '<p class="text-xs text-zinc-400 text-center py-6">ยังไม่มีการแจ้งเตือน</p>'
                : state.activities.map(a => `
                    <div class="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                        <p class="text-xs text-zinc-800">${escapeHTML(a.message)}</p>
                        <p class="text-[10px] text-zinc-400 mt-1">${new Date(a.timestamp).toLocaleString('th-TH')}</p>
                    </div>
                `).join('')}
        </div>
    `);
    lucide.createIcons();
};

window.openSettingsModal = () => {
    const { me, partner } = getPartnersInfo();
    openModal(`
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-zinc-900">ตั้งค่าพื้นที่ส่วนตัว</h3>
            <button onclick="closeModal()" class="text-zinc-400 hover:text-zinc-900"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="space-y-4">
            <div class="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                <div class="flex justify-between"><span class="text-zinc-500">ชื่อโลกของเรา:</span><span class="font-semibold text-zinc-900">${escapeHTML(state.roomData?.worldName || '')}</span></div>
                <div class="flex justify-between"><span class="text-zinc-500">รหัสเชื่อมต่อ:</span><span class="font-mono font-bold text-zinc-900">${state.roomId}</span></div>
                <div class="flex justify-between"><span class="text-zinc-500">สมาชิก 1:</span><span class="font-semibold text-zinc-900">${escapeHTML(me.name)} (คุณ)</span></div>
                <div class="flex justify-between"><span class="text-zinc-500">สมาชิก 2:</span><span class="font-semibold text-zinc-900">${partner ? escapeHTML(partner.name) : 'ยังไม่มี'}</span></div>
            </div>
            <button onclick="handleLeaveRoom()" class="w-full py-3 px-4 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 text-xs font-semibold transition-colors">
                ออกจากห้อง / สลับพื้นที่ส่วนตัว
            </button>
        </div>
    `);
    lucide.createIcons();
};

window.handleLeaveRoom = async (silent = false) => {
    if (!state.user) return;
    try {
        clearSubscriptions();
        const { error } = await supabase.from('profiles').update({ room_code: null }).eq('uid', state.user.uid);
        if (error) throw error;
        state.roomId = null;
        state.roomData = null;
        closeModal();
        showView('auth');
        if (!silent) showToast("ออกจากห้องเรียบร้อยแล้ว", "info");
    } catch (e) {
        console.error("Leave Room Error:", e);
    }
};

function showView(viewName) {
    setLoading(false);
    if (viewName === 'auth') {
        document.getElementById('view-auth').classList.remove('hidden');
        document.getElementById('view-app').classList.add('hidden');
    } else {
        document.getElementById('view-auth').classList.add('hidden');
        document.getElementById('view-app').classList.remove('hidden');
        selectMood('happy');
    }
    lucide.createIcons();
}

function setLoading(isLoading) {
    const loader = document.getElementById('loading-screen');
    if (isLoading) loader.classList.remove('hidden');
    else loader.classList.add('hidden');
}

window.openModal = (html) => {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-backdrop').classList.remove('hidden');
};

window.closeModal = () => {
    document.getElementById('modal-backdrop').classList.add('hidden');
};

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bgClass = type === 'error' ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-white text-zinc-900 border-zinc-200';
    toast.className = `pointer-events-auto px-4 py-3 rounded-xl border shadow-sm text-xs font-medium flex items-center justify-between gap-3 fade-in ${bgClass}`;
    toast.innerHTML = `<span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Start Application
lucide.createIcons();
initApp();