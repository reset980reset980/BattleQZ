import React, { useState, useEffect } from 'react';
import socket from '../socket';
import { Swords, Users, Settings, Sparkles, Crown, Check } from 'lucide-react';
import Admin from './Admin';

export default function Lobby({ onJoin }) {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [selectedChar, setSelectedChar] = useState('Tanjiro');
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState('');
    const [showAdmin, setShowAdmin] = useState(false);

    useEffect(() => {
        socket.connect();

        function onLobbyJoined() {
            // Ready to create/join
        }

        function onRoomCreated(id) {
            onJoin(id, 'p1');
        }

        function onPlayerUpdate(players) {
            // Handled in Game component usually, but if we are just waiting in lobby...
            // For now, if we join a room, we switch to Game view immediately.
        }

        function onErrorMsg(msg) {
            setError(msg);
        }

        function onRoomsUpdate(updatedRooms) {
            setRooms(updatedRooms);
        }

        socket.on('lobby_joined', onLobbyJoined);
        socket.on('room_created', onRoomCreated);
        socket.on('error_msg', onErrorMsg);
        socket.on('rooms_update', onRoomsUpdate);

        return () => {
            socket.off('lobby_joined', onLobbyJoined);
            socket.off('room_created', onRoomCreated);
            socket.off('error_msg', onErrorMsg);
            socket.off('rooms_update', onRoomsUpdate);
        };
    }, [onJoin]);

    const handleEnterLobby = () => {
        if (!name.trim()) return;
        socket.emit('join_lobby', { name, char: selectedChar });
    };

    const createRoom = () => {
        if (!name.trim()) { setError('이름을 입력하세요'); return; }
        socket.emit('join_lobby', { name, char: selectedChar }); // Ensure name is set
        socket.emit('create_room');
    };

    const joinRoom = (idToJoin) => {
        const targetId = idToJoin || roomId;
        if (!name.trim()) { setError('이름을 입력하세요'); return; }
        if (!targetId.trim()) { setError('방 코드를 입력하세요'); return; }
        socket.emit('join_lobby', { name, char: selectedChar }); // Ensure name is set
        socket.emit('join_room', targetId);
        onJoin(targetId, 'p2');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white font-sans p-4 relative overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
                <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
            </div>

            {/* Admin button */}
            <button
                onClick={() => setShowAdmin(true)}
                className="absolute top-6 right-6 z-30 p-3 bg-purple-600/80 hover:bg-purple-700 rounded-full transition-all hover:scale-110 shadow-lg border border-purple-400/50"
                title="관리자 패널"
            >
                <Settings size={24} />
            </button>

            <div className="z-20 max-w-2xl w-full bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border-2 border-purple-500/30 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-6xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 animate-gradient">
                        ⚔️ BATTLE QUIZ ⚔️
                    </h1>
                    <p className="text-gray-400 text-lg">재미있는 말장난 퀴즈 대결!</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg text-red-200 p-4 mb-6 text-center animate-shake">
                        <span className="font-semibold">⚠️ {error}</span>
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2">
                            <Crown size={20} />
                            플레이어 이름
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-800/50 border-2 border-purple-500/30 rounded-lg p-4 text-lg focus:border-purple-500 outline-none transition-all text-white placeholder-gray-500"
                            placeholder="멋진 닉네임을 입력하세요"
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                            <Sparkles size={20} />
                            캐릭터 선택
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setSelectedChar('Tanjiro')}
                                className={`relative border-2 rounded-xl p-4 transition-all transform hover:scale-105 ${
                                    selectedChar === 'Tanjiro'
                                        ? 'border-green-400 bg-green-900/40 shadow-lg shadow-green-500/50'
                                        : 'border-gray-600 hover:border-green-400/50 bg-gray-800/30'
                                }`}
                            >
                                <img src="https://i.imgur.com/f5A8RgG.png" alt="Tanjiro" className="w-full h-28 object-contain mb-2" />
                                <div className="text-center font-bold text-white text-lg">TANJIRO</div>
                                {selectedChar === 'Tanjiro' && (
                                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                        <Check size={16} className="text-white" />
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={() => setSelectedChar('Gojo')}
                                className={`relative border-2 rounded-xl p-4 transition-all transform hover:scale-105 ${
                                    selectedChar === 'Gojo'
                                        ? 'border-purple-400 bg-purple-900/40 shadow-lg shadow-purple-500/50'
                                        : 'border-gray-600 hover:border-purple-400/50 bg-gray-800/30'
                                }`}
                            >
                                <img src="https://i.imgur.com/0hYV1Mj.png" alt="Gojo" className="w-full h-28 object-contain mb-2" />
                                <div className="text-center font-bold text-white text-lg">GOJO</div>
                                {selectedChar === 'Gojo' && (
                                    <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                                        <Check size={16} className="text-white" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={createRoom}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg"
                    >
                        <Swords size={28} /> 새 방 만들기
                    </button>

                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t-2 border-gray-700"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 font-semibold">또는 기존 방 참가</span>
                        <div className="flex-grow border-t-2 border-gray-700"></div>
                    </div>

                    {/* ROOM LIST */}
                    <div className="bg-gray-900/50 border-2 border-purple-500/30 rounded-xl p-4">
                        <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                            <Users size={20} />
                            대기 중인 방 ({rooms.length})
                        </h3>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {rooms.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <Users size={48} className="mx-auto mb-3 opacity-30" />
                                    <p>현재 대기 중인 방이 없습니다</p>
                                    <p className="text-sm mt-1">새 방을 만들어보세요!</p>
                                </div>
                            ) : (
                                rooms.map(room => (
                                    <div key={room.id} className="flex items-center justify-between bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 border border-purple-500/30 rounded-lg hover:border-purple-500 transition-all hover:shadow-lg">
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-bold text-white">{room.id}</span>
                                            <span className="text-sm text-gray-400">방장: {room.host}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-purple-600/30 px-3 py-1 rounded-full">
                                                <span className="font-bold text-white">{room.count}/2</span>
                                            </div>
                                            <button
                                                onClick={() => joinRoom(room.id)}
                                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-lg transition-all hover:scale-105"
                                            >
                                                참가
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            className="flex-1 bg-gray-800/50 border-2 border-purple-500/30 rounded-lg p-4 text-lg focus:border-purple-500 outline-none text-white uppercase placeholder-gray-500"
                            placeholder="방 코드 입력 (예: ABC12)"
                            maxLength={5}
                        />
                        <button
                            onClick={() => joinRoom(roomId)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-8 rounded-lg transition-all hover:scale-105"
                        >
                            입장
                        </button>
                    </div>
                </div>
            </div>

            {showAdmin && <Admin onClose={() => setShowAdmin(false)} />}
        </div>
    );
}
