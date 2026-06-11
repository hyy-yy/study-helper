'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
  outlineId?: string;
  error?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [courseName, setCourseName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const allowedExtensions = ['.ppt', '.pptx', '.doc', '.docx'];
  const maxSize = 20 * 1024 * 1024; // 20MB

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return `不支持 ${ext} 格式，请上传 PPT 或 Word 文档`;
    }
    if (file.size > maxSize) {
      return `文件大小超过 20MB 限制`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const fileObj: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
    };

    try {
      // 上传文件
      const formData = new FormData();
      formData.append('file', file);
      if (courseName) {
        formData.append('course', courseName);
      }

      fileObj.progress = 30;
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...fileObj } : f));

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || '上传失败');
      }

      const uploadResult = await uploadResponse.json();
      fileObj.progress = 60;
      fileObj.status = 'processing';
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...fileObj } : f));

      // 生成提纲
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: uploadResult.data.file_id,
          style: 'exam_focus',
          course: courseName,
        }),
      });

      if (!generateResponse.ok) {
        const data = await generateResponse.json();
        throw new Error(data.error || '生成提纲失败');
      }

      const generateResult = await generateResponse.json();
      fileObj.status = 'done';
      fileObj.progress = 100;
      fileObj.outlineId = generateResult.data.outline_id;

      return fileObj;
    } catch (err) {
      fileObj.status = 'error';
      fileObj.error = err instanceof Error ? err.message : '上传失败';
      return fileObj;
    }
  };

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      const error = validateFile(file);
      if (error) {
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          status: 'error',
          progress: 0,
          error,
        });
      } else {
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          status: 'uploading',
          progress: 0,
        });
      }
    }

    setFiles(prev => [...prev, ...newFiles]);

    // 上传有效文件
    for (let i = 0; i < Array.from(fileList).length; i++) {
      const file = Array.from(fileList)[i];
      const error = validateFile(file);
      if (!error) {
        const result = await uploadFile(file);
        setFiles(prev => prev.map(f => f.id === newFiles[i].id ? result : f));
      }
    }
  }, [courseName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const viewOutline = (outlineId: string) => {
    router.push(`/outline/${outlineId}`);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const doneCount = files.filter(f => f.status === 'done').length;
  const errorCount = files.filter(f => f.status === 'error').length;

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
        {/* 课程名称 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📚 课程名称（可选）
          </label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="例如：马克思主义基本原理"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <p className="text-xs text-gray-500 mt-1">
            填写课程名称可以更好地组织资料
          </p>
        </div>

        {/* 上传区域 */}
        <div
          className={`bg-white rounded-2xl shadow-lg p-8 border-2 border-dashed transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50 scale-105'
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">
              {isDragging ? '📥' : '📁'}
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {isDragging ? '松开鼠标上传文件' : '拖拽文件到这里'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">或点击选择文件</p>
            <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm">
              支持 .ppt, .pptx, .doc, .docx 格式
            </div>
            <p className="text-gray-400 text-xs mt-4">最大 20MB · 可同时上传多个文件</p>
          </div>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".ppt,.pptx,.doc,.docx"
          onChange={handleFileChange}
          multiple
          className="hidden"
        />

        {/* 上传统计 */}
        {files.length > 0 && (
          <div className="mt-6 flex gap-4">
            <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{doneCount}</div>
              <div className="text-xs text-green-600">上传成功</div>
            </div>
            <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{files.length}</div>
              <div className="text-xs text-blue-600">总文件数</div>
            </div>
            {errorCount > 0 && (
              <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-xs text-red-600">上传失败</div>
              </div>
            )}
          </div>
        )}

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className={`bg-white rounded-xl shadow p-4 ${
                  file.status === 'error' ? 'border-l-4 border-red-500' : ''
                } ${
                  file.status === 'done' ? 'border-l-4 border-green-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">
                      {file.name.endsWith('.ppt') || file.name.endsWith('.pptx') ? '📊' : '📝'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    ✕
                  </button>
                </div>

                {/* 进度条 */}
                {file.status === 'uploading' || file.status === 'processing' ? (
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          file.status === 'processing' ? 'bg-yellow-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {file.status === 'uploading' ? '上传中...' : 'AI生成提纲中...'}
                      {file.progress}%
                    </p>
                  </div>
                ) : null}

                {/* 错误信息 */}
                {file.status === 'error' && (
                  <p className="text-sm text-red-600 mt-2">❌ {file.error}</p>
                )}

                {/* 成功信息 */}
                {file.status === 'done' && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600 mb-2">✅ 提纲生成成功</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewOutline(file.outlineId!);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
                    >
                      查看提纲 →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 批量操作 */}
        {doneCount > 1 && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-4">
            <button
              onClick={() => {
                const outlineIds = files
                  .filter(f => f.status === 'done' && f.outlineId)
                  .map(f => f.outlineId);
                router.push(`/outlines?ids=${outlineIds.join(',')}`);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3 rounded-xl font-semibold"
            >
              📚 查看所有提纲 ({doneCount}份)
            </button>
          </div>
        )}

        {/* 说明 */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-700 mb-4">📌 使用说明</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>支持 PowerPoint (.ppt, .pptx) 和 Word (.doc, .docx) 文档</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>可以同时上传多个文件，AI会自动处理</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>填写课程名称可以更好地组织资料</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>AI会自动识别重点内容，标注常考易考点</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>生成的提纲支持导出PDF和分享给同学</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
