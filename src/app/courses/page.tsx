'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Outline {
  outline_id: string;
  title: string;
  course: string;
  created_at: string;
}

interface Course {
  name: string;
  count: number;
  outlines: Outline[];
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutlines();
  }, []);

  const fetchOutlines = async () => {
    try {
      const response = await fetch('/api/outline/list');
      if (response.ok) {
        const data = await response.json();
        const outlines: Outline[] = data.data || [];

        // 按课程分组
        const courseMap = new Map<string, Outline[]>();
        outlines.forEach(outline => {
          const courseName = outline.course || '未分类';
          if (!courseMap.has(courseName)) {
            courseMap.set(courseName, []);
          }
          courseMap.get(courseName)!.push(outline);
        });

        // 转换为数组
        const courseList: Course[] = Array.from(courseMap.entries()).map(([name, outs]) => ({
          name,
          count: outs.length,
          outlines: outs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        }));

        setCourses(courseList);
      }
    } catch (error) {
      console.error('获取课程列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-6 px-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-2xl hover:opacity-80"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold">我的课程</h1>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 统计 */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-indigo-600">{courses.length}</div>
              <div className="text-xs text-gray-500">门课程</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {courses.reduce((sum, c) => sum + c.count, 0)}
              </div>
              <div className="text-xs text-gray-500">份提纲</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-spin">📚</div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">还没有课程</h3>
            <p className="text-gray-500 text-sm mb-6">上传复习资料时填写课程名称</p>
            <Link
              href="/upload"
              className="bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm"
            >
              上传资料
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.name} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* 课程标题 */}
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{course.name}</h3>
                      <p className="text-sm text-gray-500">{course.count} 份提纲</p>
                    </div>
                    <span className="text-3xl">📖</span>
                  </div>
                </div>

                {/* 提纲列表 */}
                <div className="p-4 space-y-3">
                  {course.outlines.map((outline) => (
                    <Link
                      key={outline.outline_id}
                      href={`/outline/${outline.outline_id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className="text-xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{outline.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(outline.created_at).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                        <span className="text-gray-400">→</span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* 批量操作 */}
                {course.count > 1 && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => {
                        const outlineIds = course.outlines.map(o => o.outline_id);
                        router.push(`/outlines?ids=${outlineIds.join(',')}&course=${encodeURIComponent(course.name)}`);
                      }}
                      className="w-full bg-indigo-500 text-white py-2 rounded-lg text-sm hover:bg-indigo-600"
                    >
                      📚 查看所有提纲
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 快速入口 */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-4">
          <Link
            href="/upload"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">📤</span>
            <div className="flex-1">
              <p className="font-medium text-gray-800">上传新资料</p>
              <p className="text-xs text-gray-500">添加新的复习资料</p>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
