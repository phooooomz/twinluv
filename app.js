import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
// 1. Supabase Initialization const SUPABASE_URL =
'https://vpybtmzoezjcajzcvwfd.supabase.co'; const SUPABASE_ANON_KEY =
'sb_publishable_WO9uj7HXQZCXKrKH5_cHMw_F3pGVjh5'; const isConfigured =
!SUPABASE_URL.includes('YOUR_PROJECT_REF') &&
!SUPABASE_ANON_KEY.startsWith('YOUR_');
let supabase = null; let clientError = null; try { supabase = createClient(SUPABASE_URL,
SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } }); } catch (e) {
clientError = e; console.error("Supabase client init failed:", e); }
// 2. Application State const state = { user: null, userProfile: null, roomId: null, roomData: null,
dailyLogs: [], somedayItems: [], quizzes: [], activities: [], chatMessages: [], selectedMood:
'happy', calendarDate: new Date(), somedayFilter: 'all', unsubscribers: [], lastChatCount: 0 };
// Preset Question Bank const PRESET_QUESTIONS = [ { category: 'ความชอบ', q: 'เครือ                                       ่ งดืม่ แก ้ว
โปรดทีฉ   ่ ั นสงั่ บ่อยทีส  ่ ด
                               ุ คืออะไร?' }, { category: 'ความชอบ', q: 'อาหารจานโปรดทีฉ               ่ ั นกินได ้ไม่มเี บือ
                                                                                                                            ่ คือ
อะไร?' }, { category: 'ความทรงจำ', q: 'สถานทีแ                ่ รกทีเ่ ราสองคนไปเทีย ่ วด ้วยกันคือทีไ่ หน?' }, { category: '
ความทรงจำ', q: 'ความประทับใจแรกตอนทีเ่ ราเจอกันคืออะไร?' }, { category: 'นิสย                         ั ', q: 'เวลาฉั นเครียด
                                                                    ั
หรือไม่สบายใจ ฉั นมักจะทำอะไร?' }, { category: 'นิสย', q: 'สงเล็กๆ น ้อยๆ ทีท ิ ่              ่ ำให ้ฉั นยิม   ้ ได ้ทันทีคอ ื อะไร?'
}, { category: 'เรือ    ่ งราวสว่ นตัว', q: 'ประเทศหรือเมืองในฝั นทีฉ       ่ ั นอยากไปสก ั ครัง้ ในชวี ต   ิ คือทีไ่ หน?' }, {
category: 'เรือ

🐱🌹💤💯💩                                                    ❤️ 🫂 😘 🥰 🥺 🎉 🔥 ✨ ☕ 🍕
                    ่ งราวสว่ นตัว', q: 'ถ ้ามีเวลาว่าง 1 วันเต็มๆ ฉั นอยากทำอะไรมากทีส
// Romantic Stickers Bank const STICKERS = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
                                                                                                  ่ ด
                                                                                                    ุ ?' } ];

' ', ' ', ' ', ' ', ' '];

                                                            🧣       👑
// Shop Items const SHOP_ITEMS = [ { id: 'crown', name: 'มงกุฎจิว๋ ', icon: ' ', price: 50, type:
'accessory' }, { id: 'scarf', name: 'ผ ้าพันคออุน

                          🪴                           🕶️    ่ ๆ', icon: ' ', price: 40, type: 'accessory' }, { id:

                                                                          🛋️
'glasses', name: 'แว่นกันแดดเท่ๆ', icon: ' ', price: 60, type: 'accessory' }, { id: 'plant', name: '


                                                         🍰        🌙
ต ้นไม ้ในห ้อง', icon: ' ', price: 30, type: 'decor' }, { id: 'bed', name: 'เบาะนอนนุ่มนิม
price: 80, type: 'decor' }, { id: 'lamp', name: 'โคมไฟพระจันทร์', icon: ' ', price: 70, type: 'decor' }, {
                                                                                                               ่ ', icon: ' ',



                                                      😊🧸 😫
id: 'cake', name: 'เค ้กพิเศษ (+30 อิม          ่ /สุข)', icon: ' ', price: 25, type: 'consumable' }, { id: 'toy',

                                                                      🥺 😢
name: 'ของเล่นชน          ิ้ โปรด (+30 สุข)', icon: ' ', price: 25, type: 'consumable' } ];


เศร ้า' } };
                       😌
const MOOD_MAP = { happy: { emoji: ' ', label: 'มีความสุข' }, miss: { emoji: ' ', label: 'คิดถึง' },
normal: { emoji: ' ', label: 'ปกติ' }, tired: { emoji: ' ', label: 'เหนือ              ่ ย' }, sad: { emoji: ' ', label: '

// 3. Authentication & Bootstrapping async function initApp() { if (!isConfigured || !supabase) {
showView('auth'); showToast(clientError ? "Supabase error: " + clientError.message : "ยังไม่ได ้ตัง้
ค่า Supabase", "error"); return; } try { const { data: sessionData } = await
supabase.auth.getSession(); let session = sessionData?.session; if (!session) { const { data,
error } = await supabase.auth.signInAnonymously(); if (error) throw error; session =
data.session; } state.user = { uid: session.user.id }; await checkUserRoomStatus(state.user.uid);
requestNotificationPermission(); } catch (error) { console.error("Auth Error:", error); showToast
("เกิดข ้อผิดพลาดในการเชอ            ื่ มต่อระบบ", "error"); showView('auth'); } }
async function checkUserRoomStatus(uid) { try { const { data: profile, error } = await supabase
.from('profiles').select('uid, name, room_code').eq('uid', uid).maybeSingle(); if (error) throw error;
if (profile && profile.room_code) { state.userProfile = { uid, name: profile.name, roomId:
profile.room_code }; state.roomId = profile.room_code; await subscribeToRoom(state.roomId); if
(state.roomId) showView('app'); } else { showView('auth'); } } catch (err) { console.error("Check
Profile Error:", err); showView('auth'); } }
// Data layer helpers async function saveProfile(name, roomCode) { const { error } = await
supabase.from('profiles') .upsert({ uid: state.user.uid, name, room_code: roomCode }, {
onConflict: 'uid' }); if (error) throw error; }
async function dbFetchRoom(code) { const { data, error } = await supabase.from('rooms')
.select('room_code, member_ids, data').eq('room_code', code).maybeSingle(); if (error) throw
error; return data; }
async function dbPatchRoom(patch) { const { error } = await supabase.rpc('patch_room', {
p_code: state.roomId, p_patch: patch }); if (error) throw error; }
async function dbListDocs(kind) { const { data, error } = await supabase.from('room_docs')
.select('id, data').eq('room_code', state.roomId).eq('kind', kind); if (error) throw error; return (data
|| []).map(r => ({ id: r.id, ...r.data })); }
async function dbGetDoc(kind, id) { const { data, error } = await supabase.from('room_docs')
.select('id, data').eq('room_code', state.roomId).eq('kind', kind).eq('id', id).maybeSingle(); if
(error) throw error; return data ? { id: data.id, ...data.data } : null; }
async function dbAddDoc(kind, data) { const { error } = await supabase.from('room_docs')
.insert({ room_code: state.roomId, kind, id: crypto.randomUUID(), data }); if (error) throw error; }
async function dbUpsertDoc(kind, id, data) { const { error } = await supabase.from('room_docs')
.upsert({ room_code: state.roomId, kind, id, data }, { onConflict: 'room_code,kind,id' }); if (error)
throw error; }
async function dbPatchDoc(kind, id, patch) { const { error } = await supabase.rpc('patch_doc', {
p_code: state.roomId, p_kind: kind, p_id: id, p_patch: patch }); if (error) throw error; }
async function dbDeleteDoc(kind, id) { const { error } = await supabase.from('room_docs')
.delete().eq('room_code', state.roomId).eq('kind', kind).eq('id', id); if (error) throw error; }
// 4. Room Creation & Joining function generateRoomCode() { const chars =
'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code = ''; for (let i = 0; i < 6; i++) { code +=
chars.charAt(Math.floor(Math.random() * chars.length)); } return code; }
window.handleCreateRoom = async () => { if (!state.user) return; const name =
document.getElementById('auth-name').value.trim(); const worldName =
document.getElementById('auth-world-name').value.trim() || 'Our Little World';
if (!name) { showToast("กรุณากรอกชอ           ื่ เรียกของคุณก่อนนะ", "error"); return; }
setLoading(true); try { const uid = state.user.uid; let roomCode = null;
for (let attempt = 0; attempt < 5 && !roomCode; attempt++) { const code =
generateRoomCode(); const { error } = await supabase.from('rooms').insert({ room_code: code,
member_ids: [uid], data: { roomCode: code, worldName, createdAt: Date.now(), members: {

        🐱
[uid]: { uid, name, role: 'creator', joinedAt: Date.now() } }, coins: 100, pet: { name: 'เจ ้าตัวน ้อย',
emoji: ' ', hunger: 80, happiness: 85, energy: 90, unlockedItems: [], equippedAccessory: '',
equippedDecor: [] } } }); if (!error) roomCode = code; else if (error.code !== '23505') throw error; }
if (!roomCode) throw new Error('Could not allocate a room code');
await saveProfile(name, roomCode); state.userProfile = { uid, name, roomId: roomCode };
state.roomId = roomCode;
await logActivity(𝑛𝑎𝑚𝑒ไดส     ้ ร้างพื้นที่"{worldName}" ขึน        ้ มา); await subscribeToRoom(roomCode);
showView('app'); showToast("สร ้างพืน                 ่ ว่ นตัวเรียบร ้อยแล ้ว!", "success"); } catch (err) {
                                                  ้ ทีส
console.error("Create Room Error:", err); showToast("ไม่สามารถสร ้างห ้องได ้ กรุณาลองใหม่",
"error"); setLoading(false); } };
window.handleJoinRoom = async () => { if (!state.user) return; const name =
document.getElementById('auth-name').value.trim(); const code =
document.getElementById('auth-invite-code').value.trim().toUpperCase();
if (!name) { showToast("กรุณากรอกชอ             ื่ เรียกของคุณก่อนนะ", "error"); return; } if (code.length !== 6) {
showToast("กรุณากรอกรหัสห ้อง 6 หลักให ้ถูกต ้อง", "error"); return; }
setLoading(true); try { const { error } = await supabase.rpc('join_room', { p_code: code, p_name:
name }); if (error) { setLoading(false); const msg = error.message || ''; if
(msg.includes('room_not_found')) { showToast("ไม่พบห ้องนี้ กรุณาตรวจสอบรหัสอีกครัง้ ", "error"); }
else if (msg.includes('room_full')) { showToast("ห ้องนีม    ้ ผ      ้
                                                               ี ู ้ใชงานครบ 2 คนแล ้ว", "error"); } else {
showToast("เกิดข ้อผิดพลาดในการเข ้าร่วมห ้อง", "error"); } return; }
await saveProfile(name, code); state.userProfile = { uid: state.user.uid, name, roomId: code };
state.roomId = code;
await logActivity(${name} ได ้เข ้าร่วมพืน
showView('app'); showToast("เชอ
                                           ้ ทีข         ❤️
                                               ่ องเราแล ้ว!    ); await subscribeToRoom(code);
                                    ื่ มต่อกับคนพิเศษสำเร็จ!", "success"); } catch (err) {
console.error("Join Room Error:", err); showToast("เกิดข ้อผิดพลาดในการเข ้าร่วมห ้อง", "error");
setLoading(false); } };
// Real-time Subscriptions async function refreshRoom() { const code = state.roomId; if (!code)
return; try { const row = await dbFetchRoom(code); if (code !== state.roomId) return; if (!row) {
showToast("ห ้องนีถ ้ ก
                      ู ลบหรือไม่พบข ้อมูล", "error"); handleLeaveRoom(true); return; }
state.roomData = { ...row.data, roomCode: row.room_code, memberIds: row.member_ids };
renderAllUI(); setLoading(false); } catch (err) { console.error("Room Fetch Error:", err); } }
async function refreshKind(kind) { const code = state.roomId; if (!code) return; try { const items =
await dbListDocs(kind); if (code !== state.roomId) return;
if (kind === 'daily') { items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); state.dailyLogs =
items; renderDailyUI(); renderDashboardUI(); } else if (kind === 'someday') { items.sort((a, b) =>
(b.createdAt || 0) - (a.createdAt || 0)); state.somedayItems = items; renderSomedayUI();
renderDashboardUI(); } else if (kind === 'quizzes') { items.sort((a, b) => (b.createdAt || 0) -
(a.createdAt || 0)); state.quizzes = items; renderQuizUI(); renderDashboardUI(); } else if (kind
=== 'chat') { items.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)); state.chatMessages =
items; renderChatUI();
// Notification on new chat message if (items.length > state.lastChatCount &&
state.lastChatCount > 0) { const latest = items[items.length - 1]; if (latest.senderUid !==
state.user?.uid) { triggerAppNotification("ข ้อความใหม่จากคนพิเศษ", latest.text || "สง่ รูปภาพ/
สติกเกอร์มาหาคุณ"); document.getElementById('chat-badge-dot').classList.remove('hidden');
document.getElementById('mobile-chat-dot').classList.remove('hidden'); } } state.lastChatCount
= items.length; } else if (kind === 'activities') { items.sort((a, b) => (b.timestamp || 0) -
(a.timestamp || 0)); if (state.activities.length > 0 && items.length > state.activities.length) { const
latest = items[0]; if (latest.actorUid !== state.user?.uid) { showToast(latest.message, "info");
triggerAppNotification("แจ ้งเตือนกิจกรรม", latest.message);
document.getElementById('notif-dot').classList.remove('hidden'); } } state.activities = items;
renderDashboardUI(); } } catch (err) { console.error(Fetch ${kind} Error:, err); } }
const ALL_KINDS = ['daily', 'someday', 'quizzes', 'chat', 'activities']; async function refreshAll() {
await refreshRoom(); await Promise.all(ALL_KINDS.map(refreshKind)); }
async function subscribeToRoom(roomCode) { clearSubscriptions(); state.roomId = roomCode;
state.dailyLogs = []; state.somedayItems = []; state.quizzes = []; state.chatMessages = [];
state.activities = []; state.lastChatCount = 0;
await refreshRoom(); if (state.roomId !== roomCode) return; await
Promise.all(ALL_KINDS.map(refreshKind));
let firstSubscribe = true; const channel = supabase.channel(room-${roomCode})
.on('postgres_changes', { event: '', schema: 'public', table: 'rooms', filter:
room_code=eq.${roomCode} }, () => refreshRoom()) .on('postgres_changes', { event: '',
schema: 'public', table: 'room_docs', filter: room_code=eq.${roomCode} }, (payload) => { const
kind = payload.new?.kind || payload.old?.kind; if (kind) refreshKind(kind); else
ALL_KINDS.forEach(refreshKind); }) .subscribe((status) => { if (status === 'SUBSCRIBED') { if
(!firstSubscribe) refreshAll(); firstSubscribe = false; } });
state.unsubscribers.push(() => supabase.removeChannel(channel)); }
function clearSubscriptions() { state.unsubscribers.forEach(unsub => { try { unsub(); } catch (e)
{} }); state.unsubscribers = []; }
document.addEventListener('visibilitychange', () => { if (!document.hidden && state.roomId &&
state.user) refreshAll(); });
async function logActivity(message) { if (!state.user || !state.roomId) return; try { await
dbAddDoc('activities', { message, actorUid: state.user.uid, timestamp: Date.now() }); } catch (e) {
console.error("Log Activity Error:", e); } }
async function addCoins(amount) { if (!state.user || !state.roomId || !state.roomData) return;
const { error } = await supabase.rpc('add_coins', { p_code: state.roomId, p_amount: amount }); if
(error) console.error("Add Coins Error:", error); }
function getPartnersInfo() { const members = state.roomData?.members || {}; const myUid =
state.user?.uid; const me = members[myUid] || { uid: myUid, name: state.userProfile?.name || '
คุณ' }; const partnerUid = Object.keys(members).find(id => id !== myUid); const partner =
partnerUid ? members[partnerUid] : null; return { me, partner }; }
function getTodayDateString() { const d = new Date(); return 𝑑. 𝑔𝑒𝑡𝐹𝑢𝑙𝑙𝑌𝑒𝑎𝑟() −
{String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}; }
// ========================================== // FEATURE 1: REAL-TIME CHAT
LOGIC // ========================================== window.toggleStickerPicker =
() => { const picker = document.getElementById('sticker-picker');
picker.classList.toggle('hidden'); if (!picker.classList.contains('hidden') && picker.children.length
=== 0) { picker.innerHTML = STICKERS.map(st => <button onclick="sendSticker('
𝑠𝑡')"𝑐𝑙𝑎𝑠𝑠 = "𝑡𝑒𝑥𝑡 − 3𝑥𝑙𝑝 − 2𝑟𝑜𝑢𝑛𝑑𝑒𝑑 − 𝑥𝑙ℎ𝑜𝑣𝑒𝑟: 𝑏𝑔 − 𝑧𝑖𝑛𝑐 − 200𝑡𝑟𝑎𝑛𝑠𝑖𝑡𝑖𝑜𝑛 − 𝑐𝑜𝑙𝑜𝑟𝑠𝑓𝑙𝑒𝑥𝑖𝑡𝑒𝑚𝑠 − 𝑐𝑒𝑛𝑡𝑒𝑟𝑗𝑢
{st}</button>).join(''); } };
window.sendSticker = async (sticker) => { await sendChatMessagePayload({ type: 'sticker', text:
sticker }); document.getElementById('sticker-picker').classList.add('hidden'); };
window.sendChatMessage = async () => { const input = document.getElementById('chat-input');
const text = input.value.trim(); if (!text) return; input.value = ''; await sendChatMessagePayload({
type: 'text', text }); };
async function sendChatMessagePayload(payload) { if (!state.user || !state.roomId) return; const
{ me } = getPartnersInfo(); try { await dbAddDoc('chat', { senderUid: state.user.uid, senderName:
me.name, type: payload.type || 'text', text: payload.text || '', mediaUrl: payload.mediaUrl || '',
timestamp: Date.now() }); } catch (e) { console.error("Send Chat Error:", e); showToast("สง่
ข ้อความไม่สำเร็จ", "error"); } }
window.handleChatFileUpload = async (event) => { const file = event.target.files?.[0]; if (!file)
return;
if (file.size > 5 * 1024 * 1024) { showToast("ไฟล์มข     ี นาดใหญ่เกินไป (จำกัดไม่เกิน 5MB)", "error");
return; }
const reader = new FileReader(); reader.onload = async (e) => { const base64Data =
e.target.result; const isVideo = file.type.startsWith('video'); await sendChatMessagePayload({
type: isVideo ? 'video' : 'image', text: isVideo ? '[วิดโี อ]' : '[รูปภาพ]', mediaUrl: base64Data });
showToast("สง่ ไฟล์เรียบร ้อยแล ้ว", "success"); }; reader.readAsDataURL(file); event.target.value =
''; };
function renderChatUI() { const container =
document.getElementById('chat-messages-container'); const myUid = state.user?.uid;

text-xs text-zinc-400">ยังไม่มข                             ❤️
if (state.chatMessages.length === 0) { container.innerHTML = <div class="text-center py-12
                                  ี ้อความ เริม
                                              ่ ต ้นทักทายคนพิเศษกันเลย!       </div>; return; }
container.innerHTML = state.chatMessages.map(msg => { const isMe = msg.senderUid ===
myUid; const timeStr = new Date(msg.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit',
minute: '2-digit' });
let contentHTML = ''; if (msg.type === 'sticker') { contentHTML = <div class="text-4xl
p-1">${escapeHTML(msg.text)}</div>; } else if (msg.type === 'image') { contentHTML = <img
src="${msg.mediaUrl}" alt="image" class="rounded-xl max-h-60 object-cover max-w-full
cursor-pointer" onclick="window.open('${msg.mediaUrl}')">; } else if (msg.type === 'video') {
contentHTML = <video src="${msg.mediaUrl}" controls class="rounded-xl max-h-60
max-w-full"></video>; } else { contentHTML = <p class="text-sm break-words
leading-relaxed">${escapeHTML(msg.text)}</p>; }
return <div class="flex flex-col
𝑖𝑠𝑀𝑒? '𝑖𝑡𝑒𝑚𝑠 − 𝑒𝑛𝑑': '𝑖𝑡𝑒𝑚𝑠 − 𝑠𝑡𝑎𝑟𝑡'" >< 𝑠𝑝𝑎𝑛𝑐𝑙𝑎𝑠𝑠 = "𝑡𝑒𝑥𝑡 − [10𝑝𝑥]𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 400𝑚𝑏 − 1𝑝𝑥 − 1" >
{escapeHTML(msg.senderName)} • ${timeStr}</span> <div class="max-w-[80%]
sm:max-w-[70%] p-3.5 rounded-2xl ${isMe ? 'bg-zinc-900 text-white rounded-tr-xs' : 'bg-white
border border-zinc-200 text-zinc-900 rounded-tl-xs shadow-2xs'}"> ${contentHTML} </div>
</div>; }).join('');
container.scrollTop = container.scrollHeight; }
// ========================================== // FEATURE 2: PWA & MOBILE APP
INSTALL HELPERS // ==========================================
window.openInstallInstructions = () => { const isIOS =
/iphone|ipad|ipod/i.test(navigator.userAgent); openModal(<div class="flex items-center
justify-between mb-4"> <h3 class="text-base font-bold text-zinc-900">ติดตัง้ แอปบนหน ้าจอมือถือ
</h3> <button onclick="closeModal()" class="text-zinc-400 hover:text-zinc-900"><i
data-lucide="x" class="w-5 h-5"></i></button> </div> <div class="space-y-4 text-xs
text-zinc-700 leading-relaxed"> <div class="p-4 rounded-2xl bg-zinc-50 border border-zinc-200

                                                     ♾️
flex items-center gap-3"> <div class="w-12 h-12 rounded-xl bg-zinc-900 text-white flex
items-center justify-center text-xl shrink-0 font-bold"> </div> <div> <p class="font-bold
text-zinc-900">Together • Our Little World</p> <p class="text-[11px] text-zinc-500">แอปพลิเคชน                ั
สว่ นตัวสำหรับคุณสองคน</p> </div> </div> ${isIOS ? <p class="font-semibold text-zinc-900">วิธ ี
ติดตัง้ บน iPhone / iPad (Safari):</p> <ol class="list-decimal pl-4 space-y-1.5 text-zinc-600"> <li>
แตะปุ่ ม <strong>Share (แชร์)</strong> ⎋ ด ้านล่างเบราว์เซอร์ Safari</li> <li>เลือ   ่ นหาแล ้วเลือกเมนู
<strong>"Add to Home Screen" (เพิม           ่ ไปยังหน ้าจอโฮม)</strong></li> <li>แตะ <strong>Add (เพิม   ่ )
</strong> ทีม  ่ ม
                 ุ ขวาบน เป็ นอันเสร็จสนิ้ !</li> </ol> : <p class="font-semibold text-zinc-900">วิธต ี ด
                                                                                                        ิ ตัง้
บน Android (Chrome):</p> <ol class="list-decimal pl-4 space-y-1.5 text-zinc-600"> <li>แตะเมนู
<strong>จุดสามจุด (⋮)</strong> ทีม     ่ ม ุ ขวาบนของเบราว์เซอร์</li> <li>เลือก <strong>"Install app" (ติด
ตัง้ แอป)</strong> หรือ <strong>"Add to Home screen"</strong></li> <li>ยืนยันการติดตัง้ เพือ       ่ เพิม่ ไอ
คอนแอปสด    ี ำสวยงามบนหน ้าจอมือถือของคุณ</li> </ol> } <button onclick="closeModal()"
class="w-full py-3 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800
transition-colors">เข ้าใจแล ้ว</button> </div> ); lucide.createIcons(); };
// ========================================== // FEATURE 3: NOTIFICATION
SYSTEM // ========================================== async function
requestNotificationPermission() { if ('Notification' in window && Notification.permission !==
'granted') { try { await Notification.requestPermission(); } catch (e) {} } }
function triggerAppNotification(title, body) { if ('Notification' in window && Notification.permission
=== 'granted') { try { new Notification(title, { body, icon:
'https://cdn-icons-png.flaticon.com/512/2583/2583344.png' }); } catch (e) {} } }
// ========================================== // DAILY US, SOMEDAY, QUIZ & PET
LOGIC // ========================================== window.selectMood =
(moodKey) => { state.selectedMood = moodKey;
document.querySelectorAll('.mood-btn').forEach(btn => { if (btn.dataset.mood === moodKey) {
btn.classList.add('border-zinc-900', 'bg-zinc-900', 'text-white');
btn.querySelector('span:last-child').classList.replace('text-zinc-700', 'text-white'); } else {
btn.classList.remove('border-zinc-900', 'bg-zinc-900', 'text-white');
btn.querySelector('span:last-child').classList.replace('text-white', 'text-zinc-700'); } }); };
window.submitDailyCheckin = async () => { if (!state.user || !state.roomId) return; const note =
document.getElementById('daily-note-input').value.trim(); const todayStr =
getTodayDateString(); const { me } = getPartnersInfo();
try { const docId = ${todayStr}_${state.user.uid}; const existing = await dbGetDoc('daily', docId);
const isFirstTimeToday = !existing; await dbUpsertDoc('daily', docId, { date: todayStr, uid:
state.user.uid, userName: me.name, mood: state.selectedMood, note, timestamp: Date.now() });
document.getElementById('daily-note-input').value = ''; if (isFirstTimeToday) { await
addCoins(15); showToast("เชก           ็ อินสำเร็จ! ได ้รับ +15 เหรียญ", "success"); } else { showToast
("อัปเดตความรู ้สก ึ วันนีเ้ รียบร ้อย", "success"); } await logActivity(${me.name} เชก    ็ อินความรู ้สก
                                                                                                         ึ :
${MOOD_MAP[state.selectedMood]?.label} ${MOOD_MAP[state.selectedMood]?.emoji}); }
catch (err) { console.error("Daily Checkin Error:", err); showToast("บันทึกไม่สำเร็จ", "error"); } };
window.changeCalendarMonth = (delta) => {
state.calendarDate.setMonth(state.calendarDate.getMonth() + delta); renderCalendar(); };
function renderDailyUI() { const { me, partner } = getPartnersInfo(); const todayStr =
getTodayDateString(); const myToday = state.dailyLogs.find(l => l.date === todayStr && l.uid
=== me.uid); const partnerToday = partner ? state.dailyLogs.find(l => l.date === todayStr &&
l.uid === partner.uid) : null;
document.getElementById('daily-today-cards').innerHTML =
${renderTodayPersonCard(me.name + ' (คุณ)', myToday)} ${partner ?
renderTodayPersonCard(partner.name, partnerToday) : <div class="bg-zinc-50 border
border-dashed border-zinc-300 rounded-2xl p-5 flex flex-col items-center justify-center
text-center"> <p class="text-sm font-medium text-zinc-600">รอคนพิเศษเข ้าร่วมห ้อง</p> <p
class="text-xs text-zinc-400 mt-1">แชร์รหัสห ้อง ${state.roomId} เพือ              ื่ มต่อกัน</p> </div> } ;
                                                                               ่ เชอ
const historyList = document.getElementById('daily-history-list'); if (state.dailyLogs.length === 0)
{ historyList.innerHTML = <p class="text-xs text-zinc-400 text-center py-8">ยังไม่มป             ี ระวัตก ิ าร

                                  😊
เชก็ อิน</p>; } else { historyList.innerHTML = state.dailyLogs.map(log => { const m =
MOOD_MAP[log.mood] || { emoji: ' ', label: 'ปกติ' }; const timeStr = new
Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); return <div
class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-start gap-3"> <div
class="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center
text-xl shrink-0">
𝑚. 𝑒𝑚𝑜𝑗𝑖 < /𝑑𝑖𝑣 >< 𝑑𝑖𝑣𝑐𝑙𝑎𝑠𝑠 = "𝑓𝑙𝑒𝑥 − 1𝑚𝑖𝑛 − 𝑤 − 0" >< 𝑑𝑖𝑣𝑐𝑙𝑎𝑠𝑠 = "𝑓𝑙𝑒𝑥𝑖𝑡𝑒𝑚𝑠 − 𝑐𝑒𝑛𝑡𝑒𝑟𝑗𝑢𝑠𝑡𝑖𝑓𝑦 − 𝑏𝑒𝑡𝑤
{escapeHTML(log.userName)} • <span class="text-zinc-500 font-normal">
𝑚. 𝑙𝑎𝑏𝑒𝑙 < /𝑠𝑝𝑎𝑛 >< /𝑝 >< 𝑠𝑝𝑎𝑛𝑐𝑙𝑎𝑠𝑠 = "𝑡𝑒𝑥𝑡 − [11𝑝𝑥]𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 400" >{log.date}
(${timeStr})</span> </div> ${log.note ?<p class="text-sm text-zinc-700 mt-1
break-words">${escapeHTML(log.note)}</p>:<p class="text-xs text-zinc-400 italic mt-1">ไม่ได ้
เขียนข ้อความเพิม ่ เติม</p>} </div> </div> ; }).join(''); } renderCalendar(); }
function renderTodayPersonCard(title, log) { if (!log) { return <div class="bg-white border
border-zinc-200 rounded-2xl p-5 flex items-center gap-4"> <div class="w-12 h-12 rounded-2xl
bg-zinc-100 flex items-center justify-center text-zinc-400 text-xl">?</div> <div><p class="text-xs
font-semibold text-zinc-500">${escapeHTML(title)}</p><p class="text-sm font-medium
text-zinc-400 mt-0.5">ยังไม่ได ้เชก       ็ อินวันนี<
                                                    ้ /p></div> </div>; } const m = MOOD_MAP[log.mood] ||
         😊
{ emoji: ' ', label: 'ปกติ' }; return <div class="bg-white border border-zinc-200 rounded-2xl p-5">
<div class="flex items-center gap-3.5"> <div class="w-12 h-12 rounded-2xl bg-zinc-50 border
border-zinc-200 flex items-center justify-center text-2xl shrink-0">${m.emoji}</div> <div
class="min-w-0 flex-1"> <div class="flex items-center justify-between"><p class="text-xs
font-semibold text-zinc-500">
𝑒𝑠𝑐𝑎𝑝𝑒𝐻𝑇𝑀𝐿(𝑡𝑖𝑡𝑙𝑒) < /𝑝 >< 𝑠𝑝𝑎𝑛𝑐𝑙𝑎𝑠𝑠 = "𝑡𝑒𝑥𝑡 − [11𝑝𝑥]𝑝𝑥 − 2𝑝𝑦 − 0. 5𝑟𝑜𝑢𝑛𝑑𝑒𝑑 − 𝑚𝑑𝑏𝑔 − 𝑧𝑖𝑛𝑐 − 100𝑡𝑒𝑥
{m.label}</span></div> <p class="text-sm text-zinc-900 mt-1 break-words">${log.note ?
escapeHTML(log.note) : '<span class="text-zinc-400 text-xs">เชก                ็ อินความรู ้สก
                                                                                             ึ แล ้ว</span>'}</p>
</div> </div> </div>; }
function renderCalendar() { const year = state.calendarDate.getFullYear(); const month =
state.calendarDate.getMonth(); const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม",
"เมษายน", "พฤษภาคม", "มิถน       ุ ายน", "กรกฎาคม", "สงิ หาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน",
"ธันวาคม"]; document.getElementById('calendar-month-label').textContent =
${monthNames[month]} ${year + 543};
const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month
+ 1, 0).getDate(); const grid = document.getElementById('calendar-grid'); grid.innerHTML = '';
for (let i = 0; i < firstDay; i++) grid.innerHTML += <div class="p-1.5"></div>; for (let d = 1; d <=
daysInMonth; d++) { const dateStr = 𝑦𝑒𝑎𝑟 −{String(month + 1).padStart(2, '0')}-
𝑆𝑡𝑟𝑖𝑛𝑔(𝑑). 𝑝𝑎𝑑𝑆𝑡𝑎𝑟𝑡(2, '0'); 𝑐𝑜𝑛𝑠𝑡𝑑𝑎𝑦𝐿𝑜𝑔𝑠 = 𝑠𝑡𝑎𝑡𝑒. 𝑑𝑎𝑖𝑙𝑦𝐿𝑜𝑔𝑠. 𝑓𝑖𝑙𝑡𝑒𝑟(𝑙 => 𝑙. 𝑑𝑎𝑡𝑒 === 𝑑𝑎𝑡𝑒𝑆𝑡𝑟); 𝑐𝑜𝑛𝑠𝑡𝑖𝑠𝑇𝑜𝑑𝑎𝑦
{MOOD_MAP[dayLogs[0].mood]?.emoji || '•'}</span> : '';
grid.innerHTML += <div class="aspect-square rounded-xl flex flex-col items-center justify-center
text-xs border
𝑖𝑠𝑇𝑜𝑑𝑎𝑦? '𝑏𝑜𝑟𝑑𝑒𝑟 − 𝑧𝑖𝑛𝑐 − 900𝑓𝑜𝑛𝑡 − 𝑏𝑜𝑙𝑑𝑏𝑔 − 𝑧𝑖𝑛𝑐 − 50': '𝑏𝑜𝑟𝑑𝑒𝑟 − 𝑡𝑟𝑎𝑛𝑠𝑝𝑎𝑟𝑒𝑛𝑡ℎ𝑜𝑣𝑒𝑟: 𝑏𝑔 − 𝑧𝑖𝑛𝑐 − 50'"
{d}</span>${emojiBadge} </div>; } }
// Someday Together window.filterSomeday = (category) => { state.somedayFilter = category;
document.querySelectorAll('.someday-filter-btn').forEach(btn => { btn.className =
btn.dataset.filter === category ? 'someday-filter-btn px-3.5 py-1.5 rounded-xl text-xs
font-medium bg-zinc-900 text-white shrink-0' : 'someday-filter-btn px-3.5 py-1.5 rounded-xl
text-xs font-medium bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 shrink-0';
}); renderSomedayUI(); };
window.openSomedayModal = (editItem = null) => { const isEdit = !!editItem; openModal(<div
class="flex items-center justify-between mb-4"> <h3 class="text-base font-bold
text-zinc-900">${isEdit ? 'แก ้ไขรายการ' : 'เพิม     ่ สงิ่ ทีอ
                                                              ่ ยากทำด ้วยกัน'}</h3> <button
onclick="closeModal()" class="text-zinc-400 hover:text-zinc-900"><i data-lucide="x" class="w-5
h-5"></i></button> </div> <div class="space-y-4"> <div> <label class="block text-xs
font-semibold text-zinc-500 mb-1.5">หมวดหมู<            ่ /label> <select id="sd-category" class="w-full
px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none

   📍
focus:border-zinc-900"> <option value="place" ${editItem?.category === 'place' ? 'selected' :
''}>    สถานทีท
               🍜 ่ อ
                   ี่ ยากไป</option> <option value="food" ${editItem?.category === 'food' ?
'selected' : ''}>
                         🎬
                       อาหารทีอ
'movie' ? 'selected' : ''}>
                               ่ ยากกิน</option> <option value="movie" ${editItem?.category ===
                                  หนัง/ซรี ส ์ อ
                                           ี ท
                                                        ✨
                                               ี่ ยากดู</option> <option value="activity"
𝑒𝑑𝑖𝑡𝐼𝑡𝑒𝑚?. 𝑐𝑎𝑡𝑒𝑔𝑜𝑟𝑦 === '𝑎𝑐𝑡𝑖𝑣𝑖𝑡𝑦'? '𝑠𝑒𝑙𝑒𝑐𝑡𝑒𝑑': '' >                กิจกรรมที่อยากท ำ < /𝑜𝑝𝑡𝑖𝑜𝑛 >< /𝑠𝑒𝑙𝑒𝑐𝑡 >< /𝑑𝑖𝑣 >< 𝑑𝑖𝑣
{isEdit ? escapeHTML(editItem.title) : ''}" placeholder="เชน           ่ ไปดูดาวทีด ่ อยอ่างขาง" class="w-full
px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none
focus:border-zinc-900"> </div> <div> <label class="block text-xs font-semibold text-zinc-500
mb-1.5">รายละเอียดเพิม     ่ เติม</label> <textarea id="sd-desc" rows="2" placeholder="รายละเอียด..."
class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none
focus:border-zinc-900 resize-none">
𝑖𝑠𝐸𝑑𝑖𝑡? 𝑒𝑠𝑐𝑎𝑝𝑒𝐻𝑇𝑀𝐿(𝑒𝑑𝑖𝑡𝐼𝑡𝑒𝑚. 𝑑𝑒𝑠𝑐𝑟𝑖𝑝𝑡𝑖𝑜𝑛||''): '' < /𝑡𝑒𝑥𝑡𝑎𝑟𝑒𝑎 >< /𝑑𝑖𝑣 >< 𝑑𝑖𝑣 >< 𝑙𝑎𝑏𝑒𝑙𝑐𝑙𝑎𝑠𝑠 = "𝑏𝑙𝑜𝑐𝑘𝑡𝑒𝑥𝑡 −
{isEdit ? escapeHTML(editItem.imageUrl || '') : ''}" placeholder="https://..." class="w-full px-3.5
py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900">
</div> <div class="pt-2 flex gap-2 justify-end"> <button onclick="closeModal()" class="px-4
py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600">ยกเลิก</button>
<button onclick="saveSomedayItem('
𝑖𝑠𝐸𝑑𝑖𝑡? 𝑒𝑑𝑖𝑡𝐼𝑡𝑒𝑚. 𝑖𝑑: ''')"𝑐𝑙𝑎𝑠𝑠 = "𝑝𝑥 − 5𝑝𝑦 − 2. 5𝑟𝑜𝑢𝑛𝑑𝑒𝑑 − 𝑥𝑙𝑏𝑔 − 𝑧𝑖𝑛𝑐 − 900𝑡𝑒𝑥𝑡 − 𝑤ℎ𝑖𝑡𝑒𝑡𝑒𝑥𝑡 − 𝑥𝑠𝑓𝑜𝑛𝑡 −
{isEdit ? 'บันทึกการแก ้ไข' : 'เพิม
                                  ่ รายการ'}</button> </div> </div>); lucide.createIcons(); };
window.saveSomedayItem = async (editId) => { if (!state.user || !state.roomId) return; const
category = document.getElementById('sd-category').value; const title =
document.getElementById('sd-title').value.trim(); const description =
document.getElementById('sd-desc').value.trim(); const imageUrl =
document.getElementById('sd-image').value.trim();
if (!title) { showToast("กรุณากรอกชอ       ื่ รายการ", "error"); return; } const { me } = getPartnersInfo();
try { if (editId) { await dbPatchDoc('someday', editId, { category, title, description, imageUrl });
showToast("แก ้ไขรายการเรียบร ้อย", "success"); } else { await dbAddDoc('someday', { category,
title, description, imageUrl, completed: false, createdBy: me.name, createdAt: Date.now() });
await logActivity(𝑚𝑒. 𝑛𝑎𝑚𝑒เพิม   ่ สิง่ ที่อยากท ำดว้ ยกัน: "{title}"); showToast("เพิม
                                                                                      ่ รายการเรียบร ้อยแล ้ว!",
"success"); } closeModal(); } catch (err) { console.error("Save Someday Error:", err); showToast
("เกิดข ้อผิดพลาด", "error"); } };
window.toggleSomedayComplete = async (id, currentStatus, title) => { if (!state.user ||
!state.roomId) return; const { me } = getPartnersInfo(); try { await dbPatchDoc('someday', id, {


showToast("ยอดเยีย
                                                                         🎉
completed: !currentStatus, completedAt: !currentStatus ? Date.now() : null }); if (!currentStatus) {
await addCoins(30); await logActivity(𝑚𝑒. 𝑛𝑎𝑚𝑒ท ำเครื่ องหมายส ำเร็จ: "{title}"               (+30 เหรียญ));
                      ่ ม! ทำสำเร็จไปอีกหนึง่ อย่าง (+30 เหรียญ)", "success"); } } catch (err) {
console.error("Toggle Someday Error:", err); } };
window.deleteSomedayItem = async (id) => { if (!state.user || !state.roomId) return; try { await
dbDeleteDoc('someday', id); showToast("ลบรายการแล ้ว", "info"); } catch (e) {} };
function renderSomedayUI() { const total = state.somedayItems.length; const completed =
state.somedayItems.filter(i => i.completed).length; const percent = total === 0 ? 0 :
Math.round((completed / total) * 100);
document.getElementById('someday-stats-text').textContent = ${completed} / 𝑡𝑜𝑡𝑎𝑙ส ำเร็จ(
{percent}%); document.getElementById('someday-progress-bar').style.width = ${percent}%;
const filtered = state.somedayFilter === 'all' ? state.somedayItems : state.somedayItems.filter(i
=> i.category === state.somedayFilter); const grid = document.getElementById('someday-grid');
if (filtered.length === 0) { grid.innerHTML = <div class="col-span-full bg-white border
border-zinc-200 rounded-2xl p-10 text-center text-xs text-zinc-400">ยังไม่มรี ายการในหมวดหมูน                  ่ ี้
</div>; return; }
                           📍
const catLabels = { place: '                  🍜
                                    สถานที'่ , food: '           🎬
                                                              อาหาร', movie: '
กิจกรรม' }; grid.innerHTML = filtered.map(item => { const safeJson =
                                                                                        ✨
                                                                                   หนัง/ซรี ส
                                                                                            ี '์ , activity: '

encodeURIComponent(JSON.stringify(item)); return <div class="bg-white border
border-zinc-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xs"> <div>
${item.imageUrl ?<div class="h-40 w-full bg-zinc-100 overflow-hidden border-b
border-zinc-100"><img src="${escapeHTML(item.imageUrl)}" class="w-full h-full object-cover
${item.completed ? 'grayscale opacity-75' : ''}"></div>: ''} <div class="p-5"> <div class="flex


class="flex items-center gap-1"> <button
                                                                       ✨
items-center justify-between gap-2 mb-2"> <span class="text-[11px] font-medium px-2.5 py-0.5
rounded-md bg-zinc-100 text-zinc-700">${catLabels[item.category] || ' '}</span> <div
onclick="openSomedayModal(JSON.parse(decodeURIComponent('
𝑠𝑎𝑓𝑒𝐽𝑠𝑜𝑛')))"𝑐𝑙𝑎𝑠𝑠 = "𝑝 − 1. 5𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 400ℎ𝑜𝑣𝑒𝑟: 𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 900𝑟𝑜𝑢𝑛𝑑𝑒𝑑 − 𝑙𝑔" >< 𝑖𝑑𝑎𝑡𝑎 − 𝑙𝑢𝑐𝑖𝑑𝑒
{item.id}')" class="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg"><i data-lucide="trash-2"
class="w-3.5 h-3.5"></i></button> </div> </div> <h4 class="font-bold text-base
𝑖𝑡𝑒𝑚. 𝑐𝑜𝑚𝑝𝑙𝑒𝑡𝑒𝑑? '𝑙𝑖𝑛𝑒 − 𝑡ℎ𝑟𝑜𝑢𝑔ℎ𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 400': '𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 900'" >
{escapeHTML(item.title)}</h4> ${item.description ?<p class="text-xs text-zinc-500 mt-1.5
leading-relaxed">${escapeHTML(item.description)}</p>: ''} </div> </div> <div class="px-5 py-3
bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between"> <span
class="text-[11px] text-zinc-400">เพิม   ่ โดย
𝑒𝑠𝑐𝑎𝑝𝑒𝐻𝑇𝑀𝐿(𝑖𝑡𝑒𝑚. 𝑐𝑟𝑒𝑎𝑡𝑒𝑑𝐵𝑦||'สมาชิก') < /𝑠𝑝𝑎𝑛 >< 𝑏𝑢𝑡𝑡𝑜𝑛𝑜𝑛𝑐𝑙𝑖𝑐𝑘 = "𝑡𝑜𝑔𝑔𝑙𝑒𝑆𝑜𝑚𝑒𝑑𝑎𝑦𝐶𝑜𝑚𝑝𝑙𝑒𝑡𝑒('
{item.id}', 𝑖𝑡𝑒𝑚. 𝑐𝑜𝑚𝑝𝑙𝑒𝑡𝑒𝑑, '{escapeHTML(item.title).replace(/'/g, "\\'")}')" class="px-3 py-1.5
rounded-lg text-xs font-semibold flex items-center gap-1.5
𝑖𝑡𝑒𝑚. 𝑐𝑜𝑚𝑝𝑙𝑒𝑡𝑒𝑑? '𝑏𝑔 − 𝑧𝑖𝑛𝑐 − 900𝑡𝑒𝑥𝑡 − 𝑤ℎ𝑖𝑡𝑒': '𝑏𝑔 − 𝑤ℎ𝑖𝑡𝑒𝑏𝑜𝑟𝑑𝑒𝑟𝑏𝑜𝑟𝑑𝑒𝑟 − 𝑧𝑖𝑛𝑐 − 200𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 700ℎ
{item.completed ? 'check-circle-2' : 'circle'}" class="w-3.5 h-3.5"></i>${item.completed ? 'สำเร็จ
                ่ งหมายสำเร็จ'} </button> </div> </div>; }).join(''); lucide.createIcons(); }
แล ้ว' : 'ทำเครือ
// How Well Do You Know Me? (Quiz) window.openCreateQuizModal = () => { openModal(<div
class="flex items-center justify-between mb-4"> <h3 class="text-base font-bold text-zinc-900">
สร ้างคำถามทายใจให ้อีกฝ่ าย</h3> <button onclick="closeModal()" class="text-zinc-400
hover:text-zinc-900"><i data-lucide="x" class="w-5 h-5"></i></button> </div> <div
class="space-y-4"> <div> <label class="block text-xs font-semibold text-zinc-500 mb-1.5">รูป
แบบการตอบคำถาม</label> <div class="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl">

                                                                  🔘
<button type="button" id="qz-type-choice-btn" onclick="switchQuizType('choice')" class="py-2
text-xs font-semibold rounded-lg bg-white text-zinc-900 shadow-2xs">                  แบบเลือกคำตอบ

                                                                            ✍️
</button> <button type="button" id="qz-type-text-btn" onclick="switchQuizType('text')"
class="py-2 text-xs font-semibold rounded-lg text-zinc-500 hover:text-zinc-900">
ตอบเอง</button> </div> <input type="hidden" id="qz-type" value="choice"> </div> <div
                                                                                                 แบบกรอกคำ

class="flex items-center justify-between bg-zinc-50 p-3 rounded-xl border border-zinc-200">
<span class="text-xs text-zinc-600">คิดคำถามไม่ออก?</span> <button type="button"
onclick="fillRandomQuestion()" class="px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium
rounded-lg hover:bg-zinc-800 flex items-center gap-1.5"><i data-lucide="shuffle" class="w-3.5
h-3.5"></i> สุม   ่ คำถาม</button> </div> <div> <label class="block text-xs font-semibold
text-zinc-500 mb-1.5">หมวดหมู<     ่ /label> <select id="qz-category" class="w-full px-3.5 py-2.5
rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none
focus:border-zinc-900"> <option value="ความชอบ">ความชอบ</option><option value="ความทรง
จำ">ความทรงจำ</option><option value="นิสย           ั ">นิสย  ั </option><option value="เรือ
                                                                                           ่ งราวสว่ นตัว">
   ่ งราวสว่ นตัว</option> </select> </div> <div> <label class="block text-xs font-semibold
เรือ
text-zinc-500 mb-1.5">คำถามของคุณ *</label> <input type="text" id="qz-question" placeholder="
เชน ่ ฉั นชอบกินอะไรเวลาฝนตก?" class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200
text-sm focus:outline-none focus:border-zinc-900"> </div> <div> <label class="block text-xs
font-semibold text-zinc-500 mb-1.5">คำตอบทีถ           ่ ก
                                                         ู ต ้อง (เฉลย) *</label> <input type="text"
id="qz-correct" placeholder="คำตอบทีแ      ่ ท ้จริง" class="w-full px-3.5 py-2.5 rounded-xl border
border-zinc-200 text-sm focus:outline-none focus:border-zinc-900"> <p id="qz-text-hint"
class="hidden text-[11px] text-zinc-400 mt-1">ระบบตรวจคำตอบอัตโนมัต ิ (ไม่สนตัวพิมพ์เล็ก-ใหญ่)
</p> </div> <div id="qz-choices-panel" class="grid grid-cols-2 gap-2"> <div><label class="block
text-xs font-semibold text-zinc-500 mb-1.5">ตัวเลือกหลอก 1 *</label><input type="text"
id="qz-wrong1" placeholder="ตัวเลือก 2" class="w-full px-3 py-2 rounded-xl border
border-zinc-200 text-sm focus:outline-none focus:border-zinc-900"></div> <div><label
class="block text-xs font-semibold text-zinc-500 mb-1.5">ตัวเลือกหลอก 2 *</label><input
type="text" id="qz-wrong2" placeholder="ตัวเลือก 3" class="w-full px-3 py-2 rounded-xl border
border-zinc-200 text-sm focus:outline-none focus:border-zinc-900"></div> </div> <div
class="pt-2 flex gap-2 justify-end"> <button onclick="closeModal()" class="px-4 py-2.5
rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600">ยกเลิก</button> <button
onclick="submitNewQuiz()" class="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs
font-semibold hover:bg-zinc-800">สง่ คำถาม</button> </div> </div>); lucide.createIcons(); };
window.switchQuizType = (type) => { document.getElementById('qz-type').value = type; const
choiceBtn = document.getElementById('qz-type-choice-btn'); const textBtn =
document.getElementById('qz-type-text-btn'); const choicesPanel =
document.getElementById('qz-choices-panel'); const textHint =
document.getElementById('qz-text-hint');
if (type === 'choice') { choiceBtn.className = 'py-2 text-xs font-semibold rounded-lg bg-white
text-zinc-900 shadow-2xs'; textBtn.className = 'py-2 text-xs font-semibold rounded-lg
text-zinc-500 hover:text-zinc-900'; choicesPanel.classList.remove('hidden');
textHint.classList.add('hidden'); } else { textBtn.className = 'py-2 text-xs font-semibold
rounded-lg bg-white text-zinc-900 shadow-2xs'; choiceBtn.className = 'py-2 text-xs
font-semibold rounded-lg text-zinc-500 hover:text-zinc-900';
choicesPanel.classList.add('hidden'); textHint.classList.remove('hidden'); } };
window.fillRandomQuestion = () => { const rand =
PRESET_QUESTIONS[Math.floor(Math.random() * PRESET_QUESTIONS.length)];
document.getElementById('qz-category').value = rand.category;
document.getElementById('qz-question').value = rand.q; };
window.submitNewQuiz = async () => { if (!state.user || !state.roomId) return; const type =
document.getElementById('qz-type')?.value || 'choice'; const category =
document.getElementById('qz-category').value; const question =
document.getElementById('qz-question').value.trim(); const correct =
document.getElementById('qz-correct').value.trim();
if (!question || !correct) { showToast("กรุณากรอกคำถามและเฉลยให ้ครบ", "error"); return; } let
options = []; if (type === 'choice') { const w1 =
document.getElementById('qz-wrong1').value.trim(); const w2 =
document.getElementById('qz-wrong2').value.trim(); if (!w1 || !w2) { showToast("กรุณากรอกตัว
เลือกหลอกให ้ครบ", "error"); return; } options = [correct, w1, w2].sort(() => Math.random() - 0.5); }
const { me } = getPartnersInfo(); try { await dbAddDoc('quizzes', { type, category, question,
correctAnswer: correct, options, creatorUid: state.user.uid, creatorName: me.name,
answeredByUid: null, selectedAnswer: null, isCorrect: null, createdAt: Date.now() }); await
logActivity(𝑚𝑒. 𝑛𝑎𝑚𝑒ตังค  ้ ำถามทายใจใหมใ่ นหมวด"{category}"); closeModal(); showToast("สง่ คำถามให ้
อีกฝ่ ายเรียบร ้อย!", "success"); } catch (err) { console.error("Quiz Error:", err); showToast("เกิดข ้อ
ผิดพลาด", "error"); } };
window.toggleQuizAnswerReveal = (id) =>
document.getElementById(quiz-reveal-${id})?.classList.toggle('hidden');
window.submitTextQuizAnswer = async (id) => { const input =
document.getElementById(quiz-text-input-${id}); if (!input || !input.value.trim()) { showToast
("กรุณากรอกคำตอบก่อน", "error"); return; } await window.answerQuiz(id, input.value.trim()); };
window.answerQuiz = async (quizId, chosen) => { if (!state.user || !state.roomId) return; const
quiz = state.quizzes.find(q => q.id === quizId); if (!quiz || quiz.answeredByUid) return;
const isCorrect = String(chosen).trim().toLowerCase() ===
String(quiz.correctAnswer).trim().toLowerCase(); const { me } = getPartnersInfo();
try { await dbPatchDoc('quizzes', quizId, { answeredByUid: state.user.uid, answeredByName:
me.name, selectedAnswer: String(chosen).trim(), isCorrect, answeredAt: Date.now() }); if
(isCorrect) { await addCoins(20); await logActivity(${me.name} ตอบคำถามของ
${quiz.creatorName} ถูกต ้อง! (+20 เหรียญ)); showToast("ถูกต ้อง! คุณรู ้จักอีกฝ่ ายดีมาก (+20
เหรียญ)", "success"); } else { await logActivity(${me.name} ตอบคำถามของ
𝑞𝑢𝑖𝑧. 𝑐𝑟𝑒𝑎𝑡𝑜𝑟𝑁𝑎𝑚𝑒ผิด); 𝑠ℎ𝑜𝑤𝑇𝑜𝑎𝑠𝑡(ยังไมถ   ่ ูก! เฉลยคือ"{quiz.correctAnswer}", "info"); } } catch (e) {
console.error("Answer Quiz Error:", e); } };
function renderQuizUI() { const { me, partner } = getPartnersInfo(); const myScore =
state.quizzes.filter(q => q.answeredByUid === me.uid && q.isCorrect).length; const
partnerScore = partner ? state.quizzes.filter(q => q.answeredByUid === partner.uid &&
q.isCorrect).length : 0;
document.getElementById('quiz-p1-name').textContent = me.name;
document.getElementById('quiz-p1-avatar').textContent = me.name.charAt(0).toUpperCase();
document.getElementById('quiz-p1-score').innerHTML = ${myScore} <span class="text-xs
font-normal text-zinc-400">คะแนน</span>;
const p2Name = partner ? partner.name : 'รอคนพิเศษ';
document.getElementById('quiz-p2-name').textContent = p2Name;
document.getElementById('quiz-p2-avatar').textContent = p2Name.charAt(0).toUpperCase();
document.getElementById('quiz-p2-score').innerHTML = ${partnerScore} <span class="text-xs
font-normal text-zinc-400">คะแนน</span>;
const activeQuizzes = state.quizzes.filter(q => !q.answeredByUid); const pastQuizzes =
state.quizzes.filter(q => q.answeredByUid);
const activeContainer = document.getElementById('quiz-active-list'); if (activeQuizzes.length
=== 0) { activeContainer.innerHTML = <div class="bg-white border border-zinc-200 rounded-2xl
p-6 text-center text-xs text-zinc-400">ไม่มค  ี ำถามทีร่ อคำตอบ</div>; } else {
activeContainer.innerHTML = activeQuizzes.map(q => { const isMyQ = q.creatorUid ===
me.uid; const isText = q.type === 'text' || !q.options || q.options.length === 0; return <div
class="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs"> <div class="flex
items-center justify-between gap-2 mb-2"> <span class="text-[11px] font-medium px-2.5 py-0.5
rounded-md bg-zinc-100 text-zinc-700">${escapeHTML(q.category)}</span> <span
class="text-xs text-zinc-400">ถามโดย
𝑒𝑠𝑐𝑎𝑝𝑒𝐻𝑇𝑀𝐿(𝑞. 𝑐𝑟𝑒𝑎𝑡𝑜𝑟𝑁𝑎𝑚𝑒) < /𝑠𝑝𝑎𝑛 >< /𝑑𝑖𝑣 >< ℎ4𝑐𝑙𝑎𝑠𝑠 = "𝑓𝑜𝑛𝑡 − 𝑏𝑜𝑙𝑑𝑡𝑒𝑥𝑡 − 𝑏𝑎𝑠𝑒𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 900𝑚
{escapeHTML(q.question)}</h4> ${isText ? <div class="flex gap-2"> <input type="text"
id="quiz-text-input-${q.id}" placeholder="พิมพ์คำตอบของคุณ..."
onkeydown="if(event.key==='Enter') submitTextQuizAnswer('
𝑞. 𝑖𝑑')"𝑐𝑙𝑎𝑠𝑠 = "𝑓𝑙𝑒𝑥 − 1𝑝𝑥 − 3. 5𝑝𝑦 − 2. 5𝑟𝑜𝑢𝑛𝑑𝑒𝑑 − 𝑥𝑙𝑏𝑜𝑟𝑑𝑒𝑟𝑏𝑜𝑟𝑑𝑒𝑟 − 𝑧𝑖𝑛𝑐 − 200𝑡𝑒𝑥𝑡 − 𝑠𝑚𝑓𝑜𝑐𝑢𝑠: 𝑜𝑢𝑡𝑙𝑖𝑛𝑒
{q.id}')" class="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold shrink-0">สง่
</button> </div> : <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5"> {q.options.map(opt =>
`<button onclick="answerQuiz('𝑞. 𝑖𝑑', '{escapeHTML(opt).replace(/'/g, "\\'")}')" class="p-3
rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white
text-sm font-medium text-left transition-all">${escapeHTML(opt)}</button>`).join('')} </div> `}
${isMyQ ? ` <div class="mt-3 pt-3 border-t border-zinc-100 flex justify-between text-xs
text-zinc-500"> <span>คำถามของคุณ</span> <button
onclick="toggleQuizAnswerReveal('${q.id}')" class="underline font-medium text-zinc-700">ดู
เฉลย</button> </div> <div id="quiz-reveal-${q.id}" class="hidden mt-2 p-2.5 rounded-xl
bg-zinc-50 border text-xs text-zinc-700">เฉลย:
<strong>{escapeHTML(q.correctAnswer)}</strong></div> : ''} </div>; }).join(''); }
document.getElementById('quiz-history-list').innerHTML = pastQuizzes.length === 0 ? <div
class="bg-white border border-zinc-200 rounded-2xl p-6 text-center text-xs text-zinc-400">ยังไม่
มีประวัตก   ิ ารเล่น</div> : pastQuizzes.map(q => <div class="bg-white border border-zinc-200
rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs"> <div> <p class="text-xs
text-zinc-400 mb-1">${escapeHTML(q.category)} • ถามโดย
𝑒𝑠𝑐𝑎𝑝𝑒𝐻𝑇𝑀𝐿(𝑞. 𝑐𝑟𝑒𝑎𝑡𝑜𝑟𝑁𝑎𝑚𝑒) < /𝑝 >< 𝑝𝑐𝑙𝑎𝑠𝑠 = "𝑡𝑒𝑥𝑡 − 𝑠𝑚𝑓𝑜𝑛𝑡 − 𝑠𝑒𝑚𝑖𝑏𝑜𝑙𝑑𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 900" >
{escapeHTML(q.question)}</p> <p class="text-xs text-zinc-500 mt-1">
𝑒𝑠𝑐𝑎𝑝𝑒𝐻𝑇𝑀𝐿(𝑞. 𝑎𝑛𝑠𝑤𝑒𝑟𝑒𝑑𝐵𝑦𝑁𝑎𝑚𝑒)ตอบ: < 𝑠𝑡𝑟𝑜𝑛𝑔 >{escapeHTML(q.selectedAnswer)}</strong>
${!q.isCorrect ?(เฉลย: ${escapeHTML(q.correctAnswer)}): ''}</p> </div> <span class="px-2.5
py-1 rounded-lg
𝑞. 𝑖𝑠𝐶𝑜𝑟𝑟𝑒𝑐𝑡? '𝑏𝑔 − 𝑧𝑖𝑛𝑐 − 900𝑡𝑒𝑥𝑡 − 𝑤ℎ𝑖𝑡𝑒': '𝑏𝑔 − 𝑧𝑖𝑛𝑐 − 100𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 500'𝑡𝑒𝑥𝑡 − 𝑥𝑠𝑓𝑜𝑛𝑡 − 𝑚𝑒𝑑𝑖𝑢𝑚"
{q.isCorrect ? 'ถูกต ้อง ✓' : 'ตอบผิด ✕'}</span> </div>).join(''); }
// Two Little Pets & Shop window.openRenamePetModal = () => { const pet =
state.roomData?.pet || {}; openModal(<div class="flex items-center justify-between mb-4"> <h3
class="text-base font-bold text-zinc-900">เปลีย         ่ นชอื่ & สต
                                                                   ั ว์เลีย
                                                                          ้ ง</h3> <button


🐶🐰🐻🦊                                                                               🐱
onclick="closeModal()" class="text-zinc-400 hover:text-zinc-900"><i data-lucide="x" class="w-5
h-5"></i></button> </div> <div class="space-y-4"> <div class="grid grid-cols-5 gap-2"> ${[' ',
' ', ' ', ' ', ' '].map(em =><button
onclick="document.getElementById('pet-selected-emoji').value='${em}'" class="p-3 rounded-xl

                                         🐱
border border-zinc-200 text-2xl">${em}</button>).join('')} </div> <input type="hidden"
id="pet-selected-emoji" value="${pet.emoji || ' '}"> <input type="text" id="pet-new-name"
value="${escapeHTML(pet.name || 'เจ ้าตัวน ้อย')}" class="w-full px-3.5 py-2.5 rounded-xl border
text-sm"> <div class="flex justify-end gap-2"><button onclick="closeModal()" class="px-4 py-2
border rounded-xl text-xs">ยกเลิก</button><button onclick="savePetIdentity()" class="px-5
py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold">บันทึก</button></div> </div> );
lucide.createIcons(); };
window.savePetIdentity = async () => { const name =
document.getElementById('pet-new-name').value.trim(); const emoji =
document.getElementById('pet-selected-emoji').value; if (!name) return; const pet = {
...state.roomData.pet, name, emoji }; await dbPatchRoom({ pet }); closeModal(); showToast
("บันทึกข ้อมูลสต   ั ว์เลีย
                           ้ งแล ้ว", "success"); };
window.interactPet = async (action) => { if (!state.roomData) return; const pet = {
...state.roomData.pet }; let coins = state.roomData.coins || 0; const { me } = getPartnersInfo();
if (action === 'feed') { if (coins < 10) { showToast("เหรียญไม่พอ (ต ้องใช ้ 10 เหรียญ)", "error");
return; } coins -= 10; pet.hunger = Math.min(100, (pet.hunger || 50) + 25); showToast("ป้ อนอาหาร
แล ้ว!", "success"); } else if (action === 'play') { coins += 5; pet.happiness = Math.min(100,
(pet.happiness || 50) + 20); pet.energy = Math.max(0, (pet.energy || 50) - 15); showToast("เล่น
กับสต  ั ว์เลีย
              ้ ง ได ้รับ +5 เหรียญ!", "success"); } else if (action === 'sleep') { pet.energy =
Math.min(100, (pet.energy || 50) + 35); showToast("ให ้นอนพักผ่อนแล ้ว", "success"); } await
dbPatchRoom({ pet, coins }); };
window.buyOrEquipShopItem = async (id) => { const item = SHOP_ITEMS.find(i => i.id === id);
if (!item) return; const pet = { ...state.roomData.pet }; let unlocked = pet.unlockedItems || []; let
coins = state.roomData.coins || 0;
if (item.type === 'consumable') { if (coins < item.price) { showToast("เหรียญไม่พอ", "error");
return; } coins -= item.price; pet.happiness = Math.min(100, pet.happiness + 30); await
dbPatchRoom({ pet, coins }); showToast(ใช ้ ${item.name} สำเร็จ!, "success"); return; }
if (!unlocked.includes(id)) { if (coins < item.price) { showToast("เหรียญไม่พอ", "error"); return; }
coins -= item.price; unlocked.push(id); pet.unlockedItems = unlocked; showToast(ปลดล็อก
${item.name}!, "success"); }
if (item.type === 'accessory') pet.equippedAccessory = pet.equippedAccessory === item.icon ?
'' : item.icon; else if (item.type === 'decor') { let decor = pet.equippedDecor || [];
pet.equippedDecor = decor.includes(item.icon) ? decor.filter(d => d !== item.icon) : [...decor,
item.icon]; } await dbPatchRoom({ pet, coins }); };
function renderPetUI() { const pet = state.roomData?.pet; if (!pet) return;

                                                              🐱
document.getElementById('pet-name-display').textContent = pet.name;
document.getElementById('pet-emoji').textContent = pet.emoji || ' ';
document.getElementById('pet-accessory-badge').textContent = pet.equippedAccessory || '';
document.getElementById('pet-decor-display').innerHTML = (pet.equippedDecor || []).map(i =>
<span>${i}</span>).join('');
document.getElementById('pet-stat-hunger').textContent = ${pet.hunger}%;
document.getElementById('pet-bar-hunger').style.width = ${pet.hunger}%;
document.getElementById('pet-stat-happy').textContent = ${pet.happiness}%;
document.getElementById('pet-bar-happy').style.width = ${pet.happiness}%;
document.getElementById('pet-stat-energy').textContent = ${pet.energy}%;
document.getElementById('pet-bar-energy').style.width = ${pet.energy}%;
const unlocked = pet.unlockedItems || []; document.getElementById('pet-shop-grid').innerHTML
= SHOP_ITEMS.map(item => { const isUnlocked = unlocked.includes(item.id); const isEquipped
= pet.equippedAccessory === item.icon || (pet.equippedDecor || []).includes(item.icon); let
btnText =
𝑖𝑡𝑒𝑚. 𝑝𝑟𝑖𝑐𝑒เหรี ยญ, 𝑏𝑡𝑛𝑆𝑡𝑦𝑙𝑒 = '𝑏𝑔 − 𝑧𝑖𝑛𝑐 − 900𝑡𝑒𝑥𝑡 − 𝑤ℎ𝑖𝑡𝑒'; 𝑖𝑓(𝑖𝑡𝑒𝑚. 𝑡𝑦𝑝𝑒! == '𝑐𝑜𝑛𝑠𝑢𝑚𝑎𝑏𝑙𝑒'&&𝑖𝑠𝑈𝑛𝑙𝑜𝑐𝑘𝑒𝑑)𝑏𝑡
{item.icon}</div><p class="text-xs font-semibold text-zinc-900">
𝑖𝑡𝑒𝑚. 𝑛𝑎𝑚𝑒 < /𝑝 >< /𝑑𝑖𝑣 >< 𝑏𝑢𝑡𝑡𝑜𝑛𝑜𝑛𝑐𝑙𝑖𝑐𝑘 = "𝑏𝑢𝑦𝑂𝑟𝐸𝑞𝑢𝑖𝑝𝑆ℎ𝑜𝑝𝐼𝑡𝑒𝑚('{item.id}')" class="mt-3
w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold 𝑏𝑡𝑛𝑆𝑡𝑦𝑙𝑒" >{btnText}</button> </div>;
}).join(''); }
// Global UI Rendering & Navigation function renderAllUI() { if (!state.roomData) return; const {
me, partner } = getPartnersInfo();
document.getElementById('header-world-name').textContent = state.roomData.worldName ||
'Our Little World'; document.getElementById('header-room-code').textContent = state.roomId;
document.getElementById('header-coins').textContent = state.roomData.coins || 0;
document.getElementById('shop-coins-display').textContent = state.roomData.coins || 0;
const badge = document.getElementById('partner-status-badge'); if (partner) {
badge.innerHTML = <span class="w-1.5 h-1.5 rounded-full bg-zinc-900"></span> เชอ       ื่ มต่อกับ
${escapeHTML(partner.name)};
document.getElementById('dash-invite-box').classList.add('hidden'); } else { badge.innerHTML =
<span class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span> รออีกฝ่ ายเข ้าร่วม;
document.getElementById('dash-invite-box').classList.remove('hidden');
document.getElementById('dash-code-display').textContent = state.roomId; }
renderDashboardUI(); renderDailyUI(); renderSomedayUI(); renderQuizUI(); renderPetUI();
renderChatUI(); }
function renderDashboardUI() { if (!state.roomData) return; const { me, partner } =
getPartnersInfo();
document.getElementById('dash-date').textContent = new Date().toLocaleDateString('th-TH', {
weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
document.getElementById('dash-greeting').textContent = สวัสดี 𝑚𝑒. 𝑛𝑎𝑚𝑒{partner ? &
${partner.name} : ''};
const todayStr = getTodayDateString(); const myToday = state.dailyLogs.find(l => l.date ===
todayStr && l.uid === me.uid); const partnerToday = partner ? state.dailyLogs.find(l => l.date
=== todayStr && l.uid === partner.uid) : null;
document.getElementById('dash-daily-preview').innerHTML = <div class="p-3 rounded-xl
bg-zinc-50 border border-zinc-100"><p class="text-[11px] text-zinc-400 truncate">
𝑒𝑠𝑐𝑎𝑝𝑒𝐻𝑇𝑀𝐿(𝑚𝑒. 𝑛𝑎𝑚𝑒) < /𝑝 >< 𝑝𝑐𝑙𝑎𝑠𝑠 = "𝑡𝑒𝑥𝑡 − 𝑠𝑚𝑓𝑜𝑛𝑡 − 𝑠𝑒𝑚𝑖𝑏𝑜𝑙𝑑𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 900𝑚𝑡 − 1" >
{myToday ?${MOOD_MAP[myToday.mood]?.emoji} {MOOD_MAP[myToday.mood]?.label}` : 'ยัง
ไม่เชก  ็ อิน'}</p></div> <div class="p-3 rounded-xl bg-zinc-50 border border-zinc-100"><p
class="text-[11px] text-zinc-400 truncate">${partner ? escapeHTML(partner.name) : 'คนพิเศษ
'}</p><p class="text-sm font-semibold text-zinc-900 mt-1">${partnerToday ?
`{MOOD_MAP[partnerToday.mood]?.emoji} ${MOOD_MAP[partnerToday.mood]?.label}: 'ยังไม่
เชก ็ อิน'}</p></div>;
const pet = state.roomData.pet; if (pet) {

                                                               🐱
document.getElementById('dash-pet-name').textContent = pet.name;
document.getElementById('dash-pet-avatar').textContent = pet.emoji || ' ';
document.getElementById('dash-pet-hunger').textContent = ${pet.hunger}%;
document.getElementById('dash-pet-hunger-bar').style.width = ${pet.hunger}%;
document.getElementById('dash-pet-happy').textContent = ${pet.happiness}%;
document.getElementById('dash-pet-happy-bar').style.width = ${pet.happiness}%; }
const totalSomeday = state.somedayItems.length; const doneSomeday =
state.somedayItems.filter(i => i.completed).length; const pctSomeday = totalSomeday === 0 ? 0
: Math.round((doneSomeday / totalSomeday) * 100);
document.getElementById('dash-someday-percent').textContent = ${pctSomeday}%;
document.getElementById('dash-someday-bar').style.width = ${pctSomeday}%;
document.getElementById('dash-someday-summary').textContent = totalSomeday === 0 ? 'ยัง
ไม่มรี ายการสงิ่ ทีอ
                   ่ ยากทำด ้วยกัน' : ทำสำเร็จแล ้ว ${doneSomeday} จากทัง้ หมด ${totalSomeday}
รายการ;
const myScore = state.quizzes.filter(q => q.answeredByUid === me.uid && q.isCorrect).length;
const partnerScore = partner ? state.quizzes.filter(q => q.answeredByUid === partner.uid &&
q.isCorrect).length : 0; document.getElementById('dash-score-p1-name').textContent =
me.name; document.getElementById('dash-score-p1').textContent = myScore;
document.getElementById('dash-score-p2-name').textContent = partner ? partner.name : 'คน
พิเศษ'; document.getElementById('dash-score-p2').textContent = partnerScore;
if (state.chatMessages.length > 0) { const last = state.chatMessages[state.chatMessages.length
- 1]; document.getElementById('dash-latest-chat').textContent = ${last.senderName}: ${last.text
|| 'สง่ สอื่ '}; }
const actList = document.getElementById('dash-activity-list'); actList.innerHTML =
state.activities.length === 0 ? <p class="text-xs text-zinc-400">ยังไม่มค  ี วามเคลือ
                                                                                    ่ นไหว</p> :
state.activities.slice(0, 5).map(a => <div class="flex items-center justify-between py-2 border-b
border-zinc-100 last:border-none"> <span class="text-xs text-zinc-700">
𝑒𝑠𝑐𝑎𝑝𝑒𝐻𝑇𝑀𝐿(𝑎. 𝑚𝑒𝑠𝑠𝑎𝑔𝑒) < /𝑠𝑝𝑎𝑛 >< 𝑠𝑝𝑎𝑛𝑐𝑙𝑎𝑠𝑠 = "𝑡𝑒𝑥𝑡 − [11𝑝𝑥]𝑡𝑒𝑥𝑡 − 𝑧𝑖𝑛𝑐 − 400𝑠ℎ𝑟𝑖𝑛𝑘 − 0𝑚𝑙 − 2" >
{new Date(a.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
</div>).join(''); }
window.navigateTo = (sectionId) => { ['dashboard', 'chat', 'daily', 'someday', 'quiz',
'pet'].forEach(sec => { const el = document.getElementById(sec-${sec}); if (sec === sectionId)
el.classList.remove('hidden'); else el.classList.add('hidden'); });
document.querySelectorAll('.nav-btn').forEach(btn => { btn.className = btn.dataset.nav ===
sectionId ? 'nav-btn px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center
gap-2 bg-zinc-900 text-white shrink-0' : 'nav-btn px-4 py-2 rounded-xl text-sm font-medium
transition-all flex items-center gap-2 text-zinc-600 hover:bg-zinc-200/60 shrink-0'; });
document.querySelectorAll('.mobile-nav-btn').forEach(btn => { btn.className = btn.dataset.nav
=== sectionId ? 'mobile-nav-btn relative flex flex-col items-center gap-1 p-1.5 rounded-xl
text-zinc-900 font-semibold' : 'mobile-nav-btn relative flex flex-col items-center gap-1 p-1.5
rounded-xl text-zinc-400'; });
if (sectionId === 'chat') { document.getElementById('chat-badge-dot').classList.add('hidden');
document.getElementById('mobile-chat-dot').classList.add('hidden'); } window.scrollTo({ top: 0,
behavior: 'smooth' }); };
window.switchAuthTab = (tab) => { if (tab === 'create') {
document.getElementById('tab-create-room').className = 'py-2 text-xs font-semibold
rounded-lg bg-white text-zinc-900 shadow-2xs';
document.getElementById('tab-join-room').className = 'py-2 text-xs font-semibold rounded-lg
text-zinc-500'; document.getElementById('panel-create-room').classList.remove('hidden');
document.getElementById('panel-join-room').classList.add('hidden'); } else {
document.getElementById('tab-join-room').className = 'py-2 text-xs font-semibold rounded-lg
bg-white text-zinc-900 shadow-2xs'; document.getElementById('tab-create-room').className =
'py-2 text-xs font-semibold rounded-lg text-zinc-500';
document.getElementById('panel-join-room').classList.remove('hidden');
document.getElementById('panel-create-room').classList.add('hidden'); } };
window.copyInviteCode = () => { if (!state.roomId) return;
navigator.clipboard?.writeText(state.roomId); showToast(คัดลอกรหัสห ้อง ${state.roomId} แล ้ว!,
"success"); };
window.openActivityModal = () => {
document.getElementById('notif-dot').classList.add('hidden'); openModal(<div class="flex
items-center justify-between mb-4"> <h3 class="text-base font-bold text-zinc-900">การแจ ้งเตือน
ทัง้ หมด</h3> <button onclick="closeModal()" class="text-zinc-400 hover:text-zinc-900"><i
data-lucide="x" class="w-5 h-5"></i></button> </div> <div class="space-y-2.5 max-h-80
overflow-y-auto pr-1"> ${state.activities.length === 0 ? '<p class="text-xs text-zinc-400
text-center py-6">ยังไม่มก          ี ารแจ ้งเตือน</p>' : state.activities.map(a => <div class="p-3 rounded-xl
bg-zinc-50 border border-zinc-100"> <p class="text-xs
text-zinc-800">{escapeHTML(a.message)}</p> <p class="text-[10px] text-zinc-400 mt-1">{new
Date(a.timestamp).toLocaleString('th-TH')}</p> </div> ).join('')} </div> ); lucide.createIcons(); };
window.openSettingsModal = () => { const { me, partner } = getPartnersInfo(); openModal(<div
class="flex items-center justify-between mb-4"> <h3 class="text-base font-bold text-zinc-900">
ตัง้ ค่าพืน   ่ ว่ นตัว</h3> <button onclick="closeModal()" class="text-zinc-400
          ้ ทีส
hover:text-zinc-900"><i data-lucide="x" class="w-5 h-5"></i></button> </div> <div
class="space-y-4"> <div class="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2
text-xs"> <div class="flex justify-between"><span class="text-zinc-500">ชอ                  ื่ โลก:</span><span
class="font-semibold text-zinc-900">
𝑒𝑠𝑐𝑎𝑝𝑒𝐻𝑇𝑀𝐿(𝑠𝑡𝑎𝑡𝑒. 𝑟𝑜𝑜𝑚𝐷𝑎𝑡𝑎?. 𝑤𝑜𝑟𝑙𝑑𝑁𝑎𝑚𝑒||'') < /𝑠𝑝𝑎𝑛 >< /𝑑𝑖𝑣 >< 𝑑𝑖𝑣𝑐𝑙𝑎𝑠𝑠 = "𝑓𝑙𝑒𝑥𝑗𝑢𝑠𝑡𝑖𝑓𝑦 − 𝑏𝑒𝑡𝑤𝑒𝑒𝑛" >
{state.roomId}</span></div> <div class="flex justify-between"><span class="text-zinc-500">
สมาชก   ิ 1:</span><span class="font-semibold text-zinc-900">
𝑒𝑠𝑐𝑎𝑝𝑒𝐻𝑇𝑀𝐿(𝑚𝑒. 𝑛𝑎𝑚𝑒)(คุณ) < /𝑠𝑝𝑎𝑛 >< /𝑑𝑖𝑣 >< 𝑑𝑖𝑣𝑐𝑙𝑎𝑠𝑠 = "𝑓𝑙𝑒𝑥𝑗𝑢𝑠𝑡𝑖𝑓𝑦 − 𝑏𝑒𝑡𝑤𝑒𝑒𝑛" >< 𝑠𝑝𝑎𝑛𝑐𝑙𝑎𝑠𝑠 = "𝑡
{partner ? escapeHTML(partner.name) : 'ยังไม่ม'ี }</span></div> </div> <button
onclick="openInstallInstructions()" class="w-full py-3 px-4 rounded-xl border border-zinc-200
text-zinc-700 hover:bg-zinc-50 text-xs font-semibold flex items-center justify-center gap-2"> <i
data-lucide="download" class="w-4 h-4"></i> วิธต               ี ด
                                                                 ิ ตัง้ แอปบนหน ้าจอมือถือ </button> <button
onclick="handleLeaveRoom()" class="w-full py-3 px-4 rounded-xl border border-zinc-300
text-zinc-700 hover:bg-zinc-900 hover:text-white text-xs font-semibold transition-colors"> ออก
จากห ้อง / สลับพืน         ่ ว่ นตัว </button> </div>); lucide.createIcons(); };
                       ้ ทีส
window.handleLeaveRoom = async (silent = false) => { if (!state.user) return; try {
clearSubscriptions(); await supabase.from('profiles').update({ room_code: null }).eq('uid',
state.user.uid); state.roomId = null; state.roomData = null; closeModal(); showView('auth'); if
(!silent) showToast("ออกจากห ้องแล ้ว", "info"); } catch (e) { console.error("Leave Room Error:", e);
} };
function showView(name) { setLoading(false); if (name === 'auth') {
document.getElementById('view-auth').classList.remove('hidden');
document.getElementById('view-app').classList.add('hidden'); } else {
document.getElementById('view-auth').classList.add('hidden');
document.getElementById('view-app').classList.remove('hidden'); selectMood('happy'); }
lucide.createIcons(); }
function setLoading(isLoading) { const loader = document.getElementById('loading-screen'); if
(isLoading) loader.classList.remove('hidden'); else loader.classList.add('hidden'); }
window.openModal = (html) => { document.getElementById('modal-content').innerHTML = html;
document.getElementById('modal-backdrop').classList.remove('hidden'); lucide.createIcons(); };
window.closeModal = () => document.getElementById('modal-backdrop').classList.add('hidden');
function showToast(message, type = 'info') { const container =
document.getElementById('toast-container'); const toast = document.createElement('div'); const
bg = type === 'error' ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-white text-zinc-900
border-zinc-200'; toast.className = pointer-events-auto px-4 py-3 rounded-xl border
shadow-sm text-xs font-medium flex items-center justify-between gap-3 fade-in
𝑏𝑔; 𝑡𝑜𝑎𝑠𝑡. 𝑖𝑛𝑛𝑒𝑟𝐻𝑇𝑀𝐿 =< 𝑠𝑝𝑎𝑛 >{escapeHTML(message)}</span>;
container.appendChild(toast); setTimeout(() => { toast.style.opacity = '0'; setTimeout(() =>
toast.remove(), 300); }, 3500); }
function escapeHTML(str) { if (!str) return ''; return String(str).replace(/&/g, '&').replace(/</g,
'<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '''); }
lucide.createIcons(); initApp();
