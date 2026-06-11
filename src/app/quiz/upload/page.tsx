'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function QuizUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpload = async (file: File) => {
    // 验证文件类型 - 支持 JSON、Word、Excel、CSV
    const allowedExtensions = ['.json', '.docx', '.doc', '.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      setError('只支持 JSON、Word、Excel、CSV 格式的文件');
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/quiz/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '上传失败');
      }

      const result = await response.json();
      setSuccess(true);

      // 2秒后跳转到题库页面
      setTimeout(() => {
        router.push('/quiz');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败，请重试');
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
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
          <h1 className="text-xl font-semibold">上传题库</h1>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-md mx-auto px-4 py-8">
        {success ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">上传成功！</h3>
            <p className="text-gray-500">正在跳转到题库页面...</p>
          </div>
        ) : (
          <>
            {/* 上传区域 */}
            <div
              className={`bg-white rounded-2xl shadow-lg p-8 border-2 border-dashed transition-all duration-300 ${
                uploading ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {uploading ? (
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-bounce">📋</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">正在上传...</h3>
                  <p className="text-gray-500 text-sm">请稍候</p>
                </div>
              ) : (
                <div
                  className="text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">选择题库文件</h3>
                  <p className="text-gray-500 text-sm mb-4">支持 JSON、Word、Excel、CSV 格式</p>
                  <div className="inline-block bg-green-100 text-green-600 px-4 py-2 rounded-lg text-sm">
                    点击选择文件
                  </div>
                  <p className="text-gray-400 text-xs mt-4">最大 10MB</p>
                </div>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.docx,.doc,.xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* 题库格式说明 */}
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-700 mb-4">📋 题库格式说明</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Word 文档格式：</h4>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
{`1. 题目内容？
A. 选项A
B. 选项B
C. 选项C
D. 选项D
答案：A
解析：这是解析说明

2. 这道判断题正确吗？
答案：正确
解析：这是解析说明`}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">支持多种格式：1. 1、 (1) 题目1: 等</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">JSON 格式示例：</h4>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
{`[
  {
    "type": "single",
    "question": "题目内容",
    "options": [
      {"key": "A", "value": "选项A"},
      {"key": "B", "value": "选项B"},
      {"key": "C", "value": "选项C"},
      {"key": "D", "value": "选项D"}
    ],
    "answer": "A",
    "chapter": "章节名"
  }
]`}
                  </pre>
                </div>

                <div className="text-sm text-gray-600">
                  <p className="mb-2"><strong>支持的题型：</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• <code>single</code> - 单选题</li>
                    <li>• <code>multi</code> - 多选题（answer 如 "AB"）</li>
                    <li>• <code>judge</code> - 判断题（answer 为 "true" 或 "false"）</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
