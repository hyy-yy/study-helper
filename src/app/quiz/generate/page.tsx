'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Outline {
  outline_id: string;
  title: string;
  created_at: string;
}

export default function GenerateQuizPage() {
  const router = useRouter();
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [selectedOutline, setSelectedOutline] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [loadingOutlines, setLoadingOutlines] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOutlines();
  }, []);

  const fetchOutlines = async () => {
    try {
      const response = await fetch('/api/outline/list');
      if (response.ok) {
        const data = await response.json();
        setOutlines(data.data || []);
      }
    } catch (error) {
      console.error('获取提纲列表失败:', error);
    } finally {
      setLoadingOutlines(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedOutline) {
      setError('请选择一个提纲');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outline_id: selectedOutline,
          count: questionCount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '生成失败');
      }

      const result = await response.json();

      // 跳转到刷题页面
      router.push(`/practice/${result.data.quiz_id}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 px-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-2xl hover:opacity-80"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold">AI生成题库</h1>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-md mx-auto px-4 py-8">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4 animate-spin">🤖</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">AI正在出题...</h3>
            <p className="text-gray-500 text-sm">请稍候，这可能需要一些时间</p>
          </div>
        ) : (
          <>
            {/* 选择提纲 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">📄 选择提纲</h3>

              {loadingOutlines ? (
                <div className="text-center py-4">
                  <div className="text-2xl animate-spin">📚</div>
                </div>
              ) : outlines.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-4">还没有提纲</p>
                  <button
                    onClick={() => router.push('/upload')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    先上传一份资料
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {outlines.map((outline) => (
                    <label
                      key={outline.outline_id}
                      className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedOutline === outline.outline_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="outline"
                        value={outline.outline_id}
                        checked={selectedOutline === outline.outline_id}
                        onChange={(e) => setSelectedOutline(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedOutline === outline.outline_id
                            ? 'border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedOutline === outline.outline_id && (
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{outline.title}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(outline.created_at).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 题目数量 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">📊 题目数量</h3>
              <div className="flex gap-3">
                {[10, 20, 30, 50].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      questionCount === count
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {count}题
                  </button>
                ))}
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={!selectedOutline || loading}
              className={`w-full py-4 rounded-2xl text-lg font-semibold transition-all ${
                selectedOutline
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              🤖 开始生成
            </button>
          </>
        )}
      </main>
    </div>
  );
}
