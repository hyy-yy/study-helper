import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const quizzesDir = join(process.cwd(), 'quizzes');

    try {
      const files = await readdir(quizzesDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const quizzes = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const data = await readFile(join(quizzesDir, file), 'utf-8');
            const quiz = JSON.parse(data);
            return {
              quiz_id: quiz.quiz_id,
              title: quiz.title,
              source: quiz.source,
              stats: quiz.stats,
              created_at: quiz.created_at,
            };
          } catch (error) {
            return null;
          }
        })
      );

      // 过滤掉无效数据并按时间排序
      const validQuizzes = quizzes
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json({
        success: true,
        data: validQuizzes,
      });

    } catch (error) {
      // 目录不存在或为空
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

  } catch (error) {
    console.error('获取题库列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取题库列表失败' },
      { status: 500 }
    );
  }
}
