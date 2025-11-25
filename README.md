# ⚔️ Battle Quiz

실시간 멀티플레이어 퀴즈 배틀 게임! 재미있는 한국어 말장난 퀴즈로 친구와 대결하세요.

## 🎮 게임 특징

- **실시간 대전**: Socket.io 기반 실시간 2인 대전
- **말장난 퀴즈**: 재미있는 한국어 말장난 문제
- **배틀 애니메이션**: HTML5 Canvas 기반 역동적인 전투 장면
- **AI 문제 생성**: Gemini AI로 무한한 퀴즈 생성
- **관리자 패널**: 퀴즈 관리, CSV 업로드, AI 생성

## 🚀 빠른 시작

### 서버 실행
```bash
cd server
npm install
node index.js
```

### 클라이언트 실행
```bash
cd client
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 🎯 게임 규칙

- 2명의 플레이어가 필요합니다
- 각 라운드마다 퀴즈가 출제됩니다
- **정답**: 상대방 공격 (-20 HP)
- **오답**: 자신이 피해 입음
- **둘 다 정답**: 충돌 (양쪽 -10 HP)
- **연속 정답**: 콤보 시스템

## 🤖 AI 문제 생성

1. 관리자 패널 접속 (우측 상단 ⚙️)
2. AI 생성 탭 → "API 키 설정"
3. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 API 키 발급
4. 원하는 주제로 퀴즈 생성!

## 🛠️ 기술 스택

### Frontend
- React 19
- Vite
- Tailwind CSS 4
- Socket.io Client
- HTML5 Canvas

### Backend
- Node.js
- Express 5
- Socket.io
- REST API

### AI
- Gemini 2.5 Flash API
- 클라이언트측 API 호출

## 📁 프로젝트 구조

```
battleQZ/
├── client/              # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── Lobby.jsx
│   │   │   ├── BattleGame.jsx
│   │   │   ├── GameCanvas.jsx
│   │   │   ├── Admin.jsx
│   │   │   └── ApiKeySettings.jsx
│   │   ├── utils/
│   │   │   └── SoundManager.js
│   │   └── socket.js
│   └── package.json
├── server/              # Node.js 백엔드
│   ├── index.js
│   ├── gameManager.js
│   └── package.json
├── CLAUDE.md           # 개발자 가이드
└── README.md
```

## 🔐 보안

- API 키는 브라우저 localStorage에만 저장
- 서버에 API 키 전송 안 함
- 클라이언트측 직접 API 호출
- 공용 컴퓨터 사용 시 키 삭제 권장

## 📝 관리자 기능

### REST API
```
GET    /api/quizzes          # 전체 퀴즈 조회
POST   /api/quizzes          # 퀴즈 추가
POST   /api/quizzes/bulk     # CSV 일괄 업로드
PUT    /api/quizzes/:index   # 퀴즈 수정
DELETE /api/quizzes/:index   # 퀴즈 삭제
```

### CSV 업로드 형식
```csv
문제,답1,답2,답3,답4,정답번호(0-3)
왕이 넘어지면?,킹콩,왕자,전하,낙마,0
오리가 얼면?,빙수,언덕,오리무중,동동,1
```

## 🎨 주요 개선사항 (2025-11-25)

1. ⚡ **답변 즉시 처리**: 두 플레이어 답변 시 즉시 진행
2. 🤖 **Gemini AI 통합**: 자동 퀴즈 생성
3. 🎨 **로비 UI 개선**: 그라데이션, 애니메이션
4. 📤 **CSV 업로드**: UTF-8 BOM 지원
5. ⚙️ **관리자 패널**: 완전한 퀴즈 관리 시스템

## 🗺️ 향후 개발 계획

상세한 로드맵은 [ROADMAP.md](./ROADMAP.md)를 참고하세요.

**Phase 1 - 프레임워크 모듈화**:
- 공통 퀴즈 DB 유지하며 다양한 게임 모드 지원
- 플러그인 방식으로 새 게임 추가
- 로비에서 게임 모드 선택 (배틀/스피드/팀전/서바이벌 등)

**Phase 2 - 사용자 시스템**:
- 회원가입/로그인
- 프로필, 전적, 랭킹
- 게임 기록 저장
- 관리자 권한 시스템

**Phase 3 - 고급 기능**:
- 매치메이킹 시스템
- 친구 시스템
- 리플레이 & 하이라이트
- 모바일 앱

## 📄 라이선스

-MIT License

-박권
