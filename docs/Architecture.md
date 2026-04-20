# Architecture

**스택**: Electron + React + SQLite (better-sqlite3)

---

## 프로세스 구조

Electron은 두 개의 독립적인 프로세스로 구성된다.

```
┌─────────────────────────────────────────┐
│           Renderer Process              │
│   React App (UI, 상태 관리, 타이머 로직) │
│                                         │
│   [Component] → [Zustand Store]         │
│        ↕ ipcRenderer                   │
├─────────────────────────────────────────┤
│            Main Process                 │
│   ipcMain handlers → SQLite (DB)        │
│   시스템 트레이, 알림, 윈도우 관리        │
└─────────────────────────────────────────┘
```

- **Renderer**: React가 실행되는 브라우저 컨텍스트. UI 렌더링 및 타이머 상태 관리.
- **Main**: Node.js 환경. DB 접근, 파일 시스템, OS 알림 등 권한이 필요한 작업 담당.
- **IPC (contextBridge)**: preload 스크립트를 통해 `window.api` 로 노출된 채널만 사용. Renderer에서 Node API 직접 호출 금지.

---

## 디렉토리 구조

```
my-study-timer/
├── electron/
│   ├── main.ts          # 앱 진입점, 윈도우 생성, 시스템 트레이
│   ├── preload.ts       # contextBridge로 window.api 노출
│   ├── ipc/
│   │   ├── session.ts   # 세션 CRUD IPC 핸들러
│   │   ├── stats.ts     # 통계 조회 IPC 핸들러
│   │   ├── subject.ts   # 과목 CRUD IPC 핸들러
│   │   └── goal.ts      # 목표 설정 IPC 핸들러
│   └── db/
│       ├── index.ts     # DB 연결 및 초기화 (better-sqlite3)
│       ├── schema.ts    # 테이블 생성 SQL
│       └── queries/
│           ├── session.ts
│           ├── stats.ts
│           ├── subject.ts
│           └── goal.ts
├── src/                 # React (Renderer)
│   ├── main.tsx         # React 진입점
│   ├── types/
│   │   └── electron.d.ts    # window.api 타입 선언
│   ├── store/
│   │   ├── timerStore.ts    # 타이머 상태 (Zustand)
│   │   └── sessionStore.ts  # 세션 목록 상태 (Zustand)
│   ├── components/
│   │   ├── Timer/       # 타이머 디스플레이 & 컨트롤
│   │   ├── Session/     # 세션 시작·종료 폼
│   │   ├── Stats/       # 통계 차트 및 요약
│   │   └── Settings/    # 과목 관리, 목표 설정
│   └── hooks/
│       ├── useTimer.ts      # 타이머 tick 로직
│       └── useSession.ts    # IPC 호출 래핑
└── docs/
    └── Architecture.md
```

---

## 데이터베이스 스키마

```sql
-- 과목
CREATE TABLE subjects (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  color      TEXT    NOT NULL DEFAULT '#4A90E2',
  created_at INTEGER NOT NULL  -- UNIX timestamp
);

-- 학습 세션
CREATE TABLE sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id      INTEGER NOT NULL REFERENCES subjects(id),
  started_at      INTEGER NOT NULL,   -- UNIX timestamp
  ended_at        INTEGER,            -- NULL이면 진행 중
  target_seconds  INTEGER,            -- 세션 목표 시간 (선택)
  actual_seconds  INTEGER,            -- 실제 경과 시간 (ended_at 시점에 확정)
  paused_seconds  INTEGER NOT NULL DEFAULT 0, -- 누적 일시정지 시간
  paused_at       INTEGER,            -- 현재 일시정지 시작 시각 (진행 중 pause면 NOT NULL)
  memo            TEXT
);

-- 일별·과목별 목표
CREATE TABLE goals (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id     INTEGER REFERENCES subjects(id), -- NULL이면 전체 목표
  daily_seconds  INTEGER,
  weekly_seconds INTEGER
);
```

---

## 핵심 도메인 흐름

### 세션 시작 → 종료

```
[사용자] 과목 선택 + 목표 시간 설정 → [SessionForm]
    → timerStore.start(subjectId, targetSeconds)
    → window.api.session.create({ subjectId, targetSeconds, startedAt })
    → IPC → DB INSERT → 반환된 sessionId를 store에 저장
    → useTimer hook: setInterval(1s) tick → timerStore.tick()

[사용자] 정지/완료
    → timerStore.stop()
    → window.api.session.finish({ sessionId, endedAt, actualSeconds })
    → IPC → DB UPDATE
```

### 통계 조회

```
[Stats 화면 마운트]
    → window.api.stats.getDaily(date)   → IPC → GROUP BY subject, SUM(actual_seconds)
    → window.api.stats.getWeekly(year, week)
    → 결과를 sessionStore에 캐시 → 차트 컴포넌트 렌더링
```

---

## 상태 관리 (Zustand)

### timerStore
| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | `'idle' \| 'running' \| 'paused'` | 타이머 현재 상태 |
| `elapsed` | `number` | 현재 세션 경과 초 |
| `target` | `number \| null` | 목표 시간(초), 없으면 null |
| `activeSessionId` | `number \| null` | 진행 중인 세션 DB id |
| `subjectId` | `number \| null` | 현재 선택된 과목 |

### sessionStore
| 필드 | 타입 | 설명 |
|------|------|------|
| `sessions` | `Session[]` | 조회된 세션 목록 |
| `dailyStats` | `DailyStat[]` | 일별 통계 캐시 |
| `weeklyStats` | `WeeklyStat[]` | 주별 통계 캐시 |

---

## IPC 채널 목록

| 채널 | 방향 | 설명 |
|------|------|------|
| `session:create` | Renderer→Main | 세션 생성, sessionId 반환 |
| `session:pause` | Renderer→Main | 일시정지 시각 기록 (paused_at SET) |
| `session:resume` | Renderer→Main | 재개, paused_seconds 누적 후 paused_at NULL |
| `session:finish` | Renderer→Main | 세션 종료, actual_seconds 확정 |
| `session:list` | Renderer→Main | 날짜 범위 기준 세션 목록 조회 |
| `stats:daily` | Renderer→Main | 특정 날짜(started_at 기준)의 과목별 합계 |
| `stats:weekly` | Renderer→Main | 특정 주의 일별 합계 |
| `subject:list` | Renderer→Main | 모든 과목 조회 |
| `subject:create` | Renderer→Main | 과목 추가 |
| `subject:update` | Renderer→Main | 과목 이름·색상 수정 |
| `subject:delete` | Renderer→Main | 과목 삭제 |
| `goal:list` | Renderer→Main | 목표 목록 조회 |
| `goal:upsert` | Renderer→Main | 목표 추가 또는 덮어쓰기 |

모든 채널은 `preload.ts`의 `contextBridge.exposeInMainWorld('api', { ... })` 에 명시적으로 등록.

**IPC 입력 검증**: Main 프로세스의 각 핸들러 진입부에서 `zod` 스키마로 payload를 파싱한다. 검증 실패 시 Error를 throw해 Renderer에 반환. `contextBridge`만으로는 타입 안전성이 보장되지 않으므로 서버 경계와 동일하게 처리한다.

```ts
// 예시: electron/ipc/session.ts
const CreateSessionSchema = z.object({
  subjectId: z.number().int().positive(),
  targetSeconds: z.number().int().positive().nullable(),
  startedAt: z.number().int().positive(),
});
```

`window.api`의 타입은 `src/types/electron.d.ts`에 선언해 Renderer에서 타입 추론이 동작하도록 한다.

---

## 주요 설계 결정

- **타이머 tick은 Renderer에서만 관리**: `setInterval`은 React 레이어에서 실행. 백그라운드 상태에서도 윈도우가 살아있으므로 Main 프로세스 tick은 불필요.
- **SQLite 접근은 Main 프로세스만**: better-sqlite3는 동기 API이므로 Main에서만 호출. Renderer에서는 반드시 IPC를 거침.
- **ended_at NULL = 크래시 복구**: 앱 재시작 시 `ended_at IS NULL`인 세션을 감지해 이전 세션 이어받기 또는 폐기 여부를 사용자에게 묻는다.
- **시간은 모두 UNIX timestamp(초)로 저장**: 타임존 이슈를 줄이고 집계 쿼리를 단순화.
- **날짜 통계는 started_at 기준으로 집계**: 자정을 넘기는 세션(예: 23:50~00:20)은 시작일에 전량 귀속된다. 이 방식은 구현이 단순하고 사용자 체감과 대체로 일치한다. 쿼리에서 `DATE(started_at, 'unixepoch', 'localtime')`로 날짜를 추출한다.
- **일시정지 처리**: `paused_seconds` (누적)와 `paused_at` (현재 pause 시작 시각)를 sessions 테이블에 저장. pause → resume 시 `paused_seconds += (now - paused_at)`를 Main에서 계산해 DB에 기록. `actual_seconds = ended_at - started_at - paused_seconds`로 종료 시 확정. Renderer가 elapsed를 자체 계산해 넘기지 않으므로 조작·크래시 복구에 강하다.
