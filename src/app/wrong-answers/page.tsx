'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WrongQuestion {
  id: number;
  quizId: string;
  quizTitle: string;
  question: string;
  type: 'single' | 'multi' | 'judge';
  options?: { key: string; value: string }[];
  correctAnswer: string;
  userAnswer: string;
  explanation?: string;
  chapter?: string;
  wrongCount: number;
  lastWrongTime: string;
}

export default function WrongAnswersPage() {
  const router = useRouter();
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'single' | 'multi' | 'judge'>('all');

  useEffect(() => {
    loadWrongQuestions();
  }, []);

  const loadWrongQuestions = () => {
    try {
      const saved = localStorage.getItem('study-helper-wrong-answers');
      if (saved) {
        const data = JSON.parse(saved);
        setWrongQuestions(data);
      }
    } catch (error) {
      console.error('加载错题失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearWrongQuestions = () => {
    if (confirm('确定要清空所有错题记录吗？')) {
      localStorage.removeItem('study-helper-wrong-answers');
      setWrongQuestions([]);
    }
  };

  const removeWrongQuestion = (id: number) => {
    const updated = wrongQuestions.filter(q => q.id !== id);
    localStorage.setItem('study-helper-wrong-answers', JSON.stringify(updated));
    setWrongQuestions(updated);
  };

  const filteredQuestions = filter === 'all'
    ? wrongQuestions
    : wrongQuestions.filter(q => q.type === filter);

  const stats = {
    total: wrongQuestions.length,
    single: wrongQuestions.filter(q => q.type === 'single').length,
    multi: wrongQuestions.filter(q => q.type === 'multi').length,
    judge: wrongQuestions.filter(q => q.type === 'judge').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">📚</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-red-600 to-red-500 text-white py-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="text-2xl hover:opacity-80"
            >
              ←
            </button>
            <h1 className="text-xl font-semibold flex-1">错题本</h1>
            {wrongQuestions.length > 0 && (
              <button
                onClick={clearWrongQuestions}
                className="text-sm bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30"
              >
                清空
              </button>
            )}
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xl font-bold">{stats.total}</div>
              <div className="text-xs text-red-100">总错题</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xl font-bold">{stats.single}</div>
              <div className="text-xs text-red-100">单选</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xl font-bold">{stats.multi}</div>
              <div className="text-xs text-red-100">多选</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xl font-bold">{stats.judge}</div>
              <div className="text-xs text-red-100">判断</div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 筛选 */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'single', label: '单选题' },
              { key: 'multi', label: '多选题' },
              { key: 'judge', label: '判断题' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === item.key
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 错题列表 */}
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {wrongQuestions.length === 0 ? '还没有错题' : '没有匹配的错题'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {wrongQuestions.length === 0 ? '继续加油，减少错题！' : '试试其他筛选条件'}
            </p>
            {wrongQuestions.length === 0 && (
              <Link
                href="/quiz"
                className="bg-red-500 text-white px-6 py-2 rounded-lg text-sm"
              >
                去刷题
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question, index) => (
              <div
                key={`${question.id}-${question.quizId}-${index}`}
                className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in"
              >
                {/* 题目头部 */}
                <div className="bg-red-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      question.type === 'single'
                        ? 'bg-blue-100 text-blue-600'
                        : question.type === 'multi'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {question.type === 'single' ? '单选' :
                       question.type === 'multi' ? '多选' : '判断'}
                    </span>
                    {question.chapter && (
                      <span className="text-xs text-gray-500">{question.chapter}</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeWrongQuestion(question.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>

                {/* 题目内容 */}
                <div className="p-4">
                  <p className="text-gray-800 mb-4">{question.question}</p>

                  {/* 选项 */}
                  {question.options && (
                    <div className="space-y-2 mb-4">
                      {question.options.map((option) => (
                        <div
                          key={option.key}
                          className={`p-3 rounded-lg text-sm ${
                            option.key === question.correctAnswer
                              ? 'bg-green-100 border border-green-300'
                              : option.key === question.userAnswer
                              ? 'bg-red-100 border border-red-300'
                              : 'bg-gray-50'
                          }`}
                        >
                          <span className="font-medium mr-2">{option.key}.</span>
                          {option.value}
                          {option.key === question.correctAnswer && (
                            <span className="ml-2 text-green-600">✓ 正确答案</span>
                          )}
                          {option.key === question.userAnswer && option.key !== question.correctAnswer && (
                            <span className="ml-2 text-red-600">✗ 你的答案</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 判断题答案 */}
                  {question.type === 'judge' && (
                    <div className="flex gap-4 mb-4">
                      <div className={`flex-1 p-3 rounded-lg text-center ${
                        question.correctAnswer === 'true'
                          ? 'bg-green-100 border border-green-300'
                          : question.userAnswer === 'true'
                          ? 'bg-red-100 border border-red-300'
                          : 'bg-gray-50'
                      }`}>
                        ✓ 正确
                        {question.correctAnswer === 'true' && (
                          <div className="text-xs text-green-600 mt-1">正确答案</div>
                        )}
                      </div>
                      <div className={`flex-1 p-3 rounded-lg text-center ${
                        question.correctAnswer === 'false'
                          ? 'bg-green-100 border border-green-300'
                          : question.userAnswer === 'false'
                          ? 'bg-red-100 border border-red-300'
                          : 'bg-gray-50'
                      }`}>
                        ✗ 错误
                        {question.correctAnswer === 'false' && (
                          <div className="text-xs text-green-600 mt-1">正确答案</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 解析 */}
                  {question.explanation && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">💡 解析：</span>
                        {question.explanation}
                      </p>
                    </div>
                  )}

                  {/* 来源和时间 */}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>来源：{question.quizTitle}</span>
                    <span>错 {question.wrongCount} 次</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 练习错题按钮 */}
        {wrongQuestions.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => {
                // 创建错题题库并跳转
                const quizData = {
                  quiz_id: 'wrong-answers',
                  title: '错题练习',
                  source: 'wrong_answers',
                  questions: wrongQuestions.map((q, i) => ({
                    id: i + 1,
                    type: q.type,
                    question: q.question,
                    options: q.options,
                    answer: q.correctAnswer,
                    chapter: q.chapter,
                    explanation: q.explanation,
                  })),
                  chapters: [...new Set(wrongQuestions.map(q => q.chapter).filter(Boolean))],
                  stats: {
                    total: wrongQuestions.length,
                    single: stats.single,
                    multi: stats.multi,
                    judge: stats.judge,
                  },
                  created_at: new Date().toISOString(),
                };
                localStorage.setItem('quiz-wrong-answers', JSON.stringify(quizData));
                router.push('/practice/wrong-answers');
              }}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-2xl text-lg font-semibold btn-active"
            >
              🔄 练习错题 ({wrongQuestions.length} 道)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
