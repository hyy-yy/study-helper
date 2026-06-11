'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async (file: File) => {
    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('只支持 .pptx 和 .docx 格式的文件');
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(10);

    try {
      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);

      // 上传文件
      setProgress(30);
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('上传失败');
      }

      const uploadResult = await uploadResponse.json();
      setProgress(60);

      // 生成提纲
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: uploadResult.data.file_id,
          style: 'exam_focus'
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('生成提纲失败');
      }

      const generateResult = await generateResponse.json();
      setProgress(100);

      // 跳转到提纲页面
      setTimeout(() => {
        router.push(`/outline/${generateResult.data.outline_id}`);
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败，请重试');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
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
          <h1 className="text-xl font-semibold">上传复习资料</h1>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-md mx-auto px-4 py-8">
        {/* 上传区域 */}
        <div
          className={`bg-white rounded-2xl shadow-lg p-8 border-2 border-dashed transition-all duration-300 ${
            uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {uploading ? (
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">📄</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">正在处理...</h3>
              <p className="text-gray-500 text-sm mb-6">AI正在为你生成知识点提纲</p>

              {/* 进度条 */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-500 text-sm">{progress}%</p>
            </div>
          ) : (
            <div
              className="text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">拖拽文件到这里</h3>
              <p className="text-gray-500 text-sm mb-4">或点击选择文件</p>
              <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm">
                支持 .pptx, .docx 格式
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
          accept=".pptx,.docx"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 说明 */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-700 mb-4">📌 使用说明</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>支持 PowerPoint (.pptx) 和 Word (.docx) 文档</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>AI会自动识别重点内容，标注常考易考点</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>生成的提纲支持导出PDF和分享给同学</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>文件会在7天后自动删除，请及时保存</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
