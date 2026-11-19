'use strict';
/* =========================================================
 * 솔랭에서 월즈까지 — 시뮬레이션 엔진 (DOM 없음)
 * 리그·구단·로스터: 2026 시즌 공개 자료 기준. 능력치는 게임 속 수치이며 실제 선수 평가가 아니다.
 * ========================================================= */

/* ---------- 유틸 ---------- */
let R = Math.random;
const rand = (a, b) => a + R() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
function randn() { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const pick = a => a[Math.floor(R() * a.length)];
const chance = p => R() < p;
const r1 = x => Math.round(x * 10) / 10;
const r2 = x => Math.round(x * 100) / 100;
const sum = a => a.reduce((s, x) => s + x, 0);
const avg = a => (a.length ? sum(a) / a.length : 0);
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function wIdx(ws) { let x = R() * sum(ws); for (let i = 0; i < ws.length; i++) { x -= ws[i]; if (x <= 0) return i; } return ws.length - 1; }

/* ---------- 기본 데이터 ---------- */
const START_YEAR = 2027;
// 커리어 상한: 31살 시즌이 마지막. 그 전에도 계약이 끝났는데 불러주는 팀이 없으면 은퇴한다
const MAX_AGE = 31;
const POS =['TOP', 'JGL', 'MID', 'ADC', 'SUP'];
const POS_KO = { TOP: '탑', JGL: '정글', MID: '미드', ADC: '원딜', SUP: '서포터' };
const STATS = ['lane', 'tf', 'macro', 'mech', 'mental', 'pool'];
const STAT_KO = { lane: '라인전', tf: '한타', macro: '운영', mech: '피지컬', mental: '멘탈', pool: '챔프폭' };
const WGT = {
  TOP: { lane: .25, tf: .20, macro: .15, mech: .20, mental: .10, pool: .10 },
  JGL: { lane: .10, tf: .20, macro: .30, mech: .15, mental: .10, pool: .15 },
  MID: { lane: .25, tf: .20, macro: .15, mech: .20, mental: .10, pool: .10 },
  ADC: { lane: .20, tf: .30, macro: .10, mech: .25, mental: .10, pool: .05 },
  SUP: { lane: .15, tf: .25, macro: .30, mech: .05, mental: .15, pool: .10 },
};
const KW = { TOP: 1.0, JGL: 1.0, MID: 1.3, ADC: 1.5, SUP: 0.25 };
const DW = { TOP: 1.1, JGL: 1.0, MID: 0.9, ADC: 1.0, SUP: 1.25 };
const AP = { TOP: 0.42, JGL: 0.62, MID: 0.55, ADC: 0.5, SUP: 0.72 };
const BEATS = { AGG: 'MAC', MAC: 'TF', TF: 'AGG' };
const REGION_KO = { LCK: '한국', LPL: '중국', LEC: '유럽', LCS: '북미', LCP: '아시아·태평양', CBLOL: '브라질' };

/* 실제 리그·구단 (2026 시즌 로스터). [태그, 한글명, 영문명, 색, [[닉네임, 능력치, 2027년 나이] × TOP·JGL·MID·ADC·SUP]]
 * 닉네임이 null인 자리는 공개 자료로 확인하지 못해 가상 선수로 채운다. */
const TEAMS_DATA = {
  LCK: [
    ['GEN', '젠지', 'Gen.G', '#A8894B', [['Kiin', 88, 28], ['Canyon', 91, 26], ['Chovy', 93, 26], ['Ruler', 91, 29], ['Duro', 86, 25]]],
    ['HLE', '한화생명e스포츠', 'Hanwha Life Esports', '#F37021', [['Zeus', 92, 23], ['Kanavi', 90, 27], ['Zeka', 89, 25], ['Gumayusi', 89, 25], ['Delight', 88, 25]]],
    ['T1', 'T1', 'T1', '#E2012D', [['Doran', 87, 27], ['Oner', 89, 25], ['Faker', 90, 31], ['Peyz', 89, 22], ['Keria', 92, 25]]],
    ['KT', 'KT 롤스터', 'KT Rolster', '#2B2B2B', [['PerfecT', 84, 23], ['Cuzz', 85, 28], ['Bdd', 87, 28], ['Aiming', 85, 27], ['Ghost', 82, 29]]],
    ['DK', '디플러스 기아', 'Dplus KIA', '#16B8A6', [['Siwoo', 84, 21], ['Lucid', 86, 22], ['ShowMaker', 87, 27], ['Smash', 85, 21], ['Career', 83, 22]]],
    ['NS', '농심 레드포스', 'Nongshim RedForce', '#C8102E', [['Kingen', 83, 27], ['Sponge', 79, 22], ['Scout', 82, 29], ['Taeyoon', 80, 24], ['Lehends', 81, 29]]],
    ['BFX', 'BNK 피어엑스', 'BNK FEARX', '#E8B400', [['Clear', 79, 24], ['Raptor', 79, 23], ['VicLa', 80, 24], ['Diable', 80, 23], ['Kellin', 81, 26]]],
    ['DNS', 'DN 수퍼스', 'DN SOOPers', '#0097DB', [['DuDu', 80, 26], ['Pyosik', 81, 27], ['Clozer', 79, 24], ['deokdam', 79, 27], ['Peter', 77, 24]]],
    ['KRX', '키움 DRX', 'KIWOOM DRX', '#3352E0', [['Rich', 77, 29], ['Vincenzo', 75, 22], ['ucal', 78, 26], ['Jiwoo', 77, 21], ['Andil', 77, 24]]],
    ['BRO', '한진 브리온', 'HANJIN BRION', '#2E8B57', [['Casting', 76, 22], ['GIDEON', 77, 25], ['Fisher', 78, 26], ['Teddy', 79, 29], ['Namgung', 75, 22]]],
  ],
  LPL: [
    ['BLG', '빌리빌리 게이밍', 'Bilibili Gaming', '#00A1D6', [['Bin', 91, 24], ['XUN', 88, 25], ['Knight', 93, 27], ['Viper', 92, 27], ['ON', 89, 24]]],
    ['AL', '애니원스 레전드', "Anyone's Legend", '#8E59E8', [['Breathe', 87, 26], ['Tarzan', 89, 28], ['Shanks', 88, 26], ['Hope', 88, 27], ['Kael', 87, 26]]],
    ['TES', '탑 이스포츠', 'Top Esports', '#FF5A1F', [['369', 87, 26], ['Tian', 87, 27], ['Creme', 87, 24], ['JackeyLove', 88, 27], ['Zhuo', 85, 25]]],
    ['IG', '인빅터스 게이밍', 'Invictus Gaming', '#3A3A3A', [['TheShy', 86, 28], ['Wei', 86, 24], ['Rookie', 86, 30], ['JiaQi', 85, 24], ['Meiko', 86, 29]]],
    ['JDG', '징동 게이밍', 'JD Gaming', '#C8102E', [['Xiaoxu', 83, 23], ['JunJia', 83, 25], ['HongQ', 84, 24], ['GALA', 86, 25], ['Vampire', 82, 24]]],
    ['WBG', '웨이보 게이밍', 'Weibo Gaming', '#F25C54', [['Zika', 83, 23], ['Jiejie', 83, 25], ['Xiaohu', 85, 29], ['Elk', 86, 25], ['Erha', 82, 24]]],
    ['LNG', 'LNG e스포츠', 'LNG Esports', '#2BB673', [['sheer', 81, 23], ['Croco', 83, 26], ['BullDoG', 83, 24], ['1xn', 82, 23], [null, 78, 22]]],
    ['EDG', '에드워드 게이밍', 'EDward Gaming', '#5B5B5B', [['Zdz', 80, 22], ['Xiaohao', 80, 22], ['Angel', 81, 26], ['Leave', 81, 25], ['Papukia', 80, 24]]],
    ['NIP', '닌자스 인 파자마스', 'Ninjas in Pyjamas', '#B9C400', [['HOYA', 79, 24], ['Guwon', 79, 23], ['Care', 80, 23], ['Assum', 80, 23], [null, 76, 21]]],
    ['WE', '팀 WE', 'Team WE', '#B71C1C', [['Cube', 79, 24], ['Monki', 79, 23], ['Karis', 80, 25], ['About', 80, 22], ['yaoyao', 78, 23]]],
    ['OMG', '오 마이 갓', 'Oh My God', '#7E57C2', [['Hery', 77, 23], ['Juhan', 78, 25], ['haichao', 78, 23], ['Starry', 78, 23], ['Moham', 77, 24]]],
    ['TT', '썬더토크 게이밍', 'ThunderTalk Gaming', '#F06292', [['Keshi', 76, 23], ['Junhao', 76, 23], ['Heru', 77, 22], ['Ryan3', 77, 22], ['Feather', 76, 22]]],
    ['UP', '울트라 프라임', 'Ultra Prime', '#6C63FF', [['Liangchen', 76, 23], ['Grizzly', 76, 22], ['Saber', 77, 24], ['Hena', 78, 26], ['Xiaoxia', 76, 23]]],
    ['LGD', 'LGD 게이밍', 'LGD Gaming', '#4A90D9', [['sasi', 75, 22], ['Heng', 75, 22], ['Tangyuan', 76, 22], ['Shaoye', 76, 22], ['ycx', 75, 22]]],
  ],
  LEC: [
    ['G2', 'G2 e스포츠', 'G2 Esports', '#D72D2D', [['BrokenBlade', 83, 27], ['SkewMond', 81, 22], ['Caps', 86, 28], ['Hans Sama', 83, 28], ['Labrov', 81, 25]]],
    ['MKOI', '모비스타 KOI', 'Movistar KOI', '#6F42C1', [['Myrwn', 80, 24], ['Elyoya', 82, 27], ['Jojopyun', 82, 22], ['Supa', 80, 25], ['Alvaro', 80, 25]]],
    ['KC', '카르민 코프', 'Karmine Corp', '#0D6EFD', [['Canna', 81, 27], ['Yike', 80, 27], ['Kyeahoo', 81, 23], ['Caliste', 81, 21], ['Busio', 79, 24]]],
  ],
  LCS: [
    ['TL', '팀 리퀴드', 'Team Liquid', '#0B2A5B', [['Morgan', 78, 27], ['Josedeodo', 77, 27], ['Quid', 78, 23], ['Yeon', 78, 25], ['CoreJJ', 79, 33]]],
    ['LYON', '라이언', 'LYON', '#D4A017', [['Dhokla', 76, 27], ['Inspired', 79, 25], ['Saint', 77, 25], ['Berserker', 80, 23], ['Isles', 76, 26]]],
    ['C9', '클라우드 나인', 'Cloud9', '#1DA1F2', [['Thanatos', 78, 22], ['Blaber', 78, 27], ['Loki', 77, 24], ['Tactical', 77, 26], ['Vulcan', 78, 29]]],
  ],
  LCP: [
    ['TSW', '팀 시크릿 웨일스', 'Team Secret Whales', '#2B2B2B', [['Pun', 77, 23], ['Hizto', 77, 24], ['Dire', 78, 23], ['Eddie', 78, 23], ['Bie', 76, 23]]],
    ['CFO', 'CTBC 플라잉 오이스터', 'CTBC Flying Oyster', '#00897B', [['Rest', 78, 24], ['Shad0w', 78, 25], ['Pout', 77, 23], ['Doggo', 79, 24], ['Kino', 77, 24]]],
    ['MVK', 'MVK e스포츠', 'MVK Esports', '#D81B60', [['Kratos', 75, 23], ['Gury', 75, 23], ['Chika', 76, 23], ['Harky', 76, 23], ['SiuLoong', 74, 24]]],
  ],
  CBLOL: [
    ['LOS', 'LOS', 'LOS', '#FF6F00', [['ZEST', 73, 24], ['Curse', 73, 24], ['Feisty', 74, 23], ['Duduhh', 73, 24], ['Ackerman', 73, 24]]],
    ['FUR', '퓨리아', 'FURIA', '#444444', [['Guigo', 73, 24], ['Tatu', 73, 23], ['Tutsz', 74, 24], ['Ayu', 74, 23], ['Jojo', 73, 24]]],
  ],
};
/* LCK 2군(LCK CL) 실제 로스터와 선수 본명: 나무위키 'LCK 스토브리그/2025' 팀별 최종 엔트리(2026 시즌) 기준 */
const ACADEMY_DATA = {"GEN":[["TOP","Ripple"],["JGL","Courage"],["MID","Kemish"],["ADC","MUDAI"],["SUP","SIRIUSS"],["SUP","Lumos"]],"HLE":[["TOP","Panther"],["JGL","Jackal"],["MID","Cracker"],["MID","Valiant"],["ADC","Pyeonsik"],["SUP","Bluffing"]],"KT":[["TOP","Sero"],["JGL","Sylvie"],["MID","Hwichan"],["ADC","FenRir"],["SUP","Pollu"],["SUP","Effort"]],"T1":[["TOP","Haetae"],["TOP","Guardian"],["JGL","Painter"],["MID","Guti"],["ADC","Cypher"],["SUP","Cloud"]],"DK":[["TOP","Jaehyuk"],["TOP","Nevid"],["JGL","Sharvel"],["MID","Garden"],["ADC","Wayne"],["SUP","Loopy"]],"BFX":[["TOP","Kangin"],["JGL","Zephyr"],["MID","Daystar"],["MID","FIESTA"],["ADC","Slayer"],["SUP","Luon"]],"NS":[["TOP","Janus"],["JGL","MihawK"],["MID","Calix"],["MID","SeTab"],["ADC","Lucy"],["SUP","Pleata"]],"BRO":[["TOP","DDahyuk"],["JGL","Dinai"],["MID","Roamer"],["MID","Tempester"],["ADC","OddEye"],["SUP","PlanB"]],"KRX":[["TOP","Frog"],["JGL","Willer"],["JGL","Winner"],["MID","AKaJe"],["ADC","LazyFeel"],["SUP","Minous"]],"DNS":[["TOP","Lancer"],["JGL","DDoiV"],["MID","Flip"],["ADC","Enosh"],["SUP","Life"],["SUP","Quantum"]]};
const REAL_NAME = {"Kiin":"김기인","Ripple":"변종민","Canyon":"김건부","Courage":"전현민","Chovy":"정지훈","Kemish":"김시훈","Ruler":"박재혁","MUDAI":"이선규","Duro":"주민규","SIRIUSS":"고건","Lumos":"김재민","Zeus":"최우제","Panther":"박지호","Kanavi":"서진혁","Jackal":"이수민","Zeka":"김건우","Cracker":"이정욱","Valiant":"한강현","Gumayusi":"이민형","Pyeonsik":"편민기","Delight":"유환중","Bluffing":"박규용","PerfecT":"이승민","Sero":"안효찬","Cuzz":"문우찬","Sylvie":"이승복","Bdd":"곽보성","Hwichan":"정휘찬","Aiming":"김하람","FenRir":"박강준","Ghost":"장용준","Pollu":"오동규","Effort":"이상호","Doran":"최현준","Haetae":"심수현","Guardian":"성태효","Oner":"문현준","Painter":"김은후","Faker":"이상혁","Guti":"문정환","Peyz":"김수환","Cypher":"김유준","Keria":"류민석","Cloud":"문현호","Siwoo":"전시우","Jaehyuk":"권재혁","Nevid":"박민우","Lucid":"최용혁","Sharvel":"김단우","ShowMaker":"허수","Garden":"설정원","Smash":"신금재","Wayne":"황서현","Career":"오형석","Loopy":"김동현","Clear":"송현민","Kangin":"최강인","Raptor":"전어진","Zephyr":"황혁수","VicLa":"이대광","Daystar":"유지명","FIESTA":"안현서","Diable":"남대근","Slayer":"김진영","Kellin":"김형규","Luon":"이현호","Kingen":"황성훈","Janus":"엄예준","Sponge":"배영준","MihawK":"김주형","Scout":"이예찬","Calix":"선현빈","SeTab":"송경진","Taeyoon":"김태윤","Lucy":"현수훈","Lehends":"손시우","Pleata":"손민우","Casting":"신민제","DDahyuk":"안민혁","GIDEON":"김민성","Dinai":"황치현","Fisher":"이정태","Roamer":"조우진","Tempester":"오영웅","Teddy":"박진성","OddEye":"조형진","Namgung":"남궁성훈","PlanB":"홍준석","Rich":"이재원","Frog":"이민회","Vincenzo":"하승민","Willer":"김정현","Winner":"우주성","Ucal":"손우현","AKaJe":"최수혁","Jiwoo":"정지우","LazyFeel":"쩐바오민","Andil":"문관빈","Minous":"강민우","DuDu":"이동주","Lancer":"한정흠","Pyosik":"홍창현","DDoiV":"방문영","Clozer":"이주현","Flip":"김상욱","deokdam":"서대길","Enosh":"곽규준","Peter":"정윤수","Life":"김정민","Quantum":"손정환"};
// 리그 전력 목표치: 은퇴·이적으로 빈자리를 채울 유망주 수준의 기준
const REGION_TARGET = { LCK: 82, LPL: 81, LEC: 80, LCS: 77, LCP: 76, CBLOL: 73 };
const FAME = { Faker: 100, Chovy: 88, Keria: 86, Canyon: 82, Ruler: 84, Zeus: 86, Gumayusi: 85, Oner: 82, Knight: 84, Viper: 86, Bin: 82, Caps: 84, ShowMaker: 84, TheShy: 82, Rookie: 80, JackeyLove: 82, Peyz: 78, Kanavi: 80, Zeka: 80, Doran: 76, CoreJJ: 74, Bdd: 74, Xiaohu: 76, Kiin: 76, Elyoya: 70, Blaber: 70 };
/* 팀의 얼굴(프랜차이즈 스타): 그 팀을 대표하는 선수. 재계약을 우선하고 오래 뛰며, 떠나거나 은퇴하면 큰 속보가 된다 */
const FRANCHISE = { Faker: 'T1', ShowMaker: 'DK', Chovy: 'GEN', Ruler: 'GEN', Zeka: 'HLE', Bdd: 'KT', Bin: 'BLG', Xiaohu: 'WBG', Rookie: 'IG', TheShy: 'IG', JackeyLove: 'TES', Caps: 'G2', Elyoya: 'MKOI', CoreJJ: 'TL', Blaber: 'C9' };
// 사실상 팀을 떠나지 않는 원클럽 레전드
const ONECLUB = { Faker: 1, ShowMaker: 1, Bin: 1, Caps: 1 };
/* 빈자리를 채우는 실존 선수 풀: 게임 시작 때 리그에 없는 실제 선수들 (2026 시즌 공개 로스터 기준).
 * 은퇴·이적으로 생긴 자리는 이 풀에서 먼저 채우고, 다 쓰면 그때 가상 선수를 만든다.
 * [닉네임, 포지션, 2027년 나이(추정), 수준(게임 속 OVR 기준), 한글 본명, 비고('FA' = 시작부터 무소속)] */
const POOL_DATA = {
  // 한국 선수: LCK CL 유망주, 해외 리그에서 뛰는 한국 선수(복귀 후보), 무소속
  KR: [['Jinbeom', 'ADC', 19, 66, '천진범'], ['Solid', 'JGL', 19, 66, '남현서'], ['MG', 'MID', 25, 70, '이지훈'], ['Hype', 'ADC', 24, 75, '변정현', 'FA'], ['Ellim', 'JGL', 26, 72, '최엘림', 'FA'],
    ['Impact', 'TOP', 32, 76, '정언영'], ['Huhi', 'SUP', 32, 75, '최재현'], ['IgNar', 'SUP', 31, 74, '이동근'], ['Photon', 'TOP', 25, 75, ''], ['HamBak', 'JGL', 23, 73, ''], ['Jun', 'SUP', 27, 76, '윤세준'],
    ['Aria', 'MID', 26, 73, '이가을'], ['Vsta', 'SUP', 25, 72, '오효성'], ['Gaeng', 'SUP', 26, 70, ''], ['YoungJae', 'JGL', 26, 72, ''], ['Mireu', 'MID', 27, 71, '']],
  // LPL 서브·무소속 베테랑
  // LPL 서브·무소속 베테랑 (위 KR 중 해외 리그에서 뛰는 선수의 소속 리그는 KR_HOME)
  CN: [['Flandre', 'TOP', 29, 80, '', 'FA'], ['Soboro', 'TOP', 22, 78], ['Ale', 'TOP', 27, 79], ['naiyou', 'JGL', 23, 80], ['Renard', 'MID', 21, 77], ['Yagao', 'MID', 27, 79, '', 'FA'], ['Cryin', 'MID', 27, 78],
    ['Photic', 'ADC', 25, 80], ['Light', 'ADC', 26, 79], ['Lwx', 'ADC', 27, 77], ['Jwei', 'SUP', 22, 77], ['fengyue', 'SUP', 23, 78], ['Crisp', 'SUP', 28, 78, '', 'FA'], ['Ming', 'SUP', 28, 78], ['Missing', 'SUP', 25, 79],
    ['Wayward', 'TOP', 25, 77], ['Solokill', 'TOP', 24, 76], ['fearness', 'TOP', 22, 76], ['Invincible', 'TOP', 23, 76], ['Leyan', 'JGL', 25, 77], ['Weiwei', 'JGL', 26, 77], ['Jinjiao', 'JGL', 24, 76], ['Bo', 'JGL', 24, 77],
    ['Shanji', 'MID', 25, 77], ['Huanfeng', 'ADC', 24, 77], ['Able', 'ADC', 24, 76], ['Hang', 'SUP', 26, 77], ['Lvmao', 'SUP', 26, 76], ['Ppgod', 'SUP', 25, 76], ['Iwandy', 'SUP', 25, 76], ['Mark', 'SUP', 27, 76]],
  LEC: [['Empyros', 'TOP', 21, 78], ['Razork', 'JGL', 26, 79], ['Vladi', 'MID', 22, 79], ['Upset', 'ADC', 28, 79], ['Lospa', 'SUP', 22, 77], ['Lot', 'TOP', 23, 76], ['ISMA', 'JGL', 22, 76], ['Jackies', 'MID', 23, 76], ['Noah', 'ADC', 24, 76],
    ['Maynter', 'TOP', 24, 76], ['Rhilech', 'JGL', 24, 76], ['Poby', 'MID', 21, 77], ['Parus', 'SUP', 24, 75], ['Naak Nako', 'TOP', 22, 77], ['Lyncas', 'JGL', 24, 77], ['Humanoid', 'MID', 27, 79], ['Carzzy', 'ADC', 26, 78], ['Fleshy', 'SUP', 24, 77],
    ['Tracyn', 'TOP', 23, 75], ['Sheo', 'JGL', 25, 76], ['Serin', 'MID', 23, 75], ['Ice', 'ADC', 24, 76], ['Stend', 'SUP', 25, 75], ['Rooster', 'TOP', 22, 74], ['Boukada', 'JGL', 22, 74], ['nuc', 'MID', 23, 75], ['Paduck', 'ADC', 24, 75], ['Trymbi', 'SUP', 26, 75],
    ['Wunder', 'TOP', 29, 77], ['Skeanz', 'JGL', 24, 75], ['LIDER', 'MID', 27, 75], ['Jopa', 'ADC', 23, 75], ['Mikyx', 'SUP', 29, 77]],
  LCS: [['DARKWINGS', 'MID', 23, 75], ['Rahel', 'ADC', 23, 75], ['APA', 'MID', 23, 76], ['Zven', 'ADC', 31, 75], ['eXyu', 'JGL', 24, 73], ['Palafox', 'MID', 26, 74], ['FBI', 'ADC', 28, 74],
    ['Gakgos', 'TOP', 22, 75], ['Gryffinn', 'JGL', 23, 75], ['Quad', 'MID', 24, 76], ['Massu', 'ADC', 22, 76], ['Cryogen', 'SUP', 23, 74], ['Zamudo', 'TOP', 24, 74], ['Fudge', 'TOP', 25, 74], ['Contractz', 'JGL', 27, 73],
    ['Zinie', 'MID', 24, 73], ['Bvoy', 'ADC', 28, 73], ['Ceos', 'SUP', 26, 73], ['Castle', 'TOP', 24, 71], ['KryRa', 'JGL', 24, 71], ['Calime', 'MID', 24, 71], ['Sajed', 'ADC', 24, 71], ['Lyonz', 'SUP', 24, 71]],
  LCP: [['Pungyeon', 'MID', 23, 75], ['2247', 'SUP', 24, 74], ['Evi', 'TOP', 27, 73], ['Van', 'JGL', 24, 72], ['Marble', 'ADC', 24, 72], ['Kiaya', 'TOP', 26, 74], ['Draktharr', 'JGL', 24, 73], ['Aress', 'MID', 24, 73], ['Artemis', 'ADC', 24, 74], ['Taki', 'SUP', 24, 72],
    ['Flauren', 'TOP', 23, 72], ['665', 'JGL', 24, 72], ['HongSuo', 'MID', 24, 72], ['Feng', 'ADC', 24, 72], ['ShiauC', 'SUP', 24, 71], ['RayFarky', 'TOP', 25, 71], ['Citrus', 'JGL', 24, 71], ['Keine', 'MID', 24, 71], ['Kakkun', 'ADC', 24, 71],
    ['SofM', 'JGL', 30, 74], ['Shogun', 'ADC', 24, 72], ['Elio', 'SUP', 24, 71], ['Hiro02', 'TOP', 24, 73], ['1Jiang', 'TOP', 24, 70], ['Husha', 'JGL', 24, 70], ['JimieN', 'MID', 24, 70], ['Shunn', 'ADC', 24, 70], ['Orca', 'SUP', 24, 70]],
  CBLOL: [['curty', 'TOP', 24, 71], ['Peach', 'JGL', 24, 71], ['Hauz', 'MID', 24, 71], ['Bao', 'ADC', 24, 71], ['ProDelta', 'SUP', 26, 71], ['Devost', 'TOP', 24, 71], ['Booki', 'JGL', 24, 71], ['Enga', 'MID', 24, 71], ['Ceo', 'ADC', 24, 71], ['TopLop', 'SUP', 24, 71],
    ['xyno', 'TOP', 24, 72], ['Mago', 'MID', 24, 72], ['Bull', 'ADC', 24, 72], ['RedBert', 'SUP', 27, 72], ['Robo', 'TOP', 27, 72], ['CarioK', 'JGL', 26, 72], ['Tinowns', 'MID', 29, 72], ['Marvin', 'ADC', 24, 72], ['Kuri', 'SUP', 24, 71],
    ['fNb', 'TOP', 28, 71], ['DOOM', 'JGL', 24, 71], ['Kaze', 'MID', 24, 71], ['Rabelo', 'ADC', 24, 71], ['frosty', 'SUP', 24, 70], ['Boal', 'TOP', 24, 71], ['Disamis', 'JGL', 24, 71], ['Morttheus', 'ADC', 24, 71], ['Kaiwing', 'SUP', 30, 71], ['Drakehero', 'JGL', 24, 71]],
};
const KR_HOME = { Impact: 'LCS', Huhi: 'LCS', IgNar: 'LCS', Photon: 'LCS', HamBak: 'LCS', Jun: 'LEC', Aria: 'LCP', Vsta: 'LCP', Gaeng: 'LCP', YoungJae: 'CBLOL', Mireu: 'CBLOL' };

/* 챔피언 (이름만 쓴다). 두 번째 값은 성향 태그로, 시즌마다 바뀌는 패치 메타와 맞물린다 */
const CHAMPS = {
  TOP: [['크산테', 'tf'], ['레넥톤', 'lane'], ['제이스', 'lane'], ['아트록스', 'tf'], ['잭스', 'mech'], ['카밀', 'mech'], ['오른', 'macro'], ['럼블', 'tf'], ['나르', 'macro'], ['그웬', 'mech'], ['케넨', 'tf'], ['요릭', 'macro']],
  JGL: [['리 신', 'mech'], ['바이', 'tf'], ['세주아니', 'macro'], ['자르반 4세', 'tf'], ['마오카이', 'macro'], ['비에고', 'mech'], ['니달리', 'mech'], ['신 짜오', 'lane'], ['렉사이', 'lane'], ['스카너', 'macro'], ['킨드레드', 'mech'], ['녹턴', 'tf']],
  MID: [['아리', 'mech'], ['아지르', 'macro'], ['오리아나', 'tf'], ['신드라', 'lane'], ['르블랑', 'mech'], ['아칼리', 'mech'], ['탈리야', 'macro'], ['사일러스', 'lane'], ['요네', 'mech'], ['빅토르', 'lane'], ['트위스티드 페이트', 'macro'], ['갈리오', 'tf']],
  ADC: [['바루스', 'lane'], ['칼리스타', 'lane'], ['이즈리얼', 'mech'], ['자야', 'tf'], ['아펠리오스', 'tf'], ['제리', 'mech'], ['카이사', 'mech'], ['애쉬', 'macro'], ['시비르', 'macro'], ['진', 'macro'], ['루시안', 'lane'], ['코그모', 'tf']],
  SUP: [['노틸러스', 'tf'], ['렐', 'tf'], ['라칸', 'mech'], ['알리스타', 'tf'], ['레오나', 'lane'], ['쓰레쉬', 'mech'], ['브라움', 'macro'], ['카르마', 'lane'], ['룰루', 'macro'], ['바드', 'macro'], ['파이크', 'mech'], ['나미', 'lane']],
};
const TAG_KO = { lane: '라인전형', tf: '한타형', macro: '운영형', mech: '캐리형' };
/* 패치 메타: 시즌마다 하나. 해당 능력치가 자기 평균보다 높은 선수가 더 활약한다 */
const METAS = {
  lane: { name: '라인전 메타', desc: '초반 라인 주도권이 승패를 가르는 패치' },
  tf: { name: '한타 메타', desc: '대규모 교전에 강한 조합이 대세인 패치' },
  macro: { name: '운영 메타', desc: '오브젝트와 시야 싸움이 길게 이어지는 패치' },
  mech: { name: '캐리 메타', desc: '손이 빠른 캐리 챔피언이 판을 치는 패치' },
};
let META = null; // 지금 치르는 시즌의 메타 (경기 계산에서 사용)
function rollMeta(prev) { return pick(Object.keys(METAS).filter(k => k !== prev)); }
function statMean(p) { let s = 0; for (const k of STATS) s += p.st[k]; return s / STATS.length; }
function metaFit(p, m) { const k = m || META; return k ? clamp((p.st[k] - statMean(p)) * 0.1, -1.2, 1.5) : 0; }
function champTag(pos, name) { const c = (CHAMPS[pos] || []).find(x => x[0] === name); return c ? c[1] : null; }
const patchName = w => `${String(w.year).slice(2)}.1`;
/* 받침에 따라 조사를 고른다 (영문·숫자는 한국어 읽기 기준) */
function hasBatchim(word) {
  const s = String(word == null ? '' : word).trim(); if (!s) return false;
  const c = s[s.length - 1], code = c.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) return (code - 0xAC00) % 28 !== 0;
  if (/[0-9]/.test(c)) return '013678'.includes(c);
  if (/[a-zA-Z]/.test(c)) return 'LMNlmn'.includes(c); // Faker(페이커)·Ruler(룰러)처럼 r로 끝나면 받침 없음
  return false;
}
const jo = (word, a, b) => (hasBatchim(word) ? a : b);
function roJ(word) {
  const s = String(word == null ? '' : word).trim(), c = s.charCodeAt(s.length - 1);
  if (c >= 0xAC00 && c <= 0xD7A3) { const j = (c - 0xAC00) % 28; return j === 0 || j === 8 ? '로' : '으로'; }
  return /[MNmn036]$/.test(s) ? '으로' : '로';
}

// 가상 선수 닉네임 (실존 프로게이머 닉네임과 겹치지 않게 고른 단어들)
const HANDLES = ('Aether Arcus Ashen Aurin Basalt Beacon Birch Bramble Cairn Calyx Cinder Cobalt Comet Corvid Crest Cypher Drift Dune Ember Enzo Equinox Fable Fennel Flint Fjord Gale Garnet Glint Gloam Gorse Halcyon Harrow Hexa Holm Iris Jade Juno Kestrel Kindle Koa Lark Lumen Lynx Maple Marrow Mica Mirth Moss Nadir Nimbus Noct Nova Obsid Onyx Orbit Osprey Pebble Pike Plume Prism Pulse Quartz Quill Raven Reed Rime Rook Rune Rust Sable Saga Sage Shale Sierra Sleet Sorrel Spire Sprig Squall Tarn Tempo Thistle Thorn Tide Tinder Topaz Torrent Umbra Vale Vanta Veil Vesper Vigil Wisp Wren Yarrow Yonder Zenith Zephyr Zinc Zola Kairo Leto Miro Oro Pax Remy Sato Taro Vero Wynn Xeno Yuki Aki Bao Dio Ferro Grit Haku Ivo Kenji Lumi Mako Opal Pico Ryo Sora Tobi Ume Vivo Waltz Yeti Zest Argo Coda Dash Glyph Hush Indy Jolt Kite Loom Nook Oath Pyre Quip Rally Snare Tusk Unda Vow Warp Brisk Clove Dusk Fern Gust Hale Inky Kodo Lune Mint Nori Orca Pique Silt Umi Velo Whim Yaro').split(/\s+/);
const HSUF = ['X', 'V', 'Q', '7', 'Jr', '01', '99', 'K', 'O', 'Z'];
const SURN = '김 이 박 최 정 강 조 윤 장 임 한 오 서 신 권 황 안 송 류 홍 전 고 문 양 손 배 백 허 남 노'.split(' ');
const GIVEN = '민준 서준 도윤 예준 시우 하준 주원 지호 지후 준서 준우 현우 도현 건우 우진 선우 연우 유준 정우 승우 승현 시윤 준혁 은우 지환 승민 지훈 민재 윤우 태윤 민성 재윤 하율 이준 서진 태민 동현 성민 한결 지성 태현 재민 상우 영훈 진혁'.split(' ');

/* ---------- 선수 ---------- */
function blank() { return { g: 0, w: 0, k: 0, d: 0, a: 0, rs: 0, pog: 0 }; }
function addStat(s, b, won) { s.g++; if (won) s.w++; s.k += b.k; s.d += b.d; s.a += b.a; s.rs += b.rtg; }
function ovrRaw(p) { const wt = WGT[p.pos]; let s = 0; for (const k of STATS) s += p.st[k] * wt[k]; return s; }
function ovr(p) { return Math.round(ovrRaw(p)); }
function avgR(s) { return s && s.g ? s.rs / s.g : 0; }
function kdaOf(s) { return s && s.g ? (s.k + s.a) / Math.max(1, s.d) : 0; }
function salaryFor(p) { const o = ovrRaw(p); return Math.max(0.3, r1(0.4 + 0.0003 * Math.pow(Math.max(0, o - 50), 3) + p.pop * 0.04)); }
const KR_SYL = ['Ha', 'Jun', 'Seo', 'Min', 'Do', 'Yun', 'Tae', 'Hyun', 'Woo', 'Ji', 'Su', 'Eun', 'Gyu', 'Han', 'Jin', 'Sol', 'Ra', 'On', 'Rim', 'Bin', 'Si', 'Hwa', 'Yeon', 'Gun'];
const CN_A = ['Xiao', 'Jie', 'Ming', 'Hao', 'Yu', 'Tian', 'Lan', 'Feng', 'Chen', 'Bai', 'Long', 'Qing', 'Xin', 'Le', 'Yao', 'Zhi', 'An', 'Rui', 'Kai', 'Mo', 'Wen', 'Shu'];
const CN_B = ['hu', 'ye', 'ming', 'yu', 'fei', 'an', 'xi', 'tian', 'long', 'bo', 'lin', 'ze', 'yi', 'wei', 'chen', 'jun', 'hao'];
function makeHandle(w, nat) {
  const gen = nat === 'CN' ? () => pick(CN_A) + pick(CN_B) : () => (chance(0.65) ? pick(HANDLES) : pick(KR_SYL) + pick(KR_SYL).toLowerCase());
  for (let i = 0; i < 200; i++) { const h = gen(); if (!w.usedH[h]) { w.usedH[h] = 1; return h; } }
  for (;;) { const h = pick(HANDLES) + pick(KR_SYL).toLowerCase(); if (!w.usedH[h]) { w.usedH[h] = 1; return h; } }
}
// 해외 리그에서 뛰는 한국 선수 (국적: 이적 규칙에 쓰인다)
const KR_ABROAD = { TheShy: 1, Rookie: 1, Viper: 1, Tarzan: 1, Kael: 1, BullDoG: 1, Croco: 1, Canna: 1, Kyeahoo: 1, CoreJJ: 1, Berserker: 1, Quid: 1, Thanatos: 1, Morgan: 1, Saint: 1, Karis: 1, Hena: 1, Grizzly: 1, Juhan: 1 };
const natOf = (region, nick) => (nick && KR_ABROAD[nick] ? 'KR' : region === 'LCK' ? 'KR' : region === 'LPL' ? 'CN' : region);
function genPlayer(w, pos, target, age, region, realNick) {
  const p = {
    id: w.nextPid++, nick: realNick || makeHandle(w, natOf(region)), nat: natOf(region, realNick), real: !!realNick, name: realNick ? REAL_NAME[realNick] || '' : region === 'LCK' ? pick(SURN) + pick(GIVEN) : '',
    region, pos, age, st: {}, pot: 0, pop: 0, sal: 0, con: randi(1, 3), tid: null, acad: false, inj: 0, tmp: 0,
    ys: blank(), ls: blank(), cs: blank(), titles: [], awards: [], seed: realNick ? 'r-' + realNick : Math.floor(R() * 1e9).toString(36), debut: null,
  };
  if (realNick) w.usedH[realNick] = 1;
  for (const k of STATS) { const wt = WGT[pos][k]; p.st[k] = target + randn() * 4 + (wt >= 0.25 ? 2 : wt <= 0.05 ? -4 : 0); }
  const diff = target - ovrRaw(p);
  for (const k of STATS) p.st[k] = clamp(p.st[k] + diff, 25, 99);
  const o = ovrRaw(p);
  const head = age <= 18 ? rand(8, 24) : age <= 21 ? rand(3, 12) : age <= 24 ? rand(1, 5) : rand(0, 2);
  p.pot = Math.round(clamp(o + head, o, realNick ? 99 : 92));
  p.pop = realNick && FAME[realNick] ? FAME[realNick] : Math.round(clamp((o - 66) * 2.2 + rand(-5, 8), 0, 95));
  p.sal = salaryFor(p);
  w.P[p.id] = p;
  return p;
}
// 실존 선수 풀에서 한 명을 데려온다. 지금 나이·수준은 2027년 기준값에서 흐른 시간만큼 보정한다
function poolLevel(e, dy) {
  const a0 = e[2];
  return e[3] + (a0 <= 21 ? Math.min(9, dy * 2.2) : a0 <= 24 ? Math.min(3, dy) : 0) - Math.max(0, a0 + dy - 28) * 1.2;
}
function poolPick(w, pos, src, opt) {
  const o = opt || {}, dy = w.year - START_YEAR, c = [];
  for (const k of src) for (const e of POOL_DATA[k] || []) {
    if (w.usedH[e[0]] || (pos && e[1] !== pos)) continue;
    if (o.fa != null && (e[5] === 'FA') !== o.fa) continue;
    const age = e[2] + dy;
    if (age > (o.maxAge || 33) || (o.young && age > 21)) continue;
    c.push({ e, k, age, lv: poolLevel(e, dy) });
  }
  if (!c.length) return null;
  // 필요한 수준에 가까운 선수부터 (약간의 무작위)
  const tg = o.target == null ? 75 : o.target;
  c.forEach(x => { x.sc = Math.abs(x.lv - tg) + rand(0, 3); });
  c.sort((a, b) => a.sc - b.sc);
  const { e, k, age, lv } = c[0];
  const p = genPlayer(w, e[1], lv, age, o.region || (k === 'KR' ? 'LCK' : k === 'CN' ? 'LPL' : k), e[0]);
  p.nat = k === 'KR' ? 'KR' : k === 'CN' ? 'CN' : k;
  p.name = e[4] || REAL_NAME[e[0]] || '';
  p.from = k === 'KR' ? KR_HOME[e[0]] || 'KR' : k; // 어디서 왔는지 (해외 리그 출신이면 'LCS' 등)
  return p;
}
// 빈자리를 채울 새 얼굴: 실존 선수 풀이 먼저, 다 쓰면 가상 선수
function newcomer(w, pos, target, a0, a1, region, opt) {
  const src = region === 'LCK' ? ['KR'] : region === 'LPL' ? ['CN'] : [region];
  return poolPick(w, pos, src, Object.assign({ target, region }, opt || {})) || genPlayer(w, pos, target, randi(a0, a1), region);
}
// 팀의 얼굴: 프랜차이즈 스타가 있으면 그 선수, 없으면 팀에서 가장 이름값 있는 선수 (내가 될 수도 있다)
function teamFace(w, T) {
  if (!T) return null;
  const ro = rosterP(w, T).filter(p => !p.mil);
  const fr = ro.filter(p => FRANCHISE[p.nick] === T.id && !p.isUser).sort((a, b) => b.pop - a.pop)[0];
  if (fr) return fr;
  const top = ro.filter(p => p.real || p.isUser).sort((a, b) => b.pop - a.pop)[0];
  return top && top.pop >= 45 ? top : null;
}
const isFranchise = (p, tid) => !!p && FRANCHISE[p.nick] === (tid || p.tid);

/* ---------- 팀/로스터 ---------- */
const userP = w => w.P[w.user.pid];
const tName = (w, id) => (w.teams[id] ? w.teams[id].name : '-');
const yl = (w, id) => w.yearLog[id] || (w.yearLog[id] = {});
function rosterP(w, T) { return T.roster.map(id => w.P[id]).filter(Boolean); }
function acadP(w, T) { return T.acad.map(id => w.P[id]).filter(Boolean); }
function detach(w, p) {
  const T = p.tid && w.teams[p.tid];
  if (T) { T.roster = T.roster.filter(id => id !== p.id); T.acad = T.acad.filter(id => id !== p.id); for (const k of POS) if (T.lineup[k] === p.id) delete T.lineup[k]; }
  p.tid = null; p.acad = false;
}
function addRoster(w, p, T) { detach(w, p); p.tid = T.id; p.acad = false; T.roster.push(p.id); w.fa = w.fa.filter(id => id !== p.id); }
function addAcad(w, p, T) { detach(w, p); p.tid = T.id; p.acad = true; T.acad.push(p.id); w.fa = w.fa.filter(id => id !== p.id); }
function toFA(w, p) { detach(w, p); if (!w.fa.includes(p.id)) w.fa.push(p.id); p.sal = salaryFor(p); }
function bestAt(w, T, pos, excl) { const c = rosterP(w, T).filter(p => p.pos === pos && p.inj <= 0 && p.id !== excl && !p.mil); c.sort((a, b) => ovrRaw(b) - ovrRaw(a)); return c[0] || null; }
function bestAcadAt(w, T, pos, excl) { const c = acadP(w, T).filter(p => p.pos === pos && p.inj <= 0 && p.id !== excl && !p.isUser); c.sort((a, b) => ovrRaw(b) - ovrRaw(a)); return c[0] || null; }
function anyAt(w, T, pos) { const c = rosterP(w, T).concat(acadP(w, T)).filter(p => p.pos === pos && !p.mil && !p.isUser); c.sort((a, b) => ovrRaw(b) - ovrRaw(a)); return c[0] || null; }
function emergency(w, T, pos) {
  const p = anyAt(w, T, pos); if (p) return p;
  const np = newcomer(w, pos, Math.min(70, T.base - 12), 18, 20, T.region, T.region === 'LCK' ? { young: true } : null); if (T.region === 'LCK') addAcad(w, np, T); else addRoster(w, np, T); return np;
}
function autoLineup(w, T) { return POS.map(pos => bestAt(w, T, pos) || bestAcadAt(w, T, pos) || emergency(w, T, pos)); }
function teamStr(w, T) { return avg(autoLineup(w, T).map(ovrRaw)); }
function userTeamId(w) { const u = w.user && w.P[w.user.pid]; return u && !u.acad && !u.mil ? u.tid : null; }
function lineupFor(w, T) {
  if (T.id === userTeamId(w) && T.userLineup) {
    return POS.map(pos => { const p = w.P[T.lineup[pos]]; return p && p.tid === T.id && !p.acad && p.inj <= 0 ? p : (bestAt(w, T, pos) || bestAcadAt(w, T, pos) || emergency(w, T, pos)); });
  }
  return autoLineup(w, T);
}
// 구단 SNS 포스터 기록 (THANK YOU · WELCOME · CONTRACT EXTENSION · FREE AGENT …). y는 오프시즌을 맞은 시즌 연도
function postOf(w, p, type, tid, extra) {
  w.posts = w.posts || [];
  const o = Object.assign({ id: (w.postSeq = (w.postSeq || 0) + 1), y: w.year, type, tid: tid || null, nick: p.nick, seed: p.seed, pos: p.pos, me: !!p.isUser, ovr: Math.round(ovrRaw(p)), name: p.name || '' }, extra || {});
  w.posts.unshift(o); if (w.posts.length > 60) w.posts.length = 60;
  return o;
}
const NOTABLE = p => p.real || ovrRaw(p) >= 82;
function addNews(w, text) { w.news.unshift({ y: w.year, text }); if (w.news.length > 60) w.news.length = 60; }

/* ---------- 월드 생성 ---------- */
function newWorld() {
  const w = { v: 5, year: START_YEAR, teams: {}, P: {}, fa: [], ids: {}, news: [], hist: [], nextPid: 1, usedH: {}, user: null, phase: 'PRE', rec: {}, yearLog: {}, S: null, meta: rollMeta(null), nextMeta: null, breaking: null };
  // 실존 선수 이름을 먼저 모두 예약해 둔다 (빈자리를 채울 때 풀에서 같은 선수가 두 번 나오지 않게)
  for (const rg in TEAMS_DATA) for (const d of TEAMS_DATA[rg]) for (const r of d[4]) if (r[0]) w.usedH[r[0]] = 1;
  for (const id in ACADEMY_DATA) for (const [, nick] of ACADEMY_DATA[id]) w.usedH[nick] = 1;
  for (const rg in TEAMS_DATA) {
    w.ids[rg] = [];
    for (const [id, name, en, color, roster] of TEAMS_DATA[rg]) {
      const base = avg(roster.map(r => r[1]));
      const T = { id, name, en, color, region: rg, base, base0: base, style: pick(['AGG', 'TF', 'MAC']), roster: [], acad: [], lineup: {}, tw: clamp(60 + (base - 76) * 1.4, 55, 85), titles: {} };
      w.teams[id] = T; w.ids[rg].push(id);
      // 공개 자료로 확인하지 못한 자리(null)도 실존 선수 풀에서 채운다
      roster.forEach((r, i) => { const p = r[0] ? genPlayer(w, POS[i], r[1], r[2], rg, r[0]) : newcomer(w, POS[i], r[1], r[2], r[2], rg); addRoster(w, p, T); p.con = rg === 'LCK' || rg === 'LPL' ? randi(1, 3) : 9; });
      if (rg === 'LCK') {
        for (const [pos, nick] of ACADEMY_DATA[id] || []) { const p = genPlayer(w, pos, randi(64, 73), randi(18, 21), rg, nick); p.pot = Math.round(clamp(ovrRaw(p) + randi(12, 22), 0, 92)); addAcad(w, p, T); }
        for (const pos of POS) if (!acadP(w, T).some(p => p.pos === pos)) addAcad(w, newcomer(w, pos, randi(60, 66), 17, 19, rg, { young: true }), T);
      }
    }
  }
  // 시작부터 무소속인 실존 선수 (FA 시장)
  for (const k of ['KR', 'CN']) for (;;) { const p = poolPick(w, null, [k], { fa: true, target: 78 }); if (!p) break; p.con = 0; w.fa.push(p.id); }
  initFinance(w);
  for (const T of Object.values(w.teams)) for (const p of rosterP(w, T)) p.sal = salaryFor(p);
  for (const p of Object.values(w.P)) if (!p.acad && p.age >= 19) p.debut = START_YEAR - randi(1, Math.max(1, p.age - 18));
  return w;
}

/* ---------- 경기 ---------- */
function perfOf(p) { const sd = clamp(7.5 - (p.st.mental - 50) / 12, 3.5, 9); return ovrRaw(p) + metaFit(p) + randn() * sd + (p.tmp || 0); }
function multinom(n, ws) { const out = ws.map(() => 0); for (let i = 0; i < n; i++) out[wIdx(ws)]++; return out; }
function binom(n, p) { let c = 0; for (let i = 0; i < n; i++) if (R() < p) c++; return c; }
function stratBonus(a, b) { if (a === b) return 0; return BEATS[a] === b ? 1.8 : BEATS[b] === a ? -1.8 : 0; }
function simGame(la, lb, ctx) {
  const pa = la.map(perfOf), pb = lb.map(perfOf), oa = la.map(ovrRaw), ob = lb.map(ovrRaw);
  const diff = (avg(pa) - avg(pb)) * 0.42 + stratBonus(ctx.sa, ctx.sb) + ctx.ba - ctx.bb + randn() * (ctx.big ? 8 : 7);
  const aWin = diff > 0, m = Math.abs(diff), close = clamp(1 - m / 9, 0, 1);
  const dur = Math.round(clamp(35 - m * 0.9 + randn() * 3.5, 21, 48));
  const kw = Math.round(6 + Math.min(m, 10) + rand(0, 6) + dur * 0.12);
  const kl = Math.max(1, Math.round(kw * (0.22 + 0.5 * close) * rand(0.8, 1.15)));
  const K = aWin ? [kw, kl] : [kl, kw], box = [];
  const mk = (lu, perf, ovs, kF, kA, won, side) => {
    const ks = multinom(kF, lu.map((p, i) => KW[p.pos] * Math.max(0.25, 1 + (perf[i] - ovs[i]) / 16)));
    const ds = multinom(kA, lu.map((p, i) => DW[p.pos] * Math.max(0.25, 1 - (perf[i] - ovs[i]) / 16)));
    lu.forEach((p, i) => {
      const a = binom(Math.max(0, kF - ks[i]), AP[p.pos]);
      const kd = clamp((ks[i] + 0.5 * a - 0.8 * ds[i]) / (5 + dur / 10), -1.4, 1.6);
      const rtg = r1(clamp(6 + (perf[i] - ovs[i]) / 5 + (ovs[i] - ctx.rb) / 14 + (won ? 0.75 : -0.75) + kd, 2.5, 10));
      box.push({ pid: p.id, side, k: ks[i], d: ds[i], a, rtg });
    });
  };
  mk(la, pa, oa, K[0], K[1], aWin, 0); mk(lb, pb, ob, K[1], K[0], !aWin, 1);
  return { aWin, dur, kills: K, box };
}
const BIG_KEYS = { LCK_PO: 1, LPL_PO: 1, MSI: 1, WKO: 1 };
const DOMESTIC = { LCK_R12: 1, LCK_R35: 1, LCK_PO: 1, LPL_S1: 1, LPL_S2: 1, LPL_S3: 1, LPL_PO: 1 };
function runSeries(w, A, B, la, lb, bo, comp, rb) {
  const ctx = { sa: chance(0.75) ? A.style : pick(['AGG', 'TF', 'MAC']), sb: chance(0.75) ? B.style : pick(['AGG', 'TF', 'MAC']), ba: (A.tw - 65) / 10, bb: (B.tw - 65) / 10, rb, big: comp === 'WKO' || comp === 'MSI' };
  const need = Math.ceil(bo / 2); let sa = 0, sb = 0; const games = [];
  while (sa < need && sb < need) {
    const g = simGame(la, lb, ctx); games.push(g); if (g.aWin) sa++; else sb++;
    for (const b of g.box) {
      const p = w.P[b.pid]; if (!p) continue;
      const won = (b.side === 0) === g.aWin;
      if (comp === 'CL') { if (p.isUser) addStat(w.S.cl, b, won); continue; }
      addStat(p.ys, b, won); addStat(p.cs, b, won); if (DOMESTIC[comp]) addStat(p.ls, b, won);
      if (p.debut == null && (p.region === 'LCK' || p.region === 'LPL')) p.debut = w.year;
    }
  }
  const aW = sa > sb, side = aW ? 0 : 1, tot = {};
  for (const g of games) for (const b of g.box) if (b.side === side) tot[b.pid] = (tot[b.pid] || 0) + b.rtg;
  const pog = +Object.keys(tot).sort((x, y) => tot[y] - tot[x])[0];
  if (comp !== 'CL' && w.P[pog]) { w.P[pog].ys.pog++; w.P[pog].cs.pog++; if (DOMESTIC[comp]) w.P[pog].ls.pog++; }
  return { a: A.id, b: B.id, bo, games, sa, sb, winner: aW ? A.id : B.id, loser: aW ? B.id : A.id, pog, la: la.map(p => p.id), lb: lb.map(p => p.id) };
}

/* =========================================================
 * 시즌 시뮬레이션 (한 번에 1년)
 * ========================================================= */
const COMP_NAME = { LCKCUP: 'LCK컵', LCK_R12: 'LCK 정규시즌 1~2R', LCK_R35: 'LCK 정규시즌 3~5R', LCK_PO: 'LCK 플레이오프', LPL_S1: 'LPL 스플릿 1', LPL_S2: 'LPL 스플릿 2', LPL_S3: 'LPL 스플릿 3', LPL_PO: 'LPL 지역 결승', MSI: 'MSI', WSW: '롤드컵 스위스 스테이지', WKO: '롤드컵 토너먼트', CL: 'LCK CL (2군)' };
const COMP_MONTH = { LCKCUP: '1월', LPL_S1: '1월', LCK_R12: '4월', LPL_S2: '4월', MSI: '6월', LCK_R35: '7월', LPL_S3: '7월', LCK_PO: '9월', LPL_PO: '9월', WSW: '10월', WKO: '11월' };

function roundRobin(ids) {
  const a = [...ids]; if (a.length % 2) a.push(null);
  const n = a.length, rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const m = [];
    for (let i = 0; i < n / 2; i++) { const x = a[i], y = a[n - 1 - i]; if (x && y) m.push(r % 2 ? [y, x] : [x, y]); }
    rounds.push(m); a.splice(1, 0, a.pop());
  }
  return rounds;
}
function sortStand(st, ids) { return [...ids].sort((a, b) => (st[b].w - st[a].w) || ((st[b].gw - st[b].gl) - (st[a].gw - st[a].gl)) || (R() - 0.5)); }
function newStand(ids) { const st = {}; ids.forEach(id => { st[id] = { w: 0, l: 0, gw: 0, gl: 0 }; }); return st; }
function addRes(st, r) { if (!st[r.a] || !st[r.b]) return; st[r.winner].w++; st[r.loser].l++; st[r.a].gw += r.sa; st[r.a].gl += r.sb; st[r.b].gw += r.sb; st[r.b].gl += r.sa; }

function ev(w, m, text, tone, cast) { const e = { m, text, tone: tone || '' }; if (cast != null) e.cast = cast; w.S.ev.push(e); }
/* 결승 중계: 내 팀이 오른 결승은 세트별 사건 타임라인을 만들어 두고, 시즌 재생 중에 미니맵 중계로 보여 준다 */
const FIN_NAME = { LCKCUP: 'LCK컵 결승', LPL_S1: 'LPL 스플릿 1 결승', LPL_S2: 'LPL 스플릿 2 결승', MSI: 'MSI 결승', LCK_PO: 'LCK 결승', LPL_PO: 'LPL 결승', WKO: '롤드컵 결승' };
const FIN_MONTH = { LCKCUP: '2월', LPL_S1: '2월', LPL_S2: '6월', MSI: '7월', LCK_PO: '9월', LPL_PO: '9월', WKO: '11월' };
const DRAKES = ['바람', '화염', '대지', '바다', '마법공학', '화학공학'];
const LANE_KO = { top: '탑', mid: '미드', bot: '바텀' };
const LOC_KO = { top: '탑', mid: '미드', bot: '바텀', jg0: '블루 정글', jg1: '레드 정글', baron: '바론 둥지', drake: '용 둥지' };
const TOWER_KO = ['1차 포탑', '2차 포탑', '억제기 포탑', '억제기'];
const FEATS = ['폭딜', '완벽한 이니시에이팅', '다중 킬', '슈퍼 세이브', '절묘한 점멸 각', '플래시 궁', '침착한 카이팅'];
// 결승 세트의 밴픽: 내 챔피언은 그 세트에 실제로 꺼낸 챔피언, 나머지는 메타 위주. 한 세트 안에서 겹치지 않는다
function draftPicks(w, r, g) {
  const used = new Set(), out = [[], []];
  if (g.uch) used.add(g.uch);
  [r.la, r.lb].forEach((ids, sd) => ids.forEach((id, i) => {
    const p = w.P[id], pos = POS[i];
    let c = p && p.isUser && g.uch ? g.uch : null;
    if (!c) { const list = CHAMPS[pos].filter(x => !used.has(x[0])), meta = list.filter(x => x[1] === w.meta); c = (meta.length && chance(0.5) ? pick(meta) : pick(list))[0]; }
    used.add(c); out[sd].push(c);
  }));
  return out;
}
/* 결승 세트 타임라인 (미니맵 중계용)
 *  m 경기 시간(분) · s 사건을 만든 진영(0 블루 = r.a, 1 레드 = r.b, -1 중립) · k 종류 · t 해설(빈 문자열이면 지도에만 표시)
 *  loc 위치(top·mid·bot·jg0·jg1·baron·drake·base0·base1) · kills [블루, 레드] · dead 쓰러진 선수 [진영, 포지션 번호]
 *  act 그 자리로 움직이는 선수 · all 양 팀 전원이 모인다. 세트의 킬 수는 경기 결과(g.kills)와 정확히 맞춘다 */
function castEvents(w, r, g, picks) {
  const win = g.aWin ? 0 : 1, lu = [r.la, r.lb], tn = [tName(w, r.a), tName(w, r.b)];
  const P = (sd, i) => w.P[lu[sd][i]];
  const nm = (sd, i) => { const p = P(sd, i); return p ? p.nick : '?'; };
  const who = (sd, i) => `${nm(sd, i)}(${picks[sd][i]})`;
  const whoJ = (sd, i, a, b) => who(sd, i) + jo(picks[sd][i], a, b);
  const bx = sd => g.box.filter(b => b.side === sd);
  const lean = p => (chance(win === 0 ? p : 1 - p) ? 0 : 1);
  const left = [g.kills[0], g.kills[1]];
  const take = (sd, n) => { const k = Math.max(0, Math.min(n, left[sd])); left[sd] -= k; return k; };
  const killer = sd => wIdx(bx(sd).map(b => b.k + 0.6));
  const victims = (sd, n) => { const ws = bx(sd).map(b => b.d + 0.6), out = []; while (out.length < Math.min(n, 5)) { const i = wIdx(ws); if (!out.includes(i)) out.push(i); ws[i] = 0.0001; } return out; };
  const KK = (sd, a, b) => (sd === 0 ? [a, b || 0] : [b || 0, a]);
  const deadOf = (sd, a, b) => victims(1 - sd, a).map(x => [1 - sd, x]).concat(victims(sd, b || 0).map(x => [sd, x]));
  const locOf = (i, sd) => (i === 0 ? 'top' : i === 2 ? 'mid' : i === 1 ? 'jg' + sd : 'bot');
  const opp = i => (i === 3 || i === 4 ? pick([3, 4]) : i === 1 ? pick([0, 2, 3]) : i);
  const out = [], lost = [{ top: 0, mid: 0, bot: 0 }, { top: 0, mid: 0, bot: 0 }];
  const add = (m, e) => { e.m = r1(clamp(m, 0, g.dur)); e.kills = e.kills || [0, 0]; out.push(e); return e; };
  const objAct = sd => [[sd, 1], [sd, 2], [sd, 3], [sd, 4]];
  const tower = (m, sd, lane) => {
    const d = 1 - sd; if (lost[d][lane] >= 4 || m >= g.dur - 0.2) return;
    const tier = lost[d][lane]++;
    add(m, { s: sd, k: 'tower', lane, tier, loc: lane, t: tier ? `${tn[sd]}, ${LANE_KO[lane]} ${TOWER_KO[tier]}까지 밀어낸다` : `${tn[sd]} ${LANE_KO[lane]} ${TOWER_KO[tier]} 파괴`, act: lane === 'top' ? [[sd, 0], [sd, 1]] : lane === 'mid' ? [[sd, 2], [sd, 1]] : [[sd, 3], [sd, 4]] });
  };

  add(0, { s: -1, k: 'note', t: `경기 시작! 블루 진영 ${tn[0]}, 레드 진영 ${tn[1]}` });
  // 라인전: 내가 있는 라인, 아니면 스타가 있는 라인을 먼저 비춘다
  const meI = [0, 1].map(sd => lu[sd].findIndex(id => w.P[id] && w.P[id].isUser));
  let fi = meI[0] >= 0 ? meI[0] : meI[1] >= 0 ? meI[1] : -1;
  if (fi < 0) { let bf = 0; for (const sd of [0, 1]) for (let i = 0; i < 5; i++) { const p = P(sd, i), f = (p && FAME[p.nick]) || 0; if (f > bf) { bf = f; fi = i; } } if (fi < 0) fi = 2; }
  add(rand(1.2, 2), { s: -1, k: 'note', t: fi === 0 ? `탑 ${who(0, 0)} vs ${who(1, 0)}, 초반 라인 주도권 싸움` : fi === 1 ? `정글 ${nm(0, 1)}${jo(nm(0, 1), '과', '와')} ${nm(1, 1)}, 첫 동선 싸움이 시작된다` : fi === 2 ? `미드 ${who(0, 2)} vs ${who(1, 2)}, 팽팽한 라인전` : `바텀 ${nm(0, 3)}·${nm(0, 4)} vs ${nm(1, 3)}·${nm(1, 4)}, 2:2 딜교환` });
  // 퍼스트 블러드
  const fb = lean(0.6), fk = killer(fb), fv = opp(fk), fm = rand(2.5, 5.5);
  const fact = [[fb, fk], [1 - fb, fv]]; if (fk === 1) fact.push([fb, fv]);
  add(fm, { s: fb, k: 'kill', loc: locOf(fv, 1 - fb), kills: KK(fb, take(fb, 1)), dead: [[1 - fb, fv]], act: fact, t: `퍼스트 블러드! ${whoJ(fb, fk, '이', '가')} ${nm(1 - fb, fv)}${jo(nm(1 - fb, fv), '을', '를')} 잡아낸다${fk === 1 ? ' · 갱킹 성공' : ''}` });
  // 오브젝트
  { const s = lean(0.55); add(rand(5.5, 7.5), { s, k: 'obj', loc: 'baron', act: [[s, 0], [s, 1], [s, 2]], t: `${tn[s]} 공허 유충 사냥` }); }
  const dc = [0, 0];
  for (let m = rand(5, 8); m < g.dur - 2 && dc[0] < 4 && dc[1] < 4; m += rand(5, 6.5)) {
    const sd = lean(0.62); dc[sd]++;
    const e = { s: sd, k: 'obj', loc: 'drake', act: objAct(sd), t: `${pick(DRAKES)}의 드래곤 (${tn[sd]} ${dc[sd]}스택)${dc[sd] === 4 ? ' · 드래곤의 영혼!' : ''}` };
    if (m > 10 && chance(0.4)) { const a = take(sd, randi(1, 2)), b = take(1 - sd, randi(0, 1)); if (a + b) { e.all = true; e.kills = KK(sd, a, b); e.dead = deadOf(sd, a, b); e.t += ` · 용 앞 교전 ${a}:${b}`; } }
    add(m, e);
  }
  tower(rand(11, 13.5), lean(0.6), pick(['top', 'bot']));
  { const s = lean(0.6), m = rand(14, 16); add(m, { s, k: 'obj', loc: 'baron', act: [[s, 0], [s, 1], [s, 2]], t: `${tn[s]} 협곡의 전령 획득` }); tower(m + 1.2, s, 'mid'); }
  add(rand(18.5, 20.5), { s: -1, k: 'note', t: pick(['사이드 운영 단계. 양 팀이 시야를 넓혀 간다', `${who(0, 0)}, ${who(1, 0)} 모두 사이드 라인을 밀고 있다`, '중반 운영 싸움. 다음 오브젝트를 두고 신경전']) });
  if (g.dur > 28) add(rand(24.5, 26.5), { s: -1, k: 'note', t: '바론 둥지 앞 대치. 한 번의 실수가 승부를 가른다' });
  // 한타
  for (let i = 0, n = g.dur > 30 ? 3 : 2; i < n; i++) {
    const m = 13 + (g.dur - 16) * (i + rand(0.2, 0.8)) / n, sd = lean(0.64);
    const a = take(sd, randi(2, 4)); if (!a) continue;
    const b = take(1 - sd, randi(0, 1)), c = killer(sd), loc = pick(['mid', 'drake', 'baron', 'jg0', 'jg1']);
    add(m, { s: sd, k: 'tf', loc, all: true, kills: KK(sd, a, b), dead: deadOf(sd, a, b), t: `${LOC_KO[loc]} 한타 ${a}:${b} ${a - b >= 3 ? '대승' : '승리'} — ${who(sd, c)} ${pick(FEATS)}` });
    tower(m + rand(1, 1.8), sd, loc === 'baron' ? 'top' : loc === 'drake' ? 'bot' : pick(['top', 'mid', 'bot']));
  }
  if (g.dur >= 24) { const m = rand(21, Math.min(g.dur - 2, 30)), sd = lean(0.8); add(m, { s: sd, k: 'obj', loc: 'baron', act: [[sd, 0]].concat(objAct(sd)), t: `${tn[sd]} 내셔 남작 처치! 바론 버프` }); tower(m + 1.6, sd, 'mid'); tower(m + 2.6, sd, pick(['top', 'bot'])); }
  if (g.dur >= 34) add(g.dur - rand(2, 4), { s: win, k: 'obj', loc: 'drake', act: objAct(win), t: `${tn[win]} 장로 드래곤 처치` });
  // 스타 선수의 솔로킬 (Faker·Chovy 같은 이름값)
  let stars = 0;
  for (const sd of [0, 1]) for (let i = 0; i < 5; i++) {
    const p = P(sd, i);
    if (!p || p.isUser || stars >= 2 || !(p.real && FAME[p.nick]) || !chance(0.5) || left[sd] < 1) continue;
    const v = i === 1 ? pick([0, 2]) : opp(i); stars++;
    add(rand(7, g.dur - 4), { s: sd, k: 'kill', loc: locOf(v, 1 - sd), kills: KK(sd, take(sd, 1)), dead: [[1 - sd, v]], act: [[sd, i], [1 - sd, v]], t: `${whoJ(sd, i, '이', '가')} ${nm(1 - sd, v)} 솔로킬! ${pick(['역시 이름값을 한다', '클래스는 영원하다', '관중석이 들썩인다'])}` });
  }
  // 내 활약
  for (const sd of [0, 1]) {
    const mi = meI[sd]; if (mi < 0) continue;
    const b = bx(sd)[mi];
    if (b.k >= 4 && left[sd] >= 3) { const n = b.k >= 7 && left[sd] >= 4 ? 4 : 3, loc = pick(['mid', 'drake', 'baron']); add(rand(14, g.dur - 2), { s: sd, k: 'tf', loc, all: true, kills: KK(sd, take(sd, n)), dead: deadOf(sd, n), t: `${nm(sd, mi)} ${n === 4 ? '쿼드라킬!' : '트리플킬!'} ${picks[sd][mi]}${roJ(picks[sd][mi])} 경기장을 뒤집는다` }); }
    else if (b.k >= 1 && left[sd] >= 1) { const v = opp(mi); add(rand(8, g.dur - 3), { s: sd, k: 'kill', loc: locOf(v, 1 - sd), kills: KK(sd, take(sd, 1)), dead: [[1 - sd, v]], act: [[sd, mi], [1 - sd, v]], t: `${whoJ(sd, mi, '이', '가')} ${nm(1 - sd, v)}${jo(nm(1 - sd, v), '을', '를')} 끊어낸다` }); }
  }
  // 남은 킬은 작은 교전으로 (대부분 지도에만 표시)
  for (const sd of [0, 1]) while (left[sd] > 0) {
    const n = Math.min(left[sd], chance(0.72) ? 1 : 2); left[sd] -= n;
    const k = killer(sd), vs = victims(1 - sd, n), loc = n === 1 ? locOf(vs[0], 1 - sd) : pick(['mid', 'jg0', 'jg1', 'top', 'bot']);
    add(rand(Math.max(3, fm + 0.5), g.dur - 1), { s: sd, k: 'kill', loc, kills: KK(sd, n), dead: vs.map(x => [1 - sd, x]), act: [[sd, k]].concat(vs.map(x => [1 - sd, x])), t: chance(0.3) ? `${LOC_KO[loc]}에서 ${whoJ(sd, k, '이', '가')} ${n > 1 ? '더블킬' : '킬을 올린다'}` : '' });
  }
  // 마무리: 억제기를 깨고 넥서스로
  { const lane = pick(['top', 'mid', 'bot']); tower(g.dur - 1.8, win, lane); tower(g.dur - 1.1, win, lane); }
  add(g.dur, { s: win, k: 'nexus', loc: 'base' + (1 - win), all: true, t: `${tn[win]} 넥서스 파괴! 세트를 가져간다` });
  return out.sort((a, b) => a.m - b.m);
}
function castFinal(w, key, r) {
  const t = userTeamId(w); if (!t || (r.a !== t && r.b !== t) || !FIN_NAME[key]) return;
  const S = w.S; S.casts = S.casts || [];
  const lu = ids => ids.map(id => { const p = w.P[id]; return p ? { nick: p.nick, pos: p.pos, ovr: ovr(p), star: !!(p.real && FAME[p.nick]), face: isFranchise(p), me: !!p.isUser, seed: p.seed } : null; });
  const idx = S.casts.length;
  S.casts.push({ key, name: FIN_NAME[key], a: r.a, b: r.b, la: lu(r.la), lb: lu(r.lb), sa: r.sa, sb: r.sb, winner: r.winner, pog: w.P[r.pog] ? w.P[r.pog].nick : '', games: r.games.map(g => { const pk = draftPicks(w, r, g); return { dur: g.dur, kills: g.kills, aWin: g.aWin, picks: pk, ev: castEvents(w, r, g, pk) }; }) });
  ev(w, FIN_MONTH[key], `${FIN_NAME[key]} — ${tName(w, r.a)} vs ${tName(w, r.b)}`, 'cast', idx);
}
function myComp(w, key) { const S = w.S; let c = S.comps.find(x => x.key === key); if (!c) { c = { key, name: COMP_NAME[key], result: '', my: blank(), tid: userP(w).tid }; S.comps.push(c); } return c; }

// 감독의 주전 선택: OVR + 감독 신뢰 + 지난 경기 출전
function coachSelect(w, T) {
  const u = userP(w), U = w.user;
  for (const pos of POS) { const b = bestAt(w, T, pos, u.id); if (b) T.lineup[pos] = b.id; else delete T.lineup[pos]; }
  T.userLineup = true;
  if (u.inj > 0) return 'INJ';
  const rival = bestAt(w, T, u.pos, u.id);
  if (!rival) { T.lineup[u.pos] = u.id; return 'START'; }
  const us = ovrRaw(u) + metaFit(u) + (U.trust - 50) / 6 + (U.lastStart ? 2 : 0) + randn() * 1.5;
  const rs = ovrRaw(rival) + metaFit(rival) + (U.lastStart ? 0 : 2) + randn() * 1.5;
  if (us >= rs) { T.lineup[u.pos] = u.id; return 'START'; }
  return 'BENCH';
}
function growthUnit(p, k) {
  const a = p.age, af = a <= 18 ? 1.3 : a <= 20 ? 1.15 : a <= 22 ? 0.95 : a <= 25 ? 0.65 : a <= 27 ? 0.4 : 0.2;
  return af * clamp((p.pot - p.st[k]) / 14, 0.04, 1.25);
}
const GROW = { pro: [0.26, 0.09], bench: [0.08, 0.025], cl: [0.25, 0.07], amateur: [0.3, 0.09] };
function grow(w, mode, mul) {
  const u = userP(w), U = w.user, f = GROW[mode], m = (mul || 1) * (U.boost || 1);
  for (const k of STATS) { const isF = U.focus.includes(k); u.st[k] = clamp(u.st[k] + (isF ? f[0] : f[1]) * growthUnit(u, k) * rand(0.6, 1.4) * m, 1, 99); }
}

// 함께 뛰는 동료: 포지션마다 가장 많이 호흡을 맞추는 파트너
const DUO = { TOP: 'JGL', JGL: 'MID', MID: 'JGL', ADC: 'SUP', SUP: 'ADC' };
const DUO_KO = { TOP: '탑-정글', JGL: '정글-미드', MID: '미드-정글', ADC: '바텀 듀오', SUP: '바텀 듀오' };
function chemOf(w, p) { return p && w.user.chem ? w.user.chem[p.id] || 0 : 0; }
function duoBonus(w, p) { return p ? clamp((ovrRaw(p) - 82) * 0.035 + Math.min(chemOf(w, p), 3) * 0.12, -0.5, 0.6) : 0; }
// 다음 시즌 예상 라인업 (스토브리그가 끝난 뒤 기준). 내 자리는 주전 우위면 나, 아니면 경쟁자
function projLineup(w, tid, role) {
  const u = userP(w), T = w.teams[tid];
  // 2군 계약이면 실제로 함께 뛸 LCK CL(2군) 동료를 보여 준다. 내 자리는 나
  if (role === 'ACADEMY') return POS.map(pos => (pos === u.pos ? { pos, p: u, me: true } : { pos, p: bestAcadAt(w, T, pos, u.id), duo: DUO[u.pos] === pos }));
  return POS.map(pos => {
    if (pos === u.pos) {
      const rv = bestAt(w, T, pos, u.id);
      return role === 'STARTER' || !rv ? { pos, p: u, me: true } : { pos, p: rv, rival: true };
    }
    return { pos, p: bestAt(w, T, pos, u.id) || bestAcadAt(w, T, pos, u.id), duo: DUO[u.pos] === pos };
  });
}

// 내 선수가 한 세트에 고른 챔피언: 시그니처는 메타와 맞을수록 자주, 나머지는 메타 챔피언 위주
function pickChamp(w) {
  const u = userP(w), U = w.user, list = CHAMPS[u.pos];
  if (U.champ && chance(champTag(u.pos, U.champ) === w.meta ? 0.5 : 0.28)) return U.champ;
  const others = list.filter(c => c[0] !== U.champ), meta = others.filter(c => c[1] === w.meta);
  return (meta.length && chance(0.55) ? pick(meta) : pick(others))[0];
}
function addChamp(w, key, ch, won) {
  const S = w.S, U = w.user;
  for (const m of [S.champs, U.champs]) { const c = m[ch] || (m[ch] = { g: 0, w: 0 }); c.g++; if (won) c.w++; }
  if (key === 'WSW' || key === 'WKO') S.wch[ch] = (S.wch[ch] || 0) + 1;
}

// 내 팀 경기 전후 처리
function series(w, a, b, bo, key) {
  const u = userP(w), U = w.user, A = w.teams[a], B = w.teams[b];
  const mine = userTeamId(w) && (a === u.tid || b === u.tid);
  let sel = null, mate = null;
  if (mine) {
    sel = coachSelect(w, w.teams[u.tid]);
    // 듀오 파트너: 실력과 함께 뛴 시즌 수(호흡)만큼 내 경기력이 오른다
    mate = sel === 'START' ? w.P[w.teams[u.tid].lineup[DUO[u.pos]]] || null : null;
    u.tmp = (U.sigTmp || 0) + duoBonus(w, mate);
  }
  const r = runSeries(w, A, B, lineupFor(w, A), lineupFor(w, B), bo, key, 76);
  if (mine) {
    w.teams[u.tid].userLineup = false;
    const c = myComp(w, key);
    const played = r.la.includes(u.id) || r.lb.includes(u.id);
    if (played && mate) w.S.duo[mate.id] = (w.S.duo[mate.id] || 0) + r.games.length;
    const rts = [];
    for (const g of r.games) for (const bx of g.box) if (bx.pid === u.id) {
      const won = (bx.side === 0) === g.aWin, ch = pickChamp(w);
      g.uch = ch; // 결승 중계에서 이 세트에 꺼낸 챔피언으로 보여 준다
      addStat(c.my, bx, won); addStat(w.S.tot, bx, won); addChamp(w, key, ch, won); rts.push(bx.rtg);
      if (bx.rtg >= 9.3 && chance(0.6)) ev(w, COMP_MONTH[key], `${COMP_NAME[key]} · ${ch}${roJ(ch)} 인생 경기! ${bx.k}/${bx.d}/${bx.a}, 평점 ${bx.rtg}`, 'gold');
    }
    if (r.pog === u.id) { c.my.pog++; w.S.tot.pog++; }
    if (played && BIG_KEYS[key]) {
      const mineA = r.la.includes(u.id), oppIds = mineA ? r.lb : r.la, opp = w.P[oppIds[POS.indexOf(u.pos)]], OT = w.teams[mineA ? r.b : r.a];
      const won = r.winner === u.tid, sc = mineA ? `${r.sa}:${r.sb}` : `${r.sb}:${r.sa}`;
      if (opp && OT) ev(w, COMP_MONTH[key], `${COMP_NAME[key]} vs ${OT.name} · ${POS_KO[u.pos]} 맞대결 ${opp.nick}${opp.real && FAME[opp.nick] ? '(스타)' : ''} — ${sc} ${won ? '승리' : '패배'}, 내 평점 ${avg(rts).toFixed(1)}`, won ? 'good' : 'bad');
    }
    if (played) {
      w.S.started++;
      const ar = avg(rts);
      U.trust = clamp(U.trust + (ar - 6.3) * 4 + (r.winner === u.tid ? 0.8 : -0.4), 0, 100);
      grow(w, 'pro');
      if (!U.everPro) { U.everPro = true; w.S.debut = true; ev(w, COMP_MONTH[key], `1군 데뷔전! ${tName(w, a === u.tid ? b : a)} 상대로 평점 ${ar.toFixed(1)}`, 'gold'); }
      if (r.pog === u.id) { u.pop = clamp(u.pop + 0.8, 0, 100); if (!U.firstPog) { U.firstPog = true; ev(w, COMP_MONTH[key], '프로 첫 POG 선정!', 'gold'); } }
    } else {
      if (sel === 'BENCH') w.S.benched++;
      U.trust = clamp(U.trust + 0.25, 0, 100);
      grow(w, 'bench');
    }
    U.trust += (50 - U.trust) * 0.02;
    U.lastStart = played;
    if (u.inj > 0) u.inj--;
    else if (chance(U.ptSafe ? 0.003 : 0.006)) { u.inj = randi(2, 6); w.S.injuries++; ev(w, COMP_MONTH[key], `손목 부상… ${u.inj}경기 결장`, 'bad'); }
  }
  return r;
}
// 2군(LCK CL) 경기: 내 선수가 2군일 때만 진행
function clDay(w, key) {
  const u = userP(w), U = w.user;
  if (!u.acad || u.mil || !u.tid || w.teams[u.tid].region !== 'LCK') return;
  if (u.inj > 0) { u.inj--; return; }
  const T = w.teams[u.tid], O = w.teams[pick(w.ids.LCK.filter(id => id !== T.id))];
  const la = POS.map(pos => (pos === u.pos ? u : (bestAcadAt(w, T, pos) || emergency(w, T, pos))));
  const lb = POS.map(pos => bestAcadAt(w, O, pos) || emergency(w, O, pos));
  // 2군 듀오와도 호흡이 쌓인다
  const mate = la[POS.indexOf(DUO[u.pos])];
  u.tmp = (U.sigTmp || 0) + (mate ? Math.min(chemOf(w, mate), 3) * 0.12 : 0);
  const r = runSeries(w, { id: T.id, style: T.style, tw: 60 }, { id: O.id, style: O.style, tw: 60 }, la, lb, 3, 'CL', 58);
  if (mate && mate.id) w.S.duo[mate.id] = (w.S.duo[mate.id] || 0) + r.games.length;
  const rts = []; for (const g of r.games) for (const b of g.box) if (b.pid === u.id) rts.push(b.rtg);
  if (r.pog === u.id) w.S.cl.pog++;
  U.trust = clamp(U.trust + (avg(rts) - 6.2) * 3, 0, 100);
  U.trust += (50 - U.trust) * 0.02;
  grow(w, 'cl');
  if (chance(0.004)) { u.inj = randi(2, 4); w.S.injuries++; ev(w, COMP_MONTH[key], `2군 경기 중 부상… ${u.inj}주 결장`, 'bad'); }
  const st = bestAt(w, T, u.pos);
  if (!st || (ovrRaw(u) >= ovrRaw(st) - 5 && U.trust >= 55)) {
    addRoster(w, u, T); w.S.callup = true; U.trust = Math.max(U.trust, 50);
    ev(w, COMP_MONTH[key], `${T.name} 1군 콜업! 이제 주전 경쟁이다`, 'gold');
  }
}
function rrStage(w, region, key, double) {
  const ids = w.ids[region]; let rounds = roundRobin(shuffle([...ids]));
  if (double) rounds = rounds.concat(rounds.map(rd => rd.map(([a, b]) => [b, a])));
  const st = newStand(ids);
  for (const rd of rounds) { for (const [a, b] of rd) addRes(st, series(w, a, b, 3, key)); if (region === 'LCK') clDay(w, key); }
  return st;
}
function koStage(w, key, pairs, bo) {
  let cur = pairs; const place = {}, rounds = []; let final = null;
  for (;;) {
    const lbl = cur.length >= 4 ? '8강' : cur.length === 2 ? '4강' : '결승';
    const res = cur.map(([a, b]) => series(w, a, b, bo, key));
    rounds.push({ lbl, m: res.map(r => ({ a: r.a, b: r.b, sa: r.sa, sb: r.sb, win: r.winner })) });
    if (cur.length === 1) { final = res[0]; place[final.winner] = '우승'; place[final.loser] = '준우승'; castFinal(w, key, final); break; }
    res.forEach(r => { place[r.loser] = lbl; });
    const win = res.map(r => r.winner); cur = [];
    for (let i = 0; i < win.length; i += 2) cur.push([win[i], win[i + 1]]);
  }
  return { champ: final.winner, runner: final.loser, place, final, rounds };
}
function giveTitle(w, tid, label, kind) {
  const T = w.teams[tid]; T.titles[kind] = (T.titles[kind] || 0) + 1;
  for (const p of rosterP(w, T)) if (p.ys.g > 0) p.titles.push({ y: w.year, label, kind });
  const u = userP(w);
  if (u.tid === tid && !u.acad && u.ys.g > 0) { w.S.titles.push(label); w.user.money = r1(w.user.money + ({ worlds: 3, msi: 1.2, lck: 0.4, lpl: 0.4, cup: 0.2 }[kind] || 0)); }
}
function placeMine(w, key, text) { const u = userP(w); const c = w.S.comps.find(x => x.key === key); if (c) c.result = text; }
// 해외 리그(LEC·LCS·LCP·CBLOL)는 결과만 요약 시뮬레이션
function abstractRegions(w, half) {
  w.rr = w.rr || {};
  for (const rg of ['LEC', 'LCS', 'LCP', 'CBLOL']) {
    const sc = w.ids[rg].map(id => ({ id, s: teamStr(w, w.teams[id]) + randn() * 2.5 })).sort((a, b) => b.s - a.s);
    w.rr[rg] = sc.map(x => x.id);
    sc.forEach((x, rank) => {
      const wr = clamp(0.7 - rank * 0.2 + randn() * 0.05, 0.2, 0.9), n = 18;
      for (const p of autoLineup(w, w.teams[x.id])) {
        const rt = clamp(6.1 + (ovrRaw(p) - 78) / 12 + (wr - 0.5) * 1.3 + randn() * 0.2, 4.5, 8.4);
        for (const t of [p.ys, p.cs, p.ls]) { t.g += n; t.w += Math.round(n * wr); t.rs += rt * n; t.k += Math.round(n * KW[p.pos] * 2.4 * (0.6 + wr)); t.d += Math.round(n * DW[p.pos] * 2.2 * (1.4 - wr)); t.a += Math.round(n * AP[p.pos] * 9); }
        const pg = Math.max(0, Math.round(n * wr * 0.2 + randn() * 0.8)); p.ys.pog += pg; p.cs.pog += pg; p.ls.pog += pg;
      }
    });
    if (half === 2) giveTitle(w, sc[0].id, `${w.year} ${rg} 우승`, 'dom');
  }
}

function runSeason(w) {
  const u = userP(w), U = w.user;
  w.rec = {}; w.yearLog = {};
  for (const p of Object.values(w.P)) { p.ys = blank(); p.ls = blank(); p.tmp = 0; }
  if (!w.meta) w.meta = rollMeta(null);
  META = w.meta;
  const S = w.S = { year: w.year, age: u.age, ovr0: ovr(u), st0: Object.assign({}, u.st), tid0: u.tid, acad0: u.acad, comps: [], ev: [], tot: blank(), cl: blank(), started: 0, benched: 0, debut: false, callup: false, titles: [], awards: [], injuries: 0, mil: !!u.mil, amateur: U.stage === 'AMATEUR' || U.stage === 'TRAINEE', lp0: U.lp, meta: w.meta, champs: {}, wch: {}, duo: {} };
  if (!U.chem) U.chem = {};
  if (S.amateur) amateurSeason(w);
  else if (u.mil) ev(w, '1월', '군 복무 중. 부대에서 틈틈이 리그를 챙겨 본다', '');
  else ev(w, '1월', `${u.acad ? tName(w, u.tid) + ' 2군' : tName(w, u.tid)} 소속으로 ${w.year} 시즌 시작`, '');
  if (!u.mil) {
    // 패치 메타와 시그니처 챔피언의 궁합
    const sig = !!U.champ && champTag(u.pos, U.champ) === w.meta, fit = metaFit(u, w.meta);
    U.sigTmp = sig ? 0.5 : 0; u.tmp = U.sigTmp;
    S.sigMeta = sig;
    const note = sig ? `시그니처 ${U.champ}${jo(U.champ, '이', '가')} 메타 픽으로 떠올랐다` : fit >= 0.5 ? `내 ${STAT_KO[w.meta]} 능력치가 빛날 패치` : fit <= -0.5 ? `내 스타일과는 맞지 않는 패치. 적응이 관건이다` : '무난하게 적응할 수 있는 패치';
    ev(w, '1월', `${patchName(w)} 패치 · ${METAS[w.meta].name}. ${note}`, sig || fit >= 0.5 ? 'good' : fit <= -0.5 ? 'bad' : '');
  }

  // 1~3월: LCK컵 · LPL 스플릿 1
  let sn = snap(w);
  const cupSt = rrStage(w, 'LCK', 'LCKCUP', false);
  const cupTop = sortStand(cupSt, w.ids.LCK).slice(0, 4);
  const cup = koStage(w, 'LCKCUP', [[cupTop[0], cupTop[3]], [cupTop[1], cupTop[2]]], 5);
  giveTitle(w, cup.champ, `${w.year} LCK컵 우승`, 'cup'); w.rec.cup = cup.champ;
  const s1 = rrStage(w, 'LPL', 'LPL_S1', false), s1t = sortStand(s1, w.ids.LPL).slice(0, 4);
  const lplA = koStage(w, 'LPL_S1', [[s1t[0], s1t[3]], [s1t[1], s1t[2]]], 5);
  giveTitle(w, lplA.champ, `${w.year} LPL 스플릿 1 우승`, 'lpl');
  stageSummary(w, sn, '2월', { LCK: 'LCK컵', LPL: 'LPL 스플릿 1' });
  stageNote(w, 'LCKCUP', cupSt, cup); stageNote(w, 'LPL_S1', s1, lplA);

  // 4~6월: LCK 1~2R · LPL 스플릿 2 → MSI 진출
  sn = snap(w);
  const r12 = rrStage(w, 'LCK', 'LCK_R12', true);
  const s2 = rrStage(w, 'LPL', 'LPL_S2', false), s2t = sortStand(s2, w.ids.LPL).slice(0, 4);
  const lplB = koStage(w, 'LPL_S2', [[s2t[0], s2t[3]], [s2t[1], s2t[2]]], 5);
  giveTitle(w, lplB.champ, `${w.year} LPL 스플릿 2 우승`, 'lpl');
  stageSummary(w, sn, '6월', { LCK: 'LCK 정규시즌 1~2R', LPL: 'LPL 스플릿 2' });
  stageNote(w, 'LCK_R12', r12, null); stageNote(w, 'LPL_S2', s2, lplB);
  abstractRegions(w, 1);
  const lck12 = sortStand(r12, w.ids.LCK);
  const mscKR = lck12.slice(0, 2), mscCN = [lplB.champ, lplB.runner];
  // 6~7월: MSI
  const msi = koStage(w, 'MSI', [[mscKR[0], w.rr.CBLOL[0]], [mscCN[1], w.rr.LEC[0]], [mscCN[0], w.rr.LCS[0]], [mscKR[1], w.rr.LCP[0]]], 5);
  giveTitle(w, msi.champ, `${w.year} MSI 우승`, 'msi'); w.rec.msi = msi.champ; w.rec.msiMvp = msi.final.pog;
  awardTo(w, msi.final.pog, `${w.year} MSI 결승 MVP`, 'mmvp');
  for (const id in msi.place) yl(w, id).msi = msi.place[id];
  placeMine(w, 'MSI', msi.place[userP(w).tid] || '');
  { const t = userTeamId(w); if (t && msi.place[t]) ev(w, '7월', `MSI ${msi.place[t]}${msi.champ === t ? '! 세계 정상에 섰다' : ''}`, msi.champ === t ? 'gold' : msi.place[t] === '준우승' ? 'good' : ''); }

  // 7~8월: LCK 3~5R · LPL 스플릿 3
  sn = snap(w);
  const r35 = rrStage(w, 'LCK', 'LCK_R35', false);
  const tot = newStand(w.ids.LCK);
  for (const id of w.ids.LCK) for (const k of ['w', 'l', 'gw', 'gl']) tot[id][k] = r12[id][k] + r35[id][k];
  stageNote(w, 'LCK_R35', tot, null);
  const s3 = rrStage(w, 'LPL', 'LPL_S3', false);
  stageSummary(w, sn, '8월', { LCK: 'LCK 정규시즌 3~5R', LPL: 'LPL 스플릿 3' });
  stageNote(w, 'LPL_S3', s3, null);
  // 9월: LCK 플레이오프 (상위 6팀) · LPL 지역 결승 (상위 4팀)
  const sd = sortStand(tot, w.ids.LCK);
  { const u = userP(w); if (u.acad && u.tid && !u.mil) ev(w, '8월', `1군 소식 · ${tName(w, u.tid)} 정규시즌 ${sd.indexOf(u.tid) + 1}위로 마감`, ''); }
  w.lckFinal = sd;
  sd.forEach((id, i) => { yl(w, id).lckRank = i + 1; });
  for (const id of sd.slice(0, 6)) yl(w, id).po = true;
  const q1 = series(w, sd[2], sd[5], 5, 'LCK_PO'), q2 = series(w, sd[3], sd[4], 5, 'LCK_PO');
  const hi = sd.indexOf(q1.winner) < sd.indexOf(q2.winner) ? q1.winner : q2.winner, lo = hi === q1.winner ? q2.winner : q1.winner;
  const sfa = series(w, sd[0], lo, 5, 'LCK_PO'), sfb = series(w, sd[1], hi, 5, 'LCK_PO');
  const fin = series(w, sfa.winner, sfb.winner, 5, 'LCK_PO');
  castFinal(w, 'LCK_PO', fin);
  const lckPlace = { [fin.winner]: '우승', [fin.loser]: '준우승', [sfa.loser]: '3~4위', [sfb.loser]: '3~4위', [q1.loser]: '5~6위', [q2.loser]: '5~6위' };
  giveTitle(w, fin.winner, `${w.year} LCK 우승`, 'lck'); w.rec.lck = fin.winner; w.rec.lckFmvp = fin.pog;
  awardTo(w, fin.pog, `${w.year} LCK 결승 MVP`, 'lfmvp');
  const sfL = [sfa.loser, sfb.loser].sort((a, b) => sd.indexOf(a) - sd.indexOf(b));
  const wKR = [fin.winner, fin.loser, ...sfL];
  { const t = userTeamId(w); if (t && w.teams[t].region === 'LCK') { const pl = lckPlace[t] || `정규시즌 ${sd.indexOf(t) + 1}위 · 플레이오프 탈락`; placeMine(w, 'LCK_PO', pl); if (!w.S.comps.find(c => c.key === 'LCK_PO')) { const c = myComp(w, 'LCK_PO'); c.result = pl; } ev(w, '9월', lckPlace[t] === '우승' ? 'LCK 우승! 트로피를 들어 올렸다' : lckPlace[t] ? `LCK 플레이오프 ${lckPlace[t]}` : `정규시즌 ${sd.indexOf(t) + 1}위로 플레이오프 진출 실패`, lckPlace[t] === '우승' ? 'gold' : lckPlace[t] ? 'good' : 'bad'); } }
  const s3t = sortStand(s3, w.ids.LPL).slice(0, 4);
  const lplC = koStage(w, 'LPL_PO', [[s3t[0], s3t[3]], [s3t[1], s3t[2]]], 5);
  giveTitle(w, lplC.champ, `${w.year} LPL 우승`, 'lpl'); w.rec.lpl = lplC.champ;
  const lsf = Object.keys(lplC.place).filter(id => lplC.place[id] === '4강').sort((a, b) => s3t.indexOf(a) - s3t.indexOf(b));
  const wCN = [lplC.champ, lplC.runner, ...lsf];
  { const t = userTeamId(w); if (t && w.teams[t].region === 'LPL') { const pl = lplC.place[t] || '진출 실패'; const c = myComp(w, 'LPL_PO'); c.result = pl; ev(w, '9월', lplC.champ === t ? 'LPL 우승!' : lplC.place[t] ? `LPL 지역 결승 ${pl}` : 'LPL 지역 결승 진출 실패', lplC.champ === t ? 'gold' : ''); } }

  // 아시안게임 (4년마다, 게임 속 일정)
  asianGames(w);

  // 10~11월: 롤드컵
  sn = snap(w);
  abstractRegions(w, 2);
  const wt = [...wKR, ...wCN, ...w.rr.LEC.slice(0, 3), ...w.rr.LCS.slice(0, 2), ...w.rr.LCP.slice(0, 2), w.rr.CBLOL[0]];
  for (const id of wt) yl(w, id).wp = '스위스 스테이지';
  { const t = userTeamId(w); if (t) ev(w, '10월', wt.includes(t) ? '롤드컵 진출 확정! 꿈의 무대로' : '롤드컵 진출 실패… 집에서 지켜본다', wt.includes(t) ? 'good' : 'bad'); }
  const sw = swissStage(w, wt);
  const ad = sw.adv;
  const wko = koStage(w, 'WKO', [[ad[0], ad[7]], [ad[3], ad[4]], [ad[1], ad[6]], [ad[2], ad[5]]], 5);
  for (const id in wko.place) yl(w, id).wp = wko.place[id];
  for (const id of wt) if (!wko.place[id]) { const r = sw.rec[id]; yl(w, id).wp = `스위스 ${r.w}승 ${r.l}패`; }
  giveTitle(w, wko.champ, `${w.year} 롤드컵 우승`, 'worlds'); w.rec.worlds = wko.champ; w.rec.wFmvp = wko.final.pog; w.rec.wRunner = wko.runner;
  awardTo(w, wko.final.pog, `${w.year} 롤드컵 결승 MVP`, 'fmvp');
  { const t = userTeamId(w); if (t && wt.includes(t)) { const pl = yl(w, t).wp; placeMine(w, 'WKO', pl); ev(w, '11월', wko.champ === t ? '롤드컵 우승!! 소환사컵을 들어 올렸다' : `롤드컵 ${pl}`, wko.champ === t ? 'gold' : wko.place[t] ? 'good' : ''); } }

  if (S.tot.g - sn.g > 0) stageSummary(w, sn, '11월', { LCK: '롤드컵', LPL: '롤드컵' });
  // 12월: 시상식
  computeAwards(w);
  { const u = userP(w), A = w.awards; if (A.userRank && A.userRank <= 10) ev(w, '12월', `올해의 선수 ${A.userRank}위${A.userRank === 1 ? '! 세계 최고의 선수로 뽑혔다' : ''}`, A.userRank === 1 ? 'gold' : 'good'); for (const a of S.awards) if (!/올해의 선수/.test(a)) ev(w, '12월', `${a} 수상`, 'gold'); }
  finishSeason(w);
  return S;
}
// 구간별 내 출전 요약 (시즌 재생에 흐르는 하이라이트)
function snap(w) { const S = w.S; return { g: S.tot.g, rs: S.tot.rs, pog: S.tot.pog, cl: S.cl.g, clrs: S.cl.rs, clpog: S.cl.pog, bench: S.benched }; }
function stageSummary(w, sn, month, names) {
  const u = userP(w), S = w.S;
  if (!u.tid || u.mil || w.user.stage === 'AMATEUR') return;
  const name = names[w.teams[u.tid].region] || names.LCK;
  const g = S.tot.g - sn.g, cl = S.cl.g - sn.cl, bench = S.benched - sn.bench;
  if (g > 0) { const a = (S.tot.rs - sn.rs) / g, pg = S.tot.pog - sn.pog; ev(w, month, `${name} · ${g}세트 출전, 평균 평점 ${a.toFixed(2)}${pg ? ` · POG ${pg}회` : ''}`, a >= 7.3 ? 'good' : a < 6 ? 'bad' : ''); }
  else if (cl > 0) { const a = (S.cl.rs - sn.clrs) / cl, pg = S.cl.pog - sn.clpog; ev(w, month, `LCK CL · ${cl}세트, 평균 평점 ${a.toFixed(2)}${pg ? ` · POG ${pg}회` : ''}`, a >= 7 ? 'good' : ''); }
  else if (bench > 0) ev(w, month, `${name} · 벤치에서 ${bench}경기를 지켜봤다`, 'bad');
}
function teamNews(w, key, st, ko) {
  const u = userP(w); if (!u.acad || !u.tid || u.mil) return;
  const T = w.teams[u.tid]; if (!st[T.id]) return;
  const rank = sortStand(st, w.ids[T.region]).indexOf(T.id) + 1;
  const res = ko && ko.place[T.id] ? ko.place[T.id] : `${rank}위`;
  ev(w, COMP_MONTH[key] === '1월' ? '2월' : COMP_MONTH[key] === '4월' ? '6월' : '8월', `1군 소식 · ${T.name} ${COMP_NAME[key]} ${res}`, ko && ko.champ === T.id ? 'good' : '');
}
function stageNote(w, key, st, ko) {
  teamNews(w, key, st, ko);
  const t = userTeamId(w); if (!t) return;
  const c = w.S.comps.find(x => x.key === key); if (!c) return;
  const T = w.teams[t]; if (!st[t]) return;
  const ids = w.ids[T.region], rank = sortStand(st, ids).indexOf(t) + 1;
  c.result = ko ? (ko.place[t] || `${rank}위`) : `${rank}위 (${st[t].w}승 ${st[t].l}패)`;
  if (ko && ko.champ === t) ev(w, COMP_MONTH[key] === '1월' ? '2월' : '6월', `${COMP_NAME[key]} 우승!`, 'gold');
  else if (ko && ko.place[t]) ev(w, COMP_MONTH[key] === '1월' ? '2월' : '6월', `${COMP_NAME[key]} ${ko.place[t]}`, ko.place[t] === '준우승' ? 'good' : '');
  else if (key === 'LCK_R12') ev(w, '6월', `정규시즌 1~2R ${rank}위${rank <= 2 ? ' — MSI 진출!' : ''}`, rank <= 2 ? 'good' : '');
}
function swissStage(w, teams) {
  const rec = {}; teams.forEach(id => { rec[id] = { w: 0, l: 0, opp: [] }; });
  for (let round = 0; round < 5; round++) {
    const act = teams.filter(id => rec[id].w < 3 && rec[id].l < 3); if (!act.length) break;
    const groups = {};
    act.forEach(id => { const k = rec[id].w + '-' + rec[id].l; (groups[k] = groups[k] || []).push(id); });
    for (const k in groups) {
      const g = shuffle(groups[k]);
      while (g.length >= 2) {
        const a = g.shift(); let j = g.findIndex(b => !rec[a].opp.includes(b) && (round > 0 || w.teams[b].region !== w.teams[a].region)); if (j < 0) j = 0;
        const b = g.splice(j, 1)[0];
        const bo = rec[a].w === 2 || rec[a].l === 2 ? 3 : 1;
        const r = series(w, a, b, bo, 'WSW');
        rec[r.winner].w++; rec[r.loser].l++; rec[a].opp.push(b); rec[b].opp.push(a);
      }
    }
  }
  const adv = teams.filter(id => rec[id].w >= 3).sort((a, b) => rec[a].l - rec[b].l || (R() - 0.5));
  const t = userTeamId(w);
  if (t && rec[t]) { const c = w.S.comps.find(x => x.key === 'WSW'); if (c) c.result = `${rec[t].w}승 ${rec[t].l}패${rec[t].w >= 3 ? ' · 8강 진출' : ' · 탈락'}`; }
  return { adv, rec };
}
function awardTo(w, pid, label, kind) {
  const p = w.P[pid]; if (!p) return;
  p.awards.push({ y: w.year, label, kind });
  if (p.isUser) w.S.awards.push(label);
}

/* 아시안게임 (2030·2034… 게임 속 가정 일정): 금메달이면 병역 면제 */
function asianGames(w) {
  if ((w.year - 2026) % 4 !== 0) return;
  const u = userP(w), U = w.user;
  if (u.mil || u.acad || !u.tid || U.stage === 'AMATEUR') return;
  const pool = Object.values(w.P).filter(p => p.region === 'LCK' && p.tid && !p.acad && p.pos === u.pos && !p.mil);
  pool.sort((a, b) => ovrRaw(b) - ovrRaw(a));
  if (!pool.slice(0, 1).includes(u) && !(pool[1] === u && ovrRaw(u) >= ovrRaw(pool[0]) - 1)) { ev(w, '9월', '아시안게임 국가대표 명단에 들지 못했다', ''); return; }
  w.S.national = true;
  if (chance(0.68)) { U.exempt = true; w.S.titles.push(`${w.year} 아시안게임 금메달`); u.titles.push({ y: w.year, label: `${w.year} 아시안게임 금메달`, kind: 'ag' }); u.pop = clamp(u.pop + 6, 0, 100); ev(w, '9월', '아시안게임 금메달! 병역 혜택까지 얻었다', 'gold'); }
  else ev(w, '9월', '아시안게임 국가대표로 출전했지만 금메달은 놓쳤다', 'bad');
}

/* 아마추어(16세) 시즌: 솔랭과 아마추어 대회 */
function amateurSeason(w) {
  const u = userP(w), U = w.user, S = w.S, trainee = U.stage === 'TRAINEE', TT = trainee ? w.teams[U.trainee] : null;
  const grade = ['고1', '고2', '고3', '스무 살', '스물한 살'][Math.min(4, u.age - 16)];
  if (trainee) ev(w, '1월', `${TT.name} 아카데미 연습생으로 새 시즌을 시작했다`, '');
  else ev(w, '1월', `${grade}, 솔로랭크 ${lpTier(U.lp)}에서 시즌을 시작했다${U.prep ? ' · 사설 아카데미 수업도 함께' : ''}`, '');
  const gm = (trainee ? 1.35 : 1) * (U.prep ? 1.15 : 1);
  for (let i = 0; i < 22; i++) {
    grow(w, 'amateur', gm);
    U.lp = Math.max(0, Math.round(U.lp + (lpTarget(u) - U.lp) * 0.12 + rand(-30, 40)));
  }
  const t = lpTier(U.lp);
  ev(w, '4월', `솔랭 ${t} 달성${lpRank(U.lp) ? ` · 한국 서버 ${lpRank(U.lp)}위` : ''}`, U.lp >= 900 ? 'gold' : 'good');
  const o = ovrRaw(u) + rand(-2, 2) + (trainee ? 2 : 0);
  const cup = o >= 60 ? '우승' : o >= 56 ? '준우승' : o >= 52 ? '4강' : '8강';
  S.comps.push({ key: 'AMA', name: trainee ? 'LCK 아카데미 시리즈' : '스쿨리그·아마추어 대회', result: cup, my: blank(), amateur: true, tid: trainee ? TT.id : null });
  ev(w, '8월', `${trainee ? 'LCK 아카데미 시리즈' : '아마추어 대회'} ${cup}${cup === '우승' ? '! 프로팀 스카우터들의 눈에 띄었다' : ''}`, cup === '우승' ? 'gold' : '');
  S.amaCup = cup;
  ev(w, '11월', trainee ? '코치진이 2군 승격을 두고 회의를 시작했다' : lpRank(U.lp) ? '랭킹 페이지를 본 프로팀들에게서 DM이 오기 시작했다' : '입단 테스트 공고가 하나둘 올라오기 시작했다', 'good');
  U.money = r1(U.money + (cup === '우승' ? 0.05 : 0.01));
}
function lpTier(lp) { return lp >= 900 ? '챌린저' : lp >= 550 ? '그랜드마스터' : lp >= 250 ? '마스터' : '다이아몬드'; }
function lpRank(lp) { return lp >= 900 ? Math.max(1, Math.round(300 * Math.exp(-(lp - 900) / 120))) : null; }
function lpTarget(u) { return 200 + (u.st.mech * 0.5 + u.st.lane * 0.3 + u.st.pool * 0.2 - 45) * 35; }

/* ---------- 시상 ---------- */
const TITLE_PTS = { cup: 3, lck: 9, lpl: 4, dom: 5, msi: 10, worlds: 20, ag: 2 };
const AWARD_PTS = { mvp: 7, fmvp: 8, mmvp: 4, lfmvp: 3, allpro: 3 };
function gmScore(w, p) {
  const s = p.ys; if (s.g < 10) return -99;
  let x = (avgR(s) - 6) * 20 + s.pog * 0.45 + (s.w / s.g) * 8;
  for (const t of p.titles) if (t.y === w.year) x += TITLE_PTS[t.kind] || 0;
  const L = p.tid ? w.yearLog[p.tid] : null;
  if (L && L.wp) x += ({ '준우승': 10, '4강': 5, '8강': 2 })[L.wp] || 0;
  for (const a of p.awards) if (a.y === w.year) x += AWARD_PTS[a.kind] || 0;
  return r1(x);
}
function computeAwards(w) {
  const A = { year: w.year, lck: {}, gm: [], userRank: null };
  const sc = p => avgR(p.ls) * 10 + p.ls.pog * 1.2 + (p.ls.w / p.ls.g) * 8;
  for (const rg of ['LCK', 'LPL']) {
    const pool = Object.values(w.P).filter(p => p.tid && !p.acad && w.teams[p.tid].region === rg && p.ls.g >= 20).sort((a, b) => sc(b) - sc(a));
    if (pool[0]) { awardTo(w, pool[0].id, `${w.year} ${rg} 정규시즌 MVP`, 'mvp'); A[rg + 'mvp'] = pool[0].id; }
    if (rg === 'LCK') {
      A.allPro = {};
      for (const pos of POS) { const c = pool.find(p => p.pos === pos); if (c) { A.allPro[pos] = c.id; awardTo(w, c.id, `${w.year} 올-LCK 퍼스트 팀`, 'allpro'); } }
      const rk = pool.filter(p => p.debut === w.year)[0];
      if (rk) { A.rookie = rk.id; awardTo(w, rk.id, `${w.year} LCK 신인상`, 'rookie'); }
    }
  }
  const all = Object.values(w.P).filter(p => p.tid && p.ys.g >= 10).map(p => ({ id: p.id, s: gmScore(w, p) })).sort((a, b) => b.s - a.s);
  // 시상 시점 정보로 저장 (오프시즌 이적·은퇴 뒤에도 그대로 보이도록)
  A.gm = all.slice(0, 10).map(x => { const p = w.P[x.id]; return { id: x.id, s: x.s, nick: p.nick, seed: p.seed, tid: p.tid, color: w.teams[p.tid].color, avg: r2(avgR(p.ys)) }; });
  if (A.gm[0]) awardTo(w, A.gm[0].id, `${w.year} 올해의 선수`, 'poy');
  const ui = all.findIndex(x => x.id === w.user.pid);
  if (ui >= 0) A.userRank = ui + 1;
  w.awards = A;
  const nt = id => { const p = w.P[id]; return p ? `${p.nick} (${tName(w, p.tid)})` : '-'; };
  w.hist.unshift({ y: w.year, worlds: tName(w, w.rec.worlds), wRunner: tName(w, w.rec.wRunner), wFmvp: nt(w.rec.wFmvp), msi: tName(w, w.rec.msi), lck: tName(w, w.rec.lck), cup: tName(w, w.rec.cup), lpl: tName(w, w.rec.lpl), poy: A.gm[0] ? nt(A.gm[0].id) : '-', poyUser: A.gm[0] && A.gm[0].id === w.user.pid });
  if (w.hist.length > 40) w.hist.length = 40;
}

/* ---------- 시즌 종료: 기록·반응·오프시즌 준비 ---------- */
function finishSeason(w) {
  const u = userP(w), U = w.user, S = w.S;
  S.ovr1 = ovr(u); S.st1 = Object.assign({}, u.st); S.gmRank = w.awards.userRank;
  S.poy = w.awards.gm[0] && w.awards.gm[0].id === u.id;
  S.role = U.stage === 'TRAINEE' ? '아카데미 연습생' : U.stage === 'AMATEUR' ? (U.prep ? '아마추어 · 학원' : '아마추어') : u.mil ? '군 복무' : S.acad0 && !S.callup ? '2군' : S.tot.g >= 25 ? '주전' : S.tot.g > 0 ? '1군 로테이션' : '1군 벤치';
  S.team = u.mil ? '군 복무' : u.tid ? tName(w, u.tid) + (u.acad ? ' 2군' : '') : U.stage === 'TRAINEE' ? tName(w, U.trainee) + ' 아카데미' : '아마추어';
  // 인기
  if (S.tot.g) u.pop = clamp(u.pop + S.tot.g * 0.05 + S.tot.pog * 0.4 + S.titles.length * 3 + (S.poy ? 10 : 0) + (avgR(S.tot) - 6.5) * 2, 0, 100);
  else if (S.cl.g) u.pop = clamp(u.pop + 0.8, 0, 100);
  else if (S.amateur) u.pop = clamp(u.pop + (U.lp >= 900 ? 4 : 1), 0, 100);
  // 가장 많이 함께 뛴 듀오와 호흡이 한 시즌 쌓인다
  const dk = Object.keys(S.duo).sort((a, b) => S.duo[b] - S.duo[a])[0];
  if (dk && S.duo[dk] >= 15 && w.P[dk]) {
    U.chem[dk] = (U.chem[dk] || 0) + 1;
    const p = w.P[dk];
    S.duoTop = { id: p.id, nick: p.nick, seed: p.seed, g: S.duo[dk], chem: U.chem[dk], ovr: ovr(p) };
    ev(w, '11월', `${DUO_KO[u.pos]} ${p.nick}${jo(p.nick, '과', '와')} ${S.duo[dk]}세트 호흡 · 함께한 지 ${U.chem[dk]}시즌`, U.chem[dk] >= 2 ? 'good' : '');
  }
  // 팀의 얼굴: 프랜차이즈 스타가 없는 팀에서 가장 이름값 있는 선수가 되면
  { const T = u.tid && !u.acad && !u.mil ? w.teams[u.tid] : null; if (T && teamFace(w, T) === u && U.faceOf !== T.id) { U.faceOf = T.id; ev(w, '12월', `${T.name}의 얼굴이 됐다. 구단 시즌권 포스터 한가운데에 내 사진이 걸렸다`, 'gold'); } }
  S.ev.sort((a, b) => parseInt(a.m, 10) - parseInt(b.m, 10));
  if (!S.amateur) U.lp = Math.max(0, Math.round(U.lp + ((u.mil ? 300 : lpTarget(u)) - U.lp) * 0.5 + rand(-40, 40)));
  S.champTop = Object.keys(S.champs).map(n => ({ n, g: S.champs[n].g, w: S.champs[n].w })).sort((a, b) => b.g - a.g).slice(0, 3);
  // 롤드컵 우승: 롤드컵에서 꺼낸 챔피언 중 하나로 우승 스킨을 만든다
  if (S.titles.some(t => t.includes('롤드컵 우승')) && Object.keys(S.wch).length) {
    const opts = Object.keys(S.wch).sort((a, b) => S.wch[b] - S.wch[a]).slice(0, 3);
    if (U.champ && !opts.includes(U.champ)) opts.push(U.champ);
    U.skinPending = { y: S.year, tid: u.tid, opts, games: Object.assign({}, S.wch) };
  }
  w.nextMeta = rollMeta(w.meta);
  S.moment = pickMoment(w);
  S.reactions = makeReactions(w);
  U.reactions = S.reactions.concat(U.reactions || []).slice(0, 80);
  U.hist.push({
    y: S.year, age: S.age, team: S.team, tid: u.mil ? null : u.tid, role: S.role, ovr0: S.ovr0, ovr: S.ovr1, g: S.tot.g, avg: S.tot.g ? r2(avgR(S.tot)) : 0, pog: S.tot.pog, kda: S.tot.g ? r2(kdaOf(S.tot)) : 0,
    clg: S.cl.g, clavg: S.cl.g ? r2(avgR(S.cl)) : 0, titles: S.titles.slice(), awards: S.awards.slice(), gmRank: S.gmRank,
    meta: S.meta, champ: S.champTop[0] ? S.champTop[0].n : null, duo: S.duoTop ? S.duoTop.nick : null,
  });
  U.boost = 1; U.ptSafe = false;
  w.phase = 'OFF';
  seasonFinance(w);
  offseasonWorld(w);
  aiFill(w);
  makeBreaking(w);
  makeTasks(w);
}

/* ---------- 오프시즌 (NPC) ---------- */
function develop(p) {
  const a = p.age, fr = !!FRANCHISE[p.nick], famous = p.real && (FAME[p.nick] || ovrRaw(p) >= 86);
  for (const k of STATS) {
    let d = a <= 19 ? rand(2, 6) : a <= 22 ? rand(1, 4.5) : a <= 24 ? rand(0, 2.5) : a <= 26 ? rand(-1, 1.5) : a <= 28 ? rand(-1.8, 0.8) : rand(-3.5, 0.5);
    if ((k === 'macro' || k === 'mental') && a >= 24) d += 0.8;
    if (k === 'mech' && a >= 26) d -= 0.8;
    if (d > 0) d *= clamp((p.pot - p.st[k]) / 12, 0, 1.3) * (p.region === 'LCK' || p.region === 'LPL' ? 1 : 0.7);
    // 실존 선수는 기량을 더 오래 지킨다: 시간이 흘러도 아는 얼굴이 리그에 남도록
    else if (fr) d *= a >= 33 ? 0.55 : 0.3;
    else if (famous) d *= a >= 31 ? 0.6 : 0.35;
    else if (p.real) d *= a >= 32 ? 0.7 : 0.45;
    p.st[k] = clamp(p.st[k] + d, 20, 99);
  }
}
function userAge(p) {
  const a = p.age;
  for (const k of STATS) {
    let d = a <= 20 ? rand(0, 1.2) * clamp((p.pot - p.st[k]) / 14, 0, 1) : 0;
    if (a >= 26) d -= rand(0, (a - 25) * 0.9) * (k === 'mech' || k === 'lane' ? 1.2 : k === 'macro' || k === 'mental' ? 0.2 : 0.7);
    if (a >= 24 && (k === 'macro' || k === 'mental')) d += rand(0, 1);
    p.st[k] = clamp(p.st[k] + d, 20, 99);
  }
}
function offseasonWorld(w) {
  const all = Object.values(w.P);
  for (const p of all) {
    p.age++;
    if (p.isUser) userAge(p); else develop(p);
    p.con--; p.inj = 0;
  }
  for (const p of all) {
    if (p.isUser) continue;
    const o = ovrRaw(p);
    let pr = p.age >= 34 ? 0.85 : p.age >= 32 ? 0.5 : p.age >= 30 ? 0.22 : p.age >= 29 ? 0.08 : 0;
    if (o >= 85) pr *= 0.35; // 기량이 남아 있는 스타는 쉽게 은퇴하지 않는다
    if (FRANCHISE[p.nick]) pr *= p.age < 34 ? 0.15 : 0.45; // 팀의 얼굴은 30대 중반까지 뛴다
    else if (FAME[p.nick] && p.age < 35) pr *= 0.25;
    else if (p.real) pr *= p.age < 33 ? 0.12 : 0.4;
    if (p.age >= 37) pr = 1; // 서른일곱이면 누구든 마우스를 내려놓는다
    if (o < 62 && p.age >= 23) pr += p.real ? 0.15 : 0.35;
    if (!p.tid && p.age >= 25) pr += p.real ? 0.12 : 0.3;
    if (chance(pr)) {
      if (p.real || o >= 82) {
        addNews(w, `${p.nick}${p.tid ? ` (${tName(w, p.tid)})` : ''} 은퇴`);
        if (p.tid && !p.acad) postOf(w, p, 'retire', p.tid);
        if (!p.acad) bigNews(w, 'retire', p, p.tid || p.lastTid || null, null, { years: p.debut ? w.year - p.debut + 1 : 0 });
      }
      detach(w, p); w.fa = w.fa.filter(id => id !== p.id); delete w.P[p.id];
    }
  }
  contractDecisions(w);
  // 해외 리그 빈자리: 그 리그의 실존 선수부터
  for (const rg of ['LEC', 'LCS', 'LCP', 'CBLOL']) for (const id of w.ids[rg]) {
    const T = w.teams[id];
    for (const p of rosterP(w, T)) p.con = 9;
    for (const pos of POS) if (!rosterP(w, T).some(p => p.pos === pos)) { const p = newcomer(w, pos, T.base0 - 1 + randn() * 2, 19, 23, rg); addRoster(w, p, T); p.con = 9; }
  }
  // 유망주·베테랑 공급 (LCK CL·LDL·해외 리그 출신): 리그 수준이 세대교체 뒤에도 유지되도록.
  // 실존 선수 풀에서 먼저 데려오고, 리그 전체 전력이 목표보다 낮아지면 그만큼 더 공급한다
  const lack = rg => Math.max(0, Math.round((REGION_TARGET[rg] - avg(w.ids[rg].map(id => teamStr(w, w.teams[id])))) * 2.5));
  for (const rg of ['LCK', 'LPL']) for (let i = 0, n = (rg === 'LCK' ? 1 : 2) + Math.min(6, lack(rg)); i < n; i++) {
    const tg = REGION_TARGET[rg] - randi(6, 12);
    let p = poolPick(w, null, [rg === 'LCK' ? 'KR' : 'CN'], { target: tg, region: rg });
    if (!p) { p = genPlayer(w, POS[randi(0, 4)], tg - 2, randi(18, 21), rg); p.pot = Math.round(clamp(ovrRaw(p) + randi(5, 13), 0, 90)); }
    p.con = 0; w.fa.push(p.id);
  }
  for (const id of w.ids.LCK) { const T = w.teams[id]; for (const pos of POS) if (!acadP(w, T).some(p => p.pos === pos && !p.isUser) && !w.fa.some(i => w.P[i] && w.P[i].acadOf === T.id && w.P[i].pos === pos)) { const p = newcomer(w, pos, randi(56, 64), 17, 18, 'LCK', { young: true }); if (!p.real) p.pot = Math.round(clamp(ovrRaw(p) + randi(10, 24), 0, 90)); addAcad(w, p, T); } }
  // FA 명단이 넘치면 가상 선수부터 정리한다 (실존 선수는 시장에 더 오래 남는다)
  if (w.fa.length > 70) { const s = w.fa.map(id => w.P[id]).filter(Boolean).sort((a, b) => (b.real - a.real) || (ovrRaw(b) - ovrRaw(a))); for (const p of s.slice(70)) { w.fa = w.fa.filter(id => id !== p.id); delete w.P[p.id]; } }
  for (const id of w.fa) { const p = w.P[id]; if (p) p.sal = salaryFor(p); }
}
/* =========================================================
 * 이적 시장: 구단 자금·성과·운영 방향과 선수의 선택을 함께 고려한다
 *  - 자금(money): 구단 규모(빅클럽/중견/소규모)에서 시작해 성적(상금·후원)에 따라 늘고 준다
 *  - 운영 방향(mode): 윈나우(상위권·부자 구단) / 유지 / 리빌딩(하위권)
 *  - FA는 연봉 제시액, 팀 전력, 주전 가능성을 따져 팀을 고른다 (스타는 우승권으로 몰린다)
 * ========================================================= */
// 구단 규모: 연간 선수단 연봉 여력(억). 실제 리그의 대략적인 투자 규모 순서를 따른 게임 속 수치
const WEALTH = { GEN: 108, HLE: 116, T1: 112, KT: 76, DK: 74, NS: 56, BFX: 50, DNS: 54, KRX: 50, BRO: 46,
  BLG: 110, AL: 92, TES: 100, IG: 80, JDG: 100, WBG: 82, LNG: 80, EDG: 74, NIP: 68, WE: 62, OMG: 52, TT: 52, UP: 48, LGD: 44 };
const payroll = (w, T) => sum(rosterP(w, T).map(p => (p.isUser ? 0 : p.sal)));
function initFinance(w) { for (const T of Object.values(w.teams)) { T.wealth = WEALTH[T.id] || 60; T.money = T.wealth; T.mode = 'keep'; } }
// 시즌 성적 → 자금과 운영 방향
function seasonFinance(w) {
  const log = w.stoveLog = { y: w.year, teams: {}, moves: [] };
  for (const rg of ['LCK', 'LPL']) {
    const ids = w.ids[rg];
    const rank = rg === 'LCK' && w.lckFinal ? w.lckFinal : [...ids].sort((a, b) => w.teams[b].base - w.teams[a].base);
    ids.forEach(id => {
      const T = w.teams[id], L = w.yearLog[id] || {}, r = rank.indexOf(id) + 1, n = ids.length;
      let prize = 0;
      if (w.rec.worlds === id) prize += 16; else if (L.wp === '준우승') prize += 9; else if (L.wp === '4강') prize += 5; else if (L.wp) prize += 2;
      if (w.rec.msi === id) prize += 6;
      if (w.rec.lck === id || w.rec.lpl === id) prize += 5;
      prize += Math.max(0, (n / 2 - r) * 0.8);
      // 성적이 좋으면 후원·상금으로 여력이 늘고, 나쁘면 줄어든다 (구단 규모 근처로 서서히 돌아온다)
      T.money = clamp(T.money + prize - (r > n * 0.7 ? 6 : 0) + (T.wealth - T.money) * 0.25, T.wealth * 0.65, T.wealth * 1.45);
      T.mode = r <= Math.ceil(n * 0.3) || T.money >= T.wealth * 1.15 ? 'win' : r > n * 0.7 ? 'rebuild' : 'keep';
      log.teams[id] = { before: r1(teamStr(w, T)), mode: T.mode, money: Math.round(T.money), rank: r, in: [], out: [] };
    });
  }
}
function stoveMove(w, p, from, to, kind) {
  const L = w.stoveLog; if (!L) return;
  if (kind === 'out') p.lastTid = from;
  if (kind === 'in' && p.lastTid === to) { const t = L.teams[to]; if (t) { t.out = t.out.filter(n => n !== p.nick); t.stay = (t.stay || []).concat(p.nick); } p.lastTid = null; return; }
  if (kind === 'in') p.lastTid = null;
  if (from && L.teams[from]) L.teams[from].out.push(p.nick);
  if (to && L.teams[to]) L.teams[to].in.push(p.nick);
  if (p.real || ovrRaw(p) >= 80) L.moves.push({ nick: p.nick, from, to, kind, ovr: ovr(p) });
}
/* 속보 후보: 이름값(FAME·인기)·실력·팀의 얼굴 여부·리그 이동으로 화제성을 매긴다 */
function bigNews(w, kind, p, from, to, extra) {
  const L = w.stoveLog; if (!L || !p || p.isUser) return;
  const fr = isFranchise(p, from) || isFranchise(p, to);
  if (!(p.real && (FAME[p.nick] || fr || ovrRaw(p) >= 83 || p.pop >= 60)) && ovrRaw(p) < 86) return;
  const cross = !!(from && to && w.teams[from] && w.teams[to] && w.teams[from].region !== w.teams[to].region);
  const score = (FAME[p.nick] || p.pop || 0) * 0.6 + ovrRaw(p) * 0.4 + (fr ? (kind === 'extend' ? 6 : 45) : 0) + ({ retire: 14, move: 10, leave: 6, extend: (extra && extra.back) ? 4 : -12 }[kind] || 0) + (cross ? 10 : 0);
  (L.big = L.big || []).push(Object.assign({ k: kind, nick: p.nick, name: p.name || '', seed: p.seed, pos: p.pos, ovr: ovr(p), age: p.age, from: from || null, to: to || null, fr, cross, score: r1(score) }, extra || {}));
}
// 계약 만료 선수: 구단은 실력·연봉·운영 방향으로 재계약을 정하고, 스타는 약팀이면 떠나기도 한다. 팀의 얼굴은 웬만하면 붙잡는다
function contractDecisions(w) {
  for (const rg of ['LCK', 'LPL']) for (const id of w.ids[rg]) {
    const T = w.teams[id], lvl = teamStr(w, T), rank = (w.stoveLog && w.stoveLog.teams[id] || {}).rank || 5;
    for (const p of rosterP(w, T)) {
      if (p.isUser || p.con > 0) continue;
      const o = ovrRaw(p), ask = salaryFor(p), room = T.money - payroll(w, T) + p.sal, fr = isFranchise(p, T.id);
      let keep = o >= lvl - 5;
      if (T.mode === 'rebuild' && p.age >= 26 && ask > T.money * 0.18) keep = chance(0.35);
      if (T.mode === 'win' && o >= lvl - 2) keep = true;
      if (ask > room) keep = keep && chance(0.4);
      const star = o >= 86 || FAME[p.nick];
      if (fr) keep = ONECLUB[p.nick] ? (o >= lvl - 14 || chance(0.6)) : chance(o >= lvl - 10 ? 0.93 : 0.5);
      else {
        // 스타 선수는 하위권 팀과 재계약하지 않고 시장에 나오기도 한다
        if (keep && star && rank > w.ids[rg].length * 0.6 && chance(0.55)) keep = false;
        if (keep && star && chance(0.32)) keep = false; // 시장 평가를 받아 보려는 스타
        if (!keep && p.real && o >= lvl - 8 && chance(0.4)) keep = true;
      }
      if (keep && (fr || chance(0.9))) {
        p.con = randi(1, 3); p.sal = ask;
        if (FAME[p.nick] || o >= 86 || fr) { postOf(w, p, 'extend', T.id, { years: p.con, until: w.year + p.con }); bigNews(w, 'extend', p, T.id, T.id, { years: p.con, until: w.year + p.con }); }
      } else { if (NOTABLE(p)) postOf(w, p, 'thanks', T.id); bigNews(w, 'leave', p, T.id, null); stoveMove(w, p, T.id, null, 'out'); toFA(w, p); }
    }
    let up = 0;
    for (const p of acadP(w, T).sort((a, b) => ovrRaw(b) - ovrRaw(a))) {
      if (p.isUser) continue;
      if (p.age >= (p.real ? 24 : 22) && ovrRaw(p) < 66) { toFA(w, p); continue; }
      const b = bestAt(w, T, p.pos), po = ovrRaw(p) + (p.real ? 2 : 0), bo = b ? ovrRaw(b) + (b.real ? 2 : 0) : 0;
      // 주전보다 낫거나, 나이 든 주전과 비슷해지면 1군으로 올린다 (팀당 두 명까지)
      if (b && up < 2 && (po > bo + (T.mode === 'rebuild' ? 0 : 2) || (b.age >= 29 && po >= bo - 1))) { addRoster(w, p, T); p.con = 2; p.sal = salaryFor(p); stoveMove(w, p, null, T.id, 'callup'); up++; continue; }
      // 1군 자리가 막힌 실력 있는 2군 선수는 시장에 나가 다른 팀 1군에 도전한다 (안 팔리면 2군으로 돌아온다)
      if (p.age >= 20 && ovrRaw(p) >= REGION_TARGET.LCK - 7 && chance(0.7)) { toFA(w, p); p.acadOf = T.id; p.lastTid = null; }
    }
  }
}
// FA 시장: 좋은 선수부터 팀을 고른다
function runMarket(w, light) {
  for (const rg of ['LCK', 'LPL']) {
    const ids = w.ids[rg];
    const fas = w.fa.map(i => w.P[i]).filter(p => p && !p.isUser && (rg === 'LCK' ? p.nat === 'KR' : p.nat === 'CN' || p.nat === 'KR')).sort((a, b) => ovrRaw(b) - ovrRaw(a));
    for (const pass of [1, 2]) for (const p of fas) {
      if (p.tid) continue;
      const o = ovrRaw(p) + (p.real ? 2 : 0), ask = salaryFor(p) * (pass === 2 ? 0.7 : 1);
      let best = null, bestU = -1e9;
      for (const id of ids) {
        const T = w.teams[id], cur = bestAt(w, T, p.pos), co = cur ? ovrRaw(cur) + (cur.real ? 2 : 0) : 0;
        const weak = !cur || co < REGION_TARGET[rg] - 9, home = FRANCHISE[p.nick] === T.id;
        if (light && !weak) continue;
        if (cur && o < co + (T.mode === 'win' ? 1 : 2) && !weak && !home) continue; // 지금 주전보다 확실히 나아야 데려간다
        if (pass === 2 && cur && o < co + 3 && !weak && !home) continue; // 몸값을 낮춘 2차 시장도 확실한 보강만
        if (rg === 'LPL' && p.nat === 'KR' && rosterP(w, T).filter(x => x.nat !== 'CN').length >= 2) continue;
        const room = T.money - payroll(w, T);
        const offer = ask * (T.mode === 'win' ? 1.15 : T.mode === 'rebuild' ? 0.9 : 1) * (0.9 + T.money / T.wealth * 0.15) * (rg === 'LPL' && p.nat === 'KR' ? 1.35 : 1);
        if (offer > room + (weak ? ask * 0.6 : 0) + (o >= 86 && T.mode === 'win' ? ask * 0.7 : 0) + (home ? ask : 0)) continue; // 우승권 팀은 스타에겐 사치세를 감수한다
        if (T.mode === 'rebuild' && p.age >= 28 && !weak && !home && chance(0.6)) continue;
        // 선수의 선택: 연봉 + 우승 가능성(팀 전력) + 주전 보장 + 친정팀
        const U = offer / ask * 3 + (teamStr(w, T) - 78) * (o >= 85 ? 0.62 : 0.2) + (o > co ? 1.5 : 0) + (p.lastTid === T.id ? 1.2 : 0) + (home ? 5 : 0) + rand(-1.2, 1.2);
        if (U > bestU) { bestU = U; best = { T, offer }; }
      }
      if (!best) continue;
      const { T, offer } = best, from = p.region, back = p.lastTid === T.id, prevTid = p.lastTid || null;
      addRoster(w, p, T); p.region = rg; p.con = randi(1, 3); p.sal = r1(offer);
      stoveMove(w, p, null, T.id, 'in');
      if (back) {
        w.posts = (w.posts || []).filter(x => !(x.y === w.year && x.type === 'thanks' && x.nick === p.nick && x.tid === T.id));
        if (p.real || o >= 80) addNews(w, `[재계약] ${p.nick} · ${T.name} ${p.con}년 · 연봉 ${p.sal}억`);
        if (NOTABLE(p)) postOf(w, p, 'extend', T.id, { years: p.con, until: w.year + p.con });
        bigNews(w, 'extend', p, T.id, T.id, { years: p.con, until: w.year + p.con, back: true });
        continue;
      }
      const abroad = p.from && p.from !== 'KR' && p.from !== 'CN' && rg === 'LCK';
      if (p.real || o >= 80) addNews(w, `[이적] ${p.nick} → ${T.name}${from !== rg ? (rg === 'LCK' && p.nat === 'KR' ? ' (LCK 복귀)' : ' (해외 이적)') : abroad ? ` (${p.from}에서 복귀)` : ''} · 연봉 ${p.sal}억`);
      if (NOTABLE(p)) postOf(w, p, 'welcome', T.id, { until: w.year + p.con });
      bigNews(w, 'move', p, prevTid, T.id, { years: p.con, sal: p.sal, fromReg: abroad ? p.from : from, toReg: rg });
      p.from = null; p.acadOf = null;
    }
    // 시장에서 팀을 못 찾은 2군 졸업생은 원래 2군으로 돌아간다
    if (rg === 'LCK') for (const p of w.fa.map(i => w.P[i]).filter(p => p && p.acadOf && !p.tid)) { const T = w.teams[p.acadOf]; p.acadOf = null; if (T && acadP(w, T).length < 8) addAcad(w, p, T); }
    // 빈자리는 2군 콜업이나 새 얼굴(실존 선수 풀 먼저)로, 넘치는 인원은 정리
    for (const id of ids) {
      const T = w.teams[id];
      for (const pos of POS) if (!bestAt(w, T, pos)) { const a = bestAcadAt(w, T, pos); if (a) { addRoster(w, a, T); stoveMove(w, a, null, T.id, 'callup'); } else { const np = newcomer(w, pos, REGION_TARGET[rg] - randi(4, 9), 19, 21, rg); addRoster(w, np, T); np.con = randi(1, 2); } }
      let ro = rosterP(w, T);
      while (ro.length > 7) {
        const st = new Set(autoLineup(w, T).map(p => p.id));
        const cut = ro.filter(p => !st.has(p.id) && !p.isUser && !isFranchise(p, T.id)).sort((a, b) => ovrRaw(a) - ovrRaw(b))[0];
        if (!cut) break; toFA(w, cut); ro = rosterP(w, T);
      }
      T.base = avg(autoLineup(w, T).map(ovrRaw));
      if (w.stoveLog && w.stoveLog.teams[id]) w.stoveLog.teams[id].after = r1(T.base);
    }
  }
}
function aiFill(w, light) { runMarket(w, light); }

/* =========================================================
 * 스토브리그 속보: 큰 이적·재계약·은퇴를 속보 카드로 (게임 속 가상 매체 '협곡 인사이더')
 * ========================================================= */
function makeBreaking(w) {
  const L = w.stoveLog, by = {};
  // 같은 선수의 소식은 마지막 결과 하나로 (결별 → 이적이면 이적, 결별 → 복귀면 재계약)
  for (const b of (L && L.big) || []) { const pv = by[b.nick]; by[b.nick] = pv ? Object.assign({}, b, { from: b.from || pv.from, fr: b.fr || pv.fr, score: Math.max(b.score, pv.score) }) : b; }
  // 재계약 소식은 두 건까지만: 이적·결별·은퇴가 먼저 보이도록
  let ext = 0;
  const items = Object.values(by).sort((a, b) => b.score - a.score).filter(b => b.k !== 'extend' || b.back || ext++ < 2).slice(0, 6).map(b => breakingItem(w, b));
  w.breaking = { y: w.year, items, shown: 0 };
}
function breakingItem(w, b) {
  const F = b.from && w.teams[b.from] ? w.teams[b.from].name : '', To = b.to && w.teams[b.to] ? w.teams[b.to].name : '';
  const n = b.nick, nn = b.name ? `${n}(${b.name})` : n, J = (x, a, c) => x + jo(x, a, c), R = x => x + roJ(x);
  let tag = 'BREAKING', text;
  if (b.k === 'retire') { tag = 'OFFICIAL'; text = b.fr ? `${J(n, '이', '가')} 은퇴를 선언했다. ${F ? F + '의 상징이 ' : ''}협곡을 떠난다. 한 시대가 저문다` : `${nn}, 현역 은퇴. ${F ? F + '에서 ' : ''}${b.years > 1 ? b.years + '번째 시즌을 끝으로 ' : ''}커리어를 마무리한다`; }
  else if (b.k === 'extend') {
    if (b.back) text = `반전. FA 시장에 나왔던 ${J(n, '이', '가')} ${R(To)} 돌아간다. ${b.years}년 계약`;
    else if (b.fr) { tag = 'EXCLUSIVE'; text = `${To}, ${J(n, '과', '와')} ${b.years}년 재계약 합의. ${b.until}년까지 ${To}의 얼굴로 남는다`; }
    else { tag = 'EXCLUSIVE'; text = `${To}, ${J(nn, '과', '와')} 재계약 합의. 계약은 ${b.until}년까지`; }
  } else if (b.k === 'move') {
    if (b.fr && F) text = `충격. ${J(n, '이', '가')} ${J(F, '을', '를')} 떠나 ${R(To)} 간다. 소식통에 따르면 ${b.years}년 계약`;
    else if (b.toReg === 'LPL' && b.fromReg !== 'LPL') text = `소식통: ${J(nn, '이', '가')} ${R(To)} 향한다. LPL 진출 · 연봉 ${b.sal}억 규모`;
    else if (b.toReg === 'LCK' && b.fromReg && b.fromReg !== 'LCK') text = `${J(n, '이', '가')} LCK로 돌아온다. ${J(To, '과', '와')} ${b.years}년 계약 합의`;
    else text = `소식통에 따르면 ${J(nn, '이', '가')} ${J(To, '과', '와')} ${b.years}년 계약에 합의했다${F ? `. ${J(F, '을', '를')} 떠나 새 도전` : ''}`;
  } else text = b.fr ? `${F}, 팀의 얼굴 ${J(n, '과', '와')} 결별. ${J(n, '은', '는')} FA 시장으로` : `${F}, ${J(n, '과', '와')} 결별. ${J(n, '이', '가')} FA 시장에 나온다`;
  return { tag, text, k: b.k, nick: n, seed: b.seed, pos: b.pos, ovr: b.ovr, from: b.from, to: b.to, fr: !!b.fr, likes: Math.round(b.score * b.score * 1.4 + rand(0, 800)), rts: Math.round(b.score * b.score * 0.35 + rand(0, 200)), ago: `${randi(1, 11)}시간` };
}
// 내가 주인공인 루머: 제안이 온 구단 중 가장 강한 팀이 적극적이라는 소식 (이름값이 있을 때만)
function userRumor(w) {
  const u = userP(w), U = w.user, t = U.tasks;
  if (!t || !t.offers || U.stage !== 'PRO' || !w.breaking) return;
  const clubs = t.offers.filter(o => (o.kind === 'transfer' || o.kind === 'resign') && o.tid && o.tid !== u.tid).sort((a, b) => w.teams[b.tid].base - w.teams[a.tid].base);
  if (!clubs.length || (u.pop < 25 && ovrRaw(u) < 76)) return;
  const To = w.teams[clubs[0].tid].name;
  const text = clubs.length > 1 ? `여러 구단이 ${u.nick}에게 관심을 보이고 있다. ${J2(To, '이', '가')} 가장 적극적이라는 소식` : `${To}, ${u.nick} 영입 추진 중. 소식통에 따르면 조건은 이미 전달됐다`;
  w.breaking.items.unshift({ tag: 'RUMOR', text, k: 'rumor', nick: u.nick, seed: u.seed, pos: u.pos, ovr: ovr(u), from: u.tid || null, to: clubs[0].tid, me: true, likes: Math.round(200 + u.pop * u.pop * 2), rts: Math.round(40 + u.pop * u.pop * 0.5), ago: '방금' });
}
function J2(x, a, b) { return x + jo(x, a, b); }
/* =========================================================
 * 내 선수
 * ========================================================= */
// 포지션별 플레이 스타일 (세 후보 모두 능력치 합은 같고 분포만 다르다)
const STYLES = {
  TOP: [['탱커 수호자', ['tf', 'mental']], ['스플릿 푸셔', ['lane', 'mech']], ['캐리 브루저', ['mech', 'tf']]],
  JGL: [['갱킹 설계자', ['macro', 'mech']], ['성장형 캐리', ['mech', 'lane']], ['오브젝트 컨트롤러', ['macro', 'tf']]],
  MID: [['라인전 괴물', ['lane', 'mech']], ['로밍 메이커', ['macro', 'pool']], ['한타 메이지', ['tf', 'pool']]],
  ADC: [['하이퍼 캐리', ['mech', 'tf']], ['라인전 강자', ['lane', 'mech']], ['안정형 딜러', ['mental', 'tf']]],
  SUP: [['이니시에이터', ['tf', 'mech']], ['인챈터', ['macro', 'mental']], ['로밍 서포터', ['macro', 'lane']]],
};
const STAT_TOTAL = 300;
function styleCandidates(pos) {
  return STYLES[pos].map(([name, main]) => {
    const st = {};
    for (const k of STATS) st[k] = 44 + rand(-3, 3) + (main.includes(k) ? (k === main[0] ? 12 : 8) : 0) + (WGT[pos][k] >= 0.25 ? 2 : 0);
    const s = sum(STATS.map(k => st[k]));
    let left = STAT_TOTAL;
    STATS.forEach((k, i) => { st[k] = i === STATS.length - 1 ? left : Math.round(st[k] * STAT_TOTAL / s); left -= i === STATS.length - 1 ? 0 : st[k]; });
    return { name, main, st };
  });
}
function createUser(w, o) {
  const p = genPlayer(w, o.pos, 50, 16, 'LCK');
  p.nick = o.nick; w.usedH[o.nick] = 1; p.isUser = true; p.seed = o.seed; p.name = o.name || p.name;
  p.st = Object.assign({}, o.style.st);
  p.pot = Math.round(clamp(80 + randn() * 4, 72, 94)); p.pop = 1; p.con = 0; p.sal = 0; p.tid = null;
  w.user = {
    pid: p.id, style: o.style.name, focus: o.focus.slice(0, 2), money: 0, trust: 45, lp: 280 + randi(0, 60), stage: 'AMATEUR', hist: [], reactions: [],
    everPro: false, firstPog: false, lastStart: false, exempt: false, served: false, boost: 1, ptSafe: false, tasks: null, loan: null, retired: false, scout: scoutGrade(p.pot),
    champ: o.champ || CHAMPS[o.pos][0][0], champs: {}, skins: [], skinPending: null, sig: null, chem: {}, sigTmp: 0,
  };
  return p;
}
// 스타일에 어울리는 챔피언부터 보여 준다
function champCandidates(pos, main) {
  const tags = (main || []).filter(k => TAG_KO[k]);
  return CHAMPS[pos].map(([n, t]) => ({ n, t, rec: tags.includes(t) })).sort((a, b) => b.rec - a.rec);
}
function scoutGrade(pot) { const v = pot + randn() * 3; return v >= 95 ? 'S' : v >= 91 ? 'A+' : v >= 88 ? 'A' : v >= 85 ? 'B+' : 'B'; }

/* 다음 진로 제안 */
function makeOffers(w) {
  const u = userP(w), U = w.user, o = ovrRaw(u), out = [];
  if (U.stage === 'AMATEUR' || U.stage === 'TRAINEE') {
    const S = w.S, rank = lpRank(U.lp), cupWin = S && S.amaCup === '우승', ids = shuffle([...w.ids.LCK]);
    // 연습생이던 팀의 2군 승격
    if (U.stage === 'TRAINEE' && (o >= 55 || chance(0.5))) { const T = w.teams[U.trainee]; out.push({ kind: 'join', tid: T.id, role: 'ACADEMY', sal: r1(rand(0.2, 0.35)), years: 2, title: `${T.name} 2군 승격`, desc: '아카데미에서 LCK CL로 · 정식 계약', route: '승격' }); }
    // 스카우트 제의: 솔랭 상위 랭커나 대회 우승자에게 구단이 먼저 연락한다
    const nScout = (rank && rank <= 50 ? 2 : rank ? 1 : 0) + (cupWin ? 1 : 0);
    for (const id of ids.filter(id => !out.some(x => x.tid === id)).slice(0, nScout)) { const T = w.teams[id]; out.push({ kind: 'join', tid: id, role: 'ACADEMY', sal: r1(rand(0.25, 0.45)), years: 2, title: `${T.name} 스카우트 제의`, desc: rank ? `솔랭 ${rank}위를 보고 연락이 왔어요 · 2군 계약` : '대회 우승을 보고 연락이 왔어요 · 2군 계약', route: '스카우트' }); }
    // 입단 테스트: 붙으면 2군 계약
    for (const id of ids.filter(id => !out.some(x => x.tid === id)).slice(0, 3)) { const T = w.teams[id], p = tryoutChance(w, T); out.push({ kind: 'tryout', tid: id, role: 'ACADEMY', sal: r1(rand(0.2, 0.35)), years: 2, p, title: `${T.name} 입단 테스트`, desc: `합격하면 2군 계약 · 합격 가능성 ${p >= 0.6 ? '높음' : p >= 0.35 ? '보통' : '낮음'}`, route: '테스트' }); }
    if (U.stage === 'AMATEUR') {
      // LCK 아카데미 시리즈 트라이아웃을 거쳐 팀 아카데미 연습생으로
      const aid = ids.find(id => !out.some(x => x.tid === id)); if (aid) out.push({ kind: 'trainee', tid: aid, role: 'TRAINEE', sal: 0, years: 1, title: `${w.teams[aid].name} 아카데미 연습생`, desc: 'LCK 아카데미 시리즈 출전 · 1년 뒤 2군 승격 도전', route: '아카데미' });
      if (!U.prep) out.push({ kind: 'school', tid: null, role: null, sal: 0, years: 1, title: '사설 게임 아카데미 등록', desc: '1년 동안 체계적으로 배워요 · 성장 +15% · 입단 테스트 합격률 상승', route: '학원' });
    }
    out.push({ kind: 'amateur', tid: null, role: null, sal: 0, years: 1, title: U.stage === 'TRAINEE' ? '연습생 1년 더' : '아마추어로 1년 더', desc: U.stage === 'TRAINEE' ? '아카데미에 남아 실력을 더 쌓아요' : '솔랭과 스쿨리그에 집중해요', route: '잔류' });
    return out;
  }
  if (U.loan) {
    const P0 = w.teams[U.loan.parent];
    out.push({ kind: 'return', tid: U.loan.parent, role: 'ROSTER', sal: u.sal, years: Math.max(1, U.loan.con), title: `${P0.name} 복귀`, desc: '임대 종료 · 원소속팀으로 돌아간다' });
  } else if (u.con > 0 && u.tid) {
    out.push({ kind: 'stay', tid: u.tid, role: u.acad ? 'ACADEMY' : 'ROSTER', sal: u.sal, years: u.con, title: `${tName(w, u.tid)} 잔류`, desc: `계약 ${u.con}년 남음 · 연봉 ${u.sal}억` });
  }
  const regions = o >= 78 || U.lplCall ? ['LCK', 'LPL'] : ['LCK'];
  for (const rg of regions) for (const id of w.ids[rg]) {
    const T = w.teams[id], st = bestAt(w, T, u.pos, u.id), so = st ? ovrRaw(st) : 0;
    let role = null;
    if (o >= so - 1) role = 'STARTER'; else if (o >= so - 6) role = 'BENCH'; else if (rg === 'LCK' && u.age <= 20 && (u.acad || !u.tid)) role = 'ACADEMY';
    if (!role) continue;
    const cur = id === u.tid;
    if (cur && u.con > 0) continue;
    const p = cur ? 0.9 : role === 'ACADEMY' ? 0.25 : clamp(0.32 + (o - so) * 0.03 + u.pop * 0.003 - (rg === 'LPL' ? 0.08 : 0) + (U.lplCall && rg === 'LPL' ? 0.4 : 0), 0.08, 0.9);
    if (!chance(p)) continue;
    let sal = salaryFor(u) * (role === 'STARTER' ? rand(0.95, 1.25) : role === 'BENCH' ? rand(0.6, 0.85) : rand(0.25, 0.4));
    if (rg === 'LPL') sal *= rand(1.4, 1.9);
    sal *= (T.mode === 'win' ? 1.12 : T.mode === 'rebuild' ? 0.9 : 1) * (0.85 + (T.money || T.wealth || 60) / (T.wealth || 60) * 0.15);
    const roleTxt = role === 'STARTER' ? '주전 경쟁 우위' : role === 'BENCH' ? '1군 · 주전 경쟁' : '2군 계약';
    out.push({ kind: cur ? 'resign' : 'transfer', tid: id, role, sal: Math.max(0.3, r1(sal)), years: randi(1, 3), rival: st ? st.id : null,
      title: cur ? `${T.name} 재계약` : `${T.name}${rg === 'LPL' ? ' (LPL)' : ''} 이적`, desc: `${roleTxt} · 연봉 ${Math.max(0.3, r1(sal))}억` });
  }
  // 임대: 1군 벤치·2군에서 경기를 못 뛴 유망주에게 약팀이 주전 자리를 제안
  const S = w.S;
  if (u.tid && !U.loan && u.con > 0 && (u.acad || (S && S.tot.g < 15)) && o >= 66) {
    const weak = w.ids.LCK.filter(id => id !== u.tid).map(id => ({ id, so: (bestAt(w, w.teams[id], u.pos) ? ovrRaw(bestAt(w, w.teams[id], u.pos)) : 0) })).filter(x => o >= x.so - 4).sort((a, b) => w.teams[a.id].base - w.teams[b.id].base);
    if (weak[0]) out.push({ kind: 'loan', tid: weak[0].id, role: 'STARTER', sal: u.sal, years: 1, title: `${tName(w, weak[0].id)} 임대 (1시즌)`, desc: '출전 기회 확보 · 시즌 후 원소속팀 복귀' });
  }
  // 불러주는 팀이 없을 때: 어린 선수는 약팀 입단 테스트로 기회를 얻고, 25살부터는 은퇴로 이어진다
  if (!out.length && u.age < 25) {
    const low = [...w.ids.LCK].sort((a, b) => w.teams[a].base - w.teams[b].base)[0];
    out.push({ kind: 'transfer', tid: low, role: 'BENCH', sal: 0.5, years: 1, title: `${tName(w, low)} 입단 테스트 합격`, desc: '1군 · 주전 경쟁 · 연봉 0.5억' });
  }
  const order = { stay: 0, return: 0, resign: 1, loan: 2, transfer: 3, join: 3 };
  return out.sort((a, b) => order[a.kind] - order[b.kind] || w.teams[b.tid].base - w.teams[a.tid].base).slice(0, 6);
}
// 서명이 필요한 계약 (잔류·임대 복귀는 기존 계약을 이어 가므로 서명 없음)
const CONTRACT_KINDS = { join: 1, transfer: 1, resign: 1, loan: 1 };
// 계약서에 서명하면 바로 효력이 생기고 되돌릴 수 없다
function signOffer(w, of) {
  const t = w.user.tasks;
  t.path = of; t.signed = true; of.done = true;
  applyOffer(w, of);
}
function tryoutChance(w, T) {
  const u = userP(w), U = w.user, rank = lpRank(U.lp);
  const lvl = avg(acadP(w, T).map(ovrRaw)) || 60;
  return r2(clamp(0.4 + (ovrRaw(u) - lvl) * 0.07 + (U.prep ? 0.12 : 0) + (rank ? 0.1 : 0) + (U.stage === 'TRAINEE' ? 0.1 : 0), 0.08, 0.92));
}
// 입단 테스트를 본다: 합격하면 2군 계약 제안으로 바뀌고, 떨어지면 그 팀 테스트는 끝
function takeTryout(w, of) {
  if (of.kind !== 'tryout' || of.tried) return null;
  of.tried = true;
  const pass = chance(of.p);
  const T = w.teams[of.tid];
  if (pass) { of.kind = 'join'; of.title = `${T.name} 입단 테스트 합격`; of.desc = '연습생 계약 · LCK CL에서 시작'; }
  else { of.failed = true; of.desc = '불합격 · 다음 기회를 노려요'; }
  return pass;
}
function applyOffer(w, of) {
  const u = userP(w), U = w.user, T = w.teams[of.tid], prev = u.tid;
  if (of.kind === 'amateur' || of.kind === 'tryout') return;
  if (of.kind === 'school') { U.prep = true; return; }
  if (of.kind === 'trainee') { U.stage = 'TRAINEE'; U.trainee = of.tid; U.prep = false; addNews(w, `${u.nick}, ${T.name} 아카데미 합류`); return; }
  if (U.stage === 'AMATEUR' || U.stage === 'TRAINEE') { U.stage = 'PRO'; U.trainee = null; U.prep = false; }
  if (of.kind === 'stay') return;
  if (of.kind === 'loan') {
    U.loan = { parent: prev, con: u.con, sal: u.sal };
    addRoster(w, u, T); U.trust = 64;
    addNews(w, `[임대] ${u.nick}, ${T.name}로 1시즌 임대`);
    pushReaction(w, 'loan', T.name); postOf(w, u, 'loan', T.id); return;
  }
  if (of.kind === 'return') { U.loan = null; addRoster(w, u, T); u.con = of.years; U.trust = 52; return; }
  U.loan = null;
  if (of.role === 'ACADEMY') addAcad(w, u, T); else addRoster(w, u, T);
  u.con = of.years; u.sal = of.sal; u.region = T.region;
  if (prev !== of.tid) {
    U.trust = of.role === 'STARTER' ? 60 : of.role === 'BENCH' ? 48 : 42; addNews(w, `[오피셜] ${u.nick}, ${T.name} 입단 (${of.years}년)`); if (prev || of.role !== 'ACADEMY') pushReaction(w, 'transfer', T.name);
    if (prev) postOf(w, u, 'thanks', prev);
    postOf(w, u, 'welcome', of.tid, { until: w.year + of.years, acad: of.role === 'ACADEMY' });
  } else postOf(w, u, 'extend', of.tid, { years: of.years, until: w.year + of.years });
}

/* 전환점 이벤트 */
const TURNS = [
  { id: 'analyst', title: '전력 분석관과의 개인 세션', text: '분석관이 지난 시즌 경기 영상을 함께 보자고 해요.', ch: [['영상을 파고든다', '움직임과 판단이 좋아져요.', (w, u) => { u.st.macro += 3; u.st.lane += 1; return '운영 +3 · 라인전 +1'; }], ['감각을 믿는다', '자신감이 오르지만 전술 이해는 제자리예요.', (w, u) => { u.st.mental += 2; u.st.mech += 1; return '멘탈 +2 · 피지컬 +1'; }]] },
  { id: 'legend', title: '레전드 선배의 연락', text: '같은 포지션의 은퇴한 선배가 밥을 사주겠다며 연락을 해 왔어요.', ch: [['포지션 디테일을 배운다', '집중 육성 능력치가 오릅니다.', (w, u) => { for (const k of w.user.focus) u.st[k] += 2; return '집중 육성 능력치 +2'; }], ['멘탈 관리법을 묻는다', '긴 시즌을 버티는 법을 배워요.', (w, u) => { u.st.mental += 3; return '멘탈 +3'; }]] },
  { id: 'stream', title: '인기 스트리머의 합방 제안', text: '구독자 100만 스트리머가 같이 방송하자고 제안했어요.', ch: [['합방한다', '인기와 수입이 오르지만 연습 시간이 줄어요.', (w, u) => { u.pop = clamp(u.pop + 8, 0, 100); w.user.money = r1(w.user.money + 0.3); return '인기 +8 · 수입 +0.3억'; }], ['연습에 집중한다', '새 챔피언을 연구해요.', (w, u) => { u.st.pool += 2; return '챔프폭 +2'; }]] },
  { id: 'refocus', title: '집중 육성을 바꿀 기회', text: '코치진이 지금 몸 상태에 맞춰 훈련 방향을 다시 잡아보자고 해요.', refocus: true, ch: [['훈련 방향을 바꾼다', '집중 육성 능력치를 새로 고를 수 있어요.', null], ['지금 방향을 유지한다', '익숙한 루틴이 안정감을 줘요.', (w, u) => { u.st.mental += 1; return '멘탈 +1'; }]] },
  { id: 'slump', cond: w => w.S && w.S.tot.g >= 10 && avgR(w.S.tot) < 6.2, title: '깊어진 슬럼프', text: '경기력이 떨어지면서 커뮤니티 반응도 차가워졌어요.', ch: [['심리 상담을 받는다', '마음을 다잡아요.', (w, u) => { u.st.mental += 3; return '멘탈 +3'; }], ['솔랭으로 정면 돌파', '감각은 돌아오지만 지칠 수 있어요.', (w, u) => { u.st.mech += 2; u.st.mental -= 1; w.user.lp += 40; return '피지컬 +2 · 멘탈 -1 · LP +40'; }]] },
  { id: 'rival', title: '라이벌의 도발', text: '같은 포지션의 상대 선수가 인터뷰에서 "솔직히 신경 안 쓴다"고 말했어요.', ch: [['SNS로 응수한다', '팬들은 열광하지만 부담도 커져요.', (w, u) => { u.pop = clamp(u.pop + 5, 0, 100); u.st.mental -= 1; return '인기 +5 · 멘탈 -1'; }], ['경기력으로 보여준다', '묵묵히 칼을 갈아요.', (w, u) => { u.st.mental += 2; return '멘탈 +2'; }]] },
  { id: 'lpl', cond: w => ovrRaw(userP(w)) >= 80, title: 'LPL 구단의 러브콜', text: '중국 명문 구단 관계자가 비공식으로 관심을 전해 왔어요.', ch: [['관심 있다고 답한다', '이번 오프시즌 LPL 제안이 들어올 가능성이 커져요.', (w) => { w.user.lplCall = true; return 'LPL 제안 확률 상승'; }], ['지금 팀에 집중한다', '감독이 믿음을 보여줘요.', (w) => { w.user.trust = clamp(w.user.trust + 10, 0, 100); return '감독 신뢰 +10'; }]] },
  { id: 'wrist', cond: w => userP(w).age >= 22, title: '손목 통증', text: '오래 쌓인 손목 통증이 심해졌어요. 의사는 수술을 권했어요.', ch: [['수술을 받는다', '시즌 초반은 쉬지만 부상 위험이 줄어요.', (w, u) => { u.inj = 4; w.user.ptSafe = true; return '시즌 초반 4경기 결장 · 부상 위험 감소'; }], ['참고 뛴다', '당장은 괜찮지만 위험이 남아요.', (w, u) => { u.st.mech -= 1; return '피지컬 -1'; }]] },
  { id: 'fanmeet', title: '팬미팅 초대', text: '팬클럽이 연말 팬미팅을 준비했다고 연락이 왔어요.', ch: [['참석한다', '팬들의 응원이 힘이 돼요.', (w, u) => { u.pop = clamp(u.pop + 5, 0, 100); u.st.mental += 1; return '인기 +5 · 멘탈 +1'; }], ['정중히 사양한다', '그 시간에 쉰다.', (w, u) => { u.st.mental += 1; return '멘탈 +1'; }]] },
  { id: 'pool', title: '챔프폭 확장 프로젝트', text: '메타가 크게 바뀌는 패치가 예고됐어요.', ch: [['새 챔피언을 판다', '대응 폭이 넓어져요.', (w, u) => { u.st.pool += 3; return '챔프폭 +3'; }], ['주력 챔피언을 갈고닦는다', '라인전이 단단해져요.', (w, u) => { u.st.lane += 2; return '라인전 +2'; }]] },
  { id: 'champ', cond: w => !!w.nextMeta && champTag(userP(w).pos, w.user.champ) !== w.nextMeta, title: '다음 패치 예고', text: '다음 시즌 패치 노트가 미리 공개됐어요. 지금 시그니처 챔피언은 새 메타와 거리가 있어요.', ch: [['메타 챔피언을 새 시그니처로', '다음 시즌 메타에 맞는 챔피언으로 바꿔요.', (w, u) => { const c = CHAMPS[u.pos].filter(x => x[1] === w.nextMeta && x[0] !== w.user.champ); if (!c.length) return '바꿀 챔피언이 없어요'; const n = pick(c)[0]; w.user.champ = n; u.st.pool += 1; return `시그니처 챔피언 → ${n} · 챔프폭 +1`; }], ['지금 챔피언을 고집한다', '숙련도가 더 깊어져요.', (w, u) => { const k = champTag(u.pos, w.user.champ) || 'lane'; u.st[k] += 2; return `${STAT_KO[k]} +2`; }]] },
  { id: 'bootcamp', cond: w => !!userP(w).tid, title: '해외 솔랭 부트캠프', text: '팀이 비시즌에 해외 서버 부트캠프를 간다고 해요.', ch: [['따라간다', '다른 스타일을 경험해요.', (w, u) => { u.st.tf += 2; u.st.macro += 1; return '한타 +2 · 운영 +1'; }], ['한국에서 솔랭', 'LP를 올려요.', (w, u) => { u.st.mech += 1; w.user.lp += 50; return '피지컬 +1 · LP +50'; }]] },
];
function rollTurn(w) {
  const c = TURNS.filter(t => !t.cond || t.cond(w));
  if (!c.length || !chance(0.85)) return null;
  const t = pick(c);
  return { id: t.id, title: t.title, text: t.text, refocus: !!t.refocus, choices: t.ch.map(x => ({ t: x[0], d: x[1] })) };
}
function resolveTurn(w, id, i) {
  const t = TURNS.find(x => x.id === id), u = userP(w);
  const f = t.ch[i][2];
  const msg = f ? f(w, u) : '';
  for (const k of STATS) u.st[k] = clamp(u.st[k], 1, 99);
  return msg;
}

/* 은퇴: 31살 시즌이 마지막. 아마추어로 21살이 되도록 프로가 못 되면 꿈을 접는다 */
function retireReason(w) {
  const u = userP(w), U = w.user;
  if ((U.stage === 'AMATEUR' || U.stage === 'TRAINEE') && u.age >= 21) return 'dream';
  if (u.age > MAX_AGE) return 'age';
  return null;
}
function makeTasks(w) {
  const u = userP(w), U = w.user;
  const t = { offers: null, path: null, turn: null, turnDone: false, turnResult: null, turnAck: false, resultsSeen: false, military: false, retire: retireReason(w), lastDance: false };
  if (t.retire) { /* 커리어를 마무리한다 */ }
  else if (u.mil) {
    if (U.milLeft > 1) { U.milLeft--; t.path = { kind: 'mil', title: '군 복무 계속' }; }
    else { u.mil = false; U.served = true; U.milLeft = 0; t.offers = makeOffers(w); addNews(w, `${u.nick} 전역`); pushReaction(w, 'discharge'); }
  } else if (U.stage === 'PRO' && u.age >= 28 && !U.exempt && !U.served) {
    t.military = true;
  } else {
    t.offers = makeOffers(w);
    // 계약이 끝나면 FA 공시: 선수 개인 계정에 FREE AGENT 포스터를 올린다
    if (t.offers.length && u.tid && u.con <= 0 && !U.loan && U.stage !== 'AMATEUR') postOf(w, u, 'fa', null);
  }
  // 계약이 끝났는데 불러주는 팀이 하나도 없으면 은퇴
  if (t.offers && !t.offers.length) { t.retire = 'noOffer'; t.offers = null; }
  // 26살부터는 스스로 은퇴를 선언할 수 있다
  if (t.offers && U.stage === 'PRO' && u.age >= 26) t.offers.push({ kind: 'retire', tid: null, role: null, sal: 0, years: 0, title: '은퇴를 선언한다', desc: '여기서 커리어를 마무리하고 명예의 전당에 올라요' });
  t.lastDance = !t.retire && u.age === MAX_AGE;
  if (!u.mil && !t.retire) t.turn = rollTurn(w);
  U.tasks = t;
  U.lplCall = false;
  userRumor(w);
}
function enlist(w) {
  const u = userP(w), U = w.user;
  if (u.tid) postOf(w, u, 'enlist', u.tid);
  detach(w, u); u.mil = true; U.milLeft = 2; U.loan = null; u.con = 0;
  U.tasks.military = false; U.tasks.path = { kind: 'mil', title: '입대' };
  addNews(w, `${u.nick} 입대`); pushReaction(w, 'enlist');
}
function canStartSeason(w) { const t = w.user.tasks; return !!(t && t.path && !t.military && !t.retire); }
function startNextSeason(w) {
  const u = userP(w), t = w.user.tasks;
  if (t.path && t.path.kind !== 'mil' && t.path.kind !== 'stay' && !t.path.done) applyOffer(w, t.path);
  if (u.mil) { for (const k of STATS) u.st[k] = clamp(u.st[k] - rand(0.5, 2.2) * (k === 'mech' || k === 'lane' ? 1.3 : 0.6), 20, 99); }
  if (w.user.skinPending) chooseSkin(w, w.user.skinPending.opts[0]);
  aiFill(w, true);
  w.year++;
  w.meta = w.nextMeta || rollMeta(w.meta); w.nextMeta = null;
  w.phase = 'PRE'; w.S = null;
  for (const T of Object.values(w.teams)) { T.lineup = {}; T.userLineup = false; }
  w.user.tasks = null;
  if (!u.mil && u.tid && !u.acad) w.user.money = r1(w.user.money + u.sal);
  else if (u.acad) w.user.money = r1(w.user.money + u.sal);
}

/* 롤드컵 우승 스킨: 우승팀 선수가 직접 챔피언을 고른다 */
function chooseSkin(w, champ) {
  const U = w.user, P = U.skinPending; if (!P) return null;
  const T = w.teams[P.tid];
  const sk = { y: P.y, tid: P.tid, team: T ? T.name : '', color: T ? T.color : '#191F28', champ: P.opts.includes(champ) ? champ : P.opts[0] };
  U.skins.push(sk); U.skinPending = null;
  addNews(w, `${P.y} 롤드컵 우승 스킨 공개 · ${userP(w).nick}의 ${sk.champ}`);
  U.reactions.unshift({ y: P.y, kind: 'article', src: pick(REACT_SRC.article), sub: '기사', author: '', text: `${sk.team} ${userP(w).nick}, 우승 스킨 챔피언으로 ${sk.champ} 선택`, time: '방금', likes: Math.round(30 + userP(w).pop * 12), tag: '' });
  U.reactions.unshift({ y: P.y, kind: 'post', src: '디시인사이드', sub: '리그 오브 레전드 갤러리', author: pick(AUTHORS), text: `${sk.champ} 우승 스킨 나오면 무조건 산다`, time: '방금', likes: Math.round(10 + userP(w).pop * 6), tag: '' });
  return sk;
}

/* 커리어 점수 */
function careerScore(w) {
  const u = userP(w), c = u.cs;
  const t = k => u.titles.filter(x => x.kind === k).length, a = k => u.awards.filter(x => x.kind === k).length;
  const score = Math.round(t('worlds') * 30 + t('msi') * 12 + t('lck') * 9 + t('lpl') * 5 + t('cup') * 3 + a('poy') * 35 + a('fmvp') * 10 + a('mvp') * 10 + a('mmvp') * 4 + a('allpro') * 4 + a('rookie') * 3 + c.pog * 0.4 + c.g * 0.04 + (c.g ? Math.max(0, avgR(c) - 6) * 15 : 0));
  const grade = score >= 400 ? 'GOAT' : score >= 220 ? 'S' : score >= 130 ? 'A' : score >= 70 ? 'B' : score >= 30 ? 'C' : 'D';
  return { score, grade, worlds: t('worlds'), msi: t('msi'), lck: t('lck'), lpl: t('lpl'), poy: a('poy'), fmvp: a('fmvp'), mvp: a('mvp') };
}
function milestones(w) {
  const u = userP(w), U = w.user;
  return [true, U.stage !== 'AMATEUR' || !!u.tid, !!U.everPro, u.titles.some(t => t.kind !== 'ag'), u.titles.some(t => t.kind === 'worlds')];
}

/* =========================================================
 * 시즌의 순간 · 언론·팬 반응 (게임 속 가상 반응)
 * ========================================================= */
function pickMoment(w) {
  const S = w.S, u = userP(w), a = avgR(S.tot);
  if (S.amateur) return { title: '새벽 4시의 솔랭', text: '랭킹 페이지에 처음 보는 닉네임이 올라왔다는 글이 커뮤니티에 돌았습니다. 그게 나였습니다.', tag: '주목' };
  if (S.mil) return { title: '부대에서 본 롤드컵', text: '생활관 TV로 롤드컵을 보며 다시 무대에 설 날을 그렸습니다.', tag: '다짐' };
  if (S.titles.some(t => t.includes('롤드컵'))) return { title: '소환사컵을 들어 올린 밤', text: '꽃가루가 쏟아지는 무대 위에서 소환사컵을 들어 올렸습니다. 연습실의 새벽들이 스쳐 지나갔습니다.', tag: '전설' };
  if (S.poy) return { title: '올해의 선수', text: '시상대에 이름이 불렸습니다. 이번 시즌 세계 최고의 선수는 나였습니다.', tag: '영광' };
  if (S.titles.length) return { title: '첫 트로피의 무게', text: `"${S.titles[0]}" 트로피를 품에 안았습니다. 생각보다 무거웠고, 생각보다 더 기뻤습니다.`, tag: '감동' };
  if (S.debut) return { title: '데뷔전의 떨림', text: 'LoL 파크 무대에 처음 선 날, 마우스를 쥔 손이 떨렸지만 첫 킬과 함께 긴장이 풀렸습니다.', tag: '설렘' };
  if (S.callup) return { title: '콜업 전화', text: '연습이 끝난 밤, 감독님 전화가 왔습니다. "내일부터 1군 연습실로 와."', tag: '설렘' };
  if (S.injuries) return { title: '재활의 시간', text: '부상으로 쉬는 동안 경기를 지켜보며 더 단단해지기로 했습니다.', tag: '다짐' };
  if (S.tot.g === 0 && !S.cl.g) return { title: '벤치에서 본 시즌', text: '경기를 지켜보는 시간이 길었습니다. 다음 시즌엔 무조건 뛰어야 합니다.', tag: '오기' };
  if (S.tot.g >= 10 && a < 6.1) { u.st.mental = clamp(u.st.mental + 1, 1, 99); return { title: '힘이 된 응원', text: '힘든 시간을 지켜봐 준 사람들의 응원 덕분에 마음을 다시 다잡았습니다.', tag: '사기 회복' }; }
  if (S.tot.g >= 20 && a >= 7.2) return { title: '모두가 이름을 외운 시즌', text: '해설진이 내 닉네임을 부르는 횟수가 눈에 띄게 늘었습니다.', tag: '주목' };
  return { title: '한 걸음 더', text: '화려하진 않았지만 매 경기 조금씩 나아졌습니다.', tag: '성장' };
}
const REACT_SRC = {
  article: ['인벤', '포모스', 'OSEN', '스포츠경향', '디스이즈게임'],
  comm: [['디시인사이드', '리그 오브 레전드 갤러리'], ['에펨코리아', 'LoL 게시판'], ['인벤', '자유게시판'], ['레딧', 'r/leagueoflegends'], ['X', '게시물'], ['치지직', '채팅']],
};
const AUTHORS = ['협곡지박령', '골드4탈출기원', '정글차이', '미드갭', 'LCK직관러', '탑신병자', '원딜은억울해', '서폿장인', '롤드컵가즈아', '새벽솔랭러', '바론스틸', '와드는생명', 'u/BaronSteal', 'u/RiftWatcher', '롤파크단골', '킬각장인', '용한타', '칼바람전문가'];
const RT = {
  amateur: { a: ['솔랭 상위권에 등장한 16세 유망주 "{n}", 프로팀들 관심'], c: ['솔랭 1페이지에 처음 보는 닉 {n} 누구임?', '{n} 듀오 큐에서 만났는데 손이 다름', '프로팀 테스트 본다는 소문 있던데', '고딩이 이 정도면 2년 안에 데뷔한다'] },
  acad: { a: ['{t} 2군의 숨은 보석 "{n}", CL에서 두각'], c: ['CL에서 {n} 잘하던데 콜업 언제?', '{t} 2군에 물건 하나 있음', '2군 경기 챙겨보는 사람만 아는 {n}', '아직 어리다. 천천히 키워라'] },
  bench: { a: ['출전 기회 못 잡은 {n}, 다음 시즌 거취는?'], c: ['출전 시간이 적어서 보여줄 게 없었음', '{t}는 왜 {n} 안 써?', '임대라도 보내서 경기 뛰게 해라', '벤치에 두기 아까운 재능'] },
  poor: { a: ['{n}, 아쉬움 남긴 시즌… 평균 평점 {r}'], c: ['{n} 이번 시즌은 좀 아쉽다', '유망주한테 너무 많은 걸 바라지 말자', '폼 언제 돌아오냐', '한 시즌 부진은 흔한 일. 중요한 건 다음 걸음'] },
  avg: { a: ['{t} {n}, 무난한 시즌… 다음 시즌이 시험대'], c: ['무난했다. 다음 시즌이 진짜임', '{n} 아직 보여줄 게 남았음', '나쁘지 않은데 확 튀는 게 없음', '작년보다는 확실히 늘었다'] },
  good: { a: ['꾸준함의 {n}, {t} 핵심으로 자리매김'], c: ['{n} 꾸준하다 진짜', '기복 없이 제 몫 해주는 게 제일 무섭다', '작년엔 불안했는데 올해는 믿고 본다', '{n} 경기는 챙겨 보게 됨', '{n} {c} 꺼내면 일단 믿고 본다'] },
  star: { a: ['"{n}" 시즌 평점 {r}… 리그 최고 수준', '{t} 상승세의 중심, {n}'], c: ['{n} 폼 미쳤다', '이 정도면 올프로 확정 아님?', '{n} is the real deal.', '요즘 {n} 하이라이트만 돌려봄', '세계관 최강자 후보 등장', '{c} 밴 안 하면 그냥 지는 거임', '{n} {c} 장인 인정'] },
  title: { a: ['{t}, 트로피 획득… 중심엔 {n}'], c: ['우승 축하해 {n}!', '{n} 우는 거 보고 나도 울었다', '이 팀 진짜 왕조 가는 거 아님?'] },
  worlds: { a: ['{n}, 롤드컵 우승… 꿈을 이뤘다'], c: ['소환사컵 든 {n} 표정 봤냐 ㅠㅠ', '17살 때부터 봐온 선수가 롤드컵 우승이라니', '레전드의 시작', '우승 스킨은 무조건 {c} 가자'] },
  poy: { a: ['올해의 선수 {n}… "이견 없는 선택"'], c: ['올해의 선수 {n}. 이견 없음', '역대급 시즌이었다', '{n} 시대 개막'] },
  mil: { a: ['{n}, 군 복무 중… 전역 후 복귀 의지'], c: ['{n} 기다릴게', '전역하면 어느 팀 갈지 벌써 궁금함'] },
};
function fillT(s, w) {
  const u = userP(w), S = w.S, c = (S && S.champTop && S.champTop[0] && S.champTop[0].n) || w.user.champ || '챔피언';
  return s.split('{n}').join(u.nick).split('{t}').join(S && S.team ? S.team : tName(w, u.tid)).split('{r}').join(S && S.tot.g ? avgR(S.tot).toFixed(2) : '-').split('{c}').join(c);
}
function mkReact(w, tier, isArticle) {
  const u = userP(w), T = RT[tier];
  const likes = Math.round((5 + u.pop * u.pop * 0.6) * rand(0.3, 1.6));
  if (isArticle) { const src = pick(REACT_SRC.article); return { y: w.year, kind: 'article', src, sub: '기사', author: src, text: fillT(pick(T.a), w), time: `${randi(1, 23)}시간 전`, likes, tag: '' }; }
  const [src, sub] = pick(REACT_SRC.comm);
  return { y: w.year, kind: 'post', src, sub, author: pick(AUTHORS), text: fillT(pick(T.c), w), time: `${randi(1, 59)}분 전`, likes, tag: pick(['', '', '훈훈', '공감', '분석']) };
}
function makeReactions(w) {
  const S = w.S, a = avgR(S.tot);
  let tier;
  if (S.amateur) tier = 'amateur';
  else if (S.mil) tier = 'mil';
  else if (S.poy) tier = 'poy';
  else if (S.titles.some(t => t.includes('롤드컵'))) tier = 'worlds';
  else if (S.titles.length) tier = 'title';
  else if (S.acad0 && !S.callup && S.tot.g < 5) tier = 'acad';
  else if (S.tot.g < 10) tier = 'bench';
  else tier = a >= 7.2 ? 'star' : a >= 6.6 ? 'good' : a >= 6.1 ? 'avg' : 'poor';
  const out = [mkReact(w, tier, true)];
  const used = new Set();
  for (let i = 0; i < 4; i++) { let r; for (let t = 0; t < 6; t++) { r = mkReact(w, tier, false); if (!used.has(r.text)) break; } used.add(r.text); out.push(r); }
  if (tier === 'poy' || tier === 'worlds') out.push(mkReact(w, 'star', false));
  return out;
}
function pushReaction(w, kind, teamName) {
  const u = userP(w), U = w.user;
  // 이적 반응은 함께 뛸 동료 이름으로: 스토브리그 팬들은 팀보다 라인업을 본다
  const T = u.tid ? w.teams[u.tid] : null, mate = T ? bestAt(w, T, DUO[u.pos], u.id) : null;
  // 팀의 얼굴(Faker·ShowMaker 같은 프랜차이즈 스타)이 있으면 그 이름이 먼저 나온다
  const face = T ? teamFace(w, T) : null, fr = face && !face.isUser && isFranchise(face, T.id) ? face : null;
  const stars = T ? [fr].concat(rosterP(w, T).filter(p => !p.isUser && p !== fr).sort((a, b) => ovrRaw(b) - ovrRaw(a))).filter(Boolean).slice(0, 2).map(p => p.nick) : [];
  const mateTxt = fr && chance(0.6) ? `${fr.nick}${jo(fr.nick, '과', '와')} 같은 팀이라니. ${u.nick} 인생 바뀌었다` : mate ? `${mate.nick}-${u.nick} ${DUO_KO[u.pos]}라니, 벌써 기대된다` : `${teamName} 영입 잘했다. ${u.nick} 기대된다`;
  const texts = {
    transfer: [stars.length === 2 ? `[오피셜] ${u.nick}, ${teamName} 입단… ${stars[0]}·${stars[1]}${jo(stars[1], '과', '와')} 한솥밥` : `[오피셜] ${u.nick}, ${teamName} 입단`, mateTxt],
    loan: [`[오피셜] ${u.nick}, ${teamName}로 1시즌 임대`, `임대 가서 경기 많이 뛰고 와라`],
    enlist: [`${u.nick} 오늘 입대… 팬들 "기다릴게"`, `${u.nick} 입대 전 마지막 방송 보고 울었다`],
    discharge: [`${u.nick} 전역! 복귀 팀은 어디?`, `전역 축하해 ${u.nick}!`],
  }[kind];
  if (!texts) return;
  U.reactions.unshift({ y: w.year, kind: 'article', src: pick(REACT_SRC.article), sub: '기사', author: '', text: texts[0], time: '방금', likes: Math.round(10 + u.pop * 8), tag: '' });
  U.reactions.unshift({ y: w.year, kind: 'post', src: '에펨코리아', sub: 'LoL 게시판', author: pick(AUTHORS), text: texts[1], time: '방금', likes: Math.round(5 + u.pop * 4), tag: '' });
}

/* Node 테스트용 */
if (typeof module !== 'undefined') module.exports = { setRng: f => { R = f; } };
