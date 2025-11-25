import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import GameCanvas from './GameCanvas';
import { soundMgr } from '../utils/SoundManager';
import { Zap, Skull, RefreshCw, Volume2, VolumeX } from 'lucide-react';

const IMG_SOURCES = {
    intro_tanjiro: "https://i.imgur.com/f5A8RgG.png",
    intro_gojo: "https://i.imgur.com/0hYV1Mj.png",
};

export default function BattleGame({ roomId, playerId }) {
    const [gameState, setGameState] = useState('WAITING'); // WAITING, BATTLE, END
    const [players, setPlayers] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [timer, setTimer] = useState(10);
    const [feedback, setFeedback] = useState(null);
    const [result, setResult] = useState(null);
    const [combo, setCombo] = useState({ p1: 0, p2: 0 });
    const [muted, setMuted] = useState(false);

    const canvasRef = useRef(null);

    useEffect(() => {
        soundMgr.init();
        soundMgr.startBattleBgm();
        return () => soundMgr.stopBattleBgm();
    }, []);

    useEffect(() => {
        // Initial listeners
        socket.on('player_update', (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        socket.on('game_start', ({ p1Name, p2Name, p1Char, p2Char }) => {
            setGameState('BATTLE');
            canvasRef.current?.initGame(p1Name, p2Name, p1Char, p2Char);
        });

        socket.on('new_quiz', (quizData) => {
            setCurrentQuiz(quizData);
            setTimer(10);
            setFeedback(null);
        });

        socket.on('timer_update', (time) => {
            setTimer(time);
        });

        socket.on('round_result', async (data) => {
            // data: { action, hp, combo, correctAnswer, p1Answer, p2Answer }

            // Update HP locally for visual immediately or wait?
            // Let's update HP after animation or immediately?
            // Server sends new HP.
            setPlayers(prev => {
                const newP = [...prev];
                if (newP[0]) { newP[0].hp = data.hp.p1; newP[0].combo = data.combo.p1; }
                if (newP[1]) { newP[1].hp = data.hp.p2; newP[1].combo = data.combo.p2; }
                return newP;
            });

            // Show feedback for my answer
            const myIdx = players.findIndex(p => p.id === socket.id);
            const myAnswer = myIdx === 0 ? data.p1Answer : data.p2Answer;
            const isCorrect = myAnswer === data.correctAnswer;

            if (isCorrect) soundMgr.sfxCorrect();
            else soundMgr.sfxWrong();

            setFeedback({
                show: true,
                isCorrect,
                correctIdx: data.correctAnswer,
                myAnswerIdx: myAnswer
            });

            // Trigger Animation
            if (data.action === 'P1_ATTACK' || data.action === 'P2_ATTACK' || data.action === 'CLASH') {
                soundMgr.sfxAttack();
                setTimeout(() => soundMgr.sfxHit(), 500);
            }

            if (data.action === 'P1_ATTACK') {
                await canvasRef.current?.performAttack('p1');
            } else if (data.action === 'P2_ATTACK') {
                await canvasRef.current?.performAttack('p2');
            } else if (data.action === 'CLASH') {
                await canvasRef.current?.performClash();
            } else {
                // Both miss or nothing
                canvasRef.current?.triggerShake();
            }
        });

        socket.on('game_over', ({ winnerId, scores }) => {
            setGameState('END');
            const isWin = winnerId === socket.id;
            const isDraw = winnerId === 'DRAW';
            setResult({ isWin, isDraw, scores });
        });

        socket.on('player_left', () => {
            alert('상대방이 나갔습니다.');
            window.location.reload();
        });

        socket.on('answer_ack', ({ isCorrect, answerIdx }) => {
            if (isCorrect) soundMgr.sfxCorrect();
            else soundMgr.sfxWrong();

            setFeedback(prev => ({
                ...prev,
                waiting: true, // Still waiting for round result (opponent)
                isCorrect, // But we know if we are correct
                myAnswerIdx: answerIdx
            }));
        });

        return () => {
            socket.off('player_update');
            socket.off('game_start');
            socket.off('new_quiz');
            socket.off('timer_update');
            socket.off('round_result');
            socket.off('game_over');
            socket.off('player_left');
            socket.off('answer_ack');
        };
    }, [players]);

    // Timer countdown - Client side interpolation only if needed, but we rely on server now mostly
    // We can keep the interval for smooth countdown between server ticks if we want, 
    // but let's just trust server ticks to avoid jumping, or use a simple decrementor that gets corrected.
    useEffect(() => {
        if (gameState === 'BATTLE' && currentQuiz && !feedback && timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => Math.max(0, prev - 0.1)); // Smooth local update
            }, 100);
            return () => clearInterval(interval);
        }
    }, [gameState, currentQuiz, feedback, timer]);

    const handleAnswer = (idx) => {
        if (feedback) return; // Already answered or round over
        // Optimistic feedback? No, wait for round result?
        // Or just mark as selected.
        // Let's just send to server.
        socket.emit('submit_answer', { roomId, answerIdx: idx });
        setFeedback({ show: true, waiting: true, selectedIdx: idx });
    };

    const p1 = players[0] || { name: 'P1', hp: 100, combo: 0 };
    const p2 = players[1] || { name: 'P2', hp: 100, combo: 0 };

    // Determine if I am P1 or P2
    const isMeP1 = socket.id === p1.id;

    return (
        <div className="relative w-full h-screen bg-[#050505] overflow-hidden flex items-center justify-center">
            <div className={`relative w-full h-full max-w-[1280px] max-h-[720px] aspect-video bg-black shadow-2xl border-2 md:border-4 border-[#333] overflow-hidden flex items-center justify-center`}>

                <GameCanvas ref={canvasRef} />

                <div className="absolute inset-0 crt-overlay z-10 opacity-40 pointer-events-none"></div>

                <button
                    className="absolute top-4 right-4 z-50 text-white opacity-50 hover:opacity-100"
                    onClick={() => {
                        soundMgr.muted = !soundMgr.muted;
                        setMuted(!muted);
                    }}
                >
                    {muted ? <VolumeX /> : <Volume2 />}
                </button>

                {/* WAITING SCREEN */}
                {gameState === 'WAITING' && (
                    <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
                        <h2 className="font-teko text-6xl animate-pulse mb-4">WAITING FOR OPPONENT...</h2>
                        <p className="font-dh text-2xl text-gray-400">ROOM CODE: {roomId}</p>
                        <div className="mt-8 flex gap-8">
                            <div className="text-center">
                                <div className="w-20 h-20 border-2 border-green-500 bg-gray-800 mb-2"></div>
                                <p className="font-hs text-xl text-green-400">{p1.name}</p>
                            </div>
                            <div className="text-center opacity-50">
                                <div className="w-20 h-20 border-2 border-gray-600 bg-gray-900 mb-2"></div>
                                <p className="font-hs text-xl text-gray-500">???</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* BATTLE UI */}
                {(gameState === 'BATTLE' || gameState === 'END') && (
                    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-2 md:p-4">
                        {/* HUD */}
                        <div className="w-full flex justify-between items-start pt-1 md:pt-2">
                            {/* P1 HUD */}
                            <div className="w-[40%] flex flex-col">
                                <div className="flex items-end gap-2 mb-1">
                                    <span className="font-hs text-2xl md:text-3xl text-[#00ff88] skew-ui">{p1.name}</span>
                                </div>
                                <div className="w-full h-6 bg-gray-800 border-2 border-gray-600 skew-ui relative overflow-hidden">
                                    <div className="absolute top-0 bottom-0 left-0 transition-all duration-300 bg-[#00ff88]" style={{ width: `${p1.hp}%` }}></div>
                                </div>
                                {p1.combo > 1 && <span className="text-[#00ff88] font-teko text-2xl mt-1 animate-bounce">{p1.combo} COMBO!</span>}
                            </div>

                            {/* TIMER */}
                            <div className="relative top-0">
                                <div className="w-16 h-16 bg-black border-2 border-white transform rotate-45 flex items-center justify-center shadow-2xl z-20">
                                    <div className="transform -rotate-45 font-teko text-4xl text-yellow-400">
                                        {Math.ceil(timer)}
                                    </div>
                                </div>
                            </div>

                            {/* P2 HUD */}
                            <div className="w-[40%] flex flex-col items-end">
                                <div className="flex items-end gap-2 mb-1">
                                    <span className="font-hs text-2xl md:text-3xl text-[#a29bfe] skew-ui-rev">{p2.name}</span>
                                </div>
                                <div className="w-full h-6 bg-gray-800 border-2 border-gray-600 skew-ui-rev relative overflow-hidden">
                                    <div className="absolute top-0 bottom-0 right-0 transition-all duration-300 bg-[#a29bfe]" style={{ width: `${p2.hp}%` }}></div>
                                </div>
                                {p2.combo > 1 && <span className="text-[#a29bfe] font-teko text-2xl mt-1 animate-bounce">{p2.combo} COMBO!</span>}
                            </div>
                        </div>

                        {/* QUIZ AREA */}
                        {currentQuiz && gameState === 'BATTLE' && (
                            <div className="w-full max-w-4xl mx-auto mb-4 pointer-events-auto transition-all duration-300">
                                <div className="bg-black/80 border-2 border-white/30 backdrop-blur-md p-4 skew-ui relative mb-4">
                                    <div className="absolute -top-3 -left-3 bg-yellow-400 text-black font-teko px-3 py-1 text-xl border border-white skew-ui-rev">
                                        ROUND {currentQuiz.round} / {currentQuiz.total}
                                    </div>
                                    <h2 className="text-center font-dh text-2xl md:text-3xl text-white skew-ui-rev">
                                        {currentQuiz.q}
                                    </h2>
                                    {feedback?.waiting && (
                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 skew-ui-rev">
                                            <span className="font-teko text-3xl text-yellow-400 animate-pulse">WAITING FOR OPPONENT...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {currentQuiz.a.map((option, idx) => {
                                        let stateStyle = "bg-gray-900/80 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-white hover:text-white";
                                        let icon = null;

                                        if (feedback) {
                                            if (feedback.waiting) {
                                                // Waiting for opponent, BUT we might know our result already from answer_ack
                                                if (feedback.myAnswerIdx === idx) {
                                                    if (feedback.isCorrect === true) {
                                                        stateStyle = "bg-green-600 border-green-400 text-white shadow-[0_0_20px_#00ff00]";
                                                        icon = <Zap className="inline mr-2 w-5 h-5" />;
                                                    } else if (feedback.isCorrect === false) {
                                                        stateStyle = "bg-red-600 border-red-400 text-white shadow-[0_0_20px_#ff0000]";
                                                        icon = <Skull className="inline mr-2 w-5 h-5" />;
                                                    } else {
                                                        // Should not happen if answer_ack is working, but fallback
                                                        stateStyle = "bg-yellow-600 border-yellow-400 text-white";
                                                    }
                                                } else {
                                                    stateStyle = "opacity-50";
                                                }
                                            } else {
                                                // Round Result shown (Battle phase)
                                                if (idx === feedback.correctIdx) {
                                                    stateStyle = "bg-green-600 border-green-400 text-white shadow-[0_0_20px_#00ff00]";
                                                    icon = <Zap className="inline mr-2 w-5 h-5" />;
                                                } else if (idx === feedback.myAnswerIdx) {
                                                    stateStyle = "bg-red-600 border-red-400 text-white shadow-[0_0_20px_#ff0000]";
                                                    icon = <Skull className="inline mr-2 w-5 h-5" />;
                                                } else {
                                                    stateStyle = "opacity-30";
                                                }
                                            }
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswer(idx)}
                                                disabled={!!feedback}
                                                className={`h-16 skew-ui border-2 transition-all duration-100 font-dh text-xl flex items-center justify-center overflow-hidden ${stateStyle}`}
                                            >
                                                <span className="skew-ui-rev flex items-center">{icon}{option}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* RESULT SCREEN */}
                {gameState === 'END' && result && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 p-4">
                        <div className="flex flex-col items-center gap-6 p-10 border-4 border-white skew-ui bg-gray-900/90 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                            <div className="skew-ui-rev text-center">
                                <h1 className={`font-hs text-8xl mb-2 ${result.isWin ? 'text-yellow-400' : (result.isDraw ? 'text-gray-400' : 'text-gray-600')}`}>
                                    {result.isWin ? 'YOU WIN' : (result.isDraw ? 'DRAW' : 'YOU LOSE')}
                                </h1>
                                <button onClick={() => window.location.reload()} className="mt-8 px-12 py-4 bg-[#ff003c] hover:bg-red-500 text-white font-hs text-3xl flex items-center justify-center gap-3 mx-auto transition-all">
                                    <RefreshCw /> LOBBY
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
