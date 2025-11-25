# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**Battle Quiz**는 실시간 멀티플레이어 퀴즈 배틀 게임입니다. 두 명의 플레이어가 한국어 말장난 퀴즈를 풀며 대결하고, 정답 여부에 따라 상대방을 공격하거나 피해를 입습니다.

## 아키텍처

### 기술 스택

**클라이언트** (`/client`)
- React 19 + Vite
- Socket.io-client (실시간 통신)
- Tailwind CSS 4 (스타일링)
- HTML5 Canvas (배틀 애니메이션)

**서버** (`/server`)
- Node.js + Express 5
- Socket.io (WebSocket 서버)
- CORS 지원

### 프로젝트 구조

```
battleQZ/
├── client/              # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── Lobby.jsx          # 로비 화면 (방 생성/참가)
│   │   │   ├── BattleGame.jsx     # 게임 메인 컨트롤러
│   │   │   └── GameCanvas.jsx     # Canvas 기반 배틀 애니메이션
│   │   ├── utils/
│   │   │   └── SoundManager.js    # 사운드 효과 관리
│   │   ├── socket.js              # Socket.io 클라이언트 싱글톤
│   │   ├── App.jsx                # 루트 컴포넌트 (Lobby ↔ BattleGame 전환)
│   │   └── main.jsx
│   └── package.json
└── server/              # Node.js 백엔드
    ├── index.js         # Express + Socket.io 서버 엔트리포인트
    ├── gameManager.js   # 게임 로직 및 상태 관리 (방, 플레이어, 퀴즈, 타이머)
    └── package.json
```

## 최근 업데이트

### 2025-11-25 주요 개선사항

1. **답변 즉시 처리**: 두 플레이어 모두 답변 시 타이머 즉시 종료 및 0.5초 후 라운드 진행 (기존 대기 시간 제거)
2. **관리자 패널**: 퀴즈 CRUD, CSV 일괄 업로드, **Gemini AI 문제 생성** 완료
3. **로비 UI/UX 대폭 개선**: 그라데이션, 애니메이션, 더 나은 레이아웃
4. **CSV 한글 인코딩 수정**: UTF-8 BOM 추가로 엑셀에서도 한글 정상 표시
5. **AI 문제 생성 시스템**: Gemini API 통합, 사용자별 API 키 관리, 실시간 퀴즈 생성 및 미리보기

## 핵심 시스템 설계

### 1. 실시간 통신 아키텍처 (Socket.io)

**연결 흐름**:
```
Client → socket.connect() → Server (io.on('connection'))
         ↓
   join_lobby (이름 전송)
         ↓
   create_room / join_room
         ↓
   game_start (2명 입장 시 자동 시작)
         ↓
   new_quiz → submit_answer → round_result
         ↓
   game_over
```

**주요 이벤트**:
- `join_lobby`: 플레이어 이름 및 캐릭터 설정
- `create_room` / `join_room`: 방 생성/참가
- `rooms_update`: 대기 중인 방 목록 브로드캐스트
- `game_start`: 게임 시작 (2명 입장 시)
- `new_quiz`: 새 퀴즈 라운드 시작
- `timer_update`: 타이머 카운트다운 (10초)
- `submit_answer`: 플레이어 답변 제출
- `answer_ack`: 답변 즉시 피드백
- `round_result`: 라운드 결과 (공격, HP, 콤보)
- `game_over`: 게임 종료 (승자 결정)
- `player_left`: 플레이어 나감 → 방 삭제

### 2. 게임 상태 관리 (GameManager)

**서버 측 상태** (`gameManager.js`):
```javascript
rooms = Map {
  roomId: {
    id: string,              // 방 ID (5자리 대문자)
    players: [               // 플레이어 배열 (최대 2명)
      { id, name, char, hp, score, combo, lastAnswer }
    ],
    state: 'WAITING' | 'BATTLE' | 'END',
    quizzes: [],            // 전체 퀴즈 중 랜덤 10개
    currentQuizIndex: 0,
    timer: 10,
    timerInterval: NodeJS.Timeout,
    answeredPlayers: Set    // 답변 완료한 플레이어 추적
  }
}
```

**퀴즈 데이터 구조**:
```javascript
{
  q: "왕이 넘어지면?",           // 문제
  a: ["킹콩", "왕자", ...],      // 선택지 (4개)
  c: 0                           // 정답 인덱스
}
```

**라운드 해결 로직** (`resolveRound`):
- 두 플레이어 모두 답변 OR 타이머 종료 시 실행
- 정답 여부에 따라 HP 감소 및 액션 결정:
  - `P1_ATTACK`: P1만 정답 → P2 HP -20
  - `P2_ATTACK`: P2만 정답 → P1 HP -20
  - `CLASH`: 둘 다 정답 → 양쪽 HP -10
  - `BOTH_MISS`: 둘 다 오답 → 액션 없음
- 콤보 시스템: 연속 정답 시 콤보 증가, 오답 시 초기화

### 3. Canvas 애니메이션 시스템 (GameCanvas.jsx)

**애니메이션 상태 머신**:
```
Fighter.state: 'IDLE' | 'DASH' | 'ATTACK' | 'HIT' | 'FALL'
```

**공격 시퀀스** (`performAttackSequence`):
1. 공격자: DASH (돌진) → 중앙으로 이동
2. 공격자: ATTACK (공격 모션) → 이펙트 파티클 생성
3. 방어자: HIT (피격) → 뒤로 넉백
4. hitStop (히트스톱) → 화면 흔들림 (shakeIntensity)
5. 양쪽 IDLE로 복귀

**충돌 시퀀스** (`performClash`):
- 양쪽 동시에 DASH → 중앙에서 만남
- 쇼크웨이브 이펙트 생성
- 양쪽 뒤로 넉백 후 IDLE

**렌더링 루프**:
- `requestAnimationFrame` 기반 60fps 렌더링
- 파티클, 쇼크웨이브, 카메라 흔들림 효과 관리
- Imgur 호스팅 이미지 사용 (캐릭터 스프라이트, 이펙트)

### 4. 클라이언트 컴포넌트 역할

**App.jsx**:
- `gameData` 상태로 Lobby ↔ BattleGame 화면 전환
- 게임 참가 시 `{ roomId, playerId }` 전달

**Lobby.jsx**:
- 플레이어 이름 입력 및 캐릭터 선택
- 방 목록 표시 (실시간 업데이트)
- 방 생성 / 참가 버튼

**BattleGame.jsx**:
- Socket.io 이벤트 리스너 등록
- 퀴즈 UI 및 답변 버튼 렌더링
- 피드백 표시 (정답/오답)
- 타이머, HP 바, 콤보 표시
- GameCanvas에 애니메이션 명령 전달

**GameCanvas.jsx**:
- `useImperativeHandle`로 `initGame`, `performAttack`, `performClash` 메서드 노출
- 파티클 시스템, 히트스톱, 카메라 셰이크
- 캐릭터별 색상 및 스프라이트 관리

**SoundManager.js**:
- BGM 및 효과음 관리 (Web Audio API)
- 음소거 기능

**Admin.jsx**:
- 관리자 패널 UI (4개 탭: 목록, 추가, CSV, AI)
- 퀴즈 목록 조회, 추가, 수정, 삭제
- CSV 파일 일괄 업로드 (UTF-8 BOM 지원)
- **Gemini AI 퀴즈 생성**: 프롬프트 기반 자동 생성, 미리보기, 일괄 저장

**ApiKeySettings.jsx**:
- Gemini API 키 관리 UI
- localStorage 기반 사용자별 키 저장
- API 키 테스트 기능
- 보안 안내 및 발급 가이드

## 관리자 기능

### REST API 엔드포인트

서버는 퀴즈 관리를 위한 REST API를 제공합니다:

```javascript
GET    /api/quizzes          // 전체 퀴즈 목록 조회
POST   /api/quizzes          // 새 퀴즈 추가
POST   /api/quizzes/bulk     // CSV 일괄 업로드
PUT    /api/quizzes/:index   // 퀴즈 수정
DELETE /api/quizzes/:index   // 퀴즈 삭제
```

### CSV 업로드 형식

```csv
문제,답1,답2,답3,답4,정답번호(0-3)
왕이 넘어지면?,킹콩,왕자,전하,낙마,0
오리가 얼면?,빙수,언덕,오리무중,동동,1
```

### 관리자 패널 접근

- 로비 화면 우측 상단 설정(⚙️) 버튼 클릭
- 4개 탭: 퀴즈 목록, 퀴즈 추가, CSV 업로드, AI 생성

### AI 문제 생성 (Gemini API)

**설정 방법**:
1. 관리자 패널 → AI 생성 탭 → "API 키 설정" 버튼
2. Google AI Studio에서 API 키 발급: https://aistudio.google.com/app/apikey
3. 발급받은 키를 입력 후 "저장" (localStorage에 저장)
4. "API 테스트" 버튼으로 키 유효성 확인

**사용 방법**:
1. AI 생성 탭에서 원하는 주제/스타일 입력
   - 예: "동물 관련 재미있는 말장난 퀴즈 10개"
   - 예: "음식을 주제로 한 유머 퀴즈 5개"
2. "AI로 퀴즈 생성하기" 버튼 클릭
3. 생성된 퀴즈 미리보기 확인
4. "모두 저장" 버튼으로 데이터베이스에 추가

**기술 세부사항**:
- 모델: `gemini-2.5-flash` (2025년 최신 버전)
- 클라이언트측 API 호출 (서버에 키 저장 안 함)
- 응답 형식: JSON 배열 자동 파싱
- 퀴즈 형식 검증 후 자동 필터링
- temperature: 0.9 (창의성 향상)
- maxOutputTokens: 8192 (충분한 퀴즈 생성 보장)
- 입력 토큰 한도: 1M 토큰
- 출력 토큰 한도: 65K 토큰

## 개발 명령어

### 클라이언트 (`/client`)

```bash
# 개발 서버 실행 (Vite)
npm run dev              # http://localhost:5173

# 프로덕션 빌드
npm run build

# ESLint 검사
npm run lint

# 프리뷰 (빌드된 결과 확인)
npm run preview
```

### 서버 (`/server`)

```bash
# 서버 실행
node index.js            # http://localhost:3000

# 테스트 (현재 미구현)
npm test
```

### 전체 개발 워크플로우

1. **서버 먼저 시작**:
   ```bash
   cd server
   npm install              # 최초 1회
   node index.js
   ```

2. **클라이언트 시작** (별도 터미널):
   ```bash
   cd client
   npm install              # 최초 1회
   npm run dev
   ```

3. 브라우저에서 `http://localhost:5173` 접속
4. 두 개의 브라우저 탭/윈도우로 2명의 플레이어 시뮬레이션 가능

## 중요 구현 세부사항

### 동시성 처리

- **개선된 즉시 처리**: 두 플레이어 모두 답변 시 타이머 즉시 종료 + 0.5초 후 라운드 진행
- `answeredPlayers` Set으로 중복 답변 방지
- 타이머 종료 시 미답변 플레이어는 자동으로 오답 처리
- 라운드 전환 시간: 1.8초 (기존 2.5초에서 단축)

### 상태 동기화

- 서버가 모든 게임 상태의 단일 진실 공급원 (Single Source of Truth)
- 클라이언트는 `round_result` 이벤트로 HP, 콤보 업데이트
- 애니메이션은 클라이언트 측에서 독립적으로 실행 (서버 부하 감소)

### 방 관리

- 방 ID는 5자리 랜덤 대문자 (`Math.random().toString(36).substring(2, 7).toUpperCase()`)
- 플레이어 나가면 방 자동 삭제
- `WAITING` 상태 방만 목록에 표시

### 타이머 정확도

- 서버 측 `setInterval`로 1초마다 `timer_update` 브로드캐스트
- 클라이언트는 서버 시간 기준으로 UI 업데이트 (네트워크 지연 최소화)

## 알려진 제약사항 및 TODO

1. **서버 URL 하드코딩**: `client/src/socket.js` 및 `Admin.jsx`에 `http://localhost:3000` 고정
   - 프로덕션 배포 시 환경 변수로 변경 필요

2. **이미지 외부 호스팅**: Imgur 링크 사용
   - 링크 만료 시 이미지 깨짐 가능
   - 프로덕션 환경에서는 CDN 또는 로컬 호스팅 권장

3. **테스트 부재**: 서버/클라이언트 모두 테스트 코드 미구현

4. **에러 핸들링**: 네트워크 오류, 연결 끊김 등 예외 상황 처리 부족

5. **보안**:
   - 프로덕션 환경에서는 CORS 설정 강화 필요 (현재 `origin: "*"`)
   - 관리자 패널 인증 없음 (누구나 접근 가능)

6. **퀴즈 데이터 영속성**:
   - 현재 메모리에만 저장 (서버 재시작 시 관리자가 추가한 퀴즈 소실)
   - 프로덕션에서는 데이터베이스 연동 필요

7. **API 키 보안**:
   - Gemini API 키는 브라우저 localStorage에 저장
   - 공용 컴퓨터에서 사용 시 주의 필요
   - 클라이언트측 API 호출로 서버 노출 방지

## 디버깅 팁

- **서버 로그**: 콘솔에 플레이어 답변 및 라운드 해결 로그 출력
- **클라이언트 디버깅**: React DevTools + 브라우저 콘솔에서 Socket.io 이벤트 확인
- **네트워크 탭**: WebSocket 프레임 검사로 실시간 통신 모니터링
- **동시 플레이 테스트**: 시크릿 모드 + 일반 모드로 동일 PC에서 2인 플레이 가능
