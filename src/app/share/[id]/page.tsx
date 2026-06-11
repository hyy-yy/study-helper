'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface ShareData {
  type: 'outline' | 'quiz';
  content: any;
  share_info: {
    created_at: string;
    expire_at: string;
    access_count: number;
  };
}

export default function SharePage() {
  const router = useRouter();
  const params = useParams();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShareData();
  }, [params.id]);

  const fetchShareData = async () => {
    try {
      const response = await fetch(`/api/share/${params.id}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '获取分享内容失败');
      }
      const data = await response.json();
      setShareData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🔗</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-gray-500 mb-4">{error || '分享内容不存在'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
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
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push('/')}
              className="text-2xl hover:opacity-80"
            >
              ←
            </button>
            <h1 className="text-xl font-semibold">
              {shareData.type === 'outline' ? '知识点提纲' : '练习题库'}
            </h1>
          </div>
          <div className="text-sm text-blue-100">
            分享于 {new Date(shareData.share_info.created_at).toLocaleDateString('zh-CN')}
            · 已被查看 {shareData.share_info.access_count} 次
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 提示信息 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-700 text-sm">
            ⏰ 此分享链接将于 {new Date(shareData.share_info.expire_at).toLocaleDateString('zh-CN')} 过期
          </p>
        </div>

        {/* 内容预览 */}
        {shareData.type === 'outline' ? (
          <OutlinePreview content={shareData.content} />
        ) : (
          <QuizPreview content={shareData.content} />
        )}

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => {
              // 保存到本地
              const saved = JSON.parse(localStorage.getItem('study-helper-shares') || '[]');
              saved.push({
                type: shareData.type,
                id: params.id,
                title: shareData.content.title || shareData.content.content?.title,
                saved_at: new Date().toISOString(),
              });
              localStorage.setItem('study-helper-shares', JSON.stringify(saved));
              alert('已保存到本地！');
            }}
            className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold"
          >
            💾 保存
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('链接已复制！');
            }}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold"
          >
            🔗 复制链接
          </button>
        </div>
      </main>
    </div>
  );
}

// 提纲预览组件
function OutlinePreview({ content }: { content: any }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-2">{content.title}</h2>
      <p className="text-gray-500 text-sm mb-6">{content.summary}</p>

      <div className="space-y-4">
        {content.chapters?.slice(0, 3).map((chapter: any, index: number) => (
          <div key={index}>
            <h3 className="font-semibold text-gray-700 mb-2">{chapter.name}</h3>
            <div className="space-y-2">
              {chapter.sections?.slice(0, 2).map((section: any, sIndex: number) => (
                <div key={sIndex}>
                  <p className="text-sm text-gray-600 mb-1">{section.title}</p>
                  <ul className="space-y-1 ml-4">
                    {section.points?.slice(0, 3).map((point: any, pIndex: number) => (
                      <li key={pIndex} className="text-sm text-gray-500 flex items-start gap-2">
                        <span>
                          {point.importance === 'high' ? '🔴' :
                           point.importance === 'medium' ? '⭐' : '📌'}
                        </span>
                        <span>{point.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {content.chapters?.length > 3 && (
        <p className="text-sm text-gray-400 mt-4 text-center">
          还有 {content.chapters.length - 3} 个章节...
        </p>
      )}
    </div>
  );
}

// 题库预览组件
function QuizPreview({ content }: { content: any }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{content.title}</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{content.stats?.total || 0}</div>
          <div className="text-xs text-gray-500">总题数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{content.stats?.single || 0}</div>
          <div className="text-xs text-gray-500">单选题</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-500">{content.stats?.multi || 0}</div>
          <div className="text-xs text-gray-500">多选题</div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-700 mb-3">题目预览</h3>
        <div className="space-y-3">
          {content.questions?.slice(0, 3).map((q: any, index: number) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{index + 1}. {q.question}</p>
              <div className="mt-2 flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  q.type === 'single' ? 'bg-blue-100 text-blue-600' :
                  q.type === 'multi' ? 'bg-green-100 text-green-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {q.type === 'single' ? '单选' : q.type === 'multi' ? '多选' : '判断'}
                </span>
                {q.chapter && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {q.chapter}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {content.questions?.length > 3 && (
        <p className="text-sm text-gray-400 mt-4 text-center">
          还有 {content.questions.length - 3} 道题目...
        </p>
      )}
    </div>
  );
}
