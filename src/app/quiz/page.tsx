'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Quiz {
  quiz_id: string;
  title: string;
  source: string;
  stats: {
    total: number;
    single: number;
    multi: number;
    judge: number;
  };
  created_at: string;
}

export default function QuizListPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quiz/list');
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.data || []);
      }
    } catch (error) {
      console.error('获取题库列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-green-600 to-green-500 text-white py-6 px-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-2xl hover:opacity-80"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold">我的题库</h1>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link href="/quiz/upload" className="block">
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-2">📤</div>
              <div className="text-sm font-medium text-gray-700">上传题库</div>
            </div>
          </Link>
          <Link href="/quiz/generate" className="block">
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-sm font-medium text-gray-700">AI生成</div>
            </div>
          </Link>
        </div>

        {/* 题库列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-spin">📚</div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">还没有题库</h3>
            <p className="text-gray-500 text-sm mb-6">上传题库或让AI帮你生成</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/quiz/upload"
                className="bg-green-500 text-white px-6 py-2 rounded-lg text-sm"
              >
                上传题库
              </Link>
              <Link
                href="/quiz/generate"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg text-sm"
              >
                AI生成
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.quiz_id}
                href={`/practice/${quiz.quiz_id}`}
                className="block"
              >
                <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 flex-1">{quiz.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      quiz.source === 'ai_generated'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {quiz.source === 'ai_generated' ? 'AI生成' : '用户上传'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>共 {quiz.stats.total} 题</span>
                    <span>单选 {quiz.stats.single}</span>
                    <span>多选 {quiz.stats.multi}</span>
                    <span>判断 {quiz.stats.judge}</span>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    {new Date(quiz.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
