'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [stats, setStats] = useState({
    outlines: 0,
    questions: 0,
    quizzes: 0,
    courses: 0
  });

  useEffect(() => {
    // 从本地存储获取统计信息
    const savedStats = localStorage.getItem('study-helper-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">📚 期末复习助手</h1>
          <p className="text-blue-100 text-lg">上传资料，AI帮你划重点</p>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-md mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-gray-500 text-sm mb-4">学习统计</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.outlines}</div>
              <div className="text-gray-500 text-xs mt-1">份提纲</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.questions}</div>
              <div className="text-gray-500 text-xs mt-1">道题目</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.quizzes}</div>
              <div className="text-gray-500 text-xs mt-1">次刷题</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">{stats.courses}</div>
              <div className="text-gray-500 text-xs mt-1">门课程</div>
            </div>
          </div>
        </div>

        {/* 功能入口 */}
        <div className="space-y-4">
          <Link href="/upload" className="block">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">📤</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">上传复习资料</h2>
                  <p className="text-gray-500 text-sm">支持 PPT、Word 文档</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/courses" className="block">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">📚</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">我的课程</h2>
                  <p className="text-gray-500 text-sm">按课程查看资料</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/quiz" className="block">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">📝</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">我的题库</h2>
                  <p className="text-gray-500 text-sm">上传或AI生成题目</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/practice" className="block">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">✏️</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">开始刷题</h2>
                  <p className="text-gray-500 text-sm">已有 {stats.questions} 道题目</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 快速入口 */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-gray-500 text-sm mb-4">快速开始</h3>
          <div className="space-y-3">
            <Link href="/upload" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-blue-500">📄</span>
              <span className="text-gray-700">上传一份复习资料</span>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
            <Link href="/courses" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-indigo-500">📚</span>
              <span className="text-gray-700">查看我的课程</span>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
            <Link href="/quiz/upload" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-green-500">📋</span>
              <span className="text-gray-700">上传一份题库</span>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
            <Link href="/practice" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-purple-500">🎯</span>
              <span className="text-gray-700">开始刷题练习</span>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
          </div>
        </div>
      </main>

      {/* 底部 */}
      <footer className="text-center py-6 text-gray-400 text-sm">
        <p>期末复习助手 - 让复习更高效</p>
      </footer>
    </div>
  );
}
