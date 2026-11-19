/* =========================================================
 * 솔랭에서 월즈까지 — 화면 (DOM, 토스 디자인 시스템 톤)
 * engine.js 뒤에 같은 스크립트로 이어 붙는다.
 * ========================================================= */
let G = null;
const UI = { screen: 'landing', tab: 'home', ob: null, sheet: null, play: null, end: null };
const SAVE_KEY = 'srl-save-v1', HOF_KEY = 'srl-hof-v1', SAVE_V = 5;
const $id = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 저장 (이 브라우저) ---------- */
function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function load(k) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function drop(k) { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } }
function save() { if (G) store(SAVE_KEY, G); }
// 이전 버전(4) 저장: 상점이 빠지고 속보·은퇴 필드가 생겼다
function migrate(w) { if (w && w.v === 4) { w.v = 5; if (w.user) delete w.user.shop; w.breaking = w.breaking || null; } return w && w.v === SAVE_V ? w : null; }

/* ---------- 조사·숫자 ---------- */
function josaN(n, a, b) { const d = Math.abs(Math.round(n)) % 10; return [true, true, false, true, false, false, true, true, true, false][d] ? a : b; }
function roN(n) { const d = Math.abs(Math.round(n)) % 10; return [1, 7, 8].includes(d) ? '로' : [0, 3, 6].includes(d) ? '으로' : '로'; }
const fansTxt = pop => { const n = Math.round(pop * pop * 120 + 200); return n >= 10000 ? (n / 10000).toFixed(1) + '만 명' : n.toLocaleString('ko-KR') + '명'; };
const signed = n => (n > 0 ? '+' : '') + n;
const deltaCls = n => (n > 0 ? 'up' : n < 0 ? 'down' : 'zero');

/* ---------- 아이콘 ---------- */
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC = {
  home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/>'),
  season: svg('<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 3v3M16 3v3"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  chev: svg('<path d="m9 6 6 6-6 6"/>'),
  back: svg('<path d="M19 12H5M11 18l-6-6 6-6"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  heart: svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>'),
  route: svg('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>'),
  spark: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>'),
  bag: svg('<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>'),
  flag: svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
  target: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'),
  shield: svg('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>'),
  play: svg('<path d="M7 4v16l13-8z"/>'),
  trophy: svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>'),
  pen: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  patch: svg('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
};

/* ---------- 선수 아바타 (DiceBear Avataaars, Pablo Stanley) ---------- */
const AVC = {};
function avatarURI(seed, color, headset) {
  const key = seed + '|' + color + '|' + (headset ? 1 : 0);
  if (AVC[key]) return AVC[key];
  let uri;
  try { uri = window.PixelAvatar.make(seed, color, headset); } catch (e) { uri = fallbackAvatar(seed, color); }
  return (AVC[key] = uri);
}
function fallbackAvatar(seed, color) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const skin = ['#f2c9a0', '#d9a87c', '#a8754f', '#ffe0c2'][h % 4], hair = ['#2b2118', '#5a3a22', '#c9a24a', '#1c1c2b'][(h >> 3) % 4];
  const rows = ['..hhhh..', '.hhhhhh.', '.hssssh.', '.sesses.', '.ssssss.', '..smms..', '.cccccc.', 'cccccccc'];
  let r = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => { const f = { h: hair, s: skin, e: '#1a1a1a', m: '#a0525a', c: color }[ch]; if (f) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${f}"/>`; }));
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" shape-rendering="crispEdges">${r}</svg>`);
}
function teamColor(p) { const T = p && p.tid && G && G.teams[p.tid]; return T && !p.acad ? T.color : '#4E5968'; }
function av(p, cls) { return `<img class="av ${cls || ''}" src="${avatarURI(p.seed, teamColor(p))}" alt="" width="64" height="64">`; }
function lum(hex) { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
// 구단 로고: 빌드 때 CSS 배경(.lg-태그)으로 넣는다. 어두운 배경용 로고는 짙은 타일 위에 올린다
const LOGO_DARK = { DK: 1, KRX: 1, G2: 1, TL: 1, TSW: 1, MVK: 1, HLE: 1, KT: 1, WBG: 1, AL: 1 };
function crestOf(id, color, cls, label) {
  const lab = label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true"';
  if (window.LOGO_SET && window.LOGO_SET[id]) return `<span class="crest logo lg-${esc(id)} ${LOGO_DARK[id] ? 'dk' : ''} ${cls || ''}"${lab}></span>`;
  return `<span class="crest ${cls || ''}" style="background:${color};color:${lum(color) > 0.62 ? '#191F28' : '#fff'}"${lab}>${esc(id)}</span>`;
}
function crest(T, cls, label) { return T ? crestOf(T.id, T.color, cls, label ? T.name : '') : ''; }

/* ---------- 서명 ---------- */
// 획 좌표는 600×180 기준. 첫 계약 때 직접 그리고, 이후 계약서에는 저장된 서명을 재생한다
function sigLen(st) { let l = 0; for (let i = 1; i < st.length; i++) l += Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]); return l; }
function validSig(strokes) { return !!strokes && strokes.reduce((a, st) => a + sigLen(st), 0) >= 80; }
function sigD(st) { return st.length === 1 ? `M${st[0][0]} ${st[0][1]}h.1` : 'M' + st.map(p => `${p[0]} ${p[1]}`).join('L'); }
function sigSVG(strokes, play, cls) {
  const ss = (strokes || []).filter(st => st.length);
  if (!play) return `<svg class="sig ${cls || ''}" viewBox="0 0 600 180" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${ss.map(st => `<path d="${sigD(st)}"/>`).join('')}</svg>`;
  // 획 길이에 비례해 1.6초 동안 순서대로 그린다
  const lens = ss.map(st => Math.max(sigLen(st), 4)), total = sum(lens), n = ss.length, gap = n > 1 ? 260 / (n - 1) : 0, draw = 1600 - gap * (n - 1);
  let t = 0;
  return `<svg class="sig play ${cls || ''}" viewBox="0 0 600 180" preserveAspectRatio="xMidYMid meet" role="img" aria-label="저장된 선수 서명을 재생하는 중">${ss.map((st, i) => { const d = Math.max(30, draw * lens[i] / total); const h = `<path pathLength="1" d="${sigD(st)}" style="animation-delay:${Math.round(t)}ms;animation-duration:${Math.round(d)}ms"/>`; t += d + gap; return h; }).join('')}</svg>`;
}
function packSig(strokes) { return strokes.filter(st => st.length).map(st => st.map(([a, b]) => [Math.round(a), Math.round(b)])); }
function autograph(strokes, nick, state, play) {
  return `<div class="autograph ${play ? 'is-writing' : ''}"><small>선수 서명${state ? ' · ' + state : ''}</small>${sigSVG(strokes, play)}<i></i><span>${esc(nick)}</span></div>`;
}

/* ---------- 롤드컵 우승 스킨 카드 ---------- */
function skinCard(sk, nick, seed, sig) {
  return `<div class="skin" style="--tc:${esc(sk.color)}"><div class="skin-hd"><span>${sk.y} 롤드컵 우승</span>${crestOf(sk.tid, sk.color, 'sm')}</div>
    <b class="skin-ch">${esc(sk.champ)}</b><span class="skin-sub">${esc(sk.team)} ${esc(nick)} 우승 스킨</span>
    ${sig ? sigSVG(sig.strokes, false, 'skin-sig') : ''}<img class="skin-av" src="${avatarURI(seed, sk.color)}" alt=""></div>`;
}

// 시작 화면·시즌 화면의 무대: 헤드셋을 쓴 선수와 모니터 불빛 (팀 컬러 조명)
function paintScenes() { /* CSS로 그려서 따로 칠할 것이 없다 */ }
const CUP_SVG = '<svg class="stage-cup" viewBox="0 0 60 80" aria-hidden="true"><path d="M14 6h32v14c0 12-7 21-16 23-9-2-16-11-16-23z" fill="#F5C842" stroke="#B8860B" stroke-width="2"/><path d="M14 10H5c0 9 4 14 10 15M46 10h9c0 9-4 14-10 15" fill="none" stroke="#B8860B" stroke-width="3"/><path d="M26 43h8v12h-8z" fill="#E0B22E"/><path d="M16 56h28v8H16z" fill="#C9962A"/><path d="M12 64h36v8H12z" fill="#8C6A1E"/><path d="M22 12h5v20h-5z" fill="#FFF2B0" opacity=".7"/></svg>';
function sceneHTML(seed, color, pro, kind) {
  kind = kind || (pro ? 'pro' : 'solo');
  const deco = kind === 'acad' ? '<i class="stage-row"></i>' : kind === 'debut' ? '<i class="stage-beam a"></i><i class="stage-beam b"></i><i class="stage-crowd"></i>' : kind === 'champ' || kind === 'worlds' ? '<i class="stage-confetti"></i>' + CUP_SVG : '';
  return `<div class="stage ${pro ? 'pro' : ''} k-${kind}" style="--tc:${esc(color || '#3182F6')}" role="img" aria-label="${pro ? '경기장 무대의 선수' : '새벽, 게이밍 데스크 앞의 선수'}">
    <i class="stage-glow"></i>${kind === 'debut' || kind === 'champ' || kind === 'worlds' ? '' : '<i class="stage-mon l"></i><i class="stage-mon r"></i>'}${deco}
    <img class="stage-av" src="${avatarURI(seed || 'landing-hero', color || '#3182F6')}" alt="">
    <i class="stage-desk"></i><i class="stage-kb"></i></div>`;
}

/* ---------- 구단 SNS 포스터 (THANK YOU · WELCOME · CONTRACT EXTENSION · FREE AGENT) ----------
 * 실제 LCK 구단들이 스토브리그에 올리는 4:5 인스타 포스터 문법을 따른다:
 * 화면을 꽉 채운 굵은 영문 타이포 + 그 위를 가리는 선수 상반신 + 닉네임·포지션·계약 기간 + 우상단 로고 */
const POSTER = {
  thanks: { w: ['THANK', 'YOU'], cls: 'thanks' },
  welcome: { w: ['WELCOME'], cls: 'welcome' },
  extend: { w: ['CONTRACT', 'EXTENSION'], cls: 'extend' },
  fa: { w: ['FREE', 'AGENT'], cls: 'fa' },
  loan: { w: ['ON', 'LOAN'], cls: 'welcome' },
  enlist: { w: ['SEE YOU', 'SOON'], cls: 'thanks' },
  retire: { w: ['THANK YOU', 'LEGEND'], cls: 'thanks' },
};
function postTeam(p) { return p.tid && G && G.teams[p.tid] ? G.teams[p.tid] : null; }
// 구단별 포스터 (실제 2025~2026 스토브리그 공식 포스터 양식 기준)
//  T1: 따뜻한 흐린 배경 + 흰 기하학 원·격자선, WELCOME + 큰 이름 + 영문 본명, 세로 문구, 계약 기간, 사인, 하단 로고
//  HLE: 짙은 회색 + 주황 사선 빛, 기울어진 거대 문구, 필기체 포지션 + 이름 + 영문 본명
//  DNS: 별이 뜬 우주 + 격자 + 파란 행성, +LOL TEAM +포지션, 이름 | 본명, 넓은 WELCOME, 스폰서 띠
//  GEN: 크림·골드 실크 / KT: 붉은 도트 조명 + 하단 계약 줄 / NS: 붉은 테두리 / BFX: 검정·노랑 / BRO: 윈도우 창
// 실제 사진 대신 선수 일러스트를 쓰고, 구단 로고 외의 스폰서 이름은 넣지 않는다
const POS_EN = { TOP: 'TOP', JGL: 'JUNGLE', MID: 'MID', ADC: 'BOT', SUP: 'SUPPORT' };
const POS_SHORT = { TOP: 'TOP', JGL: 'JGL', MID: 'MID', ADC: 'BOT', SUP: 'SPT' };
const NUM_EN = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
const SURNAME_EN = { 김: 'KIM', 이: 'LEE', 박: 'PARK', 최: 'CHOI', 정: 'JEONG', 강: 'KANG', 조: 'CHO', 윤: 'YOON', 장: 'JANG', 임: 'LIM', 한: 'HAN', 오: 'OH', 서: 'SEO', 신: 'SHIN', 권: 'KWON', 황: 'HWANG', 안: 'AHN', 송: 'SONG', 류: 'RYU', 유: 'YOO', 홍: 'HONG', 전: 'JEON', 고: 'KO', 문: 'MOON', 양: 'YANG', 손: 'SON', 배: 'BAE', 백: 'BAEK', 허: 'HEO', 남: 'NAM', 노: 'NOH', 심: 'SHIM', 곽: 'KWAK', 하: 'HA', 주: 'JOO', 우: 'WOO', 엄: 'EOM', 변: 'BYEON', 편: 'PYEON', 선: 'SEON', 설: 'SEOL', 성: 'SUNG', 연: 'YEON', 남궁: 'NAMGUNG', 쩐: 'TRAN' };
const RR_L = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const RR_V = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const RR_T = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
// 이름 표기 관례: 받침 없는 '우·수·주·유' 등은 oo로 (수환 → SOO-HWAN, 단우 → DAN-WOO)
function syl(ch) { const c = ch.charCodeAt(0) - 0xAC00; if (c < 0 || c > 11171) return ch; const l = Math.floor(c / 588), v = Math.floor((c % 588) / 28), t = c % 28; let vv = RR_V[v]; if (v === 13 && t === 0) vv = l === 11 ? 'woo' : 'oo'; if (v === 17 && t === 0 && l === 11) vv = 'yoo'; return RR_L[l] + vv + RR_T[t]; }
// 한글 본명을 포스터용 영문으로 (예: 김수환 → KIM SU-HWAN)
function romanName(name) {
  if (!name || !/^[가-힣]{2,4}$/.test(name)) return '';
  const two = name.length === 4 && SURNAME_EN[name.slice(0, 2)];
  const sur = two ? SURNAME_EN[name.slice(0, 2)] : SURNAME_EN[name[0]] || syl(name[0]).toUpperCase();
  const given = [...name.slice(two ? 2 : 1)].map(syl).join('-').toUpperCase();
  return `${sur} ${given}`;
}
function posterHTML(p, size) {
  const T = postTeam(p), def = POSTER[p.type] || POSTER.welcome, color = T ? T.color : '#4E5968';
  const en = T ? T.en.toUpperCase() : 'FREE AGENT', id = T ? T.id : 'FA';
  const tpl = { T1: 't1', HLE: 'hle', DNS: 'dns', GEN: 'gen', KT: 'kt', NS: 'ns', BFX: 'bfx', BRO: 'bro', DK: 'dk', KRX: 'krx' }[id] || (p.type === 'fa' ? 'fa' : 'std');
  const yr = p.y + (p.type === 'thanks' || p.type === 'retire' ? 0 : 1);
  const word = def.w.join(' '), nick = esc(p.nick), real = esc(romanName(p.name)), pos = POS_EN[p.pos] || '', posS = POS_SHORT[p.pos] || '';
  const term = p.type === 'extend' ? `${NUM_EN[p.years] || p.years} MORE YEAR${p.years > 1 ? 'S' : ''}<br>UNTIL ${p.until}` : p.type === 'welcome' && p.acad ? `ACADEMY<br>LCK CL ${yr}` : p.type === 'welcome' && p.until ? `${NUM_EN[p.until - p.y] || ''} YEAR${p.until - p.y > 1 ? 'S' : ''}<br>UNTIL ${p.until}` : p.type === 'loan' ? `ON LOAN<br>${yr} SEASON` : p.type === 'fa' ? `OPEN TO OFFERS<br>${yr}` : `${en}<br>${yr}`;
  const sig = p.me && G && G.user && G.user.sig && /welcome|extend|loan/.test(p.type) ? sigSVG(G.user.sig.strokes, false, 'pv-sig') : '';
  const av = `<img class="pv-av" src="${avatarURI(p.seed, p.type === 'fa' ? '#4E5968' : color)}" alt="">`;
  const logo = T ? crest(T, 'pv-logo') : '';
  let h = '';
  if (tpl === 't1') h = `<i class="t1-geo"></i>${av}<div class="t1-head"><span>${word}</span><b>${nick}</b>${real ? `<small>${real}</small>` : ''}</div><span class="t1-side l">${yr} T1WIN</span><span class="t1-side r">T1 FIGHTING</span><div class="t1-foot">${term}</div>${sig}<div class="t1-logo">${logo}</div>`;
  else if (tpl === 'hle') h = `<i class="hle-streak"></i>${logo}<span class="hle-corp">한화생명</span>${p.type === 'thanks' ? '<span class="hle-pre">FAREWELL</span>' : ''}<b class="hle-word">${def.w.map(x => `<span>${x}</span>`).join('')}</b>${av}<div class="hle-name"><i>${pos.charAt(0) + pos.slice(1).toLowerCase()}</i><b>${nick}</b>${real ? `<span>${real}</span>` : ''}</div>${sig}`;
  else if (tpl === 'dns') h = `<i class="dns-space"></i><i class="dns-planet"></i><div class="dns-top"><span>⁄⁄ ${yr} DNS</span><span>LOL TEAM</span>${logo}</div><div class="dns-tag">+LOL TEAM<br>+${posS}</div>${av}<div class="dns-name">${nick}${real ? ` <i>|</i> ${real}` : ''}</div><b class="dns-word">${word}</b><div class="dns-bar">${logo}<span>DN SOOPERS · ${yr}</span></div>${sig}`;
  else if (tpl === 'gen') h = `<i class="gen-silk"></i><b class="gen-word">${def.w.map(x => `<span>${x}</span>`).join('')}</b><span class="gen-nick">${nick}</span>${av}<div class="gen-slogan">${yr}<br>GEN.G LEAGUE OF LEGENDS</div><div class="gen-logo">${logo}</div>${sig}`;
  else if (tpl === 'kt') h = `<i class="kt-dots"></i>${logo}<b class="kt-word">${def.w.map(x => `<span>${x}</span>`).join('')}</b>${av}<div class="kt-foot"><b>${nick}</b><span>WITH KT ROLSTER<br>${p.type === 'extend' ? `FOR ${NUM_EN[p.years] || p.years} MORE YEAR${p.years > 1 ? 'S' : ''}` : p.type === 'thanks' ? 'THANK YOU FOR EVERYTHING' : `${posS} · ${yr}`}</span><b>${p.until || yr}</b></div>${sig}`;
  else if (tpl === 'ns') h = `<i class="ns-frame"></i><div class="ns-top">${en.split(' ').map(w => w.split('').join(' ')).join('&nbsp;&nbsp;&nbsp;')}</div>${av}<div class="ns-low"><b class="ns-nick">${nick}</b><b class="ns-word">${word}</b></div><div class="ns-bar">NONGSHIM · REDFORCE · ${yr}</div>${sig}`;
  else if (tpl === 'bfx') h = `<i class="bfx-glow"></i>${logo}${av}<div class="bfx-low"><small>FEARLESS FOXES · ${yr}</small><b class="bfx-word">${word}</b><span class="bfx-nick">${nick}${real ? ` · ${real}` : ''}</span></div>${sig}`;
  else if (tpl === 'bro') h = `<div class="bro-bar"><span>${word.charAt(0) + word.slice(1).toLowerCase()}</span><i>_</i><i>□</i><i>×</i></div><div class="bro-menu"><u>F</u>ile <u>E</u>dit <u>S</u>earch <u>H</u>elp</div><div class="bro-win"><b class="bro-word">${word}</b><div class="bro-pos">↘ ${posS}</div>${real ? `<div class="bro-real">${real}</div>` : ''}<div class="bro-team">HANJIN BRION</div>${av}<b class="bro-nick">${nick}</b>${sig}</div>`;
  else h = `<i class="std-streak"></i>${logo}<b class="std-word">${word}</b>${av}<div class="std-name"><i>${pos}</i><b>${nick}</b>${real ? `<span>${real}</span>` : ''}</div><div class="std-foot">${term}</div>${sig}`;
  return `<div class="poster pv tpl-${tpl} pt-${p.type} ${def.w.length > 1 ? 'two' : ''} ${size || ''}" style="--tc:${esc(color)}">${h}</div>`;
}

function postCaption(p) {
  const T = postTeam(p), n = p.nick, tn = T ? T.name : '';
  switch (p.type) {
    case 'thanks': return `그동안 ${tn}${jo(tn, '과', '와')} 함께해 준 ${n} 선수에게 진심으로 감사드립니다. 앞으로의 새로운 도전을 응원하겠습니다. #ThankYou${n}`;
    case 'welcome': if (p.acad) return `${n} 선수가 ${tn} 2군(LCK CL)에 합류합니다. 1군 무대를 향한 첫걸음을 응원해 주세요. #Welcome${n}`; return `${n} 선수가 ${tn}에 합류합니다. 계약 기간은 ${p.until}년까지입니다. 새로운 시즌, 함께 달려 주세요. #Welcome${n}`;
    case 'extend': return `${n} 선수와 ${p.until}년까지 함께합니다. 변함없는 응원 부탁드립니다. #${n}${p.until}`;
    case 'loan': return `${n} 선수가 ${p.y + 1} 시즌 동안 ${tn}에서 임대로 뛰게 됐습니다. 좋은 경기로 보답하겠습니다.`;
    case 'fa': return `${n}입니다. 계약이 끝나 FA가 됐습니다. 그동안 응원해 주셔서 감사합니다. 더 좋은 모습으로 찾아뵙겠습니다.`;
    case 'enlist': return `${n} 선수가 병역 의무를 위해 잠시 팀을 떠납니다. 건강하게 다녀오세요. 기다리겠습니다.`;
    case 'retire': return `${n} 선수가 프로게이머 생활을 마무리합니다. 협곡에 남긴 모든 순간을 기억하겠습니다.`;
  }
  return '';
}
function postAccount(p) { const T = postTeam(p); return p.type === 'fa' ? { name: p.nick, sub: '선수 개인 계정' } : { name: T ? T.name : 'LCK', sub: '공식 계정' }; }
// 인스타 게시물 모양: 계정 줄 + 포스터 + 좋아요 + 캡션
function postCard(p) {
  const acc = postAccount(p), T = postTeam(p);
  const likes = Math.round((p.me ? 40 + userP(G).pop * userP(G).pop * 3 : 200 + (p.ovr || 70) * (p.ovr || 70) * 2) * (T && T.id === 'T1' ? 2.5 : 1));
  return `<article class="ig"><div class="ig-hd">${p.type === 'fa' ? `<img class="av sm" src="${avatarURI(p.seed, '#4E5968')}" alt="">` : T ? crest(T, 'sm') : ''}<div><b>${esc(acc.name)}</b><span>${acc.sub}</span></div></div>
    ${posterHTML(p)}
    <div class="ig-ft"><span class="ig-like">${IC.heart}${likes.toLocaleString('ko-KR')}</span><p><b>${esc(acc.name)}</b> ${esc(postCaption(p))}</p>${commentsHTML(p)}<p class="fine" style="margin:0">게임 속 연출이에요. 실제 구단·선수 계정의 게시물·댓글이 아니에요.</p></div></article>`;
}
// 스토브리그 피드: 이번 오프시즌 포스터 (내 것 먼저)
function stovePosts() { const y = G.phase === 'PRE' ? G.year - 1 : G.year; return (G.posts || []).filter(p => p.y === y).sort((a, b) => ((b.me ? 1000 : 0) + (b.ovr || 0)) - ((a.me ? 1000 : 0) + (a.ovr || 0))).slice(0, 16); }
function stoveRow() {
  const ps = stovePosts();
  if (!ps.length) return '';
  return `<h3 class="sec">스토브리그</h3><div class="pt-strip" role="list">${ps.map(p => `<button class="pt-mini" role="listitem" data-a="openPost" data-v="${p.id}" aria-label="${esc(postAccount(p).name)} ${esc(POSTER[p.type].w.join(' '))} ${esc(p.nick)}">${posterHTML(p, 'mini')}</button>`).join('')}</div>`;
}

/* ---------- 개발자에게 응원 한마디 ----------
 * 결제·후원 없이 응원 메시지만 받는다. 게임 안 팝업에서 보내면 폼 전송 서비스(Web3Forms)가 개발자 메일함으로 전달한다.
 * 코드에는 개발자 이메일이 없고 접근 키만 있다. 키가 비어 있으면 응원 버튼을 아예 숨긴다.
 * 플레이어의 이름·연락처는 받지 않는다 (게임 속 연도·닉네임만 함께 보낸다) */
const CHEER_KEY = '';
const CHEER_API = 'https://api.web3forms.com/submit';
const CHEER_MAX = 500;
function cheerCtx() { const u = G && G.user ? userP(G) : null; return u ? `게임 속 ${G.year}년 · ${u.nick} ${u.age}살 ${POS_KO[u.pos] || ''}`.trim() : '게임 시작 전'; }
function cheerEntry() {
  return `<div class="contact"><button class="li" data-a="cheer"><span class="ic red">${IC.heart}</span><span class="tx"><b>개발자에게 응원 남기기</b><span>재밌었던 순간, 바라는 기능 무엇이든</span></span><span class="chev">${IC.chev}</span></button></div>`;
}
function vCheer(s) {
  if (s.state === 'done') return sheetWrap(`<p class="eyebrow">개발자에게 한마디</p><h2 class="t1">고마워요!</h2><p class="body" style="margin:0">메시지가 개발자에게 잘 전달됐어요.</p><button class="btn btn-primary" data-a="closeSheet">닫기</button>`, '응원 보내기 완료');
  const busy = s.state === 'sending', len = (s.text || '').length;
  return sheetWrap(`<p class="eyebrow">개발자에게 한마디</p><h2 class="t1">응원 한마디 남겨 주세요</h2><p class="body" style="margin:0">재밌었던 순간, 바라는 기능, 아쉬운 점 모두 반가워요.</p>
    <textarea id="cheer" class="textarea" maxlength="${CHEER_MAX}" placeholder="예) 결승 미니맵 중계 보는 맛이 있어요!" ${busy ? 'disabled' : ''}>${esc(s.text || '')}</textarea>
    <input id="cheer-hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="cheer-meta"><span>이름이나 연락처는 받지 않아요. 게임 속 연도와 닉네임만 함께 전달돼요.</span><span id="cheer-n">${len}/${CHEER_MAX}</span></div>
    ${!CHEER_KEY ? '<p class="fine" style="margin:0">아직 준비 중이에요. 곧 보낼 수 있어요.</p>' : s.state === 'error' ? '<p class="fine err" style="margin:0">보내지 못했어요. 잠시 후 다시 시도해 주세요.</p>' : ''}
    <div class="btn-row"><button class="btn btn-grey" data-a="closeSheet">닫기</button><button class="btn btn-primary" data-a="cheerSend" ${busy || !CHEER_KEY ? 'disabled' : ''}>${busy ? '보내는 중…' : '보내기'}</button></div>`, '개발자에게 응원 남기기');
}
function cheerSend() {
  const s = UI.sheet; if (!s || s.type !== 'cheer' || s.state === 'sending' || !CHEER_KEY) return;
  const ta = $id('cheer'), hp = $id('cheer-hp');
  const text = (ta ? ta.value : s.text || '').trim().slice(0, CHEER_MAX);
  s.text = ta ? ta.value : s.text;
  if (!text) { toast('메시지를 적어 주세요'); return; }
  if (UI.cheerAt && Date.now() - UI.cheerAt < 60000) { toast('조금 뒤에 다시 보내 주세요'); return; }
  const done = ok => { if (UI.sheet !== s) return; if (ok) { s.state = 'done'; s.text = ''; UI.cheerAt = Date.now(); } else s.state = 'error'; renderSheet(); };
  // 자동 입력 봇만 채우는 칸: 채워져 있으면 보낸 척만 한다
  if (hp && hp.value) { done(true); return; }
  s.state = 'sending'; renderSheet();
  const ac = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => ac && ac.abort(), 12000);
  fetch(CHEER_API, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, signal: ac ? ac.signal : undefined,
    body: JSON.stringify({ access_key: CHEER_KEY, subject: '[솔랭에서 월즈까지] 응원 메시지', from_name: '솔랭에서 월즈까지', message: text, 게임: cheerCtx() }),
  }).then(r => r.json()).then(j => done(!!(j && j.success))).catch(() => done(false)).finally(() => clearTimeout(timer));
}

/* ---------- 스토브리그 속보 ----------
 * 큰 이적·재계약·은퇴를 이적시장 속보 계정처럼 보여 준다. 매체 '협곡 인사이더'는 게임 속 가상 계정이다 */
const BRK_TAG = { BREAKING: 'red', OFFICIAL: 'dark', EXCLUSIVE: 'blue', RUMOR: 'amber' };
const fmtK = n => (n >= 10000 ? (n / 10000).toFixed(1) + '만' : Math.round(n).toLocaleString('ko-KR'));
function brkTeam(id) { return id && G.teams[id] ? crest(G.teams[id], 'sm') : '<span class="crest sm brk-fa">FA</span>'; }
function brkCard(b, compact) {
  const u = userP(G), T = b.to && G.teams[b.to], F = b.from && G.teams[b.from];
  const nick = b.me ? u.nick : b.nick, color = T ? T.color : F ? F.color : '#4E5968';
  const flow = b.k === 'retire' ? `${brkTeam(b.from)}<span class="brk-ar">은퇴</span>` : b.k === 'extend' ? `${brkTeam(b.to)}<span class="brk-ar">재계약</span>` : b.k === 'leave' ? `${brkTeam(b.from)}<span class="brk-ar">→</span>${brkTeam(null)}` : `${brkTeam(b.from)}<span class="brk-ar">→</span>${brkTeam(b.to)}`;
  return `<article class="brk ${compact ? 'compact' : ''}"><div class="brk-hd"><span class="brk-logo">${IC.bolt}</span><div class="brk-acc"><b>협곡 인사이더</b><span>@rift_insider · ${esc(b.ago)}</span></div><span class="brk-tag ${BRK_TAG[b.tag] || ''}">${b.tag}</span></div>
    <p class="brk-tx">${esc(b.text)}</p>
    <div class="brk-card"><img class="av sm" src="${avatarURI(b.seed, color)}" alt=""><div class="brk-who"><b>${esc(nick)}${b.fr ? ' <i class="ro-v face">팀의 얼굴</i>' : ''}</b><small>${POS_KO[b.pos] || ''} · OVR ${b.ovr}</small></div><div class="brk-flow">${flow}</div></div>
    <div class="brk-ft">${compact ? '' : `<span>♥ ${fmtK(b.likes)}</span><span>리포스트 ${fmtK(b.rts)}</span>`}<span class="brk-fake">가상 기사 · 솔랭에서 월즈까지</span></div></article>`;
}
// 이번 오프시즌 속보가 아직 보여 줄 시기인지 (오프시즌, 또는 다음 시즌을 시작하기 전)
function curBreaking() { const B = G && G.breaking; if (!B || !B.items || !B.items.length) return null; return (G.phase === 'OFF' && B.y === G.year) || (G.phase === 'PRE' && B.y === G.year - 1) ? B : null; }
function breakingFeed(n) {
  const B = curBreaking(); if (!B) return '';
  return `<h3 class="sec">스토브리그 속보</h3><section class="card tight brk-list">${B.items.slice(0, n).map(b => brkCard(b, true)).join('')}<p class="fine" style="margin:8px 0 0">게임 속 가상 속보예요. 실제 매체·선수의 소식이 아니에요.</p></section>`;
}
// 이야기 사이사이에 속보를 띄운다 (아직 안 본 것 n개)
function showBreaking(n) {
  const B = curBreaking(); if (!B || G.phase !== 'OFF') return false;
  const start = B.shown || 0, end = Math.min(B.items.length, start + n);
  if (start >= end) return false;
  B.shown = end; save();
  UI.sheet = { type: 'breaking', i: start, start, end }; renderSheet();
  return true;
}
/* ---------- 은퇴 이유 ---------- */
const RETIRE_WHY = {
  age: { title: '마우스를 내려놓을 시간', short: `${MAX_AGE}살 시즌을 끝으로 커리어를 마무리해요`, text: u => `${MAX_AGE}살 시즌을 끝으로 은퇴할 때가 됐어요. 손목도, 반응 속도도 예전 같지 않아요. 협곡에서 보낸 시간을 정리할 차례예요.` },
  noOffer: { title: '불러주는 팀이 없었어요', short: '계약이 끝났지만 제안이 오지 않았어요', text: u => `계약이 끝났지만 어느 팀에서도 연락이 오지 않았어요. ${u.age}살, 프로게이머 생활을 여기서 마무리해요.` },
  dream: { title: '프로의 꿈을 접어요', short: '프로 계약을 따내지 못했어요', text: () => '스물한 살이 되도록 프로 계약을 따내지 못했어요. 프로의 꿈은 접지만, 솔랭 랭커로 보낸 새벽들은 남아요.' },
};
// 팀의 얼굴 표시 (Faker·ShowMaker 같은 프랜차이즈 스타, 없으면 팀에서 이름값이 가장 큰 선수)
const faceTag = (p, T) => (T && p && teamFace(G, T) === p ? ' <i class="ro-v face">팀의 얼굴</i>' : '');

function stepper(ms) {
  const L = ['솔랭', '연습생', '데뷔', '우승', '롤드컵'], cur = ms.lastIndexOf(true);
  return `<div class="stepper" aria-label="커리어 단계">${L.map((l, i) => `<div class="st ${ms[i] ? 'on' : ''} ${i === cur ? 'cur' : ''}"><i></i><span>${l}</span></div>`).join('')}</div>`;
}
function bars(st, focus) { return `<div class="bars">${STATS.map(k => `<div class="bar-row ${focus && focus.includes(k) ? 'focus' : ''}"><span>${STAT_KO[k]}</span><span class="bar"><i style="width:${clamp(st[k], 0, 100).toFixed(1)}%"></i></span><b>${Math.round(st[k])}</b></div>`).join('')}</div>`; }
function ovrOf(st, pos) { let s = 0; for (const k of STATS) s += st[k] * WGT[pos][k]; return Math.round(s); }

/* =========================================================
 * 렌더
 * ========================================================= */
function screenFor() {
  if (!G || !G.user || !G.P[G.user.pid]) return 'landing';
  if (G.user.retired) return 'landing';
  return 'app';
}
function render() {
  const s = UI.screen;
  $id('app').innerHTML = s === 'onboard' ? vOnboard() : s === 'app' ? vApp() : s === 'end' ? vEnd() : vLanding();
  renderSheet();
  paintScenes();
  if (s === 'landing' || !s) journeyTick(); else clearTimeout(jrTimer);
}

/* ---------- 시작 화면 ---------- */
function hofCard(hof) {
  const rows = hof.slice(0, 5).map((h, i) => `<div class="post" style="grid-template-columns:24px 40px 1fr auto;align-items:center"><b class="${i === 0 ? 'blue' : ''}">${i + 1}</b><img class="av sm" src="${avatarURI(h.seed || h.nick, h.color || '#4E5968')}" alt=""><div style="min-width:0"><b>${esc(h.nick)}</b><div class="cap">${POS_KO[h.pos] || ''} · ${esc(h.team || '')}</div></div><div class="cap" style="text-align:right">롤드컵 <b style="color:#191F28">${h.worlds || 0}</b> · 등급 <b style="color:#191F28">${h.grade}</b></div></div>`).join('');
  return `<div class="card-row"><h2 class="t2">명예의 전당</h2><span class="cap">이 브라우저 기록</span></div>${rows || '<p class="body">은퇴한 선수가 여기에 기록돼요. 롤드컵 우승 횟수로 순위를 매겨요.</p>'}`;
}
const JOURNEY = [
  { label: '솔랭', cap: '새벽 4시, 솔랭 큐를 돌리며', kind: 'solo', color: '#4E5968' },
  { label: '연습생', cap: '2군 연습실에 처음 들어가', kind: 'acad', color: '#3182F6' },
  { label: '데뷔', cap: 'LoL 파크 무대에서 데뷔하고', kind: 'debut', color: '#3182F6' },
  { label: '우승', cap: 'LCK 트로피를 들어 올려', kind: 'champ', color: '#3182F6' },
  { label: '롤드컵', cap: '마침내 소환사의 컵까지', kind: 'worlds', color: '#3182F6' },
];
function journeyCard(seed) {
  const k = UI.jr || 0;
  return `<section class="card center journey" aria-label="커리어 여정"><div class="jr-stage">${JOURNEY.map((j, i) => `<div class="jr-scene ${i === k ? 'on' : ''}" aria-hidden="${i !== k}">${sceneHTML(seed, j.color, j.kind !== 'solo' && j.kind !== 'acad', j.kind)}</div>`).join('')}</div>
    <p class="t3 jr-cap" aria-live="polite">${JOURNEY[k].cap}</p>
    <ol class="stepper jr-steps">${JOURNEY.map((j, i) => `<li class="st ${i <= k ? 'on' : ''} ${i === k ? 'cur' : ''}"><button type="button" data-a="jr" data-v="${i}" ${i === k ? 'aria-current="step"' : ''}><i></i><span>${j.label}</span></button></li>`).join('')}</ol></section>`;
}
// 원작처럼 약 2초마다 다음 단계로 (마지막 단계는 조금 더 오래), 움직임 줄이기 설정이면 멈춘다
let jrTimer = 0;
function setJourney(k) {
  UI.jr = k;
  const card = document.querySelector('.journey'); if (!card) return;
  card.querySelectorAll('.jr-scene').forEach((el, i) => { el.classList.toggle('on', i === k); el.setAttribute('aria-hidden', i !== k); });
  card.querySelector('.jr-cap').textContent = JOURNEY[k].cap;
  card.querySelectorAll('.jr-steps .st').forEach((el, i) => { el.classList.toggle('on', i <= k); el.classList.toggle('cur', i === k); const b = el.querySelector('button'); if (i === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
}
function journeyTick() {
  clearTimeout(jrTimer);
  if (reduceMotion() || UI.screen !== 'landing') return;
  jrTimer = setTimeout(() => { if (UI.screen !== 'landing' || !document.querySelector('.journey')) return; setJourney(((UI.jr || 0) + 1) % JOURNEY.length); journeyTick(); }, (UI.jr || 0) === JOURNEY.length - 1 ? 3500 : 2200);
}
function vLanding() {
  const sv = load(SAVE_KEY), hof = load(HOF_KEY) || [];
  const has = sv && (sv.v === SAVE_V || sv.v === 4) && sv.user && sv.P && sv.P[sv.user.pid] && !sv.user.retired;
  const su = has ? sv.P[sv.user.pid] : null;
  const crestRow = rg => `<div class="lg-league"><span class="cap">${rg}</span><div class="crest-row">${TEAMS_DATA[rg].map(d => crestOf(d[0], d[3], '', d[1])).join('')}</div></div>`;
  const crests = crestRow('LCK') + crestRow('LPL') + `<div class="lg-league"><span class="cap">LEC · LCS · LCP · CBLOL</span><div class="crest-row">${['LEC', 'LCS', 'LCP', 'CBLOL'].map(rg => TEAMS_DATA[rg].map(d => crestOf(d[0], d[3], '', d[1])).join('')).join('')}</div></div>`;
  const feats = [['스토브리그', '누구와 뛸지 보고 골라요', '계약서에 다음 시즌 라인업과 듀오 파트너가 나와요. 이적·재계약·FA 소식은 구단 포스터로 올라와요.'], ['서명', '계약서에 직접 서명해요', '첫 계약은 손가락이나 마우스로 직접 사인하고, 이후 계약서마다 내 서명이 들어가요.'], ['패치', '시즌마다 메타가 바뀌어요', '라인전·한타·운영·캐리 메타에 따라 같은 능력치도 가치가 달라져요.'], ['챔피언', '시그니처 챔피언을 정해요', '메타와 맞으면 더 자주 꺼내고 더 크게 활약해요.'], ['속보', '스토브리그 속보가 터져요', 'Faker 재계약, 대형 이적, 레전드 은퇴. 큰 소식은 이적시장 속보 계정처럼 먼저 날아와요.'], ['중계', '결승은 미니맵으로 봐요', '소환사의 협곡 미니맵에서 10명이 움직이고, 해설은 지도 아래에 흘러요.'], ['스킨', '롤드컵 우승 스킨을 남겨요', '우승하면 챔피언을 직접 골라 팀 로고와 내 서명이 들어간 스킨을 받아요.']];
  return `<div class="shell">
    <header class="hd"><div><div class="hd-t">솔랭에서 월즈까지</div><div class="hd-s">LCK·LPL 실제 구단으로 쌓는 프로게이머 인생</div></div></header>
    <main class="stack pb-cta">
      <section class="card"><p class="eyebrow">16살, 솔랭 다이아몬드에서 시작해요</p><h1 class="display">솔랭에서<br>월즈까지</h1><p class="body">한 시즌의 활약과 선택이 쌓여 커리어가 돼요.<br>데뷔, 우승, 월즈까지 도전해 보세요.</p></section>
      ${journeyCard(has ? su.seed : 'm-landing-hero')}
      <section class="card"><h2 class="t2">롤 선수라서 겪는 일</h2><div class="feats">${feats.map(([k, t, d]) => `<div class="feat"><span class="badge blue">${k}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div></section>
      <section class="card">${hofCard(hof)}</section>
      <section class="card"><h2 class="t2">실제 리그, 실제 구단</h2><p class="body">2026 시즌 기준 LCK 10팀과 LPL 14팀이 매 시즌 끝까지 치러져요. LEC·LCS·LCP·CBLOL 대표팀은 MSI와 롤드컵에서 만나요. T1의 Faker, DK의 ShowMaker처럼 팀마다 그 팀의 얼굴이 있고, 은퇴·이적으로 생긴 자리도 LCK CL과 해외 리그의 실존 선수가 먼저 채워요.</p>${crests}</section>
      ${CHEER_KEY ? `<section class="card"><h2 class="t2">개발자에게 한마디</h2><p class="body" style="margin:0">재밌게 즐기셨다면 응원 한마디 남겨 주세요.</p>${cheerEntry()}</section>` : ''}
      <p class="fine">독립적으로 만든 비공식 팬 게임이에요. Riot Games, LoL Esports, 각 구단과 관련이 없어요. 구단·대회 명칭과 로고, 선수 닉네임, 챔피언 이름의 권리는 각 권리자에게 있어요. 로스터는 2026 시즌 공개 자료 기준이라 실제와 다를 수 있고, 능력치와 경기 결과는 실제 선수 평가가 아니에요.<br>폰트 Pretendard · Anton (SIL OFL) · 아바타 Toon Head by Johan Melin (CC BY 4.0, DiceBear)</p>
    </main>
    <div class="cta-bar">${has ? `<button class="btn btn-primary" data-a="cont">이어하기 · ${esc(su.nick)} ${su.age}살</button><button class="btn btn-text" data-a="newAsk">새로운 인생 시작하기</button>` : '<button class="btn btn-primary" data-a="newGo">새로운 인생 시작하기</button>'}</div>
  </div>`;
}

/* ---------- 온보딩 ---------- */
function newOb() {
  const seeds = []; for (let i = 0; i < 24; i++) seeds.push((i % 3 === 2 ? 'f-' : 'm-') + Math.floor(Math.random() * 1e9).toString(36));
  const ob = { step: 0, seeds, seed: seeds[0], nick: pick(HANDLES), pos: 'MID', name: pick(SURN) + pick(GIVEN), styles: null, si: 0, focus: [], champ: null };
  ob.styles = styleCandidates(ob.pos);
  return ob;
}
function obTop() {
  const s = UI.ob.step;
  return `<div class="ob-top"><button class="icon-btn" data-a="obBack" aria-label="뒤로">${IC.back}</button><div class="dots">${[0, 1, 2, 3, 4].map(i => `<i class="${i === s ? 'on' : ''}"></i>`).join('')}</div><span style="width:40px"></span></div>`;
}
function vOnboard() {
  const ob = UI.ob, st = ob.step;
  let head = '', body = '', cta = '';
  if (st === 0) {
    head = '<p class="eyebrow">나의 프로게이머 인생을 시작해요</p><h1 class="t1">선수의 모습을<br>골라 주세요</h1>';
    body = `<section class="card"><div class="prof"><img class="av lg" src="${avatarURI(ob.seed, '#4E5968')}" alt="선택한 아바타"><b class="t3">내 선수의 모습</b></div>
      <div class="av-grid">${ob.seeds.map(s => `<button class="tile" data-a="obSeed" data-v="${s}" aria-pressed="${s === ob.seed}" aria-label="아바타"><img src="${avatarURI(s, '#4E5968')}" alt=""></button>`).join('')}</div>
      <button class="btn btn-text" data-a="obReroll">다른 얼굴 보기</button></section>`;
    cta = '<button class="btn btn-primary" data-a="obNext">이 아바타로 할게요</button>';
  } else if (st === 1) {
    head = '<p class="eyebrow">16살, 고1에서 시작해요</p><h1 class="t1">어떤 선수로<br>살아볼까요?</h1>';
    body = `<section class="card">
      <div class="field"><label for="nick">닉네임</label><div class="input-row"><input id="nick" class="input" maxlength="12" value="${esc(ob.nick)}" autocomplete="off" spellcheck="false"><button class="btn btn-grey btn-sm" style="height:52px" data-a="obNick">랜덤</button></div></div>
      <div class="field"><span class="lbl">포지션</span><div class="chips">${POS.map(p => `<button class="chip" data-a="obPos" data-v="${p}" aria-pressed="${ob.pos === p}">${POS_KO[p]}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">본명</span><div class="card-row"><b class="t3">${esc(ob.name)}</b><button class="btn btn-grey btn-sm" data-a="obName">다시 정하기</button></div></div>
      <div class="field"><span class="lbl">시작</span><b class="t3">대한민국 · 솔로랭크 다이아몬드</b></div>
    </section>`;
    cta = '<button class="btn btn-primary" data-a="obNext">다음</button>';
  } else if (st === 2) {
    head = `<p class="eyebrow">${esc(ob.nick)} · ${POS_KO[ob.pos]}</p><h1 class="t1">플레이 스타일을<br>골라 주세요</h1><p class="body">세 후보 모두 능력치 합은 ${STAT_TOTAL}이고, 분포만 달라요.</p>`;
    body = ob.styles.map((s, i) => {
      const top = [...STATS].sort((a, b) => s.st[b] - s.st[a]).slice(0, 2);
      return `<button class="opt" data-a="obStyle" data-i="${i}" aria-pressed="${ob.si === i}"><div class="opt-h"><b class="t3">${s.name}</b><span class="badge ${ob.si === i ? 'blue' : ''}">OVR ${ovrOf(s.st, ob.pos)}</span></div>
        <span class="cap">${top.map(k => `${STAT_KO[k]} ${Math.round(s.st[k])}`).join(' · ')}</span>${ob.si === i ? bars(s.st, s.main) : ''}</button>`;
    }).join('') + '<button class="btn btn-text" data-a="obStyleReroll">다른 후보 보기</button>';
    cta = '<button class="btn btn-primary" data-a="obNext">이 스타일로 할게요</button>';
  } else if (st === 3) {
    const s = ob.styles[ob.si], cands = champCandidates(ob.pos, s.main);
    head = `<p class="eyebrow">${s.name} · ${POS_KO[ob.pos]}</p><h1 class="t1">시그니처 챔피언을<br>골라 주세요</h1><p class="body">패치 메타와 성향이 맞는 시즌엔 더 자주 꺼내고 더 크게 활약해요. 롤드컵을 우승하면 우승 스킨 후보가 돼요.</p>`;
    body = `<section class="card"><div class="champ-grid">${cands.map(c => `<button class="champ" data-a="obChamp" data-v="${esc(c.n)}" aria-pressed="${ob.champ === c.n}"><b>${esc(c.n)}</b><span>${TAG_KO[c.t]}${c.rec ? ' · 추천' : ''}</span></button>`).join('')}</div>
      <p class="cap" style="margin-top:12px">추천: ${esc(s.name)} 스타일의 강점과 성향이 같은 챔피언이에요.</p></section>`;
    cta = `<button class="btn btn-primary" data-a="obNext" ${ob.champ ? '' : 'disabled'}>${ob.champ ? esc(ob.champ) + roJ(ob.champ) + ' 할게요' : '챔피언을 골라 주세요'}</button>`;
  } else {
    const s = ob.styles[ob.si];
    head = `<p class="eyebrow">${s.name} · OVR ${ovrOf(s.st, ob.pos)}</p><h1 class="t1">집중해서 키울 능력치를<br>골라 주세요</h1><p class="body">최대 2개까지 고를 수 있어요. 고른 능력치가 훨씬 빨리 자라고, 커리어 중 전환점에서 바꿀 수 있어요.</p>`;
    body = `<section class="card"><div class="stat-tiles">${STATS.map(k => `<button class="stat-tile" data-a="obFocus" data-v="${k}" aria-pressed="${ob.focus.includes(k)}"><b>${Math.round(s.st[k])}</b><span>${STAT_KO[k]}</span></button>`).join('')}</div>
      <p class="cap" style="margin-top:12px">${POS_KO[ob.pos]}에게 중요한 능력치: ${[...STATS].sort((a, b) => WGT[ob.pos][b] - WGT[ob.pos][a]).slice(0, 3).map(k => STAT_KO[k]).join(', ')}</p></section>`;
    cta = `<button class="btn btn-primary" data-a="obNext" ${ob.focus.length ? '' : 'disabled'}>선수 만들기</button>`;
  }
  return `<div class="shell">${obTop()}<div class="ob-head">${head}</div><main class="stack pb-cta">${body}</main><div class="cta-bar">${cta}</div></div>`;
}

/* ---------- 앱 ---------- */
function vApp() {
  const t = UI.tab;
  const r = t === 'react' ? tReact() : t === 'season' ? tSeason() : t === 'player' ? tPlayer() : t === 'record' ? tRecord() : tHome();
  const TT = themeTeam();
  const th = TT ? ` themed" style="--tc:${TT.color};--tc-ink:${lum(TT.color) > 0.6 ? '#191F28' : '#FFFFFF'};--tc-on:${lum(TT.color) > 0.6 ? '#191F28' : TT.color}` : '';
  return `<div class="shell${th}"><header class="hd">${TT ? crest(TT, 'hd-crest') : ''}<div style="flex:1;min-width:0"><div class="hd-t">${TT ? esc(TT.name) + (userP(G).acad ? ' 2군' : G.user.stage === 'TRAINEE' ? ' 아카데미' : '') : '솔랭에서 월즈까지'}</div><div class="hd-s">${G.year} 시즌${G.phase === 'OFF' ? ' 이후 · 오프시즌' : ''}${TT ? ' · 솔랭에서 월즈까지' : ''}</div></div><button class="icon-btn" data-a="settings" aria-label="설정">${IC.gear}</button></header>
    <main class="stack pb-tab ${r.cta ? 'pb-cta' : ''}">${r.html}</main>${r.cta ? `<div class="cta-bar with-tab">${r.cta}</div>` : ''}${tabbar()}</div>`;
}
function themeTeam() { const u = userP(G); if (u.mil) return null; if (u.tid) return G.teams[u.tid]; if (G.user.stage === 'TRAINEE' && G.user.trainee) return G.teams[G.user.trainee]; return null; }
function tabbar() {
  const tabs = [['home', '홈', IC.home], ['react', '반응', IC.chat], ['season', '시즌', IC.season], ['player', '선수', IC.user], ['record', '기록', IC.chart]];
  const newReact = G.phase === 'OFF' && !UI.seenReact;
  return `<nav class="tabbar" role="tablist">${tabs.map(([k, n, ic]) => `<button class="tab" role="tab" data-a="tab" data-v="${k}" aria-selected="${UI.tab === k}">${ic}<span>${n}</span>${k === 'react' && newReact ? '<i class="dot"></i>' : ''}</button>`).join('')}</nav>`;
}
function teamLine(u) {
  if (u.mil) return '군 복무 중';
  if (!u.tid) return G.user.stage === 'TRAINEE' && G.teams[G.user.trainee] ? `${G.teams[G.user.trainee].name} 아카데미 연습생` : G.user.prep ? '아마추어 · 사설 아카데미' : '아마추어 · 솔로랭크';
  const T = G.teams[u.tid];
  return `${T.name}${u.acad ? ' 2군' : ''}${G.user.loan ? ' (임대)' : ''}`;
}
function li(a, icCls, icon, title, sub, need, extra) {
  return `<button class="li ${a ? '' : 'static'}" ${a ? `data-a="${a}"` : 'tabindex="-1"'} ${extra || ''}><span class="ic ${icCls}">${icon}</span><span class="tx"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</span>${need ? '<span class="need">필수</span>' : ''}${a ? `<span class="chev">${IC.chev}</span>` : ''}</button>`;
}

/* 홈 */
function tHome() {
  const u = userP(G), U = G.user, last = U.hist[U.hist.length - 1];
  const d = last ? ovr(u) - last.ovr0 : 0;
  const T0 = u.tid && !u.mil ? G.teams[u.tid] : null;
  const prof = `<section class="card has-sig">${U.sig ? `<div class="sig-mark">${sigSVG(U.sig.strokes)}</div>` : ''}<div class="prof">${av(u)}<div style="min-width:0"><div class="t2">${esc(u.nick)}</div><div class="cap">${esc(teamLine(u))} · ${u.age}살 · ${POS_KO[u.pos]}</div><div class="cap">시그니처 ${esc(U.champ)}</div></div>${T0 ? crest(T0, 'prof-crest') : ''}</div>
    <div style="margin-top:18px"><div class="cap">종합 능력치</div><div class="big-num">${ovr(u)}</div><div class="delta ${deltaCls(d)}">${last ? (d ? `지난 시즌보다 ${signed(d)}` : '지난 시즌과 같아요') : '첫 시즌을 앞두고 있어요'}</div></div>
    <div class="mini3"><div><span>통산 세트</span><b>${u.cs.g}</b></div><div><span>통산 KDA</span><b>${u.cs.g ? kdaOf(u.cs).toFixed(2) : '-'}</b></div><div><span>트로피</span><b>${u.titles.length}</b></div></div></section>`;
  const step = myTeamCard() + `<section class="card">${stepper(milestones(G))}</section>`;
  // 확인할 일: 지금 해야 할 단계 하나만 (원작처럼 누르면 시즌 탭의 '다음 이야기'로 간다)
  const n = nextTodo();
  let list = li('goSeason', n.ic, n.icon, esc(n.title), esc(n.sub), n.need);
  if (G.nextMeta && !u.mil && G.phase === 'OFF') { const k = G.nextMeta, sig = champTag(u.pos, U.champ) === k; list += li('', 'grey', IC.patch, `다음 시즌 예고 · ${METAS[k].name}`, `${METAS[k].desc} · 내 ${STAT_KO[k]} ${Math.round(u.st[k])}${sig ? ` · 시그니처 ${esc(U.champ)}${jo(U.champ, '이', '가')} 메타 픽` : ''}`); }
  list += li('', 'green', IC.target, '집중 육성 중', U.focus.map(k => STAT_KO[k]).join(' · '));
  const news = G.news.slice(0, 5);
  const newsHtml = news.length ? `<h3 class="sec">리그 소식</h3><section class="card tight">${news.map(n => `<div class="r"><span class="cap">${n.y}</span><span style="font-weight:500">${esc(n.text)}</span></div>`).join('')}</section>` : '';
  return { html: prof + step + `<h3 class="sec">확인할 일</h3><div class="list">${list}</div>` + breakingFeed(2) + stoveRow() + newsHtml + `<button class="btn btn-grey retire-btn" data-a="sheetRetire">지금 은퇴하기</button>`, cta: '' };
}
// 오프시즌 '다음 이야기'의 현재 단계: 결과 → 우승 스킨 → (은퇴) → 전환점 → 선택 결과 → 진로(병역)
function offStage() {
  if (G.phase !== 'OFF') return 'none';
  const t = G.user.tasks;
  if (!t.resultsSeen) return 'results';
  if (G.user.skinPending) return 'skin';
  if (t.retire) return 'retire';
  if (t.turn && !t.turnDone) return 'event';
  if (t.turnResult && !t.turnAck) return 'eventResult';
  if (t.military) return 'military';
  return 'path';
}
function nextTodo() {
  const u = userP(G), U = G.user, t = U.tasks, st = offStage();
  if (st === 'none') return { ic: 'blue', icon: IC.play, title: u.age === MAX_AGE ? '커리어 마지막 시즌이 기다려요' : `${u.age}살 시즌이 기다려요`, sub: u.age === MAX_AGE ? `${MAX_AGE}살, 라스트 댄스 · 시즌 탭에서 한 시즌을 보내요` : '시즌 탭에서 한 시즌을 보내요', need: false };
  if (st === 'retire') return { ic: 'grey', icon: IC.flag, title: '은퇴할 때가 됐어요', sub: RETIRE_WHY[t.retire] ? RETIRE_WHY[t.retire].short : '커리어를 마무리해요', need: true };
  if (st === 'results') return { ic: 'blue', icon: IC.season, title: '시즌 결과를 확인해 주세요', sub: `${G.year} 시즌 · 능력치 변화와 반응`, need: true };
  if (st === 'skin') return { ic: 'gold', icon: IC.trophy, title: '우승 스킨을 만들 차례예요', sub: `${U.skinPending.y} 롤드컵 우승`, need: true };
  if (st === 'event') return { ic: 'orange', icon: IC.spark, title: '선택이 필요한 일이 생겼어요', sub: t.turn.title, need: true };
  if (st === 'eventResult') return { ic: 'orange', icon: IC.spark, title: '선택 결과를 확인해 주세요', sub: t.turn.title, need: true };
  if (st === 'military') return { ic: 'red', icon: IC.shield, title: '병역 의무를 마쳐야 해요', sub: '28살, 더는 입대를 미룰 수 없어요', need: true };
  const clubs = (t.offers || []).filter(o => CONTRACT_KINDS[o.kind]);
  if (clubs.length) return { ic: 'blue', icon: IC.route, title: clubs.length > 1 ? `제안이 ${clubs.length}건 왔어요` : '이적 제안이 왔어요', sub: clubs[0].title, need: true };
  return { ic: 'grey', icon: IC.flag, title: '다음 진로를 정할 차례예요', sub: (t.offers && t.offers[0] ? t.offers[0].title : '군 복무 계속'), need: true };
}

/* 시즌 */
function seasonInfoRows() {
  const u = userP(G), U = G.user, rows = [];
  rows.push(['소속', teamLine(u)]);
  if (u.age === MAX_AGE && U.stage === 'PRO') rows.push(['커리어', '마지막 시즌 · 라스트 댄스']);
  if (u.mil) { rows.push(['신분', '군 복무']); return rows; }
  const tag = champTag(u.pos, U.champ);
  rows.push(['패치', `${patchName(G)} · ${METAS[G.meta].name}`]);
  rows.push(['시그니처', `${U.champ} · ${TAG_KO[tag] || ''}${tag === G.meta ? ' · 메타 픽' : ''}`]);
  if (U.stage === 'AMATEUR') { rows.push(['신분', U.prep ? '아마추어 · 사설 아카데미 수강' : '아마추어']); rows.push(['일정', '솔로랭크 · 스쿨리그·아마추어 대회']); rows.push(['솔랭', `${lpTier(U.lp)} · ${U.lp}LP`]); return rows; }
  if (U.stage === 'TRAINEE') { rows.push(['신분', '팀 아카데미 연습생']); rows.push(['일정', 'LCK 아카데미 시리즈 · 솔로랭크']); rows.push(['목표', '시즌 뒤 2군(LCK CL) 승격']); return rows; }
  const T = G.teams[u.tid];
  if (u.acad) { const st = bestAt(G, T, u.pos); rows.push(['신분', '2군 (LCK CL)']); rows.push(['콜업 조건', `OVR ${st ? Math.round(ovrRaw(st) - 5) : '-'} 이상 · 감독 신뢰 55 이상`]); const m2 = bestAcadAt(G, T, DUO[u.pos], u.id); if (m2) rows.push([`2군 ${DUO_KO[u.pos]}`, `${m2.nick} (OVR ${ovr(m2)})`]); rows.push(['2군 라인업', POS.map(pos => pos === u.pos ? u.nick : (bestAcadAt(G, T, pos, u.id) || {}).nick || '-').join(' · ')]); }
  else {
    const rv = bestAt(G, T, u.pos, u.id), mate = bestAt(G, T, DUO[u.pos], u.id);
    rows.push(['신분', rv ? (ovrRaw(u) >= ovrRaw(rv) ? '1군 · 주전 경쟁 우위' : '1군 · 주전 경쟁') : '1군 · 주전']);
    if (rv) rows.push(['주전 경쟁', `${rv.nick} (OVR ${ovr(rv)})`]);
    if (mate) rows.push([DUO_KO[u.pos], `${mate.nick} (OVR ${ovr(mate)})${chemOf(G, mate) ? ` · 함께한 ${chemOf(G, mate)}시즌` : ''}`]);
    rows.push(['라인업', POS.map(pos => pos === u.pos ? u.nick : (bestAt(G, T, pos, u.id) || {}).nick || '-').join(' · ')]);
  }
  rows.push(['감독 신뢰', `${Math.round(U.trust)} / 100`]);
  if (T.region === 'LPL') rows.push(['대회', 'LPL 스플릿 1·2·3 → MSI → 롤드컵']);
  else rows.push(['대회', 'LCK컵 → 정규시즌 → MSI → 플레이오프 → 롤드컵']);
  if ((G.year - 2026) % 4 === 0) rows.push(['국가대표', '아시안게임 9월 (게임 속 일정)']);
  return rows;
}
function tSeason() {
  const u = userP(G);
  if (UI.play) return tPlayback();
  if (G.phase === 'PRE') {
    const rows = seasonInfoRows();
    const html = `<section class="card"><p class="eyebrow">시즌</p><h1 class="t1">${u.age}살 시즌을 앞두고 있어요</h1></section>
      <section class="card">${sceneHTML(u.seed, teamColor(u), !!u.tid && !u.acad)}<h2 class="t2" style="margin-top:8px">${G.year} 시즌</h2><p class="body">${G.user.stage === 'AMATEUR' ? '고1, 솔랭 랭킹을 올리고 프로팀 스카우터의 눈에 띄어야 해요.' : u.mil ? '부대에서 한 시즌을 보내요. 경기 감각이 조금씩 떨어져요.' : u.acad ? '2군에서 실력과 감독 신뢰를 쌓아 1군 콜업을 노려요.' : '경기에 나가야 성장해요. 벤치에만 머물면 성장이 멈춰요.'}</p>
      <div class="rows">${rows.map(([a, b]) => `<div class="r"><span>${a}</span><b>${esc(b)}</b></div>`).join('')}</div></section>`;
    return { html, cta: `<button class="btn btn-primary" data-a="playSeason">${u.age}살 시즌 보내기</button>` };
  }
  if (UI.viewResults || offStage() === 'results') return tResults();
  return tStory();
}
// 다음 이야기: 원작처럼 한 흐름 안에서 전환점 → 나의 선택 → 진로를 차례로 정한다
function tStory() {
  const u = userP(G), U = G.user, t = U.tasks, st = offStage(), pro = U.stage !== 'AMATEUR' && !u.mil;
  const T = u.tid ? G.teams[u.tid] : null;
  const back = '<button class="btn btn-text" data-a="viewResults">지난 시즌 결과 다시 보기</button>';
  if (st === 'eventResult') {
    const r = t.turnResult;
    return { html: `<section class="card"><p class="eyebrow">나의 선택</p><h1 class="t1">${esc(t.turn.title)}</h1><div class="result-box" style="margin-top:14px">${esc(r.choice)} · ${esc(r.msg)}</div><p class="body">선택 결과가 반영됐어요. 이제 다음 진로를 정할 차례예요.</p></section>${back}`, cta: '<button class="btn btn-primary" data-a="turnAck">다음</button>' };
  }
  if (st === 'retire') {
    const why = RETIRE_WHY[t.retire] || RETIRE_WHY.age, cs = careerScore(G);
    return { html: `<section class="card"><p class="eyebrow">다음 이야기</p><h1 class="t1">${why.title}</h1><p class="body">${esc(why.text(u))}</p>
      <div class="kv" style="margin-top:14px"><div><span>프로 커리어</span><b>${U.hist.filter(h => h.tid).length}시즌 · 1군 ${u.cs.g}세트</b></div><div><span>트로피</span><b>${u.titles.length}개 · 롤드컵 ${cs.worlds}회</b></div><div><span>커리어 등급</span><b>${cs.grade} · ${cs.score}점</b></div></div></section>${breakingFeed(6)}${back}`, cta: '<button class="btn btn-primary" data-a="retireGo">은퇴식 하기</button>' };
  }
  if (st === 'skin') {
    return { html: `<section class="card"><p class="eyebrow">다음 이야기</p><h1 class="t1">롤드컵 우승 스킨</h1><p class="body">${U.skinPending.y} 롤드컵 우승팀 선수만 받는 보상이에요. 롤드컵 무대에서 함께한 챔피언으로 팀 로고와 내 서명이 들어간 스킨이 나와요.</p></section>${back}`, cta: '<button class="btn btn-primary" data-a="sheetSkin">스킨 챔피언 고르기</button>' };
  }
  const head = `<section class="card"><p class="eyebrow">다음 이야기</p><h1 class="t1">${st === 'military' ? '병역' : pro ? '계약과 진로' : '다음 진로'}</h1>
    <p class="body">${!pro && !u.mil && st !== 'military' ? '솔랭 랭킹과 대회 성적을 보고 여러 곳에서 연락이 왔어요. 스카우트 제의, 입단 테스트, 아카데미 중에서 길을 골라요.' : st === 'military' ? '아시안게임 금메달이 없어 병역 혜택을 받지 못했어요. 입대하면 2시즌 동안 경기에 나서지 못해요.' : u.mil ? '부대에서 다음 시즌을 준비해요.' : pro ? '도착한 제안을 수락하거나 거절할 수 있어요. 계약이 남아 있으면 지금 팀에 남을 수도 있어요.' : '대회 성적과 활약을 지켜본 구단에서 연락이 왔어요.'}</p>
    ${t.lastDance ? `<div class="result-box" style="margin-top:12px">다음 시즌이 커리어 마지막 시즌이에요. ${MAX_AGE}살 시즌을 마치면 은퇴해요.</div>` : ''}
    ${pro && T ? `<div class="kv" style="margin-top:14px"><div><span>소속</span><b>${esc(teamLine(u))}</b></div><div><span>계약</span><b>${u.con > 0 ? `${u.con}년 남음` : '만료 · FA'}</b></div><div><span>연봉</span><b>${u.sal}억</b></div></div>` : ''}</section>`;
  const turnCard = st === 'event' ? `<section class="card turn-card"><p class="eyebrow">전환점</p><h2 class="t2">${esc(t.turn.title)}</h2><button class="btn btn-primary" style="margin-top:12px" data-a="sheetTurn">이야기 확인하기</button></section>` : '';
  let paths = '';
  if (st === 'military') {
    paths = `<section class="card tight"><div class="card-head"><h2 class="t2">고를 수 있는 길</h2><span class="cap">2개</span></div>
      ${li('milGo', 'red', IC.shield, '입대한다', '2시즌 복무 후 전역, 다시 프로 무대에 도전해요')}${li('retireGo', 'grey', IC.flag, '은퇴하고 입대한다', '여기서 커리어를 마무리해요')}</section>`;
  } else {
    const offers = t.offers || [{ kind: 'mil', title: '군 복무 계속', desc: '복무를 이어가요' }];
    const clubs = offers.some(o => CONTRACT_KINDS[o.kind]);
    paths = `<section class="card tight"><div class="card-head"><h2 class="t2">${clubs ? '도착한 제안' : '고를 수 있는 길'}</h2><span class="cap">${offers.length}개</span></div>
      ${offers.map((o, i) => { const OT = o.tid ? G.teams[o.tid] : null; return `<button class="li path-li" data-a="pathOpen" data-i="${i}" ${o.failed ? 'disabled' : ''}>${OT ? crest(OT) : `<span class="ic grey">${o.kind === 'mil' ? IC.shield : IC.flag}</span>`}<span class="tx"><b>${o.route ? `<span class="badge ${o.failed ? 'red' : o.route === '스카우트' ? 'blue' : o.route === '테스트' ? 'green' : ''}">${o.failed ? '불합격' : o.route}</span> ` : ''}${esc(o.title)}</b><span>${esc(o.desc || '')}</span>${OT && o.kind !== 'mil' ? `<span class="lu-mini">${projLineup(G, o.tid, o.role).map(x => `<span class="${x.me ? 'me' : x.duo ? 'duo' : x.rival ? 'rv' : ''}">${x.me ? '나' : esc(x.p ? x.p.nick : '-')}</span>`).join('')}</span>` : ''}</span><span class="chev">${IC.chev}</span></button>`; }).join('')}
      ${st === 'event' ? '<p class="cap" style="margin:8px 4px 0">진로를 정하면 이번 전환점은 지나가요.</p>' : ''}</section>`;
  }
  return { html: head + turnCard + paths + breakingFeed(6) + stoveSummary() + stoveRow() + back, cta: '' };
}
// 스토브리그 결산: 팀마다 운영 방향·자금·전력 변화와 오간 선수
const MODE_KO = { win: '윈나우', keep: '유지', rebuild: '리빌딩' };
function stoveSummary() {
  const L = G.stoveLog; if (!L || L.y !== G.year) return '';
  const u = userP(G), rg = u.tid && G.teams[u.tid].region === 'LPL' ? 'LPL' : 'LCK';
  const ids = G.ids[rg].filter(id => L.teams[id]).sort((a, b) => (L.teams[b].after || 0) - (L.teams[a].after || 0));
  const rows = ids.map(id => {
    const T = G.teams[id], t = L.teams[id], d = r1((t.after || t.before) - t.before), rich = t.money >= T.wealth * 1.1 ? '자금 넉넉' : t.money <= T.wealth * 0.85 ? '자금 빠듯' : '자금 보통';
    return `<div class="sv-row ${id === u.tid ? 'me' : ''}">${crest(T, 'sm')}<div class="sv-main"><b>${esc(T.name)}</b><span class="cap">${MODE_KO[t.mode]} · ${rich} · 지난 시즌 ${t.rank}위</span>${t.in.length || t.out.length ? `<span class="sv-io">${t.in.length ? '<i class="in">IN</i> ' + t.in.slice(0, 3).map(esc).join(', ') : ''}${t.out.length ? ' <i class="out">OUT</i> ' + t.out.slice(0, 3).map(esc).join(', ') : ''}</span>` : ''}</div><span class="sv-pw"><b>${Math.round(t.after || t.before)}</b><small class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '+' : ''}${d}</small></span></div>`;
  }).join('');
  return `<section class="card tight"><div class="card-head"><h2 class="t2">스토브리그 결산</h2><span class="cap">${rg} · 팀 전력</span></div><div class="sv">${rows}</div><p class="cap" style="margin:8px 4px 0">성적이 좋은 팀은 상금과 후원으로 자금이 늘고, 하위권 팀은 리빌딩에 들어가요. 스타 선수는 우승권과 높은 연봉을 따라 움직여요.</p></section>`;
}
// 진로를 정하면 바로 다음 시즌 준비로 넘어간다
function beginNext() {
  if (!canStartSeason(G)) return;
  startNextSeason(G); save();
  UI.sheet = null; UI.viewResults = false; UI.tab = 'season'; UI.play = null;
  render(); window.scrollTo(0, 0);
  toast(`${G.year} 시즌이 다가와요`);
}
// 다음에 볼 결승 중계 (재생이 그 줄까지 왔고 아직 안 본 것)
function pendingCast() { const P = UI.play, S = G.S; if (!P || !S.casts) return null; const e = S.ev[P.i - 1]; return e && e.cast != null && !(P.seen || {})[e.cast] ? e.cast : null; }
function tPlayback() {
  if (UI.cast) return tCast();
  const P = UI.play, S = G.S, shown = S.ev.slice(0, P.i), pend = pendingCast();
  const done = P.i >= S.ev.length && pend == null;
  const html = `<section class="card"><div class="card-row"><div><p class="eyebrow">${S.year} 시즌 · ${esc(S.team)}</p><h1 class="t1">${done ? '시즌이 끝났어요' : '시즌을 보내는 중이에요'}</h1></div>${done ? '' : '<button class="btn btn-grey btn-sm" data-a="skipPlay">건너뛰기</button>'}</div>
    <div class="tl" id="tl" aria-live="polite">${shown.map(e => `<div class="tl-item ${e.tone}"><span class="m">${e.m}</span><p>${e.cast != null ? '<b class="cast-tag">결승</b> ' : ''}${esc(e.text)}</p></div>`).join('')}</div>${done || pend != null ? '' : '<div class="typing" aria-hidden="true"><i></i><i></i><i></i></div>'}</section>`;
  if (pend != null) return { html, cta: `<button class="btn btn-primary" data-a="castOpen" data-v="${pend}">결승 중계 보기</button><button class="btn btn-text" data-a="castSkip" data-v="${pend}">결과만 보고 넘어가기</button>` };
  return { html, cta: done ? '<button class="btn btn-primary" data-a="endPlay">시즌 결과 보기</button>' : '' };
}
/* ---------- 결승 미니맵 중계 ----------
 * 소환사의 협곡을 단순하게 그린 미니맵(직접 그린 도식) 위에서 양 팀 10명의 점이 움직이고, 해설은 지도 아래에 흐른다.
 * 좌표는 0~100. 블루 진영(왼쪽 아래)이 X.a, 레드 진영(오른쪽 위)이 X.b. 단계: 미리보기(라인 맞대결) → 세트 진행 → 세트 종료 → 우승 */
const MM_SPEED = 2.2; // 실제 1초에 흐르는 경기 시간(분)
const MM_FLIP = ([x, y]) => [100 - x, 100 - y];
const MM_LOC = { top: [12, 12], mid: [50, 50], bot: [88, 88], jg0: [30, 62], jg1: [70, 38], baron: [31, 30], drake: [69, 70], base0: [13, 87], base1: [87, 13] };
const MM_FOUNT = [[6, 94], [94, 6]];
// 포탑: 진영별·라인별 바깥 → 안쪽 (네 번째는 억제기)
const MM_TW0 = { top: [[9, 30], [9, 52], [11, 71], [15, 79]], mid: [[40, 60], [33, 67], [25, 75], [20, 80]], bot: [[70, 91], [48, 91], [29, 89], [21, 85]] };
const MM_TW = [MM_TW0, { top: MM_TW0.bot.map(MM_FLIP), mid: MM_TW0.mid.map(MM_FLIP), bot: MM_TW0.top.map(MM_FLIP) }];
// 라인전 위치와 라인을 따라 밀고 당기는 방향 (포지션 번호: 0 탑 · 2 미드 · 3 원딜 · 4 서포터)
const MM_LANE = [{ 0: [9.5, 21], 2: [45, 55], 3: [79, 90.5], 4: [76.5, 88] }, { 0: [21, 9.5], 2: [55, 45], 3: [90.5, 79], 4: [88, 76.5] }];
const MM_DIR = [{ 0: [0, -1], 2: [0.7, -0.7], 3: [1, 0], 4: [1, 0] }, { 0: [-1, 0], 2: [-0.7, 0.7], 3: [0, 1], 4: [0, 1] }];
const MM_JG0 = [[47, 75], [56, 82], [41, 67], [22, 47], [27, 58], [34, 55]];
const MM_JG = [MM_JG0, MM_JG0.map(MM_FLIP)];
const MM_GRP0 = [[44, 58], [58, 76], [36, 45], [48, 64]];
const MM_GRP = [MM_GRP0, MM_GRP0.map(MM_FLIP)];
const MM_OFF = [[-5, 4], [-2, -2.5], [0, 0], [3, 3], [2.5, -1]];
const MM_LETTER = ['탑', '정', '미', '원', '서'];
const MM_ART = `<rect width="100" height="100" rx="4" class="mm-bg"/>
  <g class="mm-jg"><circle cx="30" cy="62" r="13"/><circle cx="50" cy="78" r="11"/><circle cx="70" cy="38" r="13"/><circle cx="50" cy="22" r="11"/></g>
  <path class="mm-river" d="M0 9 L9 0 L100 91 L91 100 Z"/>
  <path class="mm-lane" d="M9 91 V9 H91 M9 91 H91 V9 M11 89 L89 11"/>
  <circle class="mm-base s0" cx="5" cy="95" r="17"/><circle class="mm-base s1" cx="95" cy="5" r="17"/>
  <circle class="mm-pit baron" cx="31" cy="30" r="3.6"/><circle class="mm-pit drake" cx="69" cy="70" r="3.6"/>
  <rect class="mm-nx s0" x="11" y="85" width="4" height="4" transform="rotate(45 13 87)"/><rect class="mm-nx s1" x="85" y="11" width="4" height="4" transform="rotate(45 87 13)"/>`;
const mmClock = t => `${String(Math.floor(t)).padStart(2, '0')}:${String(Math.min(59, Math.floor((t % 1) * 60))).padStart(2, '0')}`;
function mmLocXY(e) {
  if (e.k === 'tower' && e.lane) { const L = MM_TW[1 - e.s][e.lane]; return L[Math.min(e.tier || 0, L.length - 1)]; }
  return MM_LOC[e.loc] || MM_LOC.mid;
}
// 세트마다 한 번 만드는 움직임 계획: 선수별 흔들림, 사망 구간, 사건 위치의 흩어짐
function mmPlan(X, set) {
  const g = X.games[set], ev = g.ev || [];
  const ph = [0, 1].map(sd => [0, 1, 2, 3, 4].map(i => ((sd * 5 + i) * 0.137 + set * 0.31) % 1));
  const deaths = [[[], [], [], [], []], [[], [], [], [], []]];
  for (const e of ev) for (const [sd, i] of e.dead || []) { const L = deaths[sd][i]; if (L.length && e.m < L[L.length - 1].until) continue; L.push({ at: e.m, until: e.m + 0.35 + e.m * 0.03 }); }
  const jit = ev.map((e, j) => [((j * 37) % 7) - 3, ((j * 53) % 7) - 3]);
  return { g, ev, ph, deaths, jit, kev: ev.some(e => e.kills) };
}
function mmPlanFor() {
  const C = UI.cast, key = C.idx + ':' + C.set;
  if (!UI.castPlan || UI.castPlan.key !== key) UI.castPlan = { key, P: mmPlan(G.S.casts[C.idx], C.set) };
  return UI.castPlan.P;
}
// 사건이 없을 때의 움직임: 라인전 → 사이드 운영 → 5인 그룹
function mmRoutine(sd, i, t, ph) {
  const wob = (a, f) => Math.sin(t * f + ph * 6.283) * a;
  if (i === 1 && t < 14) { const R = MM_JG[sd], u = (t / 1.25 + ph * 2) % R.length, k = Math.floor(u), f = u - k, a = R[k], b = R[(k + 1) % R.length]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
  if (i !== 1 && (t < 14 || (i === 0 && t < 26))) { const p = MM_LANE[sd][i], d = MM_DIR[sd][i], s = wob(t >= 14 ? 8 : 3.5, 0.9) + (t >= 14 ? 5 : 0); return [p[0] + d[0] * s, p[1] + d[1] * s]; }
  const C = MM_GRP[sd], u = (t / 4.5) % C.length, k = Math.floor(u), f = u - k, a = C[k], b = C[(k + 1) % C.length], o = MM_OFF[i], sg = sd ? -1 : 1;
  return [a[0] + (b[0] - a[0]) * f + o[0] * sg + wob(1.4, 1.7), a[1] + (b[1] - a[1]) * f + o[1] * sg + wob(1.4, 1.3)];
}
// 사건에 엮인 선수는 사건 직전부터 그 자리로 모였다가 흩어진다
function mmAttract(P, sd, i, t) {
  let best = -1, bw = 0;
  for (let j = 0; j < P.ev.length; j++) {
    const e = P.ev[j]; if (!e.loc || e.k === 'note') continue;
    const dt = t - e.m; if (dt < -1.3 || dt > 1.4) continue;
    if (!(e.all || (e.act && e.act.some(a => a[0] === sd && a[1] === i)) || (e.dead && e.dead.some(a => a[0] === sd && a[1] === i)))) continue;
    const wg = dt < 0 ? 1 + dt / 1.3 : dt < 0.4 ? 1 : 1 - (dt - 0.4) / 1.0;
    if (wg > bw) { bw = wg; best = j; }
  }
  if (best < 0) return null;
  const e = P.ev[best], L = mmLocXY(e), jj = P.jit[best], ang = (sd * 5 + i) * 1.2566, r = e.all ? 3.2 : 2.2, sx = e.all || e.k === 'kill' ? (sd ? 1.8 : -1.8) : 0;
  return { w: clamp(bw, 0, 1), x: L[0] + jj[0] * 0.5 + Math.cos(ang) * r + sx, y: L[1] + jj[1] * 0.5 + Math.sin(ang) * r - sx };
}
function mmAlive(P, sd, i, t) {
  let p = mmRoutine(sd, i, t, P.ph[sd][i]);
  const a = mmAttract(P, sd, i, t);
  if (a) p = [p[0] + (a.x - p[0]) * a.w, p[1] + (a.y - p[1]) * a.w];
  const F = MM_FOUNT[sd];
  let back = null; for (const d of P.deaths[sd][i]) if (d.until <= t) back = d;
  const since = back ? t - back.until : t; // 시작과 부활 직후에는 샘에서 걸어 나온다
  if (since < 1.4) { const f = since / 1.4; p = [F[0] + (p[0] - F[0]) * f, F[1] + (p[1] - F[1]) * f]; }
  return [clamp(p[0], 2.5, 97.5), clamp(p[1], 2.5, 97.5)];
}
function mmPos(P, sd, i, t) {
  for (const d of P.deaths[sd][i]) if (t >= d.at && t < d.until) { d.pos = d.pos || mmAlive(P, sd, i, d.at - 0.01); return { dead: true, x: d.pos[0], y: d.pos[1] }; }
  const p = mmAlive(P, sd, i, t);
  return { x: p[0], y: p[1] };
}
function mmKills(P, t) {
  if (!P.kev) { const f = Math.min(1, t / P.g.dur); return [Math.round(P.g.kills[0] * f), Math.round(P.g.kills[1] * f)]; }
  const k = [0, 0]; for (const e of P.ev) if (e.m <= t && e.kills) { k[0] += e.kills[0]; k[1] += e.kills[1]; }
  return k;
}
function mmDown(P, t) { const s = new Set(); for (const e of P.ev) if (e.m <= t && e.k === 'tower' && e.lane) s.add(`${1 - e.s}-${e.lane}-${Math.min(e.tier || 0, 3)}`); return s; }
function mmTexts(P, t) { return P.ev.filter(e => e.m <= t && e.t); }
function mmDots(P, t, X) {
  const lu = [X.la, X.lb]; let h = '';
  for (const sd of [0, 1]) for (let i = 0; i < 5; i++) {
    const p = mmPos(P, sd, i, t), me = lu[sd][i] && lu[sd][i].me;
    h += `<g class="mm-d s${sd}${me ? ' me' : ''}${p.dead ? ' dead' : ''}" id="mmd${sd}${i}" transform="translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})">${me ? '<circle class="ring" r="4.6"/><text class="lbl" y="-5.4">나</text>' : ''}<circle r="2.9"/><text y="1.05">${MM_LETTER[i]}</text></g>`;
  }
  return h;
}
function mmTowers(P, t) {
  const down = mmDown(P, t); let h = '';
  for (const sd of [0, 1]) for (const lane of ['top', 'mid', 'bot']) MM_TW[sd][lane].forEach(([x, y], k) => { const id = `${sd}-${lane}-${k}`; h += `<rect class="mm-tw s${sd}${k === 3 ? ' inhib' : ''}${down.has(id) ? ' down' : ''}" id="tw${id}" x="${x - 1.2}" y="${y - 1.2}" width="2.4" height="2.4" rx=".4"/>`; });
  return h;
}
function mmMarks(P, t) {
  let h = '';
  for (const sd of [0, 1]) for (let i = 0; i < 5; i++) for (const d of P.deaths[sd][i]) if (t >= d.at && t < d.at + 0.9) { d.pos = d.pos || mmAlive(P, sd, i, d.at - 0.01); h += `<path class="mm-xk s${sd}" transform="translate(${d.pos[0].toFixed(1)} ${d.pos[1].toFixed(1)})" d="M-1.7 -1.7L1.7 1.7M1.7 -1.7L-1.7 1.7"/>`; }
  for (const e of P.ev) {
    if (!e.loc || e.k === 'note') continue;
    const dt = t - e.m; if (dt < 0 || dt > 0.9) continue;
    const L = mmLocXY(e); h += `<circle class="mm-fx s${e.s < 0 ? 'n' : e.s}" cx="${L[0]}" cy="${L[1]}" r="${(2.5 + dt * 7).toFixed(2)}" style="opacity:${(1 - dt / 0.9).toFixed(2)}"/>`;
  }
  return h;
}
function mmLine(e, big) { return `<div class="${big ? 'mm-call' : 'mm-li'} s${e.s < 0 ? 'n' : e.s}"><span>${mmClock(e.m)}</span><p>${esc(e.t)}</p></div>`; }
function mmFeedHTML(P, t) {
  const tx = mmTexts(P, t);
  if (!tx.length) return '<div class="mm-call sn"><span>00:00</span><p>양 팀이 소환사의 협곡에 들어선다</p></div>';
  return mmLine(tx[tx.length - 1], true) + `<div class="mm-feed">${tx.slice(0, -1).reverse().slice(0, 6).map(e => mmLine(e)).join('')}</div>`;
}
// 매 프레임: 점·포탑·효과·시계·킬·해설만 바꾼다 (화면 전체를 다시 그리지 않는다)
function mmPaint(t) {
  const C = UI.cast, X = G.S.casts[C.idx], P = mmPlanFor();
  for (const sd of [0, 1]) for (let i = 0; i < 5; i++) {
    const el = $id(`mmd${sd}${i}`); if (!el) return;
    const p = mmPos(P, sd, i, t);
    el.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
    el.classList.toggle('dead', !!p.dead);
  }
  const down = mmDown(P, t);
  if (down.size !== C.down) { C.down = down.size; down.forEach(id => { const r = $id('tw' + id); if (r) r.classList.add('down'); }); }
  $id('mm-fx').innerHTML = mmMarks(P, t);
  $id('mm-clock').textContent = mmClock(t);
  const k = mmKills(P, t);
  $id('mm-ka').textContent = k[0]; $id('mm-kb').textContent = k[1];
  $id('mm-bar').style.width = (k[0] + k[1] ? k[0] / (k[0] + k[1]) * 100 : 50).toFixed(1) + '%';
  const n = mmTexts(P, t).length;
  if (n !== C.lines) { C.lines = n; $id('mm-talk').innerHTML = mmFeedHTML(P, t); }
}
let castRAF = 0;
function castLoop() {
  cancelAnimationFrame(castRAF);
  const C = UI.cast; if (!C || C.phase !== 'live') return;
  const dur = G.S.casts[C.idx].games[C.set].dur;
  let last = 0;
  const step = ts => {
    const C2 = UI.cast;
    if (!C2 || C2 !== C || C2.phase !== 'live' || UI.tab !== 'season' || !$id('mm')) return;
    if (last) C2.t = Math.min(dur, C2.t + Math.min(0.1, (ts - last) / 1000) * MM_SPEED);
    last = ts;
    mmPaint(C2.t);
    if (C2.t >= dur) { C2.phase = 'setEnd'; render(); return; }
    castRAF = requestAnimationFrame(step);
  };
  castRAF = requestAnimationFrame(step);
}
function tCast() {
  const C = UI.cast, X = G.S.casts[C.idx], A = G.teams[X.a], B = G.teams[X.b], u = userP(G);
  let wa = 0, wb = 0;
  X.games.slice(0, C.set + (C.phase === 'setEnd' || C.phase === 'done' ? 1 : 0)).forEach(g => (g.aWin ? wa++ : wb++));
  if (C.phase === 'done') { wa = X.sa; wb = X.sb; }
  const board = `<div class="cast-sb"><span class="cs-t">${crest(A)}<b>${esc(A.name)}</b></span><span class="cs-sc">${wa}<i>:</i>${wb}</span><span class="cs-t r"><b>${esc(B.name)}</b>${crest(B)}</span></div>`;
  const head = `<section class="card cast"><p class="eyebrow">${G.S.year} · ${esc(X.name)} · 5전 3선승</p>${board}`;
  if (C.phase === 'preview') {
    const cell = (p, r) => p ? `<span class="mu-p ${r ? 'r' : ''} ${p.me ? 'me' : ''}">${p.star || p.face ? '<i class="star">★</i>' : ''}<b>${esc(p.me ? u.nick : p.nick)}</b><small>${p.ovr}</small></span>` : '<span class="mu-p">-</span>';
    const rows = POS.map((pos, i) => { const a = X.la[i], b = X.lb[i]; return `<div class="mu ${(a && a.me) || (b && b.me) ? 'mine' : ''}">${cell(a)}<span class="mu-pos">${POS_KO[pos]}</span>${cell(b, 1)}</div>`; }).join('');
    return { html: head + `<div class="mm-sides"><span class="s0">블루 진영 · ${esc(A.name)}</span><span class="s1">레드 진영 · ${esc(B.name)}</span></div><h2 class="t2" style="margin-top:14px">라인 맞대결</h2><div class="mus">${rows}</div><p class="cap" style="margin-top:8px">★ 스타·팀의 얼굴 · 숫자는 OVR · 경기는 미니맵으로 중계돼요</p></section>`, cta: '<button class="btn btn-primary" data-a="castStart">1세트 시작</button>' };
  }
  if (C.phase === 'done') {
    const won = X.winner === u.tid, W = G.teams[X.winner];
    return { html: head + `<div class="cast-end ${won ? 'win' : ''}">${crest(W, 'lg')}<p class="t1">${esc(W.name)} 우승!</p><p class="body">${won ? '꽃가루가 쏟아진다. 우리가 해냈다.' : '준우승. 상대의 세리머니를 지켜봐야 했다.'}</p><p class="cap">결승 MVP ${esc(X.pog)}</p></div></section>`, cta: '<button class="btn btn-primary" data-a="castEnd">중계 마치기</button>' };
  }
  const P = mmPlanFor(), g = P.g, t = C.phase === 'setEnd' ? g.dur : C.t, k = mmKills(P, t);
  C.lines = mmTexts(P, t).length; C.down = mmDown(P, t).size;
  const hud = `<div class="cast-live"><span class="cast-set">${C.set + 1}세트</span><span class="cast-clock" id="mm-clock">${mmClock(t)}</span><span class="cast-k"><b id="mm-ka">${k[0]}</b> 킬 <b id="mm-kb">${k[1]}</b></span></div>
    <div class="cast-bar"><i id="mm-bar" style="width:${(k[0] + k[1] ? k[0] / (k[0] + k[1]) * 100 : 50).toFixed(1)}%"></i></div>`;
  const map = `<div class="mm-wrap"><svg id="mm" class="mm" viewBox="0 0 100 100" role="img" aria-label="소환사의 협곡 미니맵. 블루 ${esc(A.name)}, 레드 ${esc(B.name)}">${MM_ART}<g>${mmTowers(P, t)}</g><g id="mm-fx">${mmMarks(P, t)}</g><g>${mmDots(P, t, X)}</g></svg></div>
    <div class="mm-sides"><span class="s0">블루 · ${esc(A.name)}</span><span class="s1">레드 · ${esc(B.name)}</span></div>`;
  const talk = `<div class="mm-talk" id="mm-talk" aria-live="polite">${C.phase === 'setEnd' ? mmLine({ m: g.dur, s: g.aWin ? 0 : 1, t: `${G.teams[g.aWin ? X.a : X.b].name} ${C.set + 1}세트 승리! 세트 스코어 ${wa}:${wb}` }, true) + `<div class="mm-feed">${mmTexts(P, t).reverse().slice(0, 6).map(e => mmLine(e)).join('')}</div>` : mmFeedHTML(P, t)}</div>`;
  const pk = g.picks;
  const picks = pk ? `<div class="mm-picks">${POS.map((pos, i) => { const a = X.la[i], b = X.lb[i]; return `<div class="mp-r ${(a && a.me) || (b && b.me) ? 'mine' : ''}"><span class="${a && a.me ? 'me' : ''}">${esc(a ? (a.me ? u.nick : a.nick) : '-')} <small>${esc(pk[0][i])}</small></span><span class="mp-pos">${MM_LETTER[i]}</span><span class="r ${b && b.me ? 'me' : ''}"><small>${esc(pk[1][i])}</small> ${esc(b ? (b.me ? u.nick : b.nick) : '-')}</span></div>`; }).join('')}</div>` : '';
  const cta = C.phase === 'live' ? '<button class="btn btn-grey" data-a="castFast">이번 세트 건너뛰기</button>' : `<button class="btn btn-primary" data-a="castNext">${C.set + 1 < X.games.length ? (C.set + 2) + '세트 시작' : '결과 보기'}</button>`;
  return { html: head + hud + map + talk + picks + '</section>', cta };
}

function tResults() {
  const S = G.S, u = userP(G), U = G.user;
  if (!S) return { html: '<section class="card"><p class="body">지난 시즌 기록이 없어요.</p></section>', cta: '' };
  const d = S.ovr1 - S.ovr0, a = S.tot;
  const statD = STATS.map(k => [k, Math.round(S.st1[k]) - Math.round(S.st0[k])]).filter(x => x[1] !== 0).sort((x, y) => y[1] - x[1]).slice(0, 3);
  let rows = '';
  if (S.amateur) rows += `<div class="r"><span>솔랭 최고 티어</span><b>${lpTier(U.lp)}${lpRank(U.lp) ? ` · ${lpRank(U.lp)}위` : ` · ${U.lp}LP`}</b></div>`;
  if (a.g) rows += `<div class="r"><span>1군 출전</span><b>${a.g}세트 · 선발 ${S.started}경기</b></div><div class="r"><span>KDA</span><b>${a.k}/${a.d}/${a.a} (${kdaOf(a).toFixed(2)})</b></div><div class="r"><span>평균 평점</span><b>${avgR(a).toFixed(2)}</b></div><div class="r"><span>POG</span><b>${a.pog}회</b></div>`;
  else if (!S.amateur && !S.mil && !S.cl.g) rows += `<div class="r"><span>1군 출전</span><b>0세트 · 벤치 ${S.benched}경기</b></div>`;
  if (S.cl.g) rows += `<div class="r"><span>2군 출전</span><b>${S.cl.g}세트 · 평점 ${avgR(S.cl).toFixed(2)}</b></div>`;
  if (S.duoTop) rows += `<div class="r"><span>${DUO_KO[u.pos]}</span><b>${esc(S.duoTop.nick)} · ${S.duoTop.g}세트 · 함께한 ${S.duoTop.chem}시즌</b></div>`;
  rows += `<div class="r"><span>종합 능력치</span><b>${S.ovr0} → ${S.ovr1} <span class="delta ${deltaCls(d)}">${signed(d)}</span></b></div>`;
  rows += statD.map(([k, v]) => `<div class="r"><span>${STAT_KO[k]}</span><b>${Math.round(S.st1[k])} <span class="delta ${deltaCls(v)}">${signed(v)}</span></b></div>`).join('');
  const champs = (S.champTop || []).map(c => `<div class="r"><span>${esc(c.n)}${c.n === U.champ ? ' <span class="badge blue">시그니처</span>' : ''}</span><b>${c.g}세트 · 승률 ${Math.round(c.w / c.g * 100)}%</b></div>`).join('');
  const skinBox = U.skinPending && U.skinPending.y === S.year ? `<section class="card skin-cta"><p class="eyebrow">롤드컵 우승 선수만 받는 보상</p><h2 class="t2">우승 스킨 챔피언을<br>직접 골라 주세요</h2><p class="body">롤드컵에서 함께한 챔피언으로 팀 로고와 내 서명이 들어간 우승 스킨이 나와요.</p><button class="btn btn-primary" style="margin-top:12px" data-a="sheetSkin">스킨 챔피언 고르기</button></section>` : '';
  const comps = S.comps.filter(c => c.result || c.my.g).map(c => {
    const T = G.teams[c.tid];
    const good = /우승/.test(c.result) && !/준/.test(c.result);
    return `<div class="comp"><b>${esc(c.name)}</b><span class="badge ${good ? 'gold' : /준우승|4강|8강|통과|1위|2위/.test(c.result) ? 'blue' : ''}">${esc(c.result || '-')}</span><span class="cap">${c.amateur ? '솔랭 친구들과 꾸린 5인 팀' : T ? esc(T.name) : ''}${c.amateur ? '' : c.my.g ? ` · ${c.my.g}세트 ${c.my.k}/${c.my.d}/${c.my.a} · 평점 ${avgR(c.my).toFixed(2)}` : ' · 출전 없음'}</span></div>`;
  }).join('');
  const honors = [...S.titles.map(t => ['gold', t]), ...S.awards.map(t => ['blue', t])];
  const gm = G.awards.gm.map((x, i) => `<tr class="${x.id === u.id ? 'me' : ''}"><td>${i + 1}</td><td><div class="who"><img class="av sm" src="${avatarURI(x.seed, x.color)}" alt=""><span>${esc(x.nick)}</span></div></td><td><span class="who">${crestOf(x.tid, x.color, 'xs')}${esc(x.tid)}</span></td><td class="rt">${x.avg.toFixed(2)}</td></tr>`).join('');
  const re = S.reactions.slice(0, 3).map(postHTML).join('');
  const html = `<section class="card"><p class="eyebrow">시즌</p><h1 class="t1">${S.age}살 시즌이 끝났어요</h1></section>
    ${skinBox}
    <section class="card"><p class="t3 muted" style="font-weight:500">종합 능력치가</p><p class="display">${S.ovr1}${josaN(S.ovr1, '이', '가')} 됐어요</p><div class="rows">${rows}</div></section>
    ${S.meta && !S.mil ? `<section class="card"><div class="card-row"><h2 class="t2">패치와 챔피언</h2><span class="badge ${S.sigMeta ? 'blue' : ''}">${METAS[S.meta].name}</span></div>${champs ? `<div class="rows">${champs}</div>` : `<p class="body">${S.amateur ? '솔랭에서 시그니처 ' + esc(U.champ) + jo(U.champ, '을', '를') + ' 갈고닦았어요.' : '1군 경기에 나서지 못해 챔피언 기록이 없어요.'}</p>`}</section>` : ''}
    ${comps ? `<section class="card"><h2 class="t2">대회 결과</h2>${comps}</section>` : ''}
    ${honors.length ? `<section class="card"><h2 class="t2">이번 시즌 영광</h2><div class="chips" style="margin-top:12px">${honors.map(([c, t]) => `<span class="badge ${c}">${esc(t)}</span>`).join('')}</div></section>` : ''}
    <section class="card"><h2 class="t2">시즌의 순간</h2><div class="moment"><b class="t3">${esc(S.moment.title)}</b><span class="body" style="margin:0">${esc(S.moment.text)}</span><span><span class="badge blue">${esc(S.moment.tag)}</span></span></div></section>
    <section class="card"><h2 class="t2">언론·팬 반응</h2>${re}<button class="btn btn-weak" data-a="tab" data-v="react">반응 더 보기</button><p class="fine" style="margin:8px 0 0">실제 매체·커뮤니티 이름을 빌린 게임 속 가상 반응이에요.</p></section>
    <section class="card"><div class="card-row"><h2 class="t2">올해의 선수 TOP 10</h2><span class="cap">${S.gmRank ? `내 순위 ${S.gmRank}위` : '집계 제외'}</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>선수</th><th>팀</th><th class="rt">평점</th></tr></thead><tbody>${gm}</tbody></table></div></section>
    <section class="card"><h2 class="t2">${S.year} 시즌 우승</h2><div class="rows">${[['롤드컵', G.rec.worlds], ['MSI', G.rec.msi], ['LCK', G.rec.lck], ['LCK컵', G.rec.cup], ['LPL', G.rec.lpl]].map(([n, id]) => `<div class="r"><span>${n}</span><b class="who" style="justify-content:flex-end">${id ? crest(G.teams[id], 'sm') + esc(G.teams[id].name) : '-'}</b></div>`).join('')}</div></section>`;
  return { html, cta: UI.viewResults ? '<button class="btn btn-primary" data-a="resultsBack">다음 이야기로</button>' : '<button class="btn btn-primary" data-a="resultsOk">확인</button>' };
}

/* 반응 */
const SRC_COLOR = { '인벤': '#E8513B', '포모스': '#2D5BD2', 'OSEN': '#FF6B00', '스포츠경향': '#1F6FBF', '디스이즈게임': '#333D4B', '디시인사이드': '#3B4890', '에펨코리아': '#3769C8', '레딧': '#FF4500', 'X': '#191F28', '치지직': '#00C473' };
function postHTML(r) {
  return `<div class="post ${r.kind === 'article' ? 'article' : ''}"><span class="pi" style="background:${SRC_COLOR[r.src] || '#8B95A1'}">${esc(r.src[0])}</span><div style="min-width:0"><div class="ph"><b>${esc(r.kind === 'article' ? r.src : r.author)}</b><span>${esc(r.kind === 'article' ? '기사' : `${r.src} · ${r.sub}`)}</span>${r.tag ? `<span class="badge">${esc(r.tag)}</span>` : ''}</div><p>${esc(r.text)}</p><div class="pf"><span>${esc(r.time)}</span><span style="display:inline-flex;gap:4px;align-items:center"><span style="width:14px;height:14px;display:inline-block">${IC.heart}</span>${r.likes.toLocaleString('ko-KR')}</span></div></div></div>`;
}
function tReact() {
  UI.seenReact = true;
  const R_ = G.user.reactions || [];
  if (!R_.length) return { html: '<section class="card"><p class="eyebrow">반응</p><h1 class="t1">아직 반응이 없어요</h1><p class="body">시즌을 보내면 언론과 팬들의 반응이 여기에 쌓여요.</p></section>', cta: '' };
  const years = [...new Set(R_.map(r => r.y))];
  return { html: `<section class="card"><p class="eyebrow">반응</p><h1 class="t1">언론·팬 반응</h1><p class="fine" style="margin:6px 0 0">실제 매체·커뮤니티 이름을 빌린 게임 속 가상 반응이에요.</p></section>` + years.map(y => `<h3 class="sec">${y} 시즌</h3><section class="card tight">${R_.filter(r => r.y === y).map(postHTML).join('')}</section>`).join(''), cta: '' };
}

/* 선수 */
function tPlayer() {
  const u = userP(G), U = G.user, T = u.tid ? G.teams[u.tid] : null;
  const rows = [['포지션', POS_KO[u.pos]], ['플레이 스타일', U.style], ['본명', u.name || '-'], ['나이', `${u.age}살`], ['스카우트 평가', `잠재력 ${U.scout}`], ['팬', fansTxt(u.pop)], ['솔로랭크', `${lpTier(U.lp)} · ${U.lp}LP${lpRank(U.lp) ? ` · ${lpRank(U.lp)}위` : ''}`], ['누적 수입', `${U.money}억`]];
  const con = u.mil ? [['상태', `군 복무 (남은 시즌 ${U.milLeft})`]] : T ? [['소속', teamLine(u)], ['리그', T.region], ['계약', `${Math.max(0, u.con)}년 남음`], ['연봉', `${u.sal}억`], ['감독 신뢰', `${Math.round(U.trust)} / 100`]] : [['소속', '없음 (아마추어)']];
  const tro = [...u.titles, ...u.awards].sort((a, b) => b.y - a.y);
  const cp = Object.keys(U.champs).map(n => ({ n, g: U.champs[n].g, w: U.champs[n].w })).sort((a, b) => b.g - a.g).slice(0, 5);
  const sigTag = champTag(u.pos, U.champ);
  const html = `<section class="card center has-sig">${U.sig ? `<div class="sig-mark">${sigSVG(U.sig.strokes)}</div>` : ''}${av(u, 'lg')}<h1 class="t1" style="margin-top:10px">${esc(u.nick)}</h1><p class="cap">${esc(teamLine(u))}</p>${T && !u.acad && teamFace(G, T) === u ? '<span class="badge gold">' + esc(T.name) + '의 얼굴</span>' : ''}<div class="big-num" style="margin-top:8px">${ovr(u)}</div><p class="cap">종합 능력치 (OVR)</p></section>
    ${U.skins.length ? `<section class="card"><div class="card-row"><h2 class="t2">우승 스킨</h2><span class="cap">${U.skins.length}개</span></div><div class="skins">${U.skins.map(sk => skinCard(sk, u.nick, u.seed, U.sig)).join('')}</div></section>` : ''}
    <section class="card"><div class="card-row"><h2 class="t2">능력치</h2><span class="badge blue">집중 육성 ${U.focus.map(k => STAT_KO[k]).join(' · ')}</span></div>${bars(u.st, U.focus)}<p class="cap" style="margin-top:10px">${POS_KO[u.pos]}에게 중요한 능력치: ${[...STATS].sort((a, b) => WGT[u.pos][b] - WGT[u.pos][a]).slice(0, 3).map(k => STAT_KO[k]).join(', ')}</p></section>
    <section class="card"><div class="card-row"><h2 class="t2">챔피언</h2><span class="badge ${sigTag === G.meta ? 'blue' : ''}">시그니처 ${esc(U.champ)} · ${TAG_KO[sigTag] || ''}</span></div>${cp.length ? `<div class="rows">${cp.map(c => `<div class="r"><span>${esc(c.n)}</span><b>${c.g}세트 · 승률 ${Math.round(c.w / c.g * 100)}%</b></div>`).join('')}</div>` : '<p class="body">1군 경기에 나서면 챔피언 기록이 쌓여요.</p>'}<p class="cap" style="margin-top:8px">이번 시즌 메타: ${METAS[G.meta].name}</p></section>
    <section class="card"><h2 class="t2">계약</h2><div class="rows">${con.map(([a, b]) => `<div class="r"><span>${a}</span><b>${esc(b)}</b></div>`).join('')}</div>${U.sig ? autograph(U.sig.strokes, u.nick, `${U.sig.y} ${G.teams[U.sig.tid] ? G.teams[U.sig.tid].name : ''} 첫 계약`) : '<p class="cap" style="margin-top:8px">첫 프로 계약서에 직접 서명하게 돼요.</p>'}</section>
    <section class="card"><h2 class="t2">프로필</h2><div class="rows">${rows.map(([a, b]) => `<div class="r"><span>${a}</span><b>${esc(b)}</b></div>`).join('')}</div></section>
    ${tro.length ? `<section class="card"><h2 class="t2">트로피·수상</h2><div class="rows">${tro.map(t => `<div class="r"><span>${t.y}</span><b>${esc(t.label)}</b></div>`).join('')}</div></section>` : ''}`;
  return { html, cta: '' };
}

/* 기록 */
function tRecord() {
  const u = userP(G), U = G.user, c = u.cs, cs = careerScore(G);
  const sum4 = `<div class="mini3" style="grid-template-columns:repeat(2,1fr)"><div><span>통산</span><b>${c.g}세트 · POG ${c.pog}</b></div><div><span>평균 평점</span><b>${c.g ? avgR(c).toFixed(2) : '-'}</b></div><div><span>롤드컵 · MSI</span><b>${cs.worlds} · ${cs.msi}</b></div><div><span>올해의 선수</span><b>${cs.poy}회</b></div></div>`;
  const seasons = U.hist.slice().reverse().map(h => `<div class="comp"><b>${h.y} · ${h.age}살 · ${esc(h.team)}</b><span class="badge ${h.titles.length ? 'gold' : ''}">${esc(h.role)}</span><span class="cap">OVR ${h.ovr} · ${h.g ? `${h.g}세트 · 평점 ${h.avg.toFixed(2)} · POG ${h.pog}` : h.clg ? `2군 ${h.clg}세트 · 평점 ${h.clavg.toFixed(2)}` : '1군 출전 없음'}${h.meta ? ` · ${METAS[h.meta].name}` : ''}${h.champ ? ` · 최다 ${esc(h.champ)}` : ''}${h.gmRank && h.gmRank <= 10 ? ` · 올해의 선수 ${h.gmRank}위` : ''}${h.titles.length ? ' · ' + h.titles.map(esc).join(', ') : ''}</span></div>`).join('');
  const hist = G.hist.map(h => `<div class="comp"><b>${h.y} 롤드컵 · ${esc(h.worlds)}</b><span class="badge ${h.poyUser ? 'blue' : ''}">${esc(h.poy.split(' (')[0])}</span><span class="cap">결승 상대 ${esc(h.wRunner)} · MSI ${esc(h.msi)} · LCK ${esc(h.lck)} · LPL ${esc(h.lpl)} · 결승 MVP ${esc(h.wFmvp)}</span></div>`).join('');
  return { html: `<section class="card"><p class="eyebrow">기록</p><h1 class="t1">${esc(u.nick)}의 커리어</h1>${sum4}<p class="cap" style="margin-top:12px">현재 커리어 점수 ${cs.score} · 등급 ${cs.grade}</p></section>
    ${leagueCard()}
    <section class="card"><h2 class="t2">시즌별 기록</h2>${seasons || '<p class="body">첫 시즌을 보내면 기록이 쌓여요.</p>'}</section>
    ${hist ? `<section class="card"><div class="card-row"><h2 class="t2">역대 우승</h2><span class="cap">배지: 올해의 선수</span></div>${hist}</section>` : ''}`, cta: '' };
}

// 홈 '우리 팀': 지금 내가 실제로 같이 뛰는 동료 (1군이면 1군, 2군이면 2군)
function myTeamCard() {
  const u = userP(G); if (!u.tid || u.mil) return '';
  const T = G.teams[u.tid], acad = u.acad;
  const rows = POS.map(pos => {
    if (pos === u.pos) { const rv = acad ? null : bestAt(G, T, pos, u.id); return { pos, p: u, me: true, rv }; }
    return { pos, p: acad ? bestAcadAt(G, T, pos, u.id) : bestAt(G, T, pos, u.id) || bestAcadAt(G, T, pos, u.id), duo: DUO[u.pos] === pos };
  });
  return `<section class="card"><div class="card-row"><h2 class="t2">우리 팀</h2><span class="cap">${esc(acad ? (ACAD_NAME[T.id] || T.name + ' 2군') : T.name)}</span></div><div class="ro">${rows.map(x => x.p ? `<div class="ro-row ${x.me ? 'me' : ''}"><span class="ro-pos">${POS_KO[x.pos]}</span><img class="av sm" src="${avatarURI(x.p.seed, acad ? '#4E5968' : T.color)}" alt=""><span class="ro-main"><b>${esc(x.me ? u.nick : x.p.nick)}${x.me ? ' <i class="ro-v">나</i>' : x.duo ? ' <i class="ro-v duo">듀오</i>' : ''}${acad ? '' : faceTag(x.p, T)}</b><span>${x.me ? (x.rv ? `주전 경쟁 ${esc(x.rv.nick)} (OVR ${ovr(x.rv)})` : '주전') : (x.p.name ? esc(x.p.name) + ' · ' : '') + x.p.age + '살'}</span></span><span class="ro-ovr">${ovr(x.p)}</span></div>` : '').join('')}</div></section>`;
}
/* ---------- 구단 로스터: 리그별 팀 목록 → 팀 1군·2군 명단 ---------- */
// LCK 2군은 별도 팀으로 LCK CL에서 뛴다 (2026 LCK CL 참가팀 이름)
const ACAD_NAME = { T1: 'T1 Esports Academy', GEN: 'Gen.G Global Academy', HLE: 'HLE Challengers', KT: 'KT Rolster Challengers', DK: 'Dplus KIA Challengers', NS: 'Nongshim Esports Academy', BFX: 'BNK FEARX Youth', DNS: 'DN SOOPers Challengers', KRX: 'Kiwoom DRX Challengers', BRO: 'HANJIN BRION Challengers' };
const acadStr = T => avg(POS.map(pos => { const p = bestAcadAt(G, T, pos); return p ? ovrRaw(p) : 50; }));
function leagueCard() {
  const rg = UI.league || 'LCK', cl = rg === 'LCK CL';
  const ids = [...G.ids[cl ? 'LCK' : rg]].sort((a, b) => (cl ? acadStr(G.teams[b]) - acadStr(G.teams[a]) : teamStr(G, G.teams[b]) - teamStr(G, G.teams[a])));
  const u = userP(G);
  return `<section class="card"><div class="card-row"><h2 class="t2">구단 로스터</h2><span class="cap">실존 선수 ${Object.values(G.P).filter(p => p.real && p.tid).length}명</span></div>
    <div class="chips" style="margin-top:10px">${['LCK', 'LCK CL', 'LPL', 'LEC', 'LCS', 'LCP', 'CBLOL'].map(r => `<button class="chip" data-a="leagueTab" data-v="${r}" aria-pressed="${r === rg}">${r}</button>`).join('')}</div>
    <div class="lg-list">${ids.map((id, i) => { const T = G.teams[id], lu = cl ? POS.map(pos => bestAcadAt(G, T, pos) || (u.acad && u.tid === id && u.pos === pos ? u : null)).filter(Boolean) : autoLineup(G, T), mine = cl ? u.acad && u.tid === id : u.tid === id && !u.acad, fc = cl ? null : teamFace(G, T); return `<button class="li lg-team ${mine ? 'me' : ''}" data-a="teamOpen" data-v="${id}" data-cl="${cl ? 1 : ''}"><span class="lg-rank">${i + 1}</span>${crest(T, 'sm')}<span class="tx"><b>${esc(cl ? ACAD_NAME[id] || T.name + ' 2군' : T.name)}</b><span>${lu.map(p => (p === fc ? '★' : '') + esc(p.isUser ? u.nick : p.nick)).join(' · ')}</span></span><span class="lg-pw">${Math.round(cl ? acadStr(T) : teamStr(G, T))}</span></button>`; }).join('')}</div></section>`;
}
function rosterRow(p, T) {
  const u = userP(G), me = p.isUser;
  return `<div class="ro-row ${me ? 'me' : ''}"><span class="ro-pos">${POS_KO[p.pos]}</span><img class="av sm" src="${avatarURI(p.seed, p.acad ? '#4E5968' : T.color)}" alt=""><span class="ro-main"><b>${esc(me ? u.nick : p.nick)}${p.real || me ? '' : ' <i class="ro-v">가상</i>'}${p.acad ? '' : faceTag(p, T)}</b><span>${p.name ? esc(p.name) + ' · ' : ''}${p.age}살${p.con > 0 && !me ? ` · 계약 ${p.con}년` : ''}${p.inj > 0 ? ' · 부상' : ''}</span></span><span class="ro-ovr">${ovr(p)}</span></div>`;
}

const ROLE_TXT = { STARTER: '주전 경쟁 우위', BENCH: '1군 · 주전 경쟁', ACADEMY: '2군 연습생', ROSTER: '1군' };
const KIND_TXT = { join: '입단 제안', transfer: '구단 제안', resign: '재계약', loan: '임대 제안' };
// 계약서의 "함께 뛸 선수": 스토브리그가 끝난 뒤의 예상 라인업과 듀오 파트너
function lineupBlock(o) {
  const lu = projLineup(G, o.tid, o.role), T = G.teams[o.tid], u = userP(G);
  const mate = lu.find(x => x.duo && x.p), chem = mate ? chemOf(G, mate.p) : 0;
  const rows = lu.map(x => {
    const p = x.p, tag = x.me ? '<span class="badge blue">나</span>' : x.rival ? '<span class="badge red">주전 경쟁</span>' : x.duo ? '<span class="badge green">듀오</span>' : p && o.role !== 'ACADEMY' && teamFace(G, T) === p ? '<span class="badge gold">팀의 얼굴</span>' : '';
    return `<div class="lu-row ${x.me ? 'me' : ''}"><span class="lu-pos">${POS_KO[x.pos]}</span>${p ? `<img class="av sm" src="${avatarURI(p.seed, T.color)}" alt=""><b>${esc(x.me ? u.nick : p.nick)}</b>${tag}<span class="lu-o">${x.me ? `OVR ${ovr(u)}` : `OVR ${ovr(p)} · ${p.age}살`}</span>` : '<b>-</b>'}</div>`;
  }).join('');
  const acad = o.role === 'ACADEMY';
  const note = mate ? `${DUO_KO[u.pos]} 파트너 ${esc(mate.p.nick)} (OVR ${ovr(mate.p)})${chem ? ` · 함께한 ${chem}시즌` : ''}. ${acad ? '2군에서도 오래 함께할수록 호흡이 쌓여요.' : '파트너가 강하고 오래 함께할수록 내 경기력이 올라가요.'}` : '';
  let up = '';
  if (acad) {
    const st = bestAt(G, T, u.pos, u.id), lu1 = POS.map(pos => (bestAt(G, T, pos, u.id) || {}).nick || '-');
    up = st ? `<p class="cap" style="margin:6px 0 0">2군에서 활약해 OVR ${Math.round(ovrRaw(st) - 5)} 이상, 감독 신뢰 55 이상이 되면 1군으로 콜업돼요.</p>` : '';
  }
  return `<div class="lineup"><div class="card-row"><b class="t3">${acad ? '함께 뛸 2군 동료' : '함께 뛸 선수'}</b><span class="cap">${G.year + 1} ${acad ? 'LCK CL' : '시즌 예상'}</span></div>${rows}${note ? `<p class="cap" style="margin:6px 0 0">${note}</p>` : ''}${up}</div>`;
}
function lastSeasonTxt(T) {
  const L = (G.yearLog && G.yearLog[T.id]) || {}, parts = [];
  if (L.lckRank) parts.push(`LCK ${L.lckRank}위`);
  if (G.rec.lpl === T.id) parts.push('LPL 우승');
  if (G.rec.worlds === T.id) parts.push('롤드컵 우승'); else if (L.wp) parts.push(`롤드컵 ${L.wp}`);
  else if (L.msi) parts.push(`MSI ${L.msi}`);
  return parts.join(' · ') || '국제 대회 진출 실패';
}
function sheetWrap(inner, label) { return `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="grab"></div>${inner}</div>`; }
function renderSheet() {
  const root = $id('sheet'), s = UI.sheet;
  if (!s) { root.hidden = true; root.innerHTML = ''; return; }
  root.hidden = false;
  root.innerHTML = vSheet(s);
  const f = root.querySelector('.btn-primary:not([disabled]), .opt, .btn'); if (f) f.focus({ preventScroll: true });
  bindSigPad();
}
// 서명 패드: 그리는 동안에는 시트를 다시 그리지 않고 캔버스만 갱신한다
function bindSigPad() {
  const cv = $id('sigpad'), s = UI.sheet;
  if (!cv || !s || s.type !== 'contract') return;
  const x = cv.getContext('2d');
  const draw = () => {
    x.clearRect(0, 0, cv.width, cv.height); x.save(); x.scale(cv.width / 600, cv.height / 180);
    x.strokeStyle = '#191F28'; x.lineWidth = 4; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const st of s.strokes) { if (!st.length) continue; x.beginPath(); x.moveTo(st[0][0], st[0][1]); if (st.length === 1) x.lineTo(st[0][0] + 0.1, st[0][1]); for (let i = 1; i < st.length; i++) x.lineTo(st[i][0], st[i][1]); x.stroke(); }
    x.restore();
  };
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round(clamp((e.clientX - r.left) / r.width, 0, 1) * 6000) / 10, Math.round(clamp((e.clientY - r.top) / r.height, 0, 1) * 1800) / 10]; };
  let pid = null;
  cv.addEventListener('pointerdown', e => {
    if (pid !== null || e.button !== 0 || s.strokes.length >= 100) return;
    e.preventDefault(); pid = e.pointerId; try { cv.setPointerCapture(pid); } catch (err) { /* 무시 */ }
    s.strokes.push([pt(e)]); draw();
  });
  cv.addEventListener('pointermove', e => {
    if (e.pointerId !== pid) return;
    e.preventDefault();
    if (s.strokes.reduce((a, st) => a + st.length, 0) >= 5000) return;
    const last = s.strokes[s.strokes.length - 1], p = pt(e), q = last[last.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.2) return;
    last.push(p); draw();
  });
  const up = e => { if (e.pointerId !== pid) return; pid = null; const ok = validSig(s.strokes), stx = $id('sig-st'), b = $id('signBtn'); if (stx) stx.textContent = ok ? '서명했어요' : '직접 서명한 뒤 계약을 확정하세요'; if (b) b.disabled = !ok; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('lostpointercapture', () => { pid = null; });
  draw();
}
let sigTimer = 0;
function finishSign() {
  clearTimeout(sigTimer);
  const s = UI.sheet; if (!s || s.type !== 'contract') return;
  const U = G.user, o = U.tasks.offers[s.i];
  if (!U.sig) { if (!validSig(s.strokes)) return; U.sig = { strokes: packSig(s.strokes), tid: o.tid, y: G.year + 1 }; }
  signOffer(G, o); save();
  UI.sheet = { type: 'signed' }; render();
}
function vSheet(s) {
  const u = G && G.user ? userP(G) : null, U = G && G.user;
  switch (s.type) {
    case 'obSummary': {
      const ob = UI.ob, st = ob.styles[ob.si];
      return sheetWrap(`<div class="prof"><img class="av lg" src="${avatarURI(ob.seed, '#4E5968')}" alt=""><div><div class="t2">${esc(ob.nick)}</div><div class="cap">${POS_KO[ob.pos]} · ${st.name} · 16살</div></div></div>
        <div class="rows"><div class="r"><span>소속</span><b>아마추어 · 솔로랭크</b></div><div class="r"><span>본명</span><b>${esc(ob.name)}</b></div><div class="r"><span>능력치 합 · OVR</span><b>${STAT_TOTAL} · ${ovrOf(st.st, ob.pos)}</b></div><div class="r"><span>시그니처 챔피언</span><b>${esc(ob.champ)} · ${TAG_KO[champTag(ob.pos, ob.champ)]}</b></div><div class="r"><span>집중 육성</span><b>${ob.focus.map(k => STAT_KO[k]).join(' · ')}</b></div></div>
        <div class="btn-row"><button class="btn btn-grey" data-a="closeSheet">다시 보기</button><button class="btn btn-primary" data-a="startCareer">16살 시즌 시작</button></div>`, '선수 확인');
    }
    case 'offers': {
      const t = U.tasks, sel = s.sel == null ? -1 : s.sel;
      const cards = t.offers.map((o, i) => {
        const T = G.teams[o.tid], rv = o.rival ? G.P[o.rival] : null;
        return `<button class="opt" data-a="selOffer" data-i="${i}" aria-pressed="${sel === i}"><div class="opt-h"><span class="who">${crest(T)}<span><b class="t3">${esc(o.title)}</b><br><span class="cap">${T.region} · 팀 전력 ${Math.round(T.base)}</span></span></span>${{ stay: '<span class="badge">잔류</span>', return: '<span class="badge">복귀</span>', loan: '<span class="badge green">임대</span>', resign: '<span class="badge blue">재계약</span>' }[o.kind] || (T.region === 'LPL' ? '<span class="badge red">해외</span>' : '')}</div>
          <span class="cap">${esc(o.desc)}</span>${rv ? `<span class="cap">1군 ${POS_KO[u.pos]} 경쟁자: ${esc(rv.nick)} (OVR ${ovr(rv)})</span>` : ''}
          <span class="lu-mini">${projLineup(G, o.tid, o.role).map(x => `<span class="${x.me ? 'me' : x.duo ? 'duo' : x.rival ? 'rv' : ''}">${x.me ? '나' : esc(x.p ? x.p.nick : '-')}</span>`).join('')}</span></button>`;
      }).join('');
      const needSign = sel >= 0 && CONTRACT_KINDS[t.offers[sel].kind];
      return sheetWrap(`<div class="sheet-h"><div><p class="eyebrow">다음 진로</p><h2 class="t1">어디로 갈까요?</h2></div></div><p class="body" style="margin:0">강팀은 우승에 가깝지만 주전 경쟁이 치열해요. 경기에 나가야 성장해요. 계약은 서명하는 순간 확정돼요.</p>${cards}
        <button class="btn btn-primary" data-a="pickOffer" ${sel < 0 ? 'disabled' : ''}>${needSign ? '계약서 보기' : '이 길로 갈게요'}</button><button class="btn btn-text" data-a="closeSheet">나중에 정하기</button>`, '다음 진로');
    }
    case 'contract': {
      const o = U.tasks.offers[s.i], T = G.teams[o.tid], rv = o.rival ? G.P[o.rival] : null, sig = U.sig;
      const head = o.kind === 'resign' ? `${esc(T.name)}${jo(T.name, '과', '와')} 재계약할 수 있어요` : o.kind === 'loan' ? `${esc(T.name)}에서 임대 제안이 왔어요` : `${esc(T.name)}${jo(T.name, '이', '가')}<br>${esc(u.nick)} 선수를 영입하고 싶어해요`;
      const kv = [['연봉', `${o.sal}억`], ['계약 기간', o.kind === 'loan' ? '1시즌 임대' : `${o.years}년`], ['영입 역할', `<b class="blue">${ROLE_TXT[o.role] || '1군'}</b>`]];
      if (rv && o.role !== 'ACADEMY') kv.push(['주전 경쟁자', `${esc(rv.nick)} · OVR ${ovr(rv)}`]);
      if (o.role === 'ACADEMY') kv.push(['뛰는 무대', 'LCK CL (2군)']);
      const pad = sig ? autograph(sig.strokes, u.nick, s.playing ? '서명 중' : '준비됨', s.playing) + (s.playing ? '<button class="btn btn-text" data-a="sigSkip">건너뛰기</button>' : '')
        : `<div class="sig-pad"><p id="sig-ins">아래 칸에 마우스나 손가락으로 직접 서명해 주세요.</p><canvas id="sigpad" width="1200" height="360" aria-label="직접 그리는 선수 서명" aria-describedby="sig-ins"></canvas><div class="sig-act"><span id="sig-st" aria-live="polite">${validSig(s.strokes) ? '서명했어요' : '직접 서명한 뒤 계약을 확정하세요'}</span><button type="button" class="btn-quiet" data-a="sigClear">지우고 다시 서명</button></div></div>`;
      const canDecline = ['join', 'transfer', 'loan'].includes(o.kind) && U.tasks.offers.length > 1;
      return sheetWrap(`<p class="eyebrow">${KIND_TXT[o.kind] || '계약'}</p><h2 class="t1">${head}</h2><p class="body" style="margin:0">${esc(o.desc)}</p>
        <div class="contract-hd">${crest(T, 'lg')}<div style="min-width:0"><b class="t3">${esc(T.name)}</b><div class="cap">${T.region} · 팀 전력 ${Math.round(T.base)}</div><div class="cap">지난 시즌 ${esc(lastSeasonTxt(T))}</div></div></div>
        <div class="kv">${kv.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>
        ${lineupBlock(o)}${pad}
        <div class="btn-row"><button class="btn btn-grey" data-a="${canDecline ? 'declineOffer' : 'closeSheet'}" ${s.playing ? 'disabled' : ''}>${canDecline ? '거절하기' : '다른 제안 보기'}</button><button class="btn btn-primary" id="signBtn" data-a="signGo" ${s.playing || (!sig && !validSig(s.strokes)) ? 'disabled' : ''}>${s.playing ? '서명하는 중…' : '계약하기'}</button></div>`, '계약서');
    }
    case 'signed': {
      const o = U.tasks.path, T = G.teams[o.tid];
      const mine = (G.posts || []).find(p => p.me && p.y === G.year && p.tid === o.tid && /welcome|extend|loan/.test(p.type));
      return sheetWrap(`<p class="eyebrow">계약 완료 · ${G.year + 1} 시즌부터 ${o.kind === 'loan' ? '1시즌 임대' : `${o.years}년`} · 연봉 ${o.sal}억</p><h2 class="t1">${esc(T.name)}${jo(T.name, '이', '가')}<br>공식 발표를 올렸어요</h2>
        ${mine ? postCard(mine) : autograph(U.sig.strokes, u.nick, '서명 완료')}<button class="btn btn-primary" data-a="closeSheet">확인</button>`, '계약 완료');
    }
    case 'team': {
      const T = G.teams[s.id], cl = !!s.cl, ro = (cl ? acadP(G, T) : rosterP(G, T)).slice().sort((a, b) => POS.indexOf(a.pos) - POS.indexOf(b.pos) || ovrRaw(b) - ovrRaw(a)), ac = acadP(G, T).slice().sort((a, b) => POS.indexOf(a.pos) - POS.indexOf(b.pos) || ovrRaw(b) - ovrRaw(a));
      const L = G.stoveLog && G.stoveLog.teams[T.id];
      const info = cl ? ['LCK CL', `전력 ${Math.round(acadStr(T))}`, `${T.name} 산하 2군`].join(' · ') : [T.region, `전력 ${Math.round(teamStr(G, T))}`].concat(T.mode ? [MODE_KO[T.mode]] : []).concat(L && L.rank ? [`지난 시즌 ${L.rank}위`] : []).join(' · '), face = cl ? null : teamFace(G, T);
      return sheetWrap(`<div class="contract-hd">${crest(T, 'lg')}<div><b class="t2">${esc(cl ? ACAD_NAME[T.id] || T.name + ' 2군' : T.name)}</b><div class="cap">${info}</div>${face ? `<div class="cap">팀의 얼굴 <b style="color:var(--grey900)">${esc(face.isUser ? userP(G).nick : face.nick)}</b></div>` : ''}</div></div>
        <h3 class="t3">선수단 · ${ro.length}명</h3><div class="ro">${ro.map(p => rosterRow(p, T)).join('')}</div>
        <p class="cap">숫자는 OVR(게임 속 능력치)이에요. 실존 선수 이름은 2026 시즌 로스터 기준이에요. 은퇴·이적으로 생긴 빈자리는 LCK CL과 해외 리그의 실존 선수가 먼저 채우고, 그 선수들까지 다 뛰고 나면 가상 선수가 들어와요.</p>
        <button class="btn btn-primary" data-a="closeSheet">닫기</button>`, T.name + ' 로스터');
    }
    case 'post': {
      const p = (G.posts || []).find(x => x.id === s.id);
      if (!p) return sheetWrap('<button class="btn btn-primary" data-a="closeSheet">닫기</button>', '게시물');
      return sheetWrap(`${postCard(p)}<button class="btn btn-primary" data-a="closeSheet">닫기</button>`, '구단 게시물');
    }
    case 'skin': {
      const P = U.skinPending;
      if (!P) return sheetWrap('<p class="body">고를 우승 스킨이 없어요.</p><button class="btn btn-primary" data-a="closeSheet">확인</button>', '우승 스킨');
      const sel = s.sel == null ? -1 : s.sel, T = G.teams[P.tid];
      return sheetWrap(`<p class="eyebrow">${P.y} 롤드컵 우승</p><h2 class="t1">우승 스킨으로 만들<br>챔피언을 골라 주세요</h2><p class="body" style="margin:0">롤드컵 무대에서 함께한 챔피언 중에서 골라요. 스킨에는 팀 로고와 내 서명이 들어가요.</p>
        ${P.opts.map((c, i) => `<button class="opt" data-a="skinSel" data-i="${i}" aria-pressed="${sel === i}"><div class="opt-h"><b class="t3">${esc(c)}</b><span class="badge ${c === U.champ ? 'blue' : ''}">${[P.games[c] ? `롤드컵 ${P.games[c]}세트` : '', c === U.champ ? '시그니처' : ''].filter(Boolean).join(' · ')}</span></div></button>`).join('')}
        ${sel >= 0 ? skinCard({ y: P.y, tid: P.tid, team: T ? T.name : '', color: T ? T.color : '#191F28', champ: P.opts[sel] }, u.nick, u.seed, U.sig) : ''}
        <button class="btn btn-primary" data-a="skinGo" ${sel < 0 ? 'disabled' : ''}>이 챔피언으로 할게요</button><button class="btn btn-text" data-a="closeSheet">나중에 고르기</button>`, '우승 스킨');
    }
    case 'skinDone': {
      const sk = U.skins[U.skins.length - 1];
      return sheetWrap(`<p class="eyebrow">우승 스킨 공개</p><h2 class="t1">${esc(sk.champ)} 우승 스킨이<br>나왔어요</h2>${skinCard(sk, u.nick, u.seed, U.sig)}<p class="cap">선수 탭에서 언제든 다시 볼 수 있어요.</p><button class="btn btn-primary" data-a="closeSheet">확인</button>`, '우승 스킨');
    }
    case 'turn': {
      const t = U.tasks.turn;
      if (s.result != null) return sheetWrap(`<p class="eyebrow">${esc(u.nick)} · 전환점</p><h2 class="t1">${esc(t.title)}</h2><div class="result-box">${esc(s.result)}</div><button class="btn btn-primary" data-a="closeSheet">확인</button>`, '전환점');
      return sheetWrap(`${sceneHTML(u.seed, teamColor(u), !!u.tid && !u.acad)}<p class="eyebrow">${esc(u.nick)} · 전환점</p><h2 class="t1">${esc(t.title)}</h2><p class="body" style="margin:0">${esc(t.text)}</p>
        ${t.choices.map((c, i) => `<button class="opt" data-a="turnPick" data-i="${i}"><b class="t3">${esc(c.t)}</b><span class="cap">${esc(c.d)}</span></button>`).join('')}
        <p class="cap">진로를 정하면 이번 전환점은 지나가요.</p><button class="btn btn-text" data-a="closeSheet">나중에 생각하기</button>`, '전환점');
    }
    case 'focus': {
      const sel = s.sel;
      return sheetWrap(`<p class="eyebrow">집중 육성</p><h2 class="t1">새로 키울 능력치를<br>골라 주세요</h2><div class="stat-tiles">${STATS.map(k => `<button class="stat-tile" data-a="focusPick" data-v="${k}" aria-pressed="${sel.includes(k)}"><b>${Math.round(u.st[k])}</b><span>${STAT_KO[k]}</span></button>`).join('')}</div>
        <button class="btn btn-primary" data-a="focusSave" ${sel.length ? '' : 'disabled'}>이렇게 키울게요</button>`, '집중 육성');
    }
    case 'breaking': {
      const B = G.breaking, b = B && B.items[s.i];
      if (!b) return sheetWrap('<button class="btn btn-primary" data-a="closeSheet">확인</button>', '속보');
      const more = s.i + 1 < s.end;
      return sheetWrap(`<p class="eyebrow">스토브리그 속보${s.end - s.start > 1 ? ` · ${s.i - s.start + 1}/${s.end - s.start}` : ''}</p>${brkCard(b)}<p class="fine" style="margin:0">게임 속 가상 속보예요. 실제 매체·선수의 소식이 아니에요.</p><button class="btn btn-primary" data-a="${more ? 'brkNext' : 'closeSheet'}">${more ? '다음 속보' : '확인'}</button>`, '스토브리그 속보');
    }
    case 'tryout': {
      const o = U.tasks.offers[s.i], T = G.teams[o.tid];
      if (s.res === true) return sheetWrap(`${sceneHTML(u.seed, T.color, true)}<p class="eyebrow">입단 테스트 결과</p><h2 class="t1">${esc(T.name)} 입단 테스트<br>합격이에요!</h2><p class="body" style="margin:0">코치진이 2군 연습생 계약을 제안했어요.</p><button class="btn btn-primary" data-a="pathOpen" data-i="${s.i}">계약서 보기</button>`, '입단 테스트');
      if (s.res === false) return sheetWrap(`<p class="eyebrow">입단 테스트 결과</p><h2 class="t1">아쉽게 불합격이에요</h2><p class="body" style="margin:0">${esc(T.name)} 코치진은 조금 더 지켜보겠다고 했어요. 다른 길을 골라 주세요.</p><button class="btn btn-primary" data-a="closeSheet">확인</button>`, '입단 테스트');
      return sheetWrap(`<div class="contract-hd">${crest(T, 'lg')}<div><b class="t3">${esc(T.name)}</b><div class="cap">2군(LCK CL) 연습생 선발 테스트</div></div></div><h2 class="t1">입단 테스트를 볼까요?</h2><p class="body" style="margin:0">코치진 앞에서 스크림과 1:1 라인전을 치러요. 합격하면 2군 계약서를 받아요. 떨어지면 이번 오프시즌엔 이 팀 테스트를 다시 볼 수 없어요.</p>
        <div class="kv"><div><span>합격 가능성</span><b>${o.p >= 0.6 ? '높음' : o.p >= 0.35 ? '보통' : '낮음'}</b></div><div><span>내 OVR</span><b>${ovr(u)}</b></div><div><span>솔랭</span><b>${lpTier(U.lp)}${lpRank(U.lp) ? ' · ' + lpRank(U.lp) + '위' : ''}</b></div></div>
        <div class="btn-row"><button class="btn btn-grey" data-a="closeSheet">닫기</button><button class="btn btn-primary" data-a="tryoutGo" data-i="${s.i}">테스트 보러 가기</button></div>`, '입단 테스트');
    }
    case 'pathConfirm': {
      const t = U.tasks, o = (t.offers || [{ kind: 'mil', title: '군 복무 계속', desc: '복무를 이어가요' }])[s.i];
      return sheetWrap(`<h2 class="t1">${esc(o.title)}</h2><p class="body" style="margin:0">${esc(o.desc || '')}${o.kind === 'stay' ? ' 남은 계약대로 지금 팀에서 뛰어요.' : o.kind === 'return' ? ' 임대를 마치고 원소속팀으로 돌아가요.' : o.kind === 'trainee' ? ' 아직 프로 계약은 아니에요. 팀 아카데미에서 LCK 아카데미 시리즈를 뛰며 승격을 노려요.' : o.kind === 'school' ? ' 학원비는 부모님이 내 주셨어요. 1년 뒤 테스트에서 유리해져요.' : ''}</p>
        <div class="btn-row"><button class="btn btn-grey" data-a="closeSheet">닫기</button><button class="btn btn-primary" data-a="pathGo" data-i="${s.i}">선택하기</button></div>`, '진로');
    }
    case 'retire': {
      const cs = careerScore(G);
      return sheetWrap(`<p class="eyebrow">은퇴</p><h2 class="t1">정말 은퇴할까요?</h2><p class="body" style="margin:0">커리어가 여기서 끝나고 명예의 전당에 기록돼요. 지금 기준 등급은 ${cs.grade}, 점수는 ${cs.score}점이에요.</p>
        <div class="btn-row"><button class="btn btn-grey" data-a="closeSheet">더 뛸래요</button><button class="btn btn-danger" data-a="retireGo">은퇴할게요</button></div>`, '은퇴');
    }
    case 'mil': {
      return sheetWrap(`<p class="eyebrow">병역</p><h2 class="t1">입대할 때가 됐어요</h2><p class="body" style="margin:0">아시안게임 금메달이 없어 병역 혜택을 받지 못했어요. 입대하면 2시즌 동안 경기에 나서지 못하고 경기 감각이 떨어져요.</p>
        <button class="opt" data-a="milGo"><b class="t3">입대한다</b><span class="cap">2시즌 복무 후 전역, 다시 프로 무대에 도전해요.</span></button>
        <button class="opt" data-a="retireGo"><b class="t3">은퇴하고 입대한다</b><span class="cap">여기서 커리어를 마무리해요.</span></button>
        <button class="btn btn-text" data-a="closeSheet">닫기</button>`, '병역');
    }
    case 'settings': {
      return sheetWrap(`<p class="eyebrow">설정</p><h2 class="t1">무엇을 할까요?</h2>
        <button class="li" data-a="toLanding"><span class="ic grey">${IC.home}</span><span class="tx"><b>처음 화면으로</b><span>진행 상황은 자동 저장돼요</span></span></button>
        <button class="li" data-a="howto"><span class="ic blue">${IC.spark}</span><span class="tx"><b>게임 방법</b><span>시즌, 진로, 성장 규칙</span></span></button>
        ${CHEER_KEY ? `<button class="li" data-a="cheer"><span class="ic red">${IC.heart}</span><span class="tx"><b>개발자에게 응원 남기기</b><span>재밌었던 순간, 바라는 기능 무엇이든</span></span></button>` : ''}
        <button class="li" data-a="wipeAsk"><span class="ic red">${IC.flag}</span><span class="tx"><b>이 커리어 지우기</b><span>되돌릴 수 없어요</span></span></button>
        <button class="btn btn-text" data-a="closeSheet">닫기</button>`, '설정');
    }
    case 'cheer': return vCheer(s);
    case 'wipe': return sheetWrap(`<h2 class="t1">커리어를 지울까요?</h2><p class="body" style="margin:0">저장된 진행 상황이 사라지고 되돌릴 수 없어요.</p><div class="btn-row"><button class="btn btn-grey" data-a="closeSheet">취소</button><button class="btn btn-danger" data-a="wipeGo">지우기</button></div>`, '커리어 지우기');
    case 'newAsk': return sheetWrap(`<h2 class="t1">새로 시작할까요?</h2><p class="body" style="margin:0">지금 진행 중인 커리어는 지워져요. 은퇴하면 명예의 전당에 남길 수 있어요.</p><div class="btn-row"><button class="btn btn-grey" data-a="closeSheet">취소</button><button class="btn btn-primary" data-a="newGo">새로 시작</button></div>`, '새로 시작');
    case 'howto': return sheetWrap(`<p class="eyebrow">게임 방법</p><h2 class="t1">한 시즌씩 쌓는 커리어</h2>
      <div class="rows">
        <div class="r"><span>시즌</span><b style="font-weight:500">버튼 한 번에 1년이 흘러요. LCK컵, 정규시즌, MSI, 플레이오프, 롤드컵까지. 내 팀의 결승은 미니맵 중계로 봐요.</b></div>
        <div class="r"><span>성장</span><b style="font-weight:500">경기에 나갈수록 크게 자라요. 벤치만 지키면 성장이 멈춰요.</b></div>
        <div class="r"><span>주전</span><b style="font-weight:500">감독은 OVR, 감독 신뢰, 지난 경기 출전을 보고 매 경기 주전을 골라요.</b></div>
        <div class="r"><span>진로</span><b style="font-weight:500">재계약, 이적, 임대, LPL 진출 중에서 골라요.</b></div>
        <div class="r"><span>스토브리그</span><b style="font-weight:500">시즌이 끝나면 구단들의 영입·방출이 먼저 진행돼요. 계약서에서 다음 시즌 라인업과 듀오 파트너를 확인하고 골라요. 듀오와 오래 함께할수록 호흡이 쌓여요.</b></div>
        <div class="r"><span>계약</span><b style="font-weight:500">첫 계약서에는 직접 서명하고, 이후 계약서에는 저장된 서명이 들어가요. 서명하면 되돌릴 수 없어요.</b></div>
        <div class="r"><span>메타</span><b style="font-weight:500">시즌마다 패치 메타가 바뀌어요. 메타 능력치가 내 평균보다 높을수록 활약이 커져요. 오프시즌에 다음 메타가 예고돼요.</b></div>
        <div class="r"><span>챔피언</span><b style="font-weight:500">시그니처 챔피언이 메타와 맞으면 더 자주 꺼내고 시즌 내내 경기력이 올라가요.</b></div>
        <div class="r"><span>우승 스킨</span><b style="font-weight:500">롤드컵을 우승하면 그 무대에서 쓴 챔피언 중 하나를 골라 우승 스킨을 받아요.</b></div>
        <div class="r"><span>은퇴</span><b style="font-weight:500">${MAX_AGE}살 시즌이 마지막이에요. 그 전이라도 계약이 끝났는데 불러주는 팀이 없으면 은퇴해요. 26살부터는 오프시즌에 직접 은퇴를 선언할 수 있어요.</b></div>
        <div class="r"><span>팀의 얼굴</span><b style="font-weight:500">Faker·ShowMaker 같은 프랜차이즈 스타는 팀을 잘 떠나지 않아요. 오래 뛰며 이름값을 쌓으면 나도 팀의 얼굴이 될 수 있어요.</b></div>
        <div class="r"><span>속보</span><b style="font-weight:500">오프시즌에는 큰 이적·재계약·은퇴 소식이 속보로 먼저 날아와요. 게임 속 가상 매체예요.</b></div>
        <div class="r"><span>병역</span><b style="font-weight:500">28살이 되면 입대해야 해요. 아시안게임(게임 속 일정) 금메달이면 면제예요.</b></div>
        <div class="r"><span>목표</span><b style="font-weight:500">롤드컵 우승과 올해의 선수. 은퇴하면 명예의 전당에 남아요.</b></div>
      </div><button class="btn btn-primary" data-a="closeSheet">확인</button>`, '게임 방법');
  }
  return '';
}

/* ---------- 은퇴 요약: 닮은 선수 ----------
 * 원작처럼 커리어를 몇 가지 유형과 비교해 닮은 실존 선수를 고른다. 설명은 공개된 커리어 사실만 쓴다 */
const LEGENDS = {
  Faker: ['MID', 'SKT T1 시절부터 한 팀에서만 뛰며 롤드컵을 가장 많이 우승한 미드 라이너예요.'],
  Score: ['JGL', 'KT 롤스터에서만 오래 뛰며 팀의 상징이 된 정글러예요.'],
  Deft: ['ADC', '데뷔하고 오랜 시간이 지나 2022 롤드컵에서 첫 우승을 차지한 원거리 딜러예요.'],
  Ambition: ['JGL', '미드에서 정글로 포지션을 바꾼 뒤 2017 롤드컵 우승을 이룬 베테랑이에요.'],
  Rookie: ['MID', 'LPL로 건너가 인빅터스 게이밍의 2018 롤드컵 우승을 이끈 미드 라이너예요.'],
  TheShy: ['TOP', 'LPL에서 공격적인 플레이로 이름을 알리고 2018 롤드컵을 우승한 탑 라이너예요.'],
  Viper: ['ADC', 'LCK와 LPL을 오가며 2021 롤드컵을 우승한 원거리 딜러예요.'],
  CoreJJ: ['SUP', '원거리 딜러에서 서포터로 전향해 2017 롤드컵을 우승하고 북미에서도 오래 활약했어요.'],
  Mata: ['SUP', '넓은 시야와 오더로 2014 롤드컵 우승을 이끈 서포터예요.'],
  Bengi: ['JGL', 'SKT T1의 롤드컵 세 차례 우승을 함께한 정글러예요.'],
  Uzi: ['ADC', 'LPL을 대표하는 공격적인 원거리 딜러로, 롤드컵 결승에 두 번 올랐어요.'],
  Chovy: ['MID', '라인전과 CS 관리로 정평이 난 미드 라이너예요.'],
  Canyon: ['JGL', '2020 롤드컵 우승을 이끈 캐리형 정글러예요.'],
  Keria: ['SUP', 'T1의 롤드컵 연속 우승을 함께한 플레이메이커 서포터예요.'],
  Zeus: ['TOP', '어린 나이에 롤드컵 우승을 경험한 탑 라이너예요.'],
  Kiin: ['TOP', '오랜 기간 LCK 정상급 탑 라이너로 꾸준히 활약했어요.'],
  Ruler: ['ADC', '2017 롤드컵을 우승한 한타형 원거리 딜러예요.'],
  ShowMaker: ['MID', '한 팀에서 오래 뛰며 2020 롤드컵을 우승한 미드 라이너예요.'],
};
const ARCHETYPES = [
  { id: 'superstar', title: '시대를 지배한 슈퍼스타', who: ['Faker', 'Keria', 'Zeus', 'Canyon', 'Ruler'], s: f => Math.min(1, f.worlds * 0.3 + f.poy * 0.25), r: f => [`롤드컵 우승 ${f.worlds}회`, `올해의 선수 ${f.poy}회`, `최고 OVR ${f.best}`] },
  { id: 'collector', title: '가는 곳마다 우승하는 트로피 수집가', who: ['Bengi', 'Faker', 'Keria'], s: f => Math.min(1, f.titles / 8), r: f => [`트로피 ${f.titles}개`, `롤드컵 ${f.worlds} · MSI ${f.msi}`, `리그 우승 ${f.league}회`] },
  { id: 'oneclub', title: '한 팀의 상징, 원클럽맨', who: ['Faker', 'Score', 'ShowMaker'], s: f => (f.teams === 1 ? Math.min(1, f.proSeasons / 8) : 0), r: f => [`${f.mainTeam}에서만 ${f.proSeasons}시즌`, `통산 ${f.g}세트`, f.worlds ? `롤드컵 우승 ${f.worlds}회` : `팬 ${f.fans}`] },
  { id: 'late', title: '늦게 핀 꽃', who: ['Deft', 'Ambition'], s: f => (f.firstBigAge >= 25 ? 0.6 + Math.min(0.4, (f.firstBigAge - 25) * 0.1) : 0), r: f => [`${f.firstBigAge}살에 첫 큰 우승`, `데뷔 ${f.debutAge}살`, `통산 ${f.proSeasons}시즌`] },
  { id: 'import', title: '해외를 정복한 용병', who: ['Rookie', 'TheShy', 'Viper'], s: f => Math.min(1, f.lplSeasons * 0.25 + (f.lplTitles ? 0.3 : 0)), r: f => [`LPL ${f.lplSeasons}시즌`, `LPL 우승 ${f.lplTitles}회`, f.worlds ? `롤드컵 우승 ${f.worlds}회` : `통산 ${f.g}세트`] },
  { id: 'journeyman', title: '어디서든 살아남은 저니맨', who: ['Viper', 'CoreJJ', 'Deft'], s: f => (f.teams >= 3 ? Math.min(1, (f.teams - 2) * 0.3) : 0), r: f => [`${f.teams}개 팀`, `${f.regions}개 리그`, `통산 ${f.g}세트`] },
  { id: 'laner', title: '라인전 괴물', who: ['Chovy', 'TheShy', 'Zeus'], s: f => (f.topStat === 'lane' ? 0.55 + Math.min(0.4, (f.avg - 6.8) * 0.4) : 0.1), r: f => [`라인전 ${f.st.lane}`, `평균 평점 ${f.avg.toFixed(2)}`, `POG ${f.pog}회`] },
  { id: 'brain', title: '판을 읽는 운영의 뇌', who: ['Mata', 'Ambition', 'Score'], s: f => (f.topStat === 'macro' ? 0.75 : f.st.macro >= 85 ? 0.45 : 0.1), r: f => [`운영 ${f.st.macro}`, `멘탈 ${f.st.mental}`, `통산 ${f.g}세트`] },
  { id: 'fighter', title: '한타의 지배자', who: ['Ruler', 'Keria'], s: f => (f.topStat === 'tf' ? 0.75 : f.st.tf >= 85 ? 0.45 : 0.1), r: f => [`한타 ${f.st.tf}`, `통산 KDA ${f.kda}`, `POG ${f.pog}회`] },
  { id: 'mech', title: '손이 다른 피지컬 괴물', who: ['Uzi', 'TheShy', 'Faker'], s: f => (f.topStat === 'mech' ? 0.75 : f.st.mech >= 88 ? 0.45 : 0.1), r: f => [`피지컬 ${f.st.mech}`, `통산 KDA ${f.kda}`, `평균 평점 ${f.avg.toFixed(2)}`] },
  { id: 'steady', title: '우승 없이도 빛난 꾸준함', who: ['Kiin', 'Score', 'Uzi'], s: f => (f.worlds === 0 && f.proSeasons >= 7 ? 0.6 + Math.min(0.3, (f.avg - 6.5) * 0.3) : 0), r: f => [`통산 ${f.proSeasons}시즌`, `평균 평점 ${f.avg.toFixed(2)}`, `통산 ${f.g}세트`] },
];
function careerFacts() {
  const u = userP(G), U = G.user, H = U.hist, cs = careerScore(G);
  const pro = H.filter(h => h.tid && h.role !== '아마추어' && h.role !== '아카데미 연습생');
  const tids = [...new Set(pro.map(h => h.tid))];
  const regions = [...new Set(tids.map(t => G.teams[t] && G.teams[t].region))];
  const big = u.titles.filter(t => ['worlds', 'msi', 'lck', 'lpl'].includes(t.kind)).sort((a, b) => a.y - b.y)[0];
  const st = {}; for (const k of STATS) st[k] = Math.round(u.st[k]);
  const topStat = ['lane', 'tf', 'macro', 'mech'].sort((a, b) => st[b] - st[a])[0];
  const mainTeam = tids.length ? G.teams[tids[0]].name : '아마추어';
  return {
    worlds: cs.worlds, poy: cs.poy, msi: cs.msi, league: cs.lck + cs.lpl, titles: u.titles.length, best: Math.max(ovr(u), ...H.map(h => h.ovr)),
    teams: tids.length, regions: regions.length, proSeasons: pro.length, mainTeam, g: u.cs.g, pog: u.cs.pog, avg: u.cs.g ? avgR(u.cs) : 0, kda: u.cs.g ? kdaOf(u.cs).toFixed(2) : '-',
    lplSeasons: pro.filter(h => G.teams[h.tid] && G.teams[h.tid].region === 'LPL').length, lplTitles: cs.lpl, fans: fansTxt(u.pop),
    firstBigAge: big ? big.y - G.user.hist[0].y + 16 : 0, debutAge: (H.find(h => h.g > 0) || {}).age || u.age, st, topStat, pos: u.pos,
  };
}
function lookalikes() {
  const f = careerFacts(), used = new Set();
  return ARCHETYPES.map(a => ({ a, s: a.s(f) })).filter(x => x.s > 0.15).sort((x, y) => y.s - x.s).slice(0, 3).map(({ a, s }) => {
    const cand = a.who.filter(n => !used.has(n));
    const who = cand.find(n => LEGENDS[n][0] === f.pos) || cand[0] || a.who[0];
    used.add(who);
    return { title: a.title, who, desc: LEGENDS[who][1], pct: Math.round(60 + 38 * Math.min(1, s)), reasons: a.r(f) };
  });
}

/* ---------- 게시물 댓글: 롤판 팬들이 실제로 다는 말투 (게임 속 가상 댓글) ---------- */
const CMT_USERS = ['faker_forever', '롤파크지박령', 'gg_wp_02', '탑차이남', 'jungle_diff', '미드갭충', 'baron_steal', 'lck_simp', '새벽솔랭러', 'skt_since2013', '젠지직관러', 'botlane.enjoyer', '월즈가즈아', 'kda_police', '서폿장인', '롤드컵티켓구함', 'drx_dream', 'hle_orange', '협곡의왕', 'kiwi_fan', 'noob_master', 'ad_carry_life', '칼바람장인', 'rift.herald'];
const CMT_CN = ['欢迎回家！', '加油！！！', '老板大气', '这阵容冠军', '{n} 冲冲冲'];
const CMT_EN = ['WELCOME {n}!!', 'huge pickup', 'this roster is insane', "let's goooo", 'LCK diff'];
const CMT = {
  welcome: ['와 {t} 프런트 일 잘하네 ㄷㄷ', '{n} 드디어 왔다 ㅋㅋㅋㅋ', '이 라인업이면 롤드컵 간다', '{m}-{n} 듀오 벌써 설렌다', '웰컴 {n}!! 🔥', '실화냐 이게 되네', '사인 이쁘다 ㅋㅋ', '올해는 진짜 다르다 진짜로', '{t} 유니폼 잘 어울린다', '이적시장 승자 {t}'],
  thanks: ['고마웠어 {n} 어디 가든 응원할게', '아니 왜 보내냐 프런트 진짜...', '{n} 없는 {t}는 상상이 안 된다', '그동안 고생 많았어요 ❤️', '레전드 대접 해줘라', '울면서 보는 중', '다음 팀에서도 행복하자 {n}', '{n} 보내고 누구 데려옴?'],
  extend: ['재계약 ㅠㅠ 감사합니다', '{n} {u}까지 확정 ㄱㅅ', '왕조 가자 {t}!!', '프런트 오늘 일 했다', '이건 못 참지 🔥', '{n} 종신 계약 가자'],
  fa: ['우리 팀 와라 제발', '{n} 데려가는 팀이 이번 스토브 승자', '어디로 가든 응원합니다', '연봉 얼마 부를까 ㄷㄷ', 'LPL 가지 마라 ㅠ'],
  loan: ['임대 가서 많이 뛰고 와라', '경기 뛰는 게 최고지', '돌아올 때 더 무서워져서 와', '좋은 선택이다 진짜'],
  enlist: ['기다릴게요 {n}', '건강하게 다녀와!!', '전역하면 바로 복귀 ㄱ', '충성! 🫡'],
  retire: ['{n} 덕분에 롤 봤다', '레전드 은퇴... 시대가 끝났다', '고생 많았습니다 진심으로', '명예의 전당 확정', '코치로 돌아와 줘'],
};
function postComments(p) {
  let h = 2166136261; for (const c of String(p.id) + p.nick + p.type + p.y) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return h / 4294967296; };
  const T = postTeam(p), tn = T ? T.name : '', mate = T && G ? bestAt(G, T, DUO[p.pos] || 'JGL', p.me ? userP(G).id : -1) : null;
  const fill = s => s.split('{n}').join(p.nick).split('{t}').join(tn).split('{m}').join(mate ? mate.nick : '팀원').split('{u}').join(p.until || '');
  const pool = (CMT[p.type] || CMT.welcome).slice();
  if (T && T.region === 'LPL') pool.push(...CMT_CN);
  if (T && (T.region === 'LEC' || T.region === 'LCS')) pool.push(...CMT_EN);
  const out = [], used = new Set(), pop = p.me ? userP(G).pop : (p.ovr || 70);
  for (let i = 0; i < 4 && pool.length; i++) {
    const k = Math.floor(rnd() * pool.length), text = fill(pool.splice(k, 1)[0]);
    let user; do { user = CMT_USERS[Math.floor(rnd() * CMT_USERS.length)]; } while (used.has(user) && used.size < CMT_USERS.length);
    used.add(user);
    out.push({ user, text, likes: Math.round((5 + pop * pop * 0.08) * (1.6 - i * 0.35) * (0.5 + rnd())) });
  }
  return { list: out, total: Math.round(40 + pop * pop * 0.4 * (0.6 + rnd())) };
}
function commentsHTML(p) {
  const C = postComments(p);
  return `<div class="ig-cmts"><span class="cap">댓글 ${C.total.toLocaleString('ko-KR')}개</span>${C.list.map(c => `<p><b>${esc(c.user)}</b> ${esc(c.text)} <small>♥ ${c.likes.toLocaleString('ko-KR')}</small></p>`).join('')}</div>`;
}

/* ---------- 은퇴 화면 ---------- */
function vEnd() {
  const E = UI.end;
  // 원작처럼 요약 카드가 차례로 펼쳐진다 (--d: 등장 순서)
  const sec = (i, html, cls) => `<section class="card end-sec ${cls || ''}" style="--d:${i}">${html}</section>`;
  const look = (E.look || []).map(l => `<div class="look"><div class="look-h"><span class="look-pct">${l.pct}%</span><div><p class="cap">${esc(l.title)}</p><b class="t2">${esc(l.who)}</b></div></div><p class="body" style="margin:6px 0 0">${esc(l.desc)}</p><div class="chips" style="margin-top:8px">${l.reasons.map(r => `<span class="badge">${esc(r)}</span>`).join('')}</div></div>`).join('');
  const tl = (E.timeline || []).map(h => `<div class="tl-row">${h.tid && G && G.teams[h.tid] ? crest(G.teams[h.tid], 'xs') : '<span class="crest xs" style="background:var(--grey200)"></span>'}<span class="tl-y">${h.y}</span><span class="tl-t">${esc(h.team)} · ${esc(h.role)}</span><span class="tl-o">OVR ${h.ovr}</span>${h.titles.length || h.awards.length ? `<span class="tl-h">${[...h.titles, ...h.awards].map(esc).join(' · ')}</span>` : ''}</div>`).join('');
  return `<div class="shell"><header class="hd"><div><div class="hd-t">솔랭에서 월즈까지</div><div class="hd-s">커리어 요약</div></div></header>
    <main class="stack pb-cta">
      ${sec(0, `${E.sig ? `<div class="sig-mark">${sigSVG(E.sig.strokes)}</div>` : ''}<img class="av lg" src="${avatarURI(E.seed, E.color)}" alt=""><h1 class="t1" style="margin-top:10px">${esc(E.nick)}</h1><p class="cap">${POS_KO[E.pos]} · ${E.seasons}시즌 · ${E.age}살 은퇴 · 시그니처 ${esc(E.champ)}</p><div class="grade" style="margin-top:16px">${E.grade}</div><p class="body">커리어 점수 ${E.score}점 · 명예의 전당 ${E.rank}위</p>`, 'center has-sig')}
      ${look ? sec(1, `<h2 class="t2">닮은 선수</h2><p class="cap">내 커리어와 가장 닮은 실제 선수예요. 실제 선수 설명은 공개된 커리어 기록을 바탕으로 했어요.</p><div class="looks">${look}</div>`) : ''}
      ${sec(2, `<h2 class="t2">통산 기록</h2><div class="rows">${E.rows.map(([a, b]) => `<div class="r"><span>${a}</span><b>${esc(b)}</b></div>`).join('')}</div>`)}
      ${tl ? sec(3, `<h2 class="t2">걸어온 길</h2><div class="tl-list">${tl}</div>`) : ''}
      ${E.post && E.post.tid && G && G.teams[E.post.tid] ? sec(4, postCard(E.post)) : ''}
      ${E.skins.length ? sec(5, `<div class="card-row"><h2 class="t2">우승 스킨</h2><span class="cap">${E.skins.length}개</span></div><div class="skins">${E.skins.map(sk => skinCard(sk, E.nick, E.seed, E.sig)).join('')}</div>`) : ''}
      ${E.tro.length ? sec(6, `<h2 class="t2">트로피·수상</h2><div class="rows">${E.tro.map(t => `<div class="r"><span>${t.y}</span><b>${esc(t.label)}</b></div>`).join('')}</div>`) : ''}
      ${CHEER_KEY ? sec(7, `<h2 class="t2">재밌게 즐기셨나요?</h2><p class="cap">개발자에게 응원 한마디 남겨 주세요.</p>${cheerEntry()}`) : ''}
    </main>
    <div class="cta-bar"><button class="btn btn-primary" data-a="newGo">새로운 인생 시작하기</button><button class="btn btn-text" data-a="toLanding">처음 화면으로</button></div></div>`;
}
function retire() {
  const u = userP(G), U = G.user, cs = careerScore(G);
  const T = u.tid ? G.teams[u.tid] : null;
  const lastTeam = (U.hist.slice().reverse().find(h => h.tid) || {}).team || '아마추어';
  const best = Math.max(ovr(u), ...U.hist.map(h => h.ovr));
  if (U.skinPending) chooseSkin(G, U.skinPending.opts[0]);
  const look = lookalikes();
  const timeline = U.hist.map(h => ({ y: h.y, age: h.age, team: h.team, tid: h.tid, role: h.role, ovr: h.ovr, titles: h.titles.slice(), awards: (h.awards || []).filter(a => /올해의 선수|MVP/.test(a)) }));
  const entry = { nick: u.nick, pos: u.pos, seed: u.seed, color: T ? T.color : '#4E5968', team: lastTeam, grade: cs.grade, score: cs.score, worlds: cs.worlds, poy: cs.poy, best, seasons: U.hist.length, y: G.year, skins: U.skins.map(s => s.champ) };
  const hof = (load(HOF_KEY) || []).concat([entry]).sort((a, b) => (b.worlds - a.worlds) || (b.poy - a.poy) || (b.score - a.score)).slice(0, 30);
  store(HOF_KEY, hof);
  const rank = hof.indexOf(hof.find(h => h === entry || (h.nick === entry.nick && h.y === entry.y && h.score === entry.score))) + 1;
  UI.end = {
    nick: u.nick, pos: u.pos, seed: u.seed, color: entry.color, age: u.age, seasons: U.hist.length, grade: cs.grade, score: cs.score, rank, sig: U.sig, skins: U.skins.slice(), champ: U.champ,
    rows: [['1군 통산', `${u.cs.g}세트 · KDA ${kdaOf(u.cs).toFixed(2)}`], ['평균 평점', u.cs.g ? avgR(u.cs).toFixed(2) : '-'], ['POG', `${u.cs.pog}회`], ['롤드컵 우승', `${cs.worlds}회`], ['올해의 선수', `${cs.poy}회`], ['MSI · LCK · LPL', `${cs.msi} · ${cs.lck} · ${cs.lpl}`], ['최고 OVR', String(best)], ['마지막 팀', lastTeam]],
    tro: [...u.titles, ...u.awards].sort((a, b) => b.y - a.y),
    look, timeline,
    post: { id: 0, type: 'retire', name: u.name, tid: T ? T.id : ((U.hist.slice().reverse().find(h => h.tid) || {}).tid || null), nick: u.nick, seed: u.seed, pos: u.pos, y: G.year, me: true },
  };
  U.retired = true;
  drop(SAVE_KEY);
  UI.sheet = null; UI.play = null; UI.screen = 'end';
  render(); window.scrollTo(0, 0);
}

/* ---------- 토스트 ---------- */
let toastTimer = 0;
function toast(msg) { const t = $id('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2400); }

/* ---------- 시즌 재생 ---------- */
let playTimer = 0;
function startPlayback() {
  runSeason(G); save();
  UI.seenReact = false;
  UI.play = { i: reduceMotion() ? G.S.ev.length : 0 };
  render(); window.scrollTo(0, 0);
  if (!reduceMotion()) tick();
}
function tick() {
  clearTimeout(playTimer);
  if (!UI.play || UI.tab !== 'season') return;
  if (UI.play.i >= G.S.ev.length) { render(); return; }
  if (pendingCast() != null || UI.cast) { render(); return; }
  playTimer = setTimeout(() => {
    if (!UI.play) return;
    UI.play.i++;
    render();
    if (pendingCast() != null) return;
    const tl = $id('tl'); if (tl && tl.lastElementChild) tl.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    tick();
  }, UI.play.i === 0 ? 300 : 700);
}

/* =========================================================
 * 입력
 * ========================================================= */
const ACT = {
  newGo: () => { drop(SAVE_KEY); G = null; UI.sheet = null; UI.ob = newOb(); UI.screen = 'onboard'; render(); window.scrollTo(0, 0); },
  newAsk: () => { UI.sheet = { type: 'newAsk' }; renderSheet(); },
  cont: () => { const s = migrate(load(SAVE_KEY)); if (!s) { toast('저장된 커리어를 불러오지 못했어요'); return; } G = s; UI.screen = screenFor(); UI.tab = G.phase === 'PRE' ? 'season' : 'home'; UI.play = null; render(); },
  toLanding: () => { clearTimeout(playTimer); UI.play = null; UI.sheet = null; UI.screen = 'landing'; render(); window.scrollTo(0, 0); },
  // 온보딩
  obBack: () => { if (UI.ob.step === 0) { UI.screen = 'landing'; } else UI.ob.step--; render(); },
  obSeed: d => { UI.ob.seed = d.v; render(); },
  obReroll: () => { const ob = UI.ob; ob.seeds = []; for (let i = 0; i < 24; i++) ob.seeds.push((i % 3 === 2 ? 'f-' : 'm-') + Math.floor(Math.random() * 1e9).toString(36)); ob.seed = ob.seeds[0]; render(); },
  obNick: () => { UI.ob.nick = pick(HANDLES) + (chance(0.35) ? pick(HSUF) : ''); render(); },
  obName: () => { UI.ob.name = pick(SURN) + pick(GIVEN); render(); },
  obPos: d => { if (UI.ob.pos !== d.v) { UI.ob.pos = d.v; UI.ob.styles = styleCandidates(d.v); UI.ob.si = 0; UI.ob.focus = []; UI.ob.champ = null; } render(); },
  obStyle: d => { UI.ob.si = +d.i; UI.ob.focus = []; render(); },
  obStyleReroll: () => { UI.ob.styles = styleCandidates(UI.ob.pos); render(); },
  obChamp: d => { UI.ob.champ = d.v; render(); },
  obFocus: d => { const f = UI.ob.focus; const i = f.indexOf(d.v); if (i >= 0) f.splice(i, 1); else { if (f.length >= 2) f.shift(); f.push(d.v); } render(); },
  obNext: () => {
    const ob = UI.ob;
    if (ob.step === 1) { const nk = (ob.nick || '').trim().slice(0, 12); if (!nk) { toast('닉네임을 입력해 주세요'); return; } ob.nick = nk; }
    if (ob.step === 2 && !ob.champ) ob.champ = champCandidates(ob.pos, ob.styles[ob.si].main)[0].n;
    if (ob.step === 3 && !ob.champ) return;
    if (ob.step === 4) { if (!ob.focus.length) return; UI.sheet = { type: 'obSummary' }; renderSheet(); return; }
    ob.step++; render(); window.scrollTo(0, 0);
  },
  startCareer: () => {
    const ob = UI.ob;
    G = newWorld();
    createUser(G, { nick: ob.nick, pos: ob.pos, seed: ob.seed, name: ob.name, style: ob.styles[ob.si], focus: ob.focus, champ: ob.champ });
    UI.sheet = null; UI.screen = 'app'; UI.tab = 'season'; UI.play = null; save(); render(); window.scrollTo(0, 0);
  },
  // 앱
  tab: d => {
    UI.tab = d.v; if (d.v !== 'season') { clearTimeout(playTimer); if (UI.play && UI.play.i >= G.S.ev.length) UI.play = null; }
    // 원작처럼 '다음 이야기'에 들어오면 전환점 이야기가 바로 열린다 (전환점마다 한 번)
    const t = G.user && G.user.tasks;
    if (d.v === 'season' && !UI.play && !UI.viewResults && offStage() === 'event' && UI.turnShown !== G.year + ':' + t.turn.id) { UI.turnShown = G.year + ':' + t.turn.id; UI.sheet = { type: 'turn', result: null }; }
    render(); window.scrollTo(0, 0); if (d.v === 'season' && UI.play) tick(); if (d.v === 'season' && UI.cast && UI.cast.phase === 'live') castLoop();
  },
  goSeason: () => ACT.tab({ v: 'season' }),
  playSeason: () => startPlayback(),
  skipPlay: () => { clearTimeout(playTimer); const P = UI.play; if (P) { const S = G.S; let j = P.i; while (j < S.ev.length && !(S.ev[j].cast != null && !(P.seen || {})[S.ev[j].cast])) j++; P.i = Math.min(S.ev.length, j + 1); } render(); },
  castOpen: d => { clearTimeout(playTimer); UI.cast = { idx: +d.v, set: 0, t: 0, phase: 'preview' }; render(); window.scrollTo(0, 0); },
  castSkip: d => { const P = UI.play; P.seen = P.seen || {}; P.seen[+d.v] = true; UI.cast = null; render(); tick(); },
  castStart: () => { const C = UI.cast; C.phase = 'live'; C.t = 0; if (reduceMotion()) C.phase = 'setEnd'; render(); castLoop(); },
  castFast: () => { const C = UI.cast; const g = G.S.casts[C.idx].games[C.set]; C.t = g.dur; cancelAnimationFrame(castRAF); C.phase = 'setEnd'; render(); },
  castNext: () => { const C = UI.cast, X = G.S.casts[C.idx]; if (C.set + 1 < X.games.length) { C.set++; C.t = 0; C.phase = reduceMotion() ? 'setEnd' : 'live'; render(); window.scrollTo(0, 0); castLoop(); } else { C.phase = 'done'; render(); } },
  castEnd: () => { const P = UI.play; P.seen = P.seen || {}; P.seen[UI.cast.idx] = true; UI.cast = null; render(); window.scrollTo(0, 0); tick(); },
  endPlay: () => { UI.play = null; render(); window.scrollTo(0, 0); },
  settings: () => { UI.sheet = { type: 'settings' }; renderSheet(); },
  howto: () => { UI.sheet = { type: 'howto' }; renderSheet(); },
  wipeAsk: () => { UI.sheet = { type: 'wipe' }; renderSheet(); },
  cheer: () => { UI.sheet = { type: 'cheer', state: 'edit', text: '' }; renderSheet(); },
  cheerSend: () => cheerSend(),
  wipeGo: () => { drop(SAVE_KEY); G = null; UI.sheet = null; UI.screen = 'landing'; render(); toast('커리어를 지웠어요'); },
  closeSheet: () => { clearTimeout(sigTimer); const s = UI.sheet; UI.sheet = null; if (s && s.type === 'signed') { beginNext(); return; } if (s && /^(turn|offers|focus|mil|contract|skin|skinDone|pathConfirm|tryout)$/.test(s.type)) render(); else renderSheet(); },
  resultsOk: () => { G.user.tasks.resultsSeen = true; save(); UI.viewResults = false; UI.tab = 'home'; UI.autoTurn = true; render(); window.scrollTo(0, 0); showBreaking(2); },
  resultsBack: () => { UI.viewResults = false; render(); window.scrollTo(0, 0); },
  viewResults: () => { UI.viewResults = true; render(); window.scrollTo(0, 0); },
  turnAck: () => { G.user.tasks.turnAck = true; save(); render(); window.scrollTo(0, 0); showBreaking(2); },
  pathOpen: d => { const t = G.user.tasks, i = +d.i, o = t.offers && t.offers[i]; if (o && o.kind === 'retire') { UI.sheet = { type: 'retire' }; renderSheet(); return; } if (o && o.kind === 'tryout') { UI.sheet = { type: 'tryout', i }; renderSheet(); return; } if (o && CONTRACT_KINDS[o.kind]) { if (t.turn && !t.turnDone) t.turnDone = true; UI.sheet = { type: 'contract', i, strokes: [], playing: false }; renderSheet(); const sh = $id('sheet').querySelector('.sheet'); if (sh) sh.scrollTop = 0; return; } UI.sheet = { type: 'pathConfirm', i }; renderSheet(); },
  tryoutGo: d => { const t = G.user.tasks, i = +d.i, o = t.offers[i]; const pass = takeTryout(G, o); save(); UI.sheet = { type: 'tryout', i, res: pass }; renderSheet(); },
  pathGo: d => { const t = G.user.tasks; t.path = t.offers ? t.offers[+d.i] : { kind: 'mil', title: '군 복무 계속' }; if (t.turn && !t.turnDone) t.turnDone = true; beginNext(); },
  sheetOffers: () => { const t = G.user.tasks; if (t.signed) return; UI.sheet = { type: 'offers', sel: t.path ? t.offers.indexOf(t.path) : null }; if (UI.sheet.sel < 0) UI.sheet.sel = null; renderSheet(); },
  selOffer: d => { UI.sheet.sel = +d.i; renderSheet(); },
  pickOffer: () => {
    const s = UI.sheet; if (s.sel == null) return;
    const o = G.user.tasks.offers[s.sel];
    if (CONTRACT_KINDS[o.kind]) { UI.sheet = { type: 'contract', i: s.sel, strokes: [], playing: false }; renderSheet(); $id('sheet').querySelector('.sheet').scrollTop = 0; return; }
    G.user.tasks.path = o; save(); UI.sheet = null; render(); toast(`${o.title}${roJ(o.title)} 정했어요`);
  },
  declineOffer: () => {
    const s = UI.sheet, t = G.user.tasks; if (!s || s.type !== 'contract' || t.offers.length <= 1) return;
    const o = t.offers[s.i]; t.offers.splice(s.i, 1); if (t.path === o) t.path = null; save();
    UI.sheet = null; render(); toast('제안을 거절했어요');
  },
  sigClear: () => { if (UI.sheet && UI.sheet.type === 'contract') { UI.sheet.strokes = []; renderSheet(); } },
  signGo: () => {
    const s = UI.sheet; if (!s || s.type !== 'contract' || s.playing) return;
    if (G.user.sig) { if (reduceMotion()) { finishSign(); return; } s.playing = true; renderSheet(); sigTimer = setTimeout(finishSign, 1750); return; }
    if (validSig(s.strokes)) finishSign();
  },
  sigSkip: () => finishSign(),
  jr: d => { setJourney(+d.v); journeyTick(); },
  leagueTab: d => { UI.league = d.v; render(); },
  teamOpen: d => { UI.sheet = { type: 'team', id: d.v, cl: !!d.cl }; renderSheet(); },
  openPost: d => { UI.sheet = { type: 'post', id: +d.v }; renderSheet(); },
  sheetSkin: () => { if (!G.user.skinPending) return; UI.sheet = { type: 'skin', sel: null }; renderSheet(); },
  skinSel: d => { UI.sheet.sel = +d.i; renderSheet(); },
  skinGo: () => { const s = UI.sheet, P = G.user.skinPending; if (!P || s.sel == null) return; chooseSkin(G, P.opts[s.sel]); save(); UI.sheet = { type: 'skinDone' }; render(); },
  sheetTurn: () => { UI.sheet = { type: 'turn', result: null }; renderSheet(); },
  turnPick: d => {
    const t = G.user.tasks.turn, i = +d.i;
    if (t.refocus && i === 0) { UI.sheet = { type: 'focus', sel: G.user.focus.slice(), fromTurn: true }; renderSheet(); return; }
    const msg = resolveTurn(G, t.id, i); const tk = G.user.tasks; tk.turnDone = true; tk.turnResult = { choice: t.choices[i].t, msg }; save();
    UI.sheet = null; render(); window.scrollTo(0, 0); showBreaking(1);
  },
  focusPick: d => { const f = UI.sheet.sel; const i = f.indexOf(d.v); if (i >= 0) f.splice(i, 1); else { if (f.length >= 2) f.shift(); f.push(d.v); } renderSheet(); },
  focusSave: () => { const s = UI.sheet; G.user.focus = s.sel.slice(0, 2); if (s.fromTurn) { const tk = G.user.tasks; tk.turnDone = true; tk.turnResult = { choice: '훈련 방향을 바꾼다', msg: '집중 육성 ' + G.user.focus.map(k => STAT_KO[k]).join(' · ') }; } save(); UI.sheet = null; render(); toast('집중 육성을 바꿨어요'); },
  brkNext: () => { const s = UI.sheet; if (!s || s.type !== 'breaking') return; s.i++; renderSheet(); },
  sheetRetire: () => { UI.sheet = { type: 'retire' }; renderSheet(); },
  retireGo: () => retire(),
  sheetMil: () => { UI.sheet = { type: 'mil' }; renderSheet(); },
  milGo: () => { enlist(G); save(); beginNext(); },
  nextSeason: () => {
    if (!canStartSeason(G)) return;
    startNextSeason(G); save();
    UI.tab = 'season'; UI.play = null; render(); window.scrollTo(0, 0);
    toast(`${G.year} 시즌이 다가와요`);
  },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (el && ACT[el.dataset.a]) { if (el.disabled) return; e.preventDefault(); ACT[el.dataset.a](el.dataset, el); return; }
  if (e.target === $id('sheet') && UI.sheet && UI.sheet.type !== 'obSummary') ACT.closeSheet();
});
document.addEventListener('input', e => {
  if (e.target.id === 'nick' && UI.ob) UI.ob.nick = e.target.value;
  if (e.target.id === 'cheer' && UI.sheet && UI.sheet.type === 'cheer') { UI.sheet.text = e.target.value; const n = $id('cheer-n'); if (n) n.textContent = `${e.target.value.length}/${CHEER_MAX}`; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && UI.sheet) ACT.closeSheet();
  if (e.key === 'Enter' && e.target.id === 'nick') ACT.obNext();
});

/* ---------- 부팅 ---------- */
function boot(data) {
  if (data && data.save) { try { G = migrate(JSON.parse(data.save)); UI.screen = screenFor(); UI.tab = data.tab || 'home'; } catch (e) { G = null; } }
  render();
}
const HOT = window.claude && window.claude.hot;
if (HOT && HOT.snapshot) HOT.snapshot(() => ({ save: G && G.user && !G.user.retired ? JSON.stringify(G) : null, tab: UI.tab }));
if (HOT && HOT.ready) HOT.ready(boot); else boot((HOT && HOT.data) || {});
