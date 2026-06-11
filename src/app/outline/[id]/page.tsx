'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface OutlinePoint {
  content: string;
  importance: 'high' | 'medium' | 'low';
  tags: string[];
  note?: string;
}

interface OutlineSection {
  title: string;
  points: OutlinePoint[];
}

interface OutlineChapter {
  name: string;
  sections: OutlineSection[];
}

interface OutlineData {
  outline_id: string;
  file_id: string;
  style: string;
  content: {
    title: string;
    summary: string;
    chapters: OutlineChapter[];
    exam_tips: string[];
  };
  created_at: string;
}

export default function OutlinePage() {
  const router = useRouter();
  const params = useParams();
  const [outline, setOutline] = useState<OutlineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    fetchOutline();
  }, [params.id]);

  const fetchOutline = async () => {
    try {
      const response = await fetch(`/api/outline/${params.id}`);
      if (!response.ok) {
        throw new Error('获取提纲失败');
      }
      const data = await response.json();
      setOutline(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (index: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChapters(newExpanded);
  };

  const getImportanceStyle = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high':
        return '🔴';
      case 'medium':
        return '⭐';
      case 'low':
        return '📌';
      default:
        return '•';
    }
  };

  const handleExportPDF = () => {
    // 使用html2pdf.js导出PDF
    const element = document.getElementById('outline-content');
    if (element) {
      import('html2pdf.js').then((html2pdf) => {
        const opt = {
          margin: 1,
          filename: `${outline?.content.title || '知识点提纲'}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
        };
        html2pdf.default().set(opt).from(element).save();
      });
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'outline',
          id: params.id,
          expire_days: 7,
        }),
      });

      if (!response.ok) {
        throw new Error('生成分享链接失败');
      }

      const data = await response.json();
      const shareUrl = data.data.share_url;

      // 复制到剪贴板
      await navigator.clipboard.writeText(shareUrl);
      alert('分享链接已复制到剪贴板！');
    } catch (err) {
      alert('生成分享链接失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">📚</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !outline) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-gray-500">{error || '提纲不存在'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="text-2xl hover:opacity-80"
            >
              ←
            </button>
            <h1 className="text-xl font-semibold">知识点提纲</h1>
          </div>
          <div className="bg-white/20 rounded-xl p-4">
            <h2 className="font-semibold mb-2">{outline.content.title}</h2>
            <p className="text-blue-100 text-sm">{outline.content.summary}</p>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-md mx-auto px-4 py-6" id="outline-content">
        {/* 统计 */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-500">🔴</div>
              <div className="text-xs text-gray-500">必考重点</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">⭐</div>
              <div className="text-xs text-gray-500">常考易考点</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-500">📌</div>
              <div className="text-xs text-gray-500">了解即可</div>
            </div>
          </div>
        </div>

        {/* 考试提示 */}
        {outline.content.exam_tips && outline.content.exam_tips.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 考试提示</h3>
            <ul className="space-y-2">
              {outline.content.exam_tips.map((tip, index) => (
                <li key={index} className="text-yellow-700 text-sm flex items-start gap-2">
                  <span>•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 章节内容 */}
        <div className="space-y-4">
          {outline.content.chapters.map((chapter, chapterIndex) => (
            <div key={chapterIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* 章节标题 */}
              <button
                onClick={() => toggleChapter(chapterIndex)}
                className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-semibold text-gray-800">{chapter.name}</h3>
                <span className="text-gray-500">
                  {expandedChapters.has(chapterIndex) ? '▼' : '▶'}
                </span>
              </button>

              {/* 章节内容 */}
              {expandedChapters.has(chapterIndex) && (
                <div className="p-4 space-y-4">
                  {chapter.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                      <h4 className="font-medium text-gray-700 mb-3">{section.title}</h4>
                      <div className="space-y-3">
                        {section.points.map((point, pointIndex) => (
                          <div
                            key={pointIndex}
                            className={`p-3 rounded-xl border ${getImportanceStyle(point.importance)}`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">
                                {getImportanceIcon(point.importance)}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm">{point.content}</p>
                                {point.note && (
                                  <p className="text-xs mt-2 opacity-75">
                                    💡 {point.note}
                                  </p>
                                )}
                                {point.tags && point.tags.length > 0 && (
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    {point.tags.map((tag, tagIndex) => (
                                      <span
                                        key={tagIndex}
                                        className="text-xs px-2 py-0.5 rounded-full bg-white/50"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleExportPDF}
            className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            📄 导出PDF
          </button>
          <button
            onClick={handleShare}
            className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
          >
            🔗 分享链接
          </button>
        </div>
      </main>
    </div>
  );
}
