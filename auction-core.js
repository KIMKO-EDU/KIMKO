// ============================================================
// KIMKO-EDU 명화 경매 · 공용 규칙 모듈
// auction-host.html / auction.html / auction-board.html 이 함께 사용
// 판정 규칙은 기존 choco-auction.html(블레스유 선생님 자료)과 똑같습니다.
//  - 낙찰자만 금액 차감 / 동점 입찰 무효(단독인 다음 높은 금액이 낙찰)
//  - 최저 입찰 조는 -1점 (최저가가 같으면 모두 -1점)
//  - 12라운드 종료 후, 누적 지출이 가장 많은 조는 파산 패배(최하위)
// ============================================================
export const TOTAL_ROUNDS = 12;
export const MILESTONES = [3, 6, 9];

// ---------- 그림 등급과 랜덤 점수 (기존 명화 경매 화면과 같음) ----------
// 라운드 점수 = 그림 등급(1~5점). 방을 만들 때 12라운드 그림을 미리 뽑아 둡니다.
export const TIER_WEIGHTS = [27, 27, 26, 13, 7];   // 1~5점 확률(%)
export const TIERS = {
  1: { name: '낙서 스케치', titles: ['공책 구석의 낙서', '연필 낙서', '지우개 자국 스케치', '심심할 때 그린 그림'] },
  2: { name: '동네 화가의 풍경화', titles: ['언덕 위의 집', '시골 마을의 오후', '강가의 풍경', '해 질 녘 들판'] },
  3: { name: '유명 화가의 판화', titles: ['색면 구성 No.7', '도형의 리듬', '푸른 구성', '겹쳐진 시간'] },
  4: { name: '왕실 초상화', titles: ['왕의 초상', '왕비의 초상', '어린 왕자의 초상', '대공의 초상'] },
  5: { name: '전설의 명화', titles: ['황금빛 소용돌이', '빛의 정원', '영원의 하늘', '불꽃의 춤'] }
};

/* ===================== 1. 효과음 ===================== */

export function rollTier(rand) {
  const total = TIER_WEIGHTS.reduce((a, b) => a + b, 0); let x = rand() * total;
  for (let i = 0; i < 5; i++) { if (x < TIER_WEIGHTS[i]) return i + 1; x -= TIER_WEIGHTS[i]; }
  return 1;
}
export function makeRounds(n, guarantee5) {
  const rounds = Array.from({ length: n }, () => {
    const tier = rollTier(Math.random);
    const titles = TIERS[tier].titles;
    return { tier, title: titles[Math.floor(Math.random() * titles.length)], seed: Math.floor(Math.random() * 1e9), };
  });
  if (guarantee5 && !rounds.some(r => r.tier === 5)) {
    const i = Math.floor(Math.random() * n);
    const t = TIERS[5].titles;
    rounds[i].tier = 5; rounds[i].title = t[Math.floor(Math.random() * t.length)];
  }
  return rounds;
}

// 같은 seed면 어느 기기에서 그려도 똑같은 그림이 나옵니다.
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function drawArt(canvas, tier, seed) {
  const W = 800, H = 600; canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d'); const r = rng(seed);
  const pick = arr => arr[Math.floor(r() * arr.length)];
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (tier === 1) {
    c.fillStyle = '#f3efe4'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(120,150,200,.35)'; c.lineWidth = 2;
    for (let y = 60; y < H; y += 38) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.strokeStyle = 'rgba(220,90,90,.4)'; c.beginPath(); c.moveTo(80, 0); c.lineTo(80, H); c.stroke();
    for (let k = 0; k < 4 + Math.floor(r() * 3); k++) {
      c.strokeStyle = `rgba(60,60,60,${0.5 + r() * 0.4})`; c.lineWidth = 2 + r() * 3;
      let x = 120 + r() * 560, y = 80 + r() * 440; c.beginPath(); c.moveTo(x, y);
      for (let i = 0; i < 18; i++) { x += (r() - 0.5) * 120; y += (r() - 0.5) * 90; x = Math.max(100, Math.min(760, x)); y = Math.max(40, Math.min(570, y)); c.quadraticCurveTo(x + (r() - .5) * 60, y + (r() - .5) * 60, x, y); }
      c.stroke();
    }
    const fx = 220 + r() * 360, fy = 200 + r() * 200, fr = 50 + r() * 40;
    c.strokeStyle = '#333'; c.lineWidth = 4; c.beginPath(); c.ellipse(fx, fy, fr, fr * (0.85 + r() * .3), r(), 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(fx - fr * .35, fy - fr * .2, 5, 0, 7); c.arc(fx + fr * .35, fy - fr * .15, 5, 0, 7); c.fillStyle = '#333'; c.fill();
    c.beginPath(); c.arc(fx, fy + fr * .15, fr * .45, 0.2, Math.PI - 0.2); c.stroke();
    c.beginPath(); c.moveTo(fx, fy + fr); c.lineTo(fx, fy + fr + 110); c.moveTo(fx, fy + fr + 40); c.lineTo(fx - 60, fy + fr + 10); c.moveTo(fx, fy + fr + 40); c.lineTo(fx + 60, fy + fr + 15);
    c.moveTo(fx, fy + fr + 110); c.lineTo(fx - 40, fy + fr + 170); c.moveTo(fx, fy + fr + 110); c.lineTo(fx + 45, fy + fr + 168); c.stroke();
    return;
  }
  if (tier === 2) {
    const skies = [['#8ec5ff', '#e8f4ff'], ['#ffb385', '#ffe7c4'], ['#a5d8ff', '#fff3d6']];
    const [s1, s2] = pick(skies); const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, s1); g.addColorStop(1, s2); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(120 + r() * 560, 90 + r() * 70, 45 + r() * 20, 0, 7); c.fill();
    for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(255,255,255,.85)'; const cx = r() * W, cy = 70 + r() * 120; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(cx + i * 30, cy + (i % 2) * 10, 24, 0, 7); c.fill(); } }
    const greens = ['#5e9c4a', '#77b35a', '#4a8540', '#8cc36b'];
    for (let k = 0; k < 3; k++) {
      c.fillStyle = greens[k % greens.length]; c.beginPath(); c.moveTo(0, H);
      const base = 330 + k * 80, amp = 40 + r() * 50, ph = r() * 6;
      for (let x = 0; x <= W; x += 20) c.lineTo(x, base - Math.sin(x / 140 + ph) * amp);
      c.lineTo(W, H); c.fill();
    }
    const hx = 200 + r() * 380, hy = 400;
    c.fillStyle = pick(['#f1e3c6', '#ffffff', '#ffe0b3']); c.fillRect(hx, hy, 120, 90);
    c.fillStyle = pick(['#c0392b', '#7d4b2a', '#3d5a80']); c.beginPath(); c.moveTo(hx - 15, hy); c.lineTo(hx + 60, hy - 60); c.lineTo(hx + 135, hy); c.fill();
    c.fillStyle = '#6b4226'; c.fillRect(hx + 48, hy + 45, 26, 45); c.fillStyle = '#9fd3ff'; c.fillRect(hx + 12, hy + 20, 24, 22); c.fillRect(hx + 86, hy + 20, 24, 22);
    const tx = hx > 400 ? hx - 140 : hx + 220;
    c.fillStyle = '#7a4e2d'; c.fillRect(tx, 380, 18, 100); c.fillStyle = '#3f7d3a'; c.beginPath(); c.arc(tx + 9, 360, 55, 0, 7); c.fill();
    return;
  }
  if (tier === 3) {
    c.fillStyle = '#f1ebdd'; c.fillRect(0, 0, W, H);
    const pals = [['#d1453b', '#1f4e8c', '#f2b632'], ['#2a9d8f', '#e76f51', '#264653'], ['#6a4c93', '#ff595e', '#ffca3a'], ['#0b6e4f', '#f08a4b', '#1d3557']];
    const pal = pick(pals);
    c.globalAlpha = 0.85;
    for (let k = 0; k < 9; k++) {
      c.fillStyle = pick(pal);
      if (r() < 0.55) c.fillRect(r() * 650, r() * 460, 80 + r() * 260, 60 + r() * 220);
      else { c.beginPath(); c.arc(100 + r() * 600, 100 + r() * 400, 40 + r() * 110, 0, 7); c.fill(); }
    }
    c.globalAlpha = 1; c.strokeStyle = '#1b1b1b'; c.lineWidth = 8;
    for (let k = 0; k < 3; k++) { c.beginPath(); if (r() < .5) { const x = 60 + r() * 680; c.moveTo(x, 0); c.lineTo(x, H); } else { const y = 60 + r() * 480; c.moveTo(0, y); c.lineTo(W, y); } c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 2500; i++) c.fillRect(r() * W, r() * H, 2, 2);
    return;
  }
  if (tier === 4) {
    const bg = c.createRadialGradient(400, 250, 50, 400, 300, 520); bg.addColorStop(0, pick(['#5a3a22', '#3d2b1f', '#2f3b2a'])); bg.addColorStop(1, '#0d0806'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const cloak = pick(['#8e1b26', '#1f3a7a', '#4b1f6e', '#145a3c']);
    c.fillStyle = cloak; c.beginPath(); c.moveTo(150, H); c.quadraticCurveTo(170, 400, 400, 380); c.quadraticCurveTo(630, 400, 650, H); c.fill();
    c.fillStyle = '#f2eee6'; c.beginPath(); c.moveTo(330, H); c.lineTo(400, 400); c.lineTo(470, H); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 6; c.setLineDash([2, 12]); c.beginPath(); c.moveTo(160, 520); c.quadraticCurveTo(400, 430, 640, 520); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#e9c4a0'; c.fillRect(375, 330, 50, 60);
    const fg = c.createRadialGradient(385, 250, 10, 400, 270, 110); fg.addColorStop(0, '#f6d6b5'); fg.addColorStop(1, '#c79a72'); c.fillStyle = fg; c.beginPath(); c.ellipse(400, 265, 80, 100, 0, 0, 7); c.fill();
    c.fillStyle = pick(['#3a2414', '#8a5a2b', '#1c1c1c', '#c9a26b']); c.beginPath(); c.ellipse(400, 210, 88, 55, 0, Math.PI, 0); c.fill(); c.fillRect(312, 205, 22, 90); c.fillRect(466, 205, 22, 90);
    c.fillStyle = '#2b1b12'; c.beginPath(); c.arc(372, 262, 6, 0, 7); c.arc(428, 262, 6, 0, 7); c.fill();
    c.strokeStyle = '#8a4b3a'; c.lineWidth = 4; c.beginPath(); c.arc(400, 300, 20, 0.3, Math.PI - 0.3); c.stroke();
    const cg = c.createLinearGradient(0, 120, 0, 175); cg.addColorStop(0, '#fff2b0'); cg.addColorStop(1, '#c9921f'); c.fillStyle = cg;
    c.beginPath(); c.moveTo(330, 175); c.lineTo(330, 135); c.lineTo(355, 155); c.lineTo(378, 115); c.lineTo(400, 150); c.lineTo(422, 115); c.lineTo(445, 155); c.lineTo(470, 135); c.lineTo(470, 175); c.fill();
    ['#e63946', '#3a86ff', '#2ec27e'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(360 + i * 40, 162, 6, 0, 7); c.fill(); });
    const vg = c.createRadialGradient(400, 300, 220, 400, 300, 470); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.75)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    return;
  }
  // tier 5: 흐름을 따라 소용돌이치는 붓질
  const pals = [['#0b1d51', '#1f4fa3', '#f7c548', '#ffe9a3', '#3a7bd5'], ['#3b0a45', '#a4133c', '#ff8c42', '#ffd166', '#7b2cbf'], ['#04342c', '#0f7a5c', '#e9c46a', '#f4a261', '#2a9d8f']];
  const pal = pick(pals);
  const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, pal[0]); bg.addColorStop(1, pal[1]); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  const cx = 200 + r() * 400, cy = 150 + r() * 200, k1 = 0.004 + r() * 0.004, k2 = 0.005 + r() * 0.004;
  const angle = (x, y) => { const dx = x - cx, dy = y - cy; return Math.atan2(dy, dx) + Math.PI / 2 + Math.sin(x * k1) * 1.1 + Math.cos(y * k2) * 1.1; };
  for (let i = 0; i < 1300; i++) {
    let x = r() * W, y = r() * H; const col = pal[1 + Math.floor(r() * 4)];
    c.strokeStyle = col; c.globalAlpha = 0.35 + r() * 0.5; c.lineWidth = 2 + r() * 5; c.beginPath(); c.moveTo(x, y);
    for (let s = 0; s < 14; s++) { const a = angle(x, y); x += Math.cos(a) * 6; y += Math.sin(a) * 6; c.lineTo(x, y); }
    c.stroke();
  }
  c.globalAlpha = 1;
  const sg = c.createRadialGradient(cx, cy, 5, cx, cy, 120); sg.addColorStop(0, '#fffbe6'); sg.addColorStop(0.35, pal[3]); sg.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, 120, 0, 7); c.fill();
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H * .6, s = 1 + r() * 3; c.fillStyle = 'rgba(255,250,220,.9)'; c.beginPath(); c.arc(x, y, s, 0, 7); c.fill(); }
}
export const stars = (tier) => '★'.repeat(tier) + '☆'.repeat(5 - tier);
// 예전 방(그림 없이 만든 방)도 열리도록: 라운드 점수는 art가 있으면 등급, 없으면 points
export const roundPoint = (room, r) => (room.art && room.art[r - 1]) ? room.art[r - 1].tier : (room.points ? room.points[r - 1] : 1);


// bids: 조 순서대로의 입찰 금액 배열 (index 0 = 1조)
export function evaluate(bids) {
  const losers = [];
  const minBid = Math.min(...bids);
  bids.forEach((b, i) => { if (b === minBid) losers.push(i); });

  const count = {};
  bids.forEach(b => { count[b] = (count[b] || 0) + 1; });
  const amounts = Object.keys(count).map(Number).sort((a, b) => b - a);

  let winner = null, amount = 0;
  const voidAmounts = [];
  for (const a of amounts) {
    if (count[a] === 1) { winner = bids.indexOf(a); amount = a; break; }
    voidAmounts.push(a);                 // 같은 금액이 둘 이상이면 무효
  }
  const voidTeams = [];
  bids.forEach((b, i) => { if (voidAmounts.includes(b)) voidTeams.push(i); });
  return { winner, amount, losers, voidTeams, voidAmounts };
}

// results: { '1': {winner:'2'|null, point:1, losers:['1'], voidTeams:['3']}, ... } (공개 정보: 금액은 없음)
// final: { spent:{'1':n,...}, bankrupt:['2'] } | null  (최종 발표 후에만 있음)
export function standings(results, teamCount, final) {
  const pts = Array(teamCount).fill(0);
  let any = false;
  for (let r = 1; r <= TOTAL_ROUNDS; r++) {
    const x = results && results[r];
    if (!x) continue;
    any = true;
    if (x.winner != null) pts[Number(x.winner) - 1] += Number(x.point) || 0;
    (x.losers || []).forEach(t => { pts[Number(t) - 1] -= 1; });
  }
  const bk = new Set(((final && final.bankrupt) || []).map(Number));
  const order = pts.map((_, i) => i);
  order.sort((a, b) => {
    const ab = bk.has(a + 1), bb = bk.has(b + 1);
    if (ab && !bb) return 1;
    if (!ab && bb) return -1;
    return pts[b] - pts[a];
  });
  const rankOf = {};
  let rank = 0, prevKey = null;
  order.forEach((t, i) => { const key = bk.has(t + 1) ? 'B' : 'P' + pts[t]; if (key !== prevKey) { rank = i + 1; prevKey = key; } rankOf[t] = rank; });
  return {
    any,
    teams: pts.map((p, i) => ({ no: i + 1, points: p, rank: rankOf[i], bankrupt: bk.has(i + 1) }))
  };
}

// amountOf(round, teamNo) → 그 조가 그 라운드에 낸 입찰 금액 (진행자·본인만 알 수 있음)
export function spentByTeam(results, amountOf, teamCount) {
  const s = Array(teamCount).fill(0);
  for (let r = 1; r <= TOTAL_ROUNDS; r++) {
    const x = results && results[r];
    if (x && x.winner != null) s[Number(x.winner) - 1] += amountOf(r, Number(x.winner)) || 0;
  }
  return s;
}
// 누적 지출이 가장 많은 조(들)의 번호. 아무도 안 썼으면 없음
export function bankruptTeams(spent) {
  const m = Math.max(...spent);
  return m > 0 ? spent.map((v, i) => (v === m ? i + 1 : 0)).filter(Boolean) : [];
}
// upTo라운드까지 낙찰된 금액의 합 (3·6·9라운드 공개용)
export function sumWinning(results, amountOf, upTo) {
  let sum = 0;
  for (let r = 1; r <= upTo; r++) {
    const x = results && results[r];
    if (x && x.winner != null) sum += amountOf(r, Number(x.winner)) || 0;
  }
  return sum;
}
