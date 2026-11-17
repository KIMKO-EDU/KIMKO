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
  order.forEach((t, i) => { rankOf[t] = i + 1; });
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
