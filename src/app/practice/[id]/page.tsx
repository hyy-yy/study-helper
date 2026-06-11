'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Question {
  id: number;
  type: 'single' | 'multi' | 'judge';
  question: string;
  options?: { key: string; value: string }[];
  answer: string;
  chapter?: string;
  difficulty?: string;
  knowledge_point?: string;
  explanation?: string;
}

interface QuizData {
  quiz_id: string;
  title: string;
  total: number;
  questions: Question[];
  chapters: string[];
  stats: {
    total: number;
    single: number;
    multi: number;
    judge: number;
  };
}

export default function PracticePage() {
  const router = useRouter();
  const params = useParams();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [params.id]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/quiz/${params.id}`);
      if (!response.ok) {
        throw new Error('获取题库失败');
      }
      const data = await response.json();
      setQuiz(data.data);
    } catch (err) {
      console.error('获取题库失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = quiz?.questions[currentIndex];

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const correct = selectedAnswer === currentQuestion.answer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongQuestions(prev => [...prev, currentQuestion.id]);
    }
  };

  const handleNext = () => {
    if (currentIndex < (quiz?.total || 0) - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setCorrectCount(0);
    setWrongQuestions([]);
    setFinished(false);
  };

  const getScore = () => {
    if (!quiz) return 0;
    return Math.round((correctCount / quiz.total) * 100);
  };

  const getScoreLevel = () => {
    const score = getScore();
    if (score >= 90) return { text: '优秀', emoji: '🎉', color: 'text-green-500' };
    if (score >= 70) return { text: '良好', emoji: '👍', color: 'text-blue-500' };
    if (score >= 60) return { text: '及格', emoji: '😊', color: 'text-yellow-500' };
    return { text: '继续努力', emoji: '💪', color: 'text-red-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">📚</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-gray-500">题库不存在</p>
          <button
            onClick={() => router.push('/quiz')}
            className="mt-4 bg-purple-500 text-white px-6 py-2 rounded-lg"
          >
            返回题库
          </button>
        </div>
      </div>
    );
  }

  // 完成页面
  if (finished) {
    const level = getScoreLevel();
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <header className="bg-gradient-to-r from-purple-600 to-purple-500 text-white py-6 px-4">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <button
              onClick={() => router.push('/quiz')}
              className="text-2xl hover:opacity-80"
            >
              ←
            </button>
            <h1 className="text-xl font-semibold">练习完成</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
            <div className="text-6xl mb-4">{level.emoji}</div>
            <h2 className={`text-3xl font-bold mb-2 ${level.color}`}>{getScore()}分</h2>
            <p className="text-gray-500 mb-6">{level.text}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-2xl font-bold text-gray-800">{quiz.total}</div>
                <div className="text-xs text-gray-500">总题数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{correctCount}</div>
                <div className="text-xs text-gray-500">答对</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{wrongQuestions.length}</div>
                <div className="text-xs text-gray-500">答错</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="flex-1 bg-purple-500 text-white py-3 rounded-xl font-semibold"
            >
              🔄 再做一遍
            </button>
            <button
              onClick={() => router.push('/quiz')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold"
            >
              📚 返回题库
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 答题页面
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <header className="bg-gradient-to-r from-purple-600 to-purple-500 text-white py-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/quiz')}
              className="text-2xl hover:opacity-80"
            >
              ←
            </button>
            <h1 className="text-xl font-semibold flex-1">{quiz.title}</h1>
            <span className="text-sm">{currentIndex + 1}/{quiz.total}</span>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / quiz.total) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {currentQuestion && (
          <>
            {/* 题目信息 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full ${
                currentQuestion.type === 'single'
                  ? 'bg-blue-100 text-blue-600'
                  : currentQuestion.type === 'multi'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-orange-100 text-orange-600'
              }`}>
                {currentQuestion.type === 'single' ? '单选题' :
                 currentQuestion.type === 'multi' ? '多选题' : '判断题'}
              </span>
              {currentQuestion.chapter && (
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                  {currentQuestion.chapter}
                </span>
              )}
              {currentQuestion.difficulty && (
                <span className={`text-xs px-3 py-1 rounded-full ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-green-100 text-green-600'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {currentQuestion.difficulty === 'easy' ? '简单' :
                   currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
                </span>
              )}
            </div>

            {/* 题目 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-6">
                {currentQuestion.question}
              </h3>

              {/* 选项 */}
              <div className="space-y-3">
                {currentQuestion.type === 'judge' ? (
                  // 判断题
                  <>
                    <button
                      onClick={() => handleSelectAnswer('true')}
                      disabled={showResult}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        showResult
                          ? selectedAnswer === 'true'
                            ? currentQuestion.answer === 'true'
                              ? 'bg-green-100 border-2 border-green-500'
                              : 'bg-red-100 border-2 border-red-500'
                            : currentQuestion.answer === 'true'
                            ? 'bg-green-100 border-2 border-green-500'
                            : 'bg-gray-50'
                          : selectedAnswer === 'true'
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          showResult && selectedAnswer === 'true' && currentQuestion.answer !== 'true'
                            ? 'bg-red-500 text-white'
                            : showResult && currentQuestion.answer === 'true'
                            ? 'bg-green-500 text-white'
                            : selectedAnswer === 'true'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200'
                        }`}>
                          ✓
                        </div>
                        <span className="font-medium">正确</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleSelectAnswer('false')}
                      disabled={showResult}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        showResult
                          ? selectedAnswer === 'false'
                            ? currentQuestion.answer === 'false'
                              ? 'bg-green-100 border-2 border-green-500'
                              : 'bg-red-100 border-2 border-red-500'
                            : currentQuestion.answer === 'false'
                            ? 'bg-green-100 border-2 border-green-500'
                            : 'bg-gray-50'
                          : selectedAnswer === 'false'
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          showResult && selectedAnswer === 'false' && currentQuestion.answer !== 'false'
                            ? 'bg-red-500 text-white'
                            : showResult && currentQuestion.answer === 'false'
                            ? 'bg-green-500 text-white'
                            : selectedAnswer === 'false'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200'
                        }`}>
                          ✗
                        </div>
                        <span className="font-medium">错误</span>
                      </div>
                    </button>
                  </>
                ) : (
                  // 选择题
                  currentQuestion.options?.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        if (currentQuestion.type === 'multi') {
                          // 多选题
                          const current = selectedAnswer.split('').sort().join('');
                          if (current.includes(option.key)) {
                            setSelectedAnswer(current.replace(option.key, ''));
                          } else {
                            setSelectedAnswer((current + option.key).split('').sort().join(''));
                          }
                        } else {
                          handleSelectAnswer(option.key);
                        }
                      }}
                      disabled={showResult}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        showResult
                          ? selectedAnswer.includes(option.key)
                            ? currentQuestion.answer.includes(option.key)
                              ? 'bg-green-100 border-2 border-green-500'
                              : 'bg-red-100 border-2 border-red-500'
                            : currentQuestion.answer.includes(option.key)
                            ? 'bg-green-100 border-2 border-green-500'
                            : 'bg-gray-50'
                          : selectedAnswer.includes(option.key)
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                          showResult && selectedAnswer.includes(option.key) && !currentQuestion.answer.includes(option.key)
                            ? 'bg-red-500 text-white'
                            : showResult && currentQuestion.answer.includes(option.key)
                            ? 'bg-green-500 text-white'
                            : selectedAnswer.includes(option.key)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200'
                        }`}>
                          {option.key}
                        </div>
                        <span>{option.value}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* 结果提示 */}
            {showResult && (
              <div className={`rounded-2xl p-4 mb-6 ${
                isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
                  <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? '回答正确！' : '回答错误'}
                  </span>
                </div>
                {!isCorrect && currentQuestion.explanation && (
                  <p className="text-sm text-gray-600 mt-2">
                    💡 {currentQuestion.explanation}
                  </p>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4">
              {!showResult ? (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  className={`flex-1 py-4 rounded-2xl text-lg font-semibold transition-all ${
                    selectedAnswer
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  提交答案
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white py-4 rounded-2xl text-lg font-semibold"
                >
                  {currentIndex < quiz.total - 1 ? '下一题 →' : '查看结果'}
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
