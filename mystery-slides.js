// ============================================================
// KIMKO-EDU 미스터리 타임 · 게임 진행 방법 슬라이드
// 점수판(mystery-board.html)과 진행자 화면(mystery-host.html)이 함께 사용
// 방 설정(제한 시간, 벌칙, 힌트 간격)이 슬라이드 숫자에 자동으로 들어감
// ============================================================
import { fmt, esc, wrongPenFor } from './mystery-firebase.js';

export const SLIDE_COUNT = 7;

const CSS = `
.ms-wrap { container-type: inline-size; width: 100%; aspect-ratio: 16 / 9; position: relative; overflow: hidden; border-radius: 1.2cqw; background: #0f172a; }
.ms-slide { position: absolute; inset: 0; font-size: 1.55cqw; color: #fff; padding: 3.2em 4.4em 2.6em; display: flex; flex-direction: column;
  background: radial-gradient(120% 90% at 85% 0%, #312e81 0%, #1e1b4b 45%, #0f172a 100%);
  font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif; line-height: 1.45; animation: msIn .35s ease; }
@keyframes msIn { from { opacity: 0; transform: translateY(.6em); } to { opacity: 1; transform: none; } }
.ms-slide * { box-sizing: border-box; }
.ms-kick { font-size: .95em; font-weight: 800; color: #fbbf24; letter-spacing: .06em; }
.ms-h { font-size: 2.6em; font-weight: 900; line-height: 1.2; margin: .15em 0 .5em; letter-spacing: -.01em; }
.ms-h small { display: block; font-size: .42em; font-weight: 600; color: #c7d2fe; margin-top: .45em; letter-spacing: 0; }
.ms-body { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: .8em; min-height: 0; }
.ms-row { display: flex; gap: 1em; }
.ms-card { flex: 1; background: rgba(255,255,255,.07); border: .08em solid rgba(255,255,255,.14); border-radius: .8em; padding: .9em 1.1em; }
.ms-card b { color: #fde68a; }
.ms-body > .ms-card { flex: none; }
.ms-big { font-size: 1.35em; font-weight: 800; }
.ms-story { background: #fef3c7; color: #451a03; border-radius: .8em; padding: .8em 1.2em; font-size: 1.25em; font-weight: 700; }
.ms-q { display: flex; align-items: center; gap: .7em; font-size: 1.2em; padding: .45em .9em; border-radius: .7em; background: rgba(255,255,255,.06); }
.ms-q .mk { flex: 0 0 1.6em; height: 1.6em; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: .9em; }
.ms-q.good .mk { background: #16a34a; } .ms-q.bad .mk { background: #dc2626; }
.ms-q .why { margin-left: auto; font-size: .78em; color: #94a3b8; }
.ms-ans { display: grid; grid-template-columns: 1fr 1fr; gap: .8em; }
.ms-ans > div { border-radius: .8em; padding: .8em 1em; }
.ms-ans .t { font-size: 1.3em; font-weight: 900; }
.ms-ans .d { font-size: .95em; margin-top: .2em; opacity: .9; }
.ms-ans .e { font-size: .9em; margin-top: .45em; padding-top: .45em; border-top: .08em solid currentColor; opacity: .85; }
.a1 { background: #dcfce7; color: #14532d; } .a2 { background: #fee2e2; color: #7f1d1d; } .a3 { background: #fef3c7; color: #78350f; } .a4 { background: #e2e8f0; color: #1e293b; }
.ms-pen { display: flex; gap: .8em; }
.ms-pen > div { flex: 1; text-align: center; border-radius: .9em; padding: .9em .5em; background: rgba(255,255,255,.07); border: .08em solid rgba(255,255,255,.14); }
.ms-pen .n { font-size: 2.2em; font-weight: 900; color: #fbbf24; line-height: 1.1; font-variant-numeric: tabular-nums; }
.ms-pen .l { font-size: 1em; font-weight: 700; margin-top: .25em; }
.ms-formula { text-align: center; font-size: 1.35em; font-weight: 800; background: rgba(251,191,36,.12); border: .08em solid rgba(251,191,36,.4); border-radius: .8em; padding: .6em; }
.ms-dots { display: inline-flex; gap: .3em; vertical-align: middle; }
.ms-dots i { width: .8em; height: .8em; border-radius: 50%; border: .14em solid #fbbf24; display: inline-block; }
.ms-dots i.on { background: #fbbf24; }
.ms-list { margin: 0; padding-left: 1.3em; font-size: 1.25em; line-height: 1.75; }
.ms-list b { color: #fde68a; }
.ms-foot { display: flex; align-items: center; justify-content: space-between; font-size: .85em; color: #94a3b8; margin-top: .8em; }
.ms-code { background: rgba(255,255,255,.1); border-radius: 999px; padding: .25em .9em; font-weight: 800; color: #fde68a; font-variant-numeric: tabular-nums; }
.ms-prog { display: flex; gap: .35em; } .ms-prog i { width: 1.6em; height: .3em; border-radius: .2em; background: rgba(255,255,255,.2); display: block; } .ms-prog i.on { background: #fbbf24; }
.ms-hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.ms-hero .emo { font-size: 5em; line-height: 1; }
.ms-hero h1 { font-size: 3.8em; font-weight: 900; margin: .2em 0 .1em; letter-spacing: -.02em; }
.ms-hero p { font-size: 1.5em; color: #c7d2fe; margin: 0; }
`;

export function injectSlideCss() {
  if (document.getElementById('msCss')) return;
  const s = document.createElement('style');
  s.id = 'msCss'; s.textContent = CSS;
  document.head.appendChild(s);
}

// i: 0부터, room: 방 정보(settings, mainCount, title), code: 방 코드
export function slideHtml(i, room, code) {
  const s = room.settings;
  const q = fmt(s.qPenaltySec), w = fmt(s.wrongPenaltySec);
  const disc = s.keyDiscountSec || 0;
  const wMin = fmt(wrongPenFor(s, Math.max(1, (room.mainCount || 4) - 1)));
  const lim = Math.round(s.limitSec / 60), uns = Math.round((s.limitSec + s.unsolvedExtraSec) / 60);
  const hf = Math.round(s.hintFirstSec / 60), he = Math.round(s.hintEverySec / 60);
  const mk = room.mainCount || 4;
  const codeTxt = code ? `방 ${code.slice(0, 3)} ${code.slice(3)}` : '';
  const foot = `<div class="ms-foot"><span>🔍 미스터리 타임 · 게임 진행 방법</span>
    <span class="ms-prog">${Array.from({ length: SLIDE_COUNT }, (_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</span>
    <span class="ms-code">${codeTxt}</span></div>`;
  const dots = (n) => `<span class="ms-dots">${Array.from({ length: mk }, (_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</span>`;

  const S = [
    // 1. 표지
    `<div class="ms-hero">
       <div class="emo">🔍</div>
       <h1>미스터리 타임</h1>
       <p>오늘 우리는 모두 <b style="color:#fbbf24;">탐정</b>이 됩니다!</p>
       <p style="margin-top:1.4em; font-size:1.15em; color:#94a3b8;">모둠이 힘을 모아, 이상한 사건의 진짜 이야기를 밝혀내 봐요.</p>
     </div>`,

    // 2. 목표
    `<div class="ms-kick">STEP 1 · 목표</div>
     <div class="ms-h">사건의 <span style="color:#fbbf24;">전말</span>을 맞혀라!<small>그림과 짧은 이야기만 주어져요. 왜 그런 일이 생겼는지 원인과 결과를 추리해요.</small></div>
     <div class="ms-body">
       <div class="ms-row">
         <div class="ms-card"><div class="ms-big">🖼️ 사건 그림</div>그림 속에 작은 단서가 숨어 있을지도 몰라요.</div>
         <div class="ms-card"><div class="ms-big">📜 짧은 이야기</div>이상한 일이 벌어졌어요. 하지만 이유는 나와 있지 않아요.</div>
         <div class="ms-card"><div class="ms-big">🕵️ 우리의 임무</div>선생님께 질문해서 단서를 모으고, <b>진짜 이야기</b>를 완성해요.</div>
       </div>
       <div class="ms-formula">🏆 가장 <span style="color:#fbbf24;">짧은 기록</span>으로 전말을 맞힌 모둠이 우승!</div>
     </div>`,

    // 3. 질문하는 법
    `<div class="ms-kick">STEP 2 · 질문하는 법</div>
     <div class="ms-h">"예 / 아니요"로 답할 수 있게 물어요<small>한 번에 질문을 최대 3개까지 보낼 수 있어요.</small></div>
     <div class="ms-body" style="gap:.55em;">
       <div class="ms-story">📜 연습 이야기 · 민준이는 우산을 들고 있었는데, 옷이 다 젖었다.</div>
       <div class="ms-q good"><span class="mk">✓</span>"그때 비가 내리고 있었나요?"<span class="why">예/아니요로 답할 수 있어요</span></div>
       <div class="ms-q good"><span class="mk">✓</span>"물이 아래쪽에서 튀었나요?"<span class="why">구체적으로 물어서 좋아요</span></div>
       <div class="ms-q bad"><span class="mk">✕</span>"민준이 옷은 왜 젖었나요?"<span class="why">"왜"는 예/아니요로 답할 수 없어요</span></div>
       <div class="ms-q bad"><span class="mk">✕</span>"정답이 뭐예요?"<span class="why">선생님은 정답을 알려 주지 않아요 😉</span></div>
     </div>`,

    // 4. 선생님의 4가지 대답
    `<div class="ms-kick">STEP 3 · 선생님의 대답</div>
     <div class="ms-h">선생님은 4가지 중 하나로만 답해요</div>
     <div class="ms-body">
       <div class="ms-ans">
         <div class="a1"><div class="t">⭕ 네, 그렇습니다</div><div class="d">질문 내용이 모두 맞아요.</div><div class="e">"물이 아래쪽에서 튀었나요?"</div></div>
         <div class="a2"><div class="t">✕ 아니요, 그렇지 않습니다</div><div class="d">질문 내용이 틀렸어요.</div><div class="e">"그때 비가 내리고 있었나요?"</div></div>
         <div class="a3"><div class="t">△ 그럴 수도 있습니다</div><div class="d">맞는 부분과 틀린 부분이 섞여 있어요.</div><div class="e">"비 때문에 옷이 젖었나요?"</div></div>
         <div class="a4"><div class="t">— 중요하지 않습니다</div><div class="d">사건을 푸는 데 필요 없는 내용이에요.</div><div class="e">"우산이 파란색인가요?"</div></div>
       </div>
       <div style="text-align:center; font-size:1.05em; color:#c7d2fe;">💡 "그럴 수도"가 나오면 질문을 쪼개서 다시 물어보세요!</div>
     </div>`,

    // 5. 시간과 벌칙
    `<div class="ms-kick">STEP 4 · 시간이 곧 점수</div>
     <div class="ms-h">기록이 짧을수록 1등!<small>제한 시간은 ${lim}분이에요. 시간은 모든 모둠이 똑같이 흘러가요.</small></div>
     <div class="ms-body">
       <div class="ms-formula">우리 기록 = 걸린 시간 + 질문 벌칙 + 오답 벌칙</div>
       <div class="ms-pen">
         <div><div class="n">+${q}</div><div class="l">질문 1개마다</div></div>
         <div><div class="n">+${w}</div><div class="l">정답이 틀리면${disc ? `<br><span style="font-weight:500; font-size:.85em; color:#94a3b8;">(키워드 찾은 만큼 줄어요)</span>` : ''}</div></div>
         <div><div class="n">${uns}분</div><div class="l">끝까지 못 맞히면<br><span style="font-weight:500; font-size:.85em; color:#94a3b8;">(+ 벌칙)</span></div></div>
       </div>
       <div class="ms-card" style="text-align:center; font-size:1.1em;">⏳ 선생님 답을 <b>받아야</b> 다음 질문을 보낼 수 있어요. 질문을 아껴서, 잘 생각하고 보내요!</div>
     </div>`,

    // 6. 힌트와 정답 제출
    `<div class="ms-kick">STEP 5 · 힌트와 정답 제출</div>
     <div class="ms-h">막히면 힌트, 알 것 같으면 바로 제출!</div>
     <div class="ms-body">
       <div class="ms-row">
         <div class="ms-card">
           <div class="ms-big">💡 힌트가 열리는 때</div>
           <ul class="ms-list" style="font-size:1.05em;">
             <li><b>${hf}분</b>부터 <b>${he}분</b>마다 하나씩</li>
             <li>어느 모둠이 <b>정답</b>을 맞히면 바로 하나 더</li>
           </ul>
         </div>
         <div class="ms-card">
           <div class="ms-big">🎯 정답 제출</div>
           <ul class="ms-list" style="font-size:1.05em;">
             <li><b>원인 → 결과</b> 순서로 이야기처럼</li>
             <li>꼭 들어가야 할 <b>메인 키워드 ${mk}개</b></li>
             <li>언제든 제출 가능!</li>
             <li><b>문장으로</b> 써요 (단어만 나열 ✕)</li>
           </ul>
         </div>
       </div>
       <div class="ms-formula" style="font-size:1.1em;">틀려도 알려 줘요 → "메인 키워드 ${mk}개 중 ${Math.max(1, mk - 1)}개를 찾았어요!" ${dots(Math.max(1, mk - 1))}<br>
         <span style="font-size:.82em; color:#fde68a; font-weight:700;">${disc ? `찾은 키워드 1개마다 벌칙 −${fmt(disc)} → 0개 +${w} … ${Math.max(1, mk - 1)}개면 +${wMin}만!` : `틀리면 +${w}`}</span><br>
         <span style="font-size:.75em; color:#c7d2fe; font-weight:600;">점수판의 🔑 칸에서 다른 모둠이 몇 개 찾았는지도 볼 수 있어요</span></div>
     </div>`,

    // 7. 모둠 약속
    `<div class="ms-kick">STEP 6 · 모둠 약속</div>
     <div class="ms-h">준비됐나요, 탐정단?</div>
     <div class="ms-body">
       <ul class="ms-list">
         <li>✍️ 질문을 쓰는 사람은 <b>돌아가며</b> 바꿔요.</li>
         <li>🗣️ 보내기 전에 모둠이 함께 <b>의논</b>해요.</li>
         <li>🤫 다른 모둠 화면은 <b>보지 않아요.</b> 단서를 소리 내어 외치지 않아요.</li>
         <li>🙌 먼저 맞힌 모둠은 다른 모둠을 <b>응원</b>해요.</li>
       </ul>
       <div class="ms-formula" style="font-size:1.6em;">🔍 이제 사건 속으로 들어가 볼까요?</div>
     </div>`
  ];

  const body = S[Math.max(0, Math.min(SLIDE_COUNT - 1, i))];
  return `<div class="ms-slide">${i === 0 ? body + `<div class="ms-foot" style="justify-content:flex-end;"><span class="ms-code">${codeTxt}</span></div>` : body + foot}</div>`;
}
