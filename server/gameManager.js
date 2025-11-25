// Default quiz list - can be extended via admin panel
let FULL_QUIZ_LIST = [
    { q: "왕이 넘어지면?", a: ["킹콩", "왕자", "전하", "낙마"], c: 0 },
    { q: "오리가 얼면?", a: ["빙수", "언덕", "오리무중", "동동"], c: 1 },
    { q: "가장 뜨거운 바다는?", a: ["동해", "홍해", "열받아", "불바다"], c: 2 },
    { q: "차가 울면?", a: ["자동차", "잉카", "울면", "경적"], c: 1 },
    { q: "아몬드가 죽으면?", a: ["다이아몬드", "구운아몬드", "아몬드가루", "죽음"], c: 0 },
    { q: "일어나게 하는 숫자는?", a: ["일", "다섯", "백", "천"], c: 1 },
    { q: "보내기 싫으면?", a: ["가위바위보", "주먹", "보자기", "악수"], c: 0 },
    { q: "싸움 좋아하는 나라는?", a: ["프랑스", "칠레", "브라질", "독일"], c: 1 },
    { q: "세상에서 제일 추운 바다는?", a: ["썰렁해", "동해", "북극해", "냉해"], c: 0 },
    { q: "비가 1시간 동안 오면?", a: ["추적60분", "장마", "소나기", "폭우"], c: 0 },
    { q: "불이 4곳에 나면?", a: ["불장난", "사파이어", "사방팔방", "캠프파이어"], c: 1 },
    { q: "도둑이 가장 좋아하는 돈은?", a: ["아주머니", "동전", "슬그머니", "거스름돈"], c: 2 },
    { q: "세상에서 가장 가난한 왕은?", a: ["임금님", "최저임금", "세종대왕", "전세금"], c: 1 },
    { q: "바나나가 웃으면?", a: ["바나나우유", "바나나킥", "델몬트", "몽키"], c: 1 },
    { q: "물고기의 반대말은?", a: ["육고기", "불고기", "생선", "노가리"], c: 1 },
    { q: "식인종이 밥투정 할 때 하는 말은?", a: ["배고파", "살맛나네", "맛없어", "엄마밥줘"], c: 1 },
    { q: "세상에서 가장 빠른 닭은?", a: ["양념치킨", "후다닭", "오골계", "토종닭"], c: 1 },
    { q: "별 중에 가장 슬픈 별은?", a: ["똥별", "샛별", "이별", "북극성"], c: 2 },
    { q: "소가 노래를 하면?", a: ["소음", "소송", "암소", "미소"], c: 1 },
    { q: "병균들 중에서 가장 높은 균은?", a: ["세균", "비누", "대장균", "유산균"], c: 2 }
];

class GameManager {
    constructor(io) {
        this.io = io;
        this.rooms = new Map();
    }

    handleConnection(socket) {
        // Send current room list to the new connection immediately
        socket.emit('rooms_update', this.getRoomList());

        socket.on('join_lobby', (data) => {
            if (typeof data === 'string') {
                socket.data.name = data;
                socket.data.char = 'Tanjiro';
            } else {
                socket.data.name = data.name;
                socket.data.char = data.char;
            }
            socket.emit('lobby_joined');
        });

        socket.on('create_room', () => {
            const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
            this.createRoom(roomId, socket);
        });

        socket.on('join_room', (roomId) => {
            this.joinRoom(roomId, socket);
        });

        socket.on('submit_answer', ({ roomId, answerIdx }) => {
            this.handleAnswer(roomId, socket, answerIdx);
        });
    }

    handleDisconnect(socket) {
        this.rooms.forEach((room, roomId) => {
            if (room.players.find(p => p.id === socket.id)) {
                this.io.to(roomId).emit('player_left', { playerId: socket.id });
                this.rooms.delete(roomId);
                this.broadcastRoomList();
            }
        });
    }

    getRoomList() {
        const roomList = [];
        this.rooms.forEach((room) => {
            if (room.state === 'WAITING') {
                roomList.push({
                    id: room.id,
                    host: room.players[0].name,
                    count: room.players.length,
                    status: room.state
                });
            }
        });
        return roomList;
    }

    broadcastRoomList() {
        this.io.emit('rooms_update', this.getRoomList());
    }

    createRoom(roomId, socket) {
        const room = {
            id: roomId,
            players: [{
                id: socket.id,
                name: socket.data.name || 'Player 1',
                char: socket.data.char || 'Tanjiro',
                hp: 100, score: 0, combo: 0
            }],
            state: 'WAITING',
            quizzes: [],
            currentQuizIndex: 0,
            timer: 10,
            timerInterval: null,
            answeredPlayers: new Set()
        };
        this.rooms.set(roomId, room);
        socket.join(roomId);
        socket.emit('room_created', roomId);
        socket.emit('player_update', room.players);
        this.broadcastRoomList();
    }

    joinRoom(roomId, socket) {
        const room = this.rooms.get(roomId);
        if (!room) {
            socket.emit('error_msg', 'Room not found');
            return;
        }
        if (room.players.length >= 2) {
            socket.emit('error_msg', 'Room full');
            return;
        }

        room.players.push({
            id: socket.id,
            name: socket.data.name || 'Player 2',
            char: socket.data.char || 'Gojo',
            hp: 100, score: 0, combo: 0
        });
        socket.join(roomId);
        this.io.to(roomId).emit('player_update', room.players);

        if (room.players.length === 2) {
            this.startGame(roomId);
        }
        this.broadcastRoomList();
    }

    startGame(roomId) {
        const room = this.rooms.get(roomId);
        room.state = 'BATTLE';
        const shuffled = [...FULL_QUIZ_LIST].sort(() => 0.5 - Math.random());
        room.quizzes = shuffled.slice(0, 10);
        room.currentQuizIndex = 0;

        this.io.to(roomId).emit('game_start', {
            p1Name: room.players[0].name,
            p2Name: room.players[1].name,
            p1Char: room.players[0].char,
            p2Char: room.players[1].char
        });

        this.broadcastRoomList();

        setTimeout(() => {
            this.startRound(roomId);
        }, 2000);
    }

    startRound(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        if (room.currentQuizIndex >= room.quizzes.length || room.players.some(p => p.hp <= 0)) {
            this.endGame(roomId);
            return;
        }

        const quiz = room.quizzes[room.currentQuizIndex];
        room.timer = 10;
        room.answeredPlayers = new Set();
        room.players.forEach(p => p.lastAnswer = null);

        this.io.to(roomId).emit('new_quiz', {
            q: quiz.q,
            a: quiz.a,
            round: room.currentQuizIndex + 1,
            total: room.quizzes.length
        });

        if (room.timerInterval) clearInterval(room.timerInterval);
        room.timerInterval = setInterval(() => {
            room.timer -= 1;
            this.io.to(roomId).emit('timer_update', room.timer);

            if (room.timer <= 0) {
                clearInterval(room.timerInterval);
                this.resolveRound(roomId, true);
            }
        }, 1000);
    }

    handleAnswer(roomId, socket, answerIdx) {
        const room = this.rooms.get(roomId);
        if (!room || room.state !== 'BATTLE') return;

        console.log(`[${roomId}] Player ${socket.id} answered: ${answerIdx}`);

        if (room.answeredPlayers.has(socket.id)) {
            console.log(`[${roomId}] Player ${socket.id} already answered.`);
            return;
        }
        room.answeredPlayers.add(socket.id);

        const quiz = room.quizzes[room.currentQuizIndex];
        const isCorrect = answerIdx === quiz.c;
        const player = room.players.find(p => p.id === socket.id);

        if (player) {
            player.lastAnswer = { isCorrect, answerIdx };
        }

        // Send immediate feedback to the player
        socket.emit('answer_ack', { isCorrect, answerIdx });

        console.log(`[${roomId}] Answered count: ${room.answeredPlayers.size} / ${room.players.length}`);

        // Immediately resolve when all players have answered
        if (room.answeredPlayers.size === room.players.length) {
            console.log(`[${roomId}] All players answered. Resolving round immediately.`);
            clearInterval(room.timerInterval);
            // Add small delay for better UX (players see their answer registered)
            setTimeout(() => {
                this.resolveRound(roomId);
            }, 500);
        }
    }

    resolveRound(roomId, timeOver = false) {
        const room = this.rooms.get(roomId);
        const quiz = room.quizzes[room.currentQuizIndex];

        const p1 = room.players[0];
        const p2 = room.players[1];

        const p1Correct = p1.lastAnswer?.isCorrect;
        const p2Correct = p2.lastAnswer?.isCorrect;

        let action = 'NONE';

        if (p1Correct && !p2Correct) {
            p2.hp -= 20;
            action = 'P1_ATTACK';
            p1.combo++; p2.combo = 0;
        } else if (!p1Correct && p2Correct) {
            p1.hp -= 20;
            action = 'P2_ATTACK';
            p2.combo++; p1.combo = 0;
        } else if (p1Correct && p2Correct) {
            p1.hp -= 10;
            p2.hp -= 10;
            action = 'CLASH';
            p1.combo++; p2.combo++;
        } else {
            action = 'BOTH_MISS';
            p1.combo = 0; p2.combo = 0;
        }

        p1.hp = Math.max(0, p1.hp);
        p2.hp = Math.max(0, p2.hp);

        this.io.to(roomId).emit('round_result', {
            action,
            hp: { p1: p1.hp, p2: p2.hp },
            combo: { p1: p1.combo, p2: p2.combo },
            correctAnswer: quiz.c,
            p1Answer: p1.lastAnswer?.answerIdx,
            p2Answer: p2.lastAnswer?.answerIdx
        });

        setTimeout(() => {
            room.currentQuizIndex++;
            this.startRound(roomId);
        }, 1800); // Quick transition for better game flow
    }

    endGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.state = 'END';
        const p1 = room.players[0];
        const p2 = room.players[1];

        let winnerId = null;
        if (p1.hp > p2.hp) winnerId = p1.id;
        else if (p2.hp > p1.hp) winnerId = p2.id;
        else winnerId = 'DRAW';

        this.io.to(roomId).emit('game_over', {
            winnerId,
            scores: { p1: p1.score, p2: p2.score }
        });

        this.rooms.delete(roomId);
        this.broadcastRoomList();
    }

    // Admin Quiz Management Methods
    getAllQuizzes() {
        return FULL_QUIZ_LIST;
    }

    addQuiz(quiz) {
        // Validate quiz format with detailed checks
        if (!quiz || typeof quiz !== 'object') {
            throw new Error('Quiz must be an object');
        }
        if (!quiz.q || typeof quiz.q !== 'string' || quiz.q.trim() === '') {
            throw new Error('Quiz question (q) must be a non-empty string');
        }
        if (!Array.isArray(quiz.a)) {
            throw new Error('Answers (a) must be an array');
        }
        if (quiz.a.length !== 4) {
            throw new Error('Answers array must have exactly 4 elements');
        }
        // Check all answers are non-empty strings
        for (let i = 0; i < quiz.a.length; i++) {
            if (typeof quiz.a[i] !== 'string' || quiz.a[i].trim() === '') {
                throw new Error(`Answer ${i + 1} must be a non-empty string`);
            }
        }
        if (typeof quiz.c !== 'number' || !Number.isInteger(quiz.c)) {
            throw new Error('Correct answer index (c) must be an integer');
        }
        if (quiz.c < 0 || quiz.c > 3) {
            throw new Error('Correct answer index (c) must be between 0 and 3');
        }

        FULL_QUIZ_LIST.push(quiz);
        return FULL_QUIZ_LIST.length - 1;
    }

    addBulkQuizzes(quizzes) {
        const results = { success: 0, failed: 0, errors: [] };

        if (!Array.isArray(quizzes)) {
            throw new Error('Quizzes must be an array');
        }

        quizzes.forEach((quiz, index) => {
            try {
                this.addQuiz(quiz);
                results.success++;
                console.log(`✅ Quiz ${index + 1} added successfully`);
            } catch (error) {
                results.failed++;
                results.errors.push({
                    index,
                    quiz: quiz,
                    error: error.message
                });
                console.error(`❌ Quiz ${index + 1} failed:`, error.message, quiz);
            }
        });

        console.log(`📊 Bulk add results: ${results.success} success, ${results.failed} failed`);
        return results;
    }

    deleteQuiz(index) {
        if (index < 0 || index >= FULL_QUIZ_LIST.length) {
            throw new Error('Invalid quiz index');
        }
        FULL_QUIZ_LIST.splice(index, 1);
    }

    updateQuiz(index, quiz) {
        if (index < 0 || index >= FULL_QUIZ_LIST.length) {
            throw new Error('Invalid quiz index');
        }
        if (!quiz.q || !Array.isArray(quiz.a) || quiz.a.length !== 4 || typeof quiz.c !== 'number') {
            throw new Error('Invalid quiz format');
        }
        FULL_QUIZ_LIST[index] = quiz;
    }
}

module.exports = GameManager;
