# 🗺️ BattleQZ 개발 로드맵

## 현재 상태 (v1.0)

- ✅ 실시간 1:1 배틀 퀴즈 게임
- ✅ Socket.io 기반 멀티플레이어
- ✅ 관리자 패널 (퀴즈 CRUD, CSV 업로드, AI 생성)
- ✅ Gemini AI 퀴즈 생성기
- ✅ 한국어 말장난 퀴즈 22개 기본 제공

## 향후 개발 계획

### Phase 1: 프레임워크 모듈화 🔧

**목표**: 공통 퀴즈 셋을 유지하면서 다양한 게임 모드 지원

**아키텍처 설계**:

```
quiz-game-framework/
├── core/                          # 공통 코어 시스템
│   ├── network/                   # Socket.io 서버 & 방 관리
│   ├── quiz/                      # 퀴즈 관리 (CRUD, AI 생성)
│   └── client/                    # Admin, Lobby 공통 컴포넌트
│
├── games/                         # 게임 모드 플러그인
│   ├── battle-quiz/              # 현재 배틀 모드
│   ├── speed-quiz/               # 속도 대결 모드 (예정)
│   ├── team-quiz/                # 팀 대결 모드 (예정)
│   └── survival-quiz/            # 서바이벌 모드 (예정)
│
└── shared/                        # 공유 유틸리티
```

**핵심 기능**:
- 📦 **공통 퀴즈 DB**: 모든 게임 모드가 동일한 퀴즈 셋 사용
- 🎮 **게임 선택 UI**: 로비에서 게임 모드 선택
- 🔌 **플러그인 시스템**: 새 게임 추가 시 GameLogic만 구현
- 🔄 **게임 간 전환**: 같은 문제로 다른 게임 플레이 가능

**구현 내용**:

1. **코어 모듈 분리**
   - `QuizManager`: 퀴즈 CRUD 및 AI 생성 (gameManager.js에서 분리)
   - `SocketServer`: Socket.io 연결 및 방 관리 추상화
   - `RoomManager`: 방 생성/삭제/목록 관리
   - `QuizAPI`: REST API 엔드포인트 분리

2. **게임 로직 인터페이스**
   ```javascript
   class GameLogic {
       constructor(room, quizManager) { }
       startGame() { }
       handleAnswer(player, answer) { }
       calculateScore() { }
       endGame() { }
   }
   ```

3. **게임 등록 시스템**
   ```javascript
   // 서버에서 게임 모드 등록
   socketServer.registerGame('battle', BattleGameLogic);
   socketServer.registerGame('speed', SpeedGameLogic);
   socketServer.registerGame('team', TeamGameLogic);

   // 클라이언트에서 게임 선택
   socket.emit('create_room', { gameType: 'speed' });
   ```

4. **클라이언트 재구성**
   - 게임 선택 화면 추가
   - 각 게임 컴포넌트 독립 모듈화
   - 공통 UI 컴포넌트 재사용

**기대 효과**:
- ✨ Gemini Jam 프로젝트들을 같은 프레임워크로 통합
- 🚀 새 게임 모드 빠른 추가 (GameLogic만 구현)
- 🔧 유지보수 용이 (모듈별 독립 수정)
- 📚 코드 재사용성 극대화

---

### Phase 2: 사용자 시스템 & DB 확장 👥

**목표**: 사용자 계정, 통계, 랭킹 시스템 구축

**기술 스택 추가**:
- 데이터베이스: MongoDB / PostgreSQL
- 인증: JWT / Session
- ORM: Mongoose / Prisma

**핵심 기능**:

1. **사용자 인증**
   - 회원가입 / 로그인
   - 소셜 로그인 (Google, GitHub)
   - 비밀번호 암호화 (bcrypt)
   - JWT 토큰 기반 인증

2. **사용자 프로필**
   - 닉네임, 아바타 설정
   - 전적 통계 (승률, 게임 수)
   - 레벨 시스템
   - 칭호/업적 시스템

3. **게임 기록 저장**
   ```javascript
   GameHistory {
       userId: ObjectId,
       gameType: 'battle' | 'speed' | 'team',
       result: 'win' | 'lose' | 'draw',
       score: Number,
       quizzesSolved: Number,
       accuracy: Number,
       timestamp: Date
   }
   ```

4. **랭킹 시스템**
   - 전체 랭킹
   - 게임 모드별 랭킹
   - 주간/월간 랭킹
   - 친구 랭킹

5. **관리자 권한 시스템**
   - 관리자 로그인 분리
   - 역할 기반 접근 제어 (RBAC)
   - 퀴즈 관리 권한
   - 사용자 관리 (밴, 통계 조회)

6. **퀴즈 DB 확장**
   ```javascript
   Quiz {
       question: String,
       answers: [String],
       correctIndex: Number,
       category: String,        // NEW
       difficulty: Number,      // NEW
       tags: [String],          // NEW
       creator: ObjectId,       // NEW
       usage: Number,           // NEW (사용 횟수)
       rating: Number           // NEW (평가)
   }
   ```

7. **퀴즈 필터링**
   - 카테고리별 퀴즈 선택
   - 난이도 조절
   - 커스텀 퀴즈 세트 생성

**API 확장**:
```
POST   /api/auth/register        # 회원가입
POST   /api/auth/login           # 로그인
GET    /api/users/profile        # 프로필 조회
GET    /api/users/stats          # 통계 조회
GET    /api/ranking              # 랭킹 조회
POST   /api/games/history        # 게임 기록 저장
GET    /api/quizzes?category=    # 카테고리별 퀴즈
```

---

### Phase 3: 고급 기능 🚀

**추가 기능 아이디어**:

1. **매치메이킹**
   - 레벨 기반 자동 매칭
   - ELO 레이팅 시스템
   - 대기 시간 최적화

2. **친구 시스템**
   - 친구 추가/삭제
   - 친구 초대
   - 친구와 비공개 방

3. **채팅 시스템**
   - 게임 내 채팅
   - 로비 채팅
   - 이모티콘 지원

4. **리플레이 시스템**
   - 게임 리플레이 저장
   - 리플레이 공유
   - 하이라이트 클립

5. **커스터마이징**
   - 캐릭터 스킨
   - 배경 테마
   - 효과음/BGM 선택

6. **이벤트 시스템**
   - 일일 미션
   - 주간 챌린지
   - 시즌 패스

7. **모바일 앱**
   - React Native로 포팅
   - 푸시 알림
   - 오프라인 모드

---

## 개발 원칙

### 점진적 개발
- 각 Phase는 이전 Phase가 완료되고 안정화된 후 진행
- 각 기능은 독립적으로 테스트 가능해야 함
- 기존 기능을 깨지 않는 것이 최우선

### 모듈화 우선
- 새 기능 추가 시 기존 코드 영향 최소화
- 플러그인 방식으로 확장 가능하게
- 의존성 최소화

### 사용자 경험
- 빠른 로딩 시간 유지
- 직관적인 UI/UX
- 접근성 고려

### 보안
- API 키 안전한 관리
- 사용자 데이터 암호화
- SQL Injection, XSS 방지

---

## 버전 계획

- **v1.0** (현재): 배틀 퀴즈 게임 + 관리자 패널
- **v2.0**: 모듈화 프레임워크 + 멀티 게임 모드
- **v3.0**: 사용자 시스템 + DB 통합
- **v4.0**: 고급 기능 (매치메이킹, 친구, 랭킹)
- **v5.0**: 모바일 앱 + 크로스 플랫폼

---

## 기여

이 로드맵은 유동적이며, 커뮤니티 피드백에 따라 우선순위가 변경될 수 있습니다.

새로운 아이디어나 제안은 GitHub Issues에서 논의해주세요!
