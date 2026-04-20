# Study Timer

학습 시간을 측정하고 관리하는 데스크탑 타이머 앱.

## 기술 스택

- **Electron** v29 — 데스크탑 앱 프레임워크
- **React** 18 + **TypeScript** — UI
- **electron-vite** — 빌드 도구
- **better-sqlite3** — 로컬 DB (앱 데이터 폴더에 `study-timer.db` 생성)
- **Zustand** — 클라이언트 상태 관리
- **Victory** — 통계 차트
- **Zod** — IPC 페이로드 런타임 검증

## 주요 기능

- **타이머** — 과목별 학습 세션 시작 / 일시정지 / 종료
- **미니 타이머** — 타이머 탭에서 `⊟` 버튼으로 소형 플로팅 위젯 전환, 목표 설정 시 하단 프로그레스 바 표시
- **통계** — 일별·주별·과목별 학습 시간 집계 및 차트
- **목표 관리** — 과목별 일간/주간 목표 시간 설정
- **세션 기록** — 과거 세션 조회·삭제·메모 편집
- **비정상 종료 복구** — 앱 재시작 시 미완료 세션 감지 후 이어하기/종료 선택

## 프로젝트 구조

```
electron/
  main.ts          # 앱 진입점, BrowserWindow 생성, IPC 핸들러 등록
  preload.ts       # contextBridge로 window.api 노출
  db/              # SQLite 초기화, 마이그레이션, 쿼리
  ipc/             # session / stats / subject / goal IPC 핸들러

src/
  App.tsx          # 탭 라우팅 (타이머 / 통계 / 설정), 미니 타이머 상태
  components/
    Timer/         # TimerDisplay, TimerControls, SessionInfo
    Stats/         # DailyChart, WeeklyChart, StatsSummary, GoalProgress
    Settings/      # SubjectManager, GoalSettings, SessionHistory
    CrashRecovery.tsx
  store/
    timerStore.ts  # 타이머 상태 (status, elapsed, subjectId)
    sessionStore.ts # 과목·통계·목표 데이터
  hooks/
    useTimer.ts    # 1초 interval 관리
    useSession.ts  # IPC 브릿지 (세션 CRUD)
```

## 개발 환경 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
# Vite 빌드만 (out/ 생성)
npm run build

# 플랫폼별 배포 패키지 생성 (dist/ 생성)
npm run dist          # 현재 플랫폼
npm run build:mac     # macOS → .dmg / .zip
npm run build:win     # Windows → .exe (NSIS 인스톨러)
npm run build:linux   # Linux → .AppImage
```

> macOS 빌드 결과물: `dist/Study Timer-{version}-{arch}.dmg`  
> Windows 빌드 결과물: `dist/Study Timer-Setup-{version}-x64.exe`

## DB 위치

| 플랫폼 | 경로 |
|--------|------|
| macOS | `~/Library/Application Support/study-timer/study-timer.db` |
| Windows | `%APPDATA%\study-timer\study-timer.db` |
| Linux | `~/.config/study-timer/study-timer.db` |
