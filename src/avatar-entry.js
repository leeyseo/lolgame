// 선수 아바타: DiceBear "Toon Head" (Johan Melin, CC BY 4.0). 시드마다 같은 얼굴, 옷은 팀 컬러(유니폼).
// 실제 프로게이머처럼 보이도록 피부·머리·표정 범위를 좁히고, 안경은 직접 그려 얹는다.
// 시드가 'f-'로 시작하면 여성 선수 (묶음머리·긴 머리·단발).
import { createAvatar } from '@dicebear/core';
import * as toonHead from '@dicebear/toon-head';

function hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function picker(seed) { let h = hash(seed); return arr => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return arr[h % arr.length]; }; }

// 안경 (toon-head 768×768 좌표: 눈 중심 약 (307,408)·(461,408), 귀 약 x 210·560)
const GLASSES = shape => {
  const r = shape === 'round' ? 42 : 18;
  return `<g fill="rgba(255,255,255,.12)" stroke="#1F2430" stroke-width="11">
    <rect x="245" y="365" width="124" height="88" rx="${r}"/><rect x="399" y="365" width="124" height="88" rx="${r}"/>
    <path d="M369 395 Q384 383 399 395" fill="none"/><path d="M245 390 L214 382" fill="none"/><path d="M523 390 L554 382" fill="none"/></g>`;
};

window.PixelAvatar = {
  make(seed, jersey) {
    seed = String(seed);
    const P = picker(seed), female = seed.startsWith('f-');
    const opts = {
      seed,
      skinColor: [P(['f1c3a5', 'eebd9d', 'e8b293', 'dfa585', 'f4cdb2', 'e8b293', 'c68e7a'])],
      hairColor: [P(['1c1514', '231816', '2c1b18', '33221c', '2c1b18', '1c1514', '5a3a2a', 'a55728'])],
      eyes: [P(['humble', 'happy', 'wide', 'bow', 'humble', 'wide'])],
      eyebrows: [P(['neutral', 'happy', 'raised', 'neutral'])],
      mouth: [P(['smile', 'smile', 'laugh', 'smile', 'smile'])],
      beardProbability: 0,
      clothes: [P(['tShirt', 'shirt', 'openJacket', 'tShirt', 'turtleNeck'])],
    };
    if (female) {
      opts.hair = [P(['bun', 'sideComed', 'sideComed'])];
      opts.rearHair = [P(['longStraight', 'longWavy', 'shoulderHigh', 'neckHigh'])];
      opts.rearHairProbability = opts.hair[0] === 'bun' ? 0 : 100;
    } else {
      opts.hair = [P(['sideComed', 'undercut', 'spiky', 'sideComed', 'undercut', 'sideComed'])];
      opts.rearHair = ['neckHigh'];
      opts.rearHairProbability = 0;
    }
    if (jersey) opts.clothesColor = [jersey.replace('#', '')];
    let s = createAvatar(toonHead, opts).toString();
    const glasses = P([0, 0, 0, 1, 0, 2, 0, 1]);
    if (glasses) s = s.replace(/<\/svg>\s*$/, GLASSES(glasses === 2 ? 'round' : 'square') + '</svg>');
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
  },
};
