import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Edit2, Plus, Sparkles, Download, X, Check, Settings } from 'lucide-react';
import ApiKeySettings from './ApiKeySettings';

const API_URL = 'http://localhost:3000/api';

export default function Admin({ onClose }) {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editForm, setEditForm] = useState({ q: '', a: ['', '', '', ''], c: 0 });
    const [activeTab, setActiveTab] = useState('list'); // list, add, csv, ai
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [showApiSettings, setShowApiSettings] = useState(false);
    const [generatedQuizzes, setGeneratedQuizzes] = useState([]);

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/quizzes`);
            const data = await response.json();
            if (data.success) {
                setQuizzes(data.quizzes);
            }
        } catch (error) {
            alert('퀴즈 로드 실패: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (index) => {
        if (!confirm('정말 이 퀴즈를 삭제하시겠습니까?')) return;
        try {
            const response = await fetch(`${API_URL}/quizzes/${index}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert('퀴즈가 삭제되었습니다');
                loadQuizzes();
            }
        } catch (error) {
            alert('삭제 실패: ' + error.message);
        }
    };

    const handleEdit = (index) => {
        setEditingIndex(index);
        setEditForm(quizzes[index]);
        setActiveTab('add');
    };

    const handleSave = async () => {
        try {
            const url = editingIndex !== null
                ? `${API_URL}/quizzes/${editingIndex}`
                : `${API_URL}/quizzes`;
            const method = editingIndex !== null ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            const data = await response.json();
            if (data.success) {
                alert(editingIndex !== null ? '퀴즈가 수정되었습니다' : '퀴즈가 추가되었습니다');
                setEditingIndex(null);
                setEditForm({ q: '', a: ['', '', '', ''], c: 0 });
                setActiveTab('list');
                loadQuizzes();
            }
        } catch (error) {
            alert('저장 실패: ' + error.message);
        }
    };

    const handleCSVUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            const parsedQuizzes = [];

            for (let i = 1; i < lines.length; i++) { // Skip header
                const parts = lines[i].split(',').map(p => p.trim());
                if (parts.length >= 6) {
                    parsedQuizzes.push({
                        q: parts[0],
                        a: [parts[1], parts[2], parts[3], parts[4]],
                        c: parseInt(parts[5])
                    });
                }
            }

            const response = await fetch(`${API_URL}/quizzes/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quizzes: parsedQuizzes })
            });

            const data = await response.json();
            if (data.success) {
                alert(`성공: ${data.results.success}개, 실패: ${data.results.failed}개`);
                loadQuizzes();
                setActiveTab('list');
            }
        } catch (error) {
            alert('CSV 업로드 실패: ' + error.message);
        }
    };

    const downloadCSVTemplate = () => {
        const template = `문제,답1,답2,답3,답4,정답번호(0-3)
왕이 넘어지면?,킹콩,왕자,전하,낙마,0
오리가 얼면?,빙수,언덕,오리무중,동동,1`;
        // UTF-8 BOM 추가로 한글 인코딩 문제 해결
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + template], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quiz_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim()) {
            alert('문제 생성 요청을 입력하세요');
            return;
        }

        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            alert('먼저 API 키를 설정해주세요');
            setShowApiSettings(true);
            return;
        }

        setAiGenerating(true);
        setGeneratedQuizzes([]);

        try {
            const prompt = `당신은 재미있는 한국어 말장난 퀴즈를 만드는 전문가입니다.

사용자 요청: ${aiPrompt}

위 요청에 맞춰 재미있는 말장난 퀴즈를 생성해주세요.
각 퀴즈는 다음 형식의 JSON 배열로만 응답해주세요 (다른 설명 없이):

[
  {
    "q": "왕이 넘어지면?",
    "a": ["킹콩", "왕자", "전하", "낙마"],
    "c": 0
  }
]

규칙:
- 정답은 재미있는 말장난이어야 합니다
- 오답 3개는 그럴듯해야 하지만 정답보다는 덜 재미있어야 합니다
- "c"는 정답의 인덱스 (0-3)입니다
- 최소 5개, 최대 10개의 퀴즈를 생성하세요
- 응답은 반드시 유효한 JSON 배열 형식이어야 합니다`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 8192,
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API 호출 실패');
            }

            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                throw new Error('AI 응답이 비어있습니다');
            }

            // JSON 추출 (```json ... ``` 형식 처리)
            let jsonText = generatedText.trim();
            const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || jsonText.match(/```\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonText = jsonMatch[1];
            }

            // JSON 파싱
            const parsedQuizzes = JSON.parse(jsonText);

            if (!Array.isArray(parsedQuizzes) || parsedQuizzes.length === 0) {
                throw new Error('유효한 퀴즈 형식이 아닙니다');
            }

            // 퀴즈 형식 검증
            const validQuizzes = parsedQuizzes.filter(quiz =>
                quiz.q && Array.isArray(quiz.a) && quiz.a.length === 4 && typeof quiz.c === 'number' && quiz.c >= 0 && quiz.c <= 3
            );

            if (validQuizzes.length === 0) {
                throw new Error('생성된 퀴즈가 올바른 형식이 아닙니다');
            }

            setGeneratedQuizzes(validQuizzes);
            alert(`${validQuizzes.length}개의 퀴즈가 생성되었습니다!`);

        } catch (error) {
            console.error('AI 생성 오류:', error);
            alert(`AI 생성 실패: ${error.message}\n\nAPI 키를 확인하거나 요청을 다시 시도해주세요.`);
        } finally {
            setAiGenerating(false);
        }
    };

    const handleSaveGeneratedQuizzes = async () => {
        if (generatedQuizzes.length === 0) {
            alert('저장할 퀴즈가 없습니다');
            return;
        }

        try {
            console.log('📤 Saving quizzes:', generatedQuizzes);

            const response = await fetch(`${API_URL}/quizzes/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quizzes: generatedQuizzes })
            });

            const data = await response.json();
            console.log('📥 Server response:', data);

            if (data.success) {
                if (data.results.failed > 0) {
                    const errorMsg = data.results.errors.map(e =>
                        `퀴즈 ${e.index + 1}: ${e.error}`
                    ).join('\n');
                    alert(`⚠️ ${data.results.success}개 추가 성공, ${data.results.failed}개 실패\n\n실패 이유:\n${errorMsg}`);
                } else {
                    alert(`✅ ${data.results.success}개의 퀴즈가 추가되었습니다!`);
                }
                setGeneratedQuizzes([]);
                setAiPrompt('');
                loadQuizzes();
                setActiveTab('list');
            } else {
                throw new Error(data.error || '알 수 없는 오류');
            }
        } catch (error) {
            console.error('❌ Save error:', error);
            alert('저장 실패: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/30">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">관리자 패널</h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                        <X size={28} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 bg-gray-800/50">
                    {[
                        { id: 'list', label: '퀴즈 목록', icon: '📋' },
                        { id: 'add', label: '퀴즈 추가', icon: '➕' },
                        { id: 'csv', label: 'CSV 업로드', icon: '📤' },
                        { id: 'ai', label: 'AI 생성', icon: '✨' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 px-6 font-semibold transition ${
                                activeTab === tab.id
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-700/50'
                            }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {activeTab === 'list' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white">전체 퀴즈: {quizzes.length}개</h3>
                                <button onClick={loadQuizzes} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                    새로고침
                                </button>
                            </div>
                            {loading ? (
                                <p className="text-gray-400 text-center py-8">로딩 중...</p>
                            ) : (
                                quizzes.map((quiz, idx) => (
                                    <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="text-white font-bold text-lg mb-2">{quiz.q}</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {quiz.a.map((ans, i) => (
                                                        <div key={i} className={`px-3 py-2 rounded-lg ${i === quiz.c ? 'bg-green-600/30 border border-green-500' : 'bg-gray-700'}`}>
                                                            <span className="text-gray-300">{i + 1}. {ans}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button onClick={() => handleEdit(idx)} className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(idx)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'add' && (
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <h3 className="text-2xl font-bold text-white mb-6">
                                {editingIndex !== null ? '퀴즈 수정' : '새 퀴즈 추가'}
                            </h3>
                            <div>
                                <label className="block text-white font-semibold mb-2">문제</label>
                                <input
                                    type="text"
                                    value={editForm.q}
                                    onChange={(e) => setEditForm({ ...editForm, q: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                    placeholder="예: 왕이 넘어지면?"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i}>
                                        <label className="block text-white font-semibold mb-2">답 {i + 1}</label>
                                        <input
                                            type="text"
                                            value={editForm.a[i]}
                                            onChange={(e) => {
                                                const newAnswers = [...editForm.a];
                                                newAnswers[i] = e.target.value;
                                                setEditForm({ ...editForm, a: newAnswers });
                                            }}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                            placeholder={`답 ${i + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-white font-semibold mb-2">정답 번호 (0-3)</label>
                                <div className="flex gap-3">
                                    {[0, 1, 2, 3].map(i => (
                                        <button
                                            key={i}
                                            onClick={() => setEditForm({ ...editForm, c: i })}
                                            className={`flex-1 py-3 rounded-lg font-bold transition ${
                                                editForm.c === i
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            답 {i + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={handleSave} className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-bold">
                                    <Check className="inline mr-2" size={20} />
                                    {editingIndex !== null ? '수정 완료' : '추가하기'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingIndex(null);
                                        setEditForm({ q: '', a: ['', '', '', ''], c: 0 });
                                        setActiveTab('list');
                                    }}
                                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'csv' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <h3 className="text-2xl font-bold text-white mb-6">CSV 파일로 일괄 업로드</h3>

                            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6">
                                <h4 className="text-white font-bold mb-3">📥 CSV 형식 안내</h4>
                                <p className="text-gray-300 mb-3">CSV 파일은 다음 형식으로 작성해주세요:</p>
                                <pre className="bg-gray-900 p-4 rounded-lg text-green-400 text-sm overflow-x-auto">
문제,답1,답2,답3,답4,정답번호(0-3){'\n'}
왕이 넘어지면?,킹콩,왕자,전하,낙마,0{'\n'}
오리가 얼면?,빙수,언덕,오리무중,동동,1
                                </pre>
                                <button
                                    onClick={downloadCSVTemplate}
                                    className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                                >
                                    <Download className="inline mr-2" size={20} />
                                    템플릿 다운로드
                                </button>
                            </div>

                            <div className="border-2 border-dashed border-purple-500 rounded-lg p-12 text-center">
                                <Upload className="mx-auto text-purple-400 mb-4" size={64} />
                                <p className="text-white font-bold text-xl mb-4">CSV 파일을 업로드하세요</p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCSVUpload}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label
                                    htmlFor="csv-upload"
                                    className="inline-block px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer font-bold"
                                >
                                    파일 선택
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-white flex items-center">
                                    <Sparkles className="mr-3 text-yellow-400" size={32} />
                                    AI 퀴즈 생성기
                                </h3>
                                <button
                                    onClick={() => setShowApiSettings(true)}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-semibold flex items-center gap-2"
                                >
                                    <Settings size={20} />
                                    API 키 설정
                                </button>
                            </div>

                            <div className="bg-gradient-to-r from-yellow-900/30 to-purple-900/30 border border-yellow-500/50 rounded-lg p-6">
                                <h4 className="text-white font-bold mb-3">✨ AI가 재미있는 퀴즈를 만들어드립니다!</h4>
                                <p className="text-gray-300 mb-4">
                                    원하는 주제나 스타일을 입력하면 Gemini AI가 자동으로 재미있는 말장난 퀴즈를 생성합니다.
                                </p>
                                <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                                    <li>예시: "동물 관련 재미있는 말장난 퀴즈 10개"</li>
                                    <li>예시: "음식을 주제로 한 유머 퀴즈 5개"</li>
                                    <li>예시: "초등학생이 좋아할 만한 쉬운 퀴즈"</li>
                                </ul>
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">AI에게 요청하기</label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 h-32 resize-none"
                                    placeholder="예: 동물 관련 재미있는 말장난 퀴즈를 10개 만들어주세요"
                                />
                            </div>

                            <button
                                onClick={handleAIGenerate}
                                disabled={aiGenerating}
                                className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                                    aiGenerating
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-yellow-500 to-purple-600 text-white hover:from-yellow-600 hover:to-purple-700'
                                }`}
                            >
                                {aiGenerating ? (
                                    <>⏳ 생성 중...</>
                                ) : (
                                    <>
                                        <Sparkles className="inline mr-2" size={24} />
                                        AI로 퀴즈 생성하기
                                    </>
                                )}
                            </button>

                            {/* Generated Quizzes Preview */}
                            {generatedQuizzes.length > 0 && (
                                <div className="bg-green-900/30 border-2 border-green-500/50 rounded-xl p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-white font-bold text-xl">생성된 퀴즈 ({generatedQuizzes.length}개)</h4>
                                        <button
                                            onClick={handleSaveGeneratedQuizzes}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold flex items-center gap-2"
                                        >
                                            <Check size={20} />
                                            모두 저장
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {generatedQuizzes.map((quiz, idx) => (
                                            <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                                <h5 className="text-white font-bold text-lg mb-2">{idx + 1}. {quiz.q}</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {quiz.a.map((ans, i) => (
                                                        <div key={i} className={`px-3 py-2 rounded-lg ${i === quiz.c ? 'bg-green-600/30 border border-green-500' : 'bg-gray-700'}`}>
                                                            <span className="text-gray-300">{i + 1}. {ans}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showApiSettings && <ApiKeySettings onClose={() => setShowApiSettings(false)} />}
        </div>
    );
}
