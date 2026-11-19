// 엔진만 로드해 커리어를 자동으로 끝까지 돌리는 스모크·밸런스 테스트
// 실행: node test/sim-test.mjs [반복수]
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync(new URL('../src/engine.js', import.meta.url), 'utf8');
const RUNS = +process.argv[2] || 3;
const EXPORTS = 'takeTryout, signOffer, chooseSkin, champCandidates, CONTRACT_KINDS, METAS, teamStr, newWorld, createUser, styleCandidates, runSeason, startNextSeason, canStartSeason, applyOffer, resolveTurn, enlist, userP, ovr, ovrRaw, avgR, careerScore, lpTier, teamFace, isFranchise, autoLineup, MAX_AGE, POS, STATS, WGT';

function career(pos, pick) {
  const ctx = vm.createContext({ console, Math, JSON, Object, Array, Set, Number, String });
  vm.runInContext(src + `\n;globalThis.E = { ${EXPORTS} };`, ctx);
  const E = ctx.E, w = E.newWorld();
  const styles = E.styleCandidates(pos);
  E.createUser(w, { nick: 'Tester', pos, seed: 'x', name: '테스터', style: styles[0], focus: styles[0].main, champ: E.champCandidates(pos, styles[0].main)[0].n });
  const log = [], champs = {}, skins = [], metas = {}, brk = [];
  let t0 = Date.now(), seasons = 0, end = '', castEv = 0, castBad = 0;
  for (let s = 0; s < 30; s++) {
    const S = E.runSeason(w); seasons++; metas[S.meta] = (metas[S.meta] || 0) + 1;
    const u = E.userP(w), U = w.user;
    champs[w.hist[0].worlds] = (champs[w.hist[0].worlds] || 0) + 1;
    // 결승 중계: 사건 킬 합계가 세트 결과와 맞는지
    for (const c of S.casts || []) for (const g of c.games) { castEv += g.ev.length; const k = g.ev.reduce((a, e) => [a[0] + e.kills[0], a[1] + e.kills[1]], [0, 0]); if (k[0] !== g.kills[0] || k[1] !== g.kills[1]) castBad++; }
    // 실존 선수 비율: LCK·LPL 1군 주전 중 실존 선수
    const lu = ['LCK', 'LPL'].flatMap(rg => w.ids[rg].flatMap(id => E.autoLineup(w, w.teams[id])));
    const realPct = Math.round(lu.filter(p => p.real || p.isUser).length / lu.length * 100);
    const faces = ['T1', 'DK', 'GEN'].map(id => { const f = E.teamFace(w, w.teams[id]); return `${id}:${f ? f.nick : '-'}`; }).join(' ');
    if (w.breaking) brk.push(...w.breaking.items.slice(0, 2).map(b => `${w.year} [${b.tag}] ${b.text}`));
    log.push(`      실존 주전 ${realPct}% | 팀의 얼굴 ${faces}`);
    log.push(`${S.year} ${S.age}살 ${S.team.padEnd(10)} ${S.role.padEnd(6)} OVR ${S.ovr0}->${S.ovr1} 1군 ${S.tot.g}세트 평점 ${S.tot.g ? E.avgR(S.tot).toFixed(2) : '-'} POG ${S.tot.pog} 2군 ${S.cl.g} | 올해의선수 ${S.gmRank ?? '-'}위 ${S.titles.join('/')} | 롤드컵 ${w.hist[0].worlds}`);
    const t = U.tasks;
    if (t.retire) { end = `은퇴(${t.retire}) ${u.age}살`; break; }
    if (t.turn) { const i = t.turn.refocus ? 1 : 0; E.resolveTurn(w, t.turn.id, i); }
    if (t.military) E.enlist(w);
    else if (!t.path) {
      // 아마추어 진로: 스카우트·승격 > 입단 테스트(합격 시) > 아카데미 연습생 > 1년 더
      const clubs = t.offers.filter(x => x.kind !== 'retire');
      let o = null;
      if (clubs.some(x => x.route)) {
        o = clubs.find(x => x.kind === 'join');
        if (!o) for (const x of clubs.filter(x => x.kind === 'tryout')) { if (E.takeTryout(w, x)) { o = x; break; } }
        o = o || clubs.find(x => x.kind === 'trainee') || clubs.find(x => x.kind === 'school') || clubs.find(x => x.kind === 'amateur');
      } else o = pick(w, clubs, E);
      if (E.CONTRACT_KINDS[o.kind]) E.signOffer(w, o); else t.path = o;
    }
    if (U.skinPending) { const sk = E.chooseSkin(w, U.skinPending.opts[U.skinPending.opts.length - 1]); skins.push(sk.y + ' ' + sk.champ); }
    if (!E.canStartSeason(w)) throw new Error('시즌 시작 불가: ' + JSON.stringify(t));
    E.startNextSeason(w);
  }
  if (!end) throw new Error('커리어가 끝나지 않았다');
  return { log, cs: E.careerScore(w), champs, skins, metas, end, brk, castEv, castBad, ms: Date.now() - t0, seasons, size: JSON.stringify(w).length, players: Object.keys(w.P).length, real: Object.values(w.P).filter(p => p.real && p.tid).length };
}
// 진로 고르기: 주전 우위 제안 중 가장 강한 팀 > 임대 > 잔류 > 첫 제안
const smart = (w, offers) => {
  const st = offers.filter(o => o.role === 'STARTER' && o.kind !== 'loan').sort((a, b) => w.teams[b.tid].base - w.teams[a.tid].base);
  return st[0] || offers.find(o => o.kind === 'loan') || offers.find(o => o.kind === 'stay' || o.kind === 'return') || offers[0];
};
// 항상 가장 강한 팀으로 (벤치 위험)
const greedy = (w, offers) => offers.filter(o => o.tid).sort((a, b) => w.teams[b.tid].base - w.teams[a.tid].base)[0] || offers[0];

const plans = [['MID', smart, '똑똑하게'], ['ADC', greedy, '강팀만'], ['JGL', smart, '똑똑하게'], ['SUP', smart, '똑똑하게'], ['TOP', greedy, '강팀만']];
for (let i = 0; i < RUNS; i++) {
  const [pos, fn, name] = plans[i % plans.length];
  const r = career(pos, fn);
  console.log(`\n=== ${pos} / ${name} — ${r.seasons}시즌 ${r.end} · ${r.ms}ms (시즌당 ${(r.ms / r.seasons).toFixed(0)}ms), 세이브 ${(r.size / 1024).toFixed(0)}KB, 선수 ${r.players}명 (소속 실존 ${r.real}명)`);
  r.log.forEach(l => console.log('  ' + l));
  console.log('  커리어:', JSON.stringify(r.cs));
  console.log('  롤드컵 우승:', JSON.stringify(r.champs));
  console.log(`  결승 중계 사건 ${r.castEv}개 · 킬 합계 불일치 ${r.castBad}세트`);
  console.log('  속보 예시:\n    ' + r.brk.slice(0, 8).join('\n    '));
  if (r.castBad) throw new Error('결승 중계 킬 합계가 세트 결과와 다르다');
}
