// ============================================================
// KIMKO-EDU 미스터리 타임 · 공용 모듈
// mystery.html / mystery-host.html / mystery-board.html / mystery-admin.html 이 함께 사용
// ============================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import {
  getFirestore, doc, setDoc, getDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';

// 페이지에서 Firestore 함수를 이 파일 하나로 가져다 쓰도록 그대로 내보냄
export * from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';

// ---------- 연결 정보 (공개해도 되는 값) ----------
const firebaseConfig = {
  apiKey: "AIzaSyB94xmL8JSpmTfERsoWPlYy9mDYP5l_fIs",
  authDomain: "kimko-games.firebaseapp.com",
  projectId: "kimko-games",
  storageBucket: "kimko-games.firebasestorage.app",
  messagingSenderId: "579974375902",
  appId: "1:579974375902:web:1794fd7a92044f9bbb154f"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ---------- 페이지 주소 ----------
export function pageUrl(file, params) {
  const u = new URL(file, location.href);
  if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}

// ---------- 익명 로그인 + 시계 맞추기 ----------
let clockOffset = 0; // 서버 시각 - 내 기기 시각 (ms)
export function now() { return Date.now() + clockOffset; }

export function ready() {
  return new Promise((resolve, reject) => {
    const stop = onAuthStateChanged(auth, async (user) => {
      stop();
      try {
        if (!user) user = (await signInAnonymously(auth)).user;
        await syncClock(user.uid);
        resolve(user.uid);
      } catch (e) { reject(e); }
    }, reject);
  });
}

// 내 칸에 서버 시각을 써 보고 읽어 와서 기기 시계 차이를 잼 (기기마다 타이머가 어긋나지 않게)
async function syncClock(uid) {
  try {
    const ref = doc(db, 'connectionTest', uid);
    const t0 = Date.now();
    await setDoc(ref, { clock: serverTimestamp() }, { merge: true });
    const snap = await getDoc(ref);
    const t1 = Date.now();
    const server = snap.data().clock.toMillis();
    clockOffset = server - (t0 + t1) / 2;
  } catch (e) {
    clockOffset = 0; // 실패해도 게임은 진행 (기기 시계 사용)
  }
}

// ---------- 기본 설정 (40분 수업용) ----------
export const DEFAULT_SETTINGS = {
  teamMode: 'fixed',     // 'fixed' = 모둠 수 직접, 'auto' = 접속한 기기 수만큼
  teamCount: 6,
  maxTeams: 6,           // fixed면 teamCount, auto면 12
  limitSec: 23 * 60,     // 제한 시간
  hintFirstSec: 6 * 60,  // 첫 힌트
  hintEverySec: 3 * 60,  // 힌트 간격
  qPenaltySec: 30,       // 질문 1개 벌칙
  wrongPenaltySec: 120,  // 오답 벌칙
  unsolvedExtraSec: 300  // 못 맞히면 제한 시간 + 이만큼
};

// ---------- 답변 4가지 ----------
export const ANSWERS = {
  yes:   { long: '네, 그렇습니다',          short: '네',        cls: 'a-yes' },
  no:    { long: '아니요, 그렇지 않습니다',  short: '아니요',     cls: 'a-no' },
  maybe: { long: '그럴 수도 있습니다',        short: '그럴 수도',  cls: 'a-may' },
  nul:   { long: '중요하지 않습니다',         short: '중요X',     cls: 'a-nul' }
};

// ---------- 시간 계산 ----------
export function ms(ts) {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  return null;
}

// 게임 시작 후 지난 시간(초). 종료되면 그 순간에서 멈춤. 제한 시간을 넘지 않음.
export function elapsedSec(room, nowMs = now()) {
  const st = ms(room && room.startedAt);
  if (!st) return 0;
  const en = ms(room.endedAt);
  const end = (room.status === 'ended' && en) ? en : nowMs;
  return Math.max(0, Math.min(room.settings.limitSec, (end - st) / 1000));
}

export function remainSec(room, nowMs = now()) {
  if (!room || room.status === 'lobby') return room ? room.settings.limitSec : 0;
  if (room.status === 'ended') return 0;
  return Math.max(0, room.settings.limitSec - elapsedSec(room, nowMs));
}

export function fmt(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// 모둠 기록 = (정답이면 맞힌 시각 / 못 맞히면 제한+5분 / 진행 중이면 지난 시간) + 벌칙
export function teamScore(team, room, nowMs = now()) {
  const s = room.settings;
  const pen = (team.questions || 0) * s.qPenaltySec + (team.wrong || 0) * s.wrongPenaltySec;
  const el = elapsedSec(room, nowMs);
  const over = room.status === 'ended' || el >= s.limitSec;
  let base, state;
  if (team.solved) { base = team.solvedAtSec || 0; state = 'solved'; }
  else if (over) { base = s.limitSec + s.unsolvedExtraSec; state = 'unsolved'; }
  else { base = el; state = 'playing'; }
  return { score: base + pen, pen, base, state };
}

// teams: [{id, ...data}] → 기록 순 정렬 + 순위(동점 같은 순위)
export function rankTeams(teams, room, nowMs = now()) {
  const list = teams.map(t => ({ ...t, ...teamScore(t, room, nowMs) }));
  list.sort((a, b) => (Math.floor(a.score) - Math.floor(b.score)) || (Number(a.id) - Number(b.id)));
  let prev = null, rank = 0;
  list.forEach((t, i) => {
    const sc = Math.floor(t.score);
    if (sc !== prev) { rank = i + 1; prev = sc; }
    t.rank = rank;
  });
  return list;
}

// ---------- 힌트 일정 ----------
// 정해진 칸(6분, 9분, 12분 …)마다 하나씩 + 정답 모둠이 나오면 하나 더
export function hintSlotTimes(room) {
  const s = room.settings, n = room.hintCount || 0, out = [];
  for (let i = 0; i < n; i++) {
    const t = s.hintFirstSec + i * s.hintEverySec;
    if (t < s.limitSec) out.push(t);
  }
  return out;
}
export function slotsDue(room, el) {
  return hintSlotTimes(room).filter(t => t <= el).length;
}
// 다음 자동 힌트까지 남은 초 (없으면 null)
export function nextHintIn(room, el) {
  if ((room.hintsRevealed || []).length >= (room.hintCount || 0)) return null;
  const t = hintSlotTimes(room).find(t => t > el);
  return t == null ? null : t - el;
}

// ---------- 키워드 자동 찾기 ----------
const norm = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
// mainKeywords: [{label:'감기', match:['감기','열이']}]
export function findKeywords(text, mainKeywords) {
  const t = norm(text);
  return (mainKeywords || []).map(k => (k.match && k.match.length ? k.match : [k.label]).some(m => m && t.includes(norm(m))));
}

// ---------- 기타 ----------
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function explainError(e) {
  const code = (e && e.code) || '';
  if (code.includes('permission-denied')) return '권한이 없습니다. (보안 규칙에 막힘)';
  if (code.includes('unavailable') || code.includes('network')) return '인터넷 연결을 확인해 주세요.';
  if (code.includes('unauthorized-domain')) return '허용되지 않은 주소입니다. Firebase 승인된 도메인을 확인하세요.';
  if (code.includes('admin-restricted-operation') || code.includes('operation-not-allowed')) return 'Firebase에서 익명 로그인이 꺼져 있습니다.';
  return (e && e.message) || String(e);
}

export function toast(msg, kind = '') {
  let box = document.getElementById('toastBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toastBox';
    box.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;';
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  const bg = kind === 'error' ? '#b91c1c' : kind === 'ok' ? '#15803d' : '#1e1b4b';
  el.style.cssText = `background:${bg};color:#fff;padding:11px 18px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:90vw;`;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// 데이터 읽기 옵션: 서버 시각이 아직 안 정해진 값은 추정치로
export const EST = { serverTimestamps: 'estimate' };
