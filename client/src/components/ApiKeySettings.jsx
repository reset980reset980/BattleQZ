import React, { useState, useEffect } from 'react';
import { Key, Check, X, AlertCircle } from 'lucide-react';

export default function ApiKeySettings({ onClose }) {
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
            setSaved(true);
        }
    }, []);

    const handleSave = () => {
        if (!apiKey.trim()) {
            alert('API 키를 입력하세요');
            return;
        }
        localStorage.setItem('gemini_api_key', apiKey.trim());
        setSaved(true);
        setTestResult(null);
        alert('API 키가 저장되었습니다');
    };

    const handleTest = async () => {
        const keyToTest = apiKey.trim() || localStorage.getItem('gemini_api_key');
        if (!keyToTest) {
            alert('API 키를 먼저 입력하세요');
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyToTest}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Hello' }]
                    }]
                })
            });

            if (response.ok) {
                setTestResult({ success: true, message: 'API 키가 정상적으로 작동합니다!' });
            } else {
                const error = await response.json();
                setTestResult({ success: false, message: `오류: ${error.error?.message || '알 수 없는 오류'}` });
            }
        } catch (error) {
            setTestResult({ success: false, message: `연결 오류: ${error.message}` });
        } finally {
            setTesting(false);
        }
    };

    const handleClear = () => {
        if (confirm('저장된 API 키를 삭제하시겠습니까?')) {
            localStorage.removeItem('gemini_api_key');
            setApiKey('');
            setSaved(false);
            setTestResult(null);
            alert('API 키가 삭제되었습니다');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-2xl p-8 shadow-2xl border border-yellow-500/30">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Key className="text-yellow-400" size={32} />
                        Gemini API 키 설정
                    </h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                        <X size={28} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                            <AlertCircle size={20} className="text-blue-400" />
                            API 키 발급 방법
                        </h3>
                        <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                            <li>Google AI Studio 접속: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">aistudio.google.com/app/apikey</a></li>
                            <li>"Create API Key" 버튼 클릭</li>
                            <li>생성된 API 키를 복사하여 아래에 입력</li>
                        </ol>
                    </div>

                    <div>
                        <label className="block text-white font-semibold mb-2">API 키</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                setSaved(false);
                                setTestResult(null);
                            }}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 font-mono"
                            placeholder="AIzaSy..."
                        />
                        {saved && (
                            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                                <Check size={16} />
                                저장됨
                            </p>
                        )}
                    </div>

                    {testResult && (
                        <div className={`p-4 rounded-lg border ${
                            testResult.success
                                ? 'bg-green-900/30 border-green-500'
                                : 'bg-red-900/30 border-red-500'
                        }`}>
                            <p className={testResult.success ? 'text-green-300' : 'text-red-300'}>
                                {testResult.message}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-bold"
                        >
                            저장
                        </button>
                        <button
                            onClick={handleTest}
                            disabled={testing}
                            className={`flex-1 py-3 rounded-lg transition font-bold ${
                                testing
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {testing ? '테스트 중...' : 'API 테스트'}
                        </button>
                        <button
                            onClick={handleClear}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold"
                        >
                            삭제
                        </button>
                    </div>

                    <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                        <h4 className="text-yellow-300 font-bold mb-2">🔒 보안 안내</h4>
                        <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                            <li>API 키는 브라우저 로컬 스토리지에만 저장됩니다</li>
                            <li>서버에 전송되지 않으며, 사용자 기기에만 보관됩니다</li>
                            <li>공용 컴퓨터에서는 사용 후 키를 삭제하세요</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
