# 구현 계획

Architecture.md 기반 단계별 구현 순서.

---

## Phase 1 — 프로젝트 초기 세팅 ✅

**목표**: 빌드·실행 가능한 빈 Electron + React 뼈대 완성

- [x] `electron-vite` + TypeScript 프로젝트 생성
- [x] `better-sqlite3` 설치 및 네이티브 모듈 빌드 설정 (`electron-builder install-app-deps`)
- [x] `eslint` + `prettier` 설정
- [x] `preload.ts` — `contextBridge.exposeInMainWorld('api', {})` 기본 구조 작성
- [x] `electron/main.ts` — 윈도우 생성, devtools 연결
- [x] `src/main.tsx` — React 진입점, 빈 `<App />` 렌더링 확인

---

## Phase 2 — DB 초기화 & IPC 뼈대 ✅

**목표**: 앱 실행 시 DB가 생성되고, IPC 채널 호출이 왕복되는 것 확인

- [x] `electron/db/schema.ts` — `subjects`, `sessions`, `goals` 테이블 CREATE SQL
- [x] `electron/db/index.ts` — DB 파일 경로(`app.getPath('userData')`) 지정, 앱 시작 시 스키마 자동 마이그레이션
- [x] `zod` 설치 — IPC payload 검증용
- [x] `electron/ipc/session.ts` — `session:create`, `session:pause`, `session:resume`, `session:finish`, `session:list` 핸들러 (zod 스키마 검증 포함)
- [x] `electron/ipc/stats.ts` — `stats:daily`, `stats:weekly` 핸들러
- [x] `electron/ipc/subject.ts` — `subject:list`, `subject:create` 핸들러
- [x] `electron/ipc/goal.ts` — `goal:list`, `goal:upsert` 핸들러
- [x] `preload.ts` — 위 모든 채널을 `window.api`에 노출
- [x] `src/types/electron.d.ts` — `window.api` 전체 타입 선언
- [x] 간단한 콘솔 테스트로 IPC 왕복 확인

---

## Phase 3 — 타이머 핵심 기능 ✅

**목표**: 과목을 선택하고 타이머를 시작·정지·완료할 수 있는 상태

- [x] `src/store/timerStore.ts` — `status / elapsed / target / activeSessionId / subjectId` Zustand 정의
- [x] `src/hooks/useTimer.ts` — `setInterval(1s)` tick, `status === 'running'`일 때만 동작
- [x] `src/hooks/useSession.ts` — `window.api.session.*` IPC 호출 래핑
- [x] `src/components/Timer/TimerDisplay.tsx` — 경과 시간 `HH:MM:SS` 표시, 목표 대비 진행 바
- [x] `src/components/Timer/TimerControls.tsx` — 시작 / 일시정지 / 재개 / 완료 버튼
- [x] 세션 시작 시 `session:create` → DB INSERT → `activeSessionId` 저장
- [x] 일시정지 시 `session:pause` → DB에 `paused_at` 기록
- [x] 재개 시 `session:resume` → DB에서 `paused_seconds` 누적, `paused_at` NULL
- [x] 세션 완료 시 `session:finish` → Main이 `actual_seconds = ended_at - started_at - paused_seconds` 계산 후 저장

---

## Phase 4 — 과목 선택 & 세션 폼 ✅

**목표**: 과목을 추가·선택하고 목표 시간을 설정한 뒤 타이머를 시작

- [x] `src/store/sessionStore.ts` — `subjects`, `sessions`, `dailyStats`, `weeklyStats` Zustand 정의
- [x] `src/components/Session/SubjectSelector.tsx` — 과목 목록 드롭다운, 새 과목 추가 인라인 폼
- [x] `src/components/Session/TargetInput.tsx` — 목표 시간 입력 (TimerControls 내부에 인라인 통합)
- [x] 앱 시작 시 `subject:list` 호출해 과목 목록 초기 로드

---

## Phase 5 — 통계 화면 ✅

**목표**: 오늘·이번 주 학습 시간을 과목별로 시각화

- [x] `victory` 설치
- [x] `electron/db/queries/stats.ts` — `GROUP BY subject_id, SUM(actual_seconds)` 쿼리 구현
  - 날짜 필터는 `DATE(started_at, 'unixepoch', 'localtime')` 기준 (자정을 넘기는 세션은 시작일에 귀속)
- [x] `src/components/Stats/DailyChart.tsx` — 과목별 막대 차트
- [x] `src/components/Stats/WeeklyChart.tsx` — 요일별 합계 꺾은선 차트
- [x] `src/components/Stats/StatsSummary.tsx` — 총 시간, 목표 달성률 텍스트 요약
- [x] 화면 마운트 시 `stats:daily` + `stats:weekly` 동시 호출

---

## Phase 6 — 설정 화면 ✅

**목표**: 과목 색상 변경·삭제, 일별·주별 목표 시간 설정

- [x] `subject:update`, `subject:delete` IPC 채널 추가 (`electron/ipc/subject.ts` 확장)
- [x] `goal:upsert`, `goal:list`는 Phase 2에서 이미 생성한 `electron/ipc/goal.ts` 활용
- [x] `src/components/Settings/SubjectManager.tsx` — 과목 색상 편집, 삭제
- [x] `src/components/Settings/GoalSettings.tsx` — 과목별 또는 전체 일별·주별 목표 입력

---

## Phase 7 — 안정성 & 마무리 (진행 중)

**목표**: 엣지 케이스 처리 및 배포 준비

- [x] **크래시 복구**: 앱 시작 시 `ended_at IS NULL` 세션 감지 → "이어서 하기 / 취소" 다이얼로그
- [x] **시스템 트레이**: 트레이 아이콘, 클릭으로 창 토글, 종료 메뉴
- [x] **OS 알림**: 목표 시간 도달 시 `Notification` 발송
- [x] `electron-builder` 패키징 설정 (mac/win dmg, nsis)
- [x] 앱 아이콘 적용

---

## 의존성 요약

| 패키지 | 용도 |
|--------|------|
| `electron-vite` | 빌드 도구 |
| `better-sqlite3` | SQLite 동기 드라이버 |
| `electron-builder` | 네이티브 모듈 재빌드 + 배포 패키징 |
| `zustand` | 전역 상태 관리 |
| `zod` | IPC payload 런타임 검증 |
| `victory` | 통계 차트 |
