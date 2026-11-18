# 솔랭에서 월즈까지

16살 솔랭 랭커에서 LCK·LPL 실제 구단의 주전, 그리고 월즈까지. 한 시즌씩 쌓아 가는 리그 오브 레전드 프로게이머 커리어 시뮬레이션 웹게임입니다. 웹 축구 커리어 게임 「벤치에서 발롱까지」의 흐름을 롤판으로 옮겼습니다.

## 플레이

`dist/index.html` 하나로 돌아갑니다. 브라우저로 열거나 아무 정적 호스팅(GitHub Pages, Netlify 등)에 올리면 됩니다. 서버와 인터넷 연결이 필요 없고, 진행 상황은 브라우저에 저장됩니다.

## 주요 내용

- **시즌 단위 진행:** 버튼 한 번에 1년(LCK컵 → 정규시즌 → MSI → 플레이오프 → 롤드컵). 내 팀이 결승에 오르면 세트별 문자 중계를 봅니다.
- **실제 리그·구단:** 2026 시즌 기준 LCK 10팀(1군·2군), LPL 14팀, 롤드컵 출전 해외 팀. 구단 로고와 실존 선수 이름·본명을 씁니다.
- **입단 경로:** 솔랭 스카우트, 입단 테스트, 팀 아카데미 연습생, 사설 아카데미, 아마추어 1년 더.
- **오프시즌 '다음 이야기':** 전환점 → 나의 선택 → 도착한 제안. 계약서에는 직접 서명하고, 함께 뛸 라인업과 듀오 파트너를 보고 고릅니다.
- **스토브리그:** 구단 자금·성적·운영 방향(윈나우·유지·리빌딩)에 따른 이적 시장. 이적·재계약·FA 소식은 구단별 실제 양식을 따른 포스터와 팬 댓글로 올라옵니다.
- **롤만의 요소:** 패치 메타, 시그니처 챔피언, 롤드컵 우승 스킨, 병역과 아시안게임.
- **은퇴 요약:** 커리어와 닮은 실제 선수, 걸어온 길, 명예의 전당.

## 개발

```bash
npm install
npm run build   # dist/index.html 생성
npm test        # 엔진만 돌리는 자동 커리어 시뮬레이션
```

| 경로 | 내용 |
|---|---|
| `src/engine.js` | 시뮬레이션 엔진 (리그·경기·이적 시장·커리어, DOM 없음) |
| `src/ui.js` | 화면 (토스 디자인 시스템 톤) |
| `src/style.css` | 스타일, 구단별 포스터 템플릿 |
| `src/avatar-entry.js` | 선수 아바타 생성 (DiceBear Toon Head) |
| `assets/logos/` | 구단 로고 (96px WebP) |
| `assets/fonts/` | Pretendard 서브셋 |
| `build.mjs` | 폰트·로고·스크립트를 HTML 한 파일로 합치는 빌드 |
| `test/sim-test.mjs` | 자동 플레이 밸런스 테스트 |

## 크레딧과 고지

- 폰트: [Pretendard](https://github.com/orioncactus/pretendard) (SIL OFL 1.1), [Anton](https://github.com/googlefonts/AntonFont) (SIL OFL 1.1)
- 아바타: [Toon Head](https://www.dicebear.com/styles/toon-head/) by Johan Melin (CC BY 4.0), [DiceBear](https://www.dicebear.com/)
- 로스터: 나무위키·Inven Global·GosuGamers 등 공개 자료 (2026 시즌 기준)

독립적으로 만든 비공식 팬 게임입니다. Riot Games, LoL Esports, 각 구단과 관련이 없습니다. 구단·대회 명칭과 로고, 선수 닉네임·본명, 챔피언 이름의 권리는 각 권리자에게 있습니다. 능력치와 경기 결과는 게임 속 수치이며 실제 선수 평가가 아닙니다. 게임 속 기사·게시물·댓글은 모두 가상의 연출입니다.
