// 빌드: 폰트(Base64)·아바타 번들·CSS·JS를 HTML 한 파일로 합친다.
//  dist/index.html    — 어디든 올리면 되는 완성 문서 (itch.io, Netlify, GitHub Pages, 더블클릭 실행)
//  dist/artifact.html — claude.ai Artifact 게시용 조각 (doctype/head 없이)
import fs from 'node:fs';
import * as esbuild from 'esbuild';

const rd = p => fs.readFileSync(new URL(p, import.meta.url));
const txt = p => rd(p).toString('utf8');
const b64 = p => rd(p).toString('base64');
const fill = (s, map) => Object.entries(map).reduce((acc, [k, v]) => acc.split(k).join(v), s);
const safe = js => js.split('</script').join('<\\/script');

const av = await esbuild.build({ entryPoints: ['src/avatar-entry.js'], bundle: true, minify: true, format: 'iife', write: false, target: 'es2019' });
const avatarJs = av.outputFiles[0].text;

const game = await esbuild.transform(txt('./src/engine.js') + '\n' + txt('./src/ui.js'), { minify: true, target: 'es2019' });

const css = fill(txt('./src/style.css'), {
  '__FONT_REG__': b64('./assets/fonts/Pretendard-Regular.subset.woff2'),
  '__FONT_BOLD__': b64('./assets/fonts/Pretendard-Bold.subset.woff2'),
  '__FONT_ANTON__': b64('./node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2'),
});
// 구단 로고 (LoL Esports 공식 사이트에 게시된 이미지를 96px WebP로 줄인 것): CSS 배경으로 한 번만 넣는다
const logoDir = new URL('./assets/logos/', import.meta.url);
const logoTags = fs.readdirSync(logoDir).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)).sort();
const logoCss = logoTags.map(t => `.lg-${t}{background-image:url(data:image/webp;base64,${b64('./assets/logos/' + t + '.webp')})}`).join('\n');
const logoJs = `window.LOGO_SET=${JSON.stringify(Object.fromEntries(logoTags.map(t => [t, 1])))};`;

const body = txt('./src/body.html');
const TITLE = '솔랭에서 롤드컵까지';

const inner = `<style>${css}\n${logoCss}</style>\n${body}\n<script>${logoJs}</script>\n<script>${safe(avatarJs)}</script>\n<script>${safe(game.code)}</script>\n`;

const full = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${TITLE}</title>
<meta name="description" content="16살 솔랭 랭커에서 LCK·LPL 실제 구단의 주전, 롤드컵 우승까지. 시즌 단위 프로게이머 커리어 시뮬레이션.">
<meta name="theme-color" content="#F2F4F6">
</head>
<body>
${inner}</body>
</html>
`;
const fragment = `<title>${TITLE}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${inner}`;

fs.mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./dist/index.html', import.meta.url), full);
fs.writeFileSync(new URL('./dist/artifact.html', import.meta.url), fragment);
fs.copyFileSync(new URL('./assets/fonts/Pretendard-LICENSE.txt', import.meta.url), new URL('./dist/FONT-LICENSE-Pretendard.txt', import.meta.url));
fs.copyFileSync(new URL('./node_modules/@fontsource/anton/LICENSE', import.meta.url), new URL('./dist/FONT-LICENSE-Anton.txt', import.meta.url));
try { fs.rmSync(new URL('./dist/FONT-LICENSE-OFL.md', import.meta.url)); } catch (e) { /* 이전 빌드 산출물 없음 */ }
console.log(`dist/index.html ${(full.length / 1024).toFixed(0)}KB (avatar ${(avatarJs.length / 1024).toFixed(0)}KB, game ${(game.code.length / 1024).toFixed(0)}KB, logos ${logoTags.length}개 ${(logoCss.length / 1024).toFixed(0)}KB)`);
