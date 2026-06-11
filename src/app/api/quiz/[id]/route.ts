import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const chapter = searchParams.get('chapter');
    const type = searchParams.get('type');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少题库ID' },
        { status: 400 }
      );
    }

    // 读取题库
    const quizzesDir = join(process.cwd(), 'quizzes');
    const quizPath = join(quizzesDir, `${id}.json`);

    try {
      const data = await readFile(quizPath, 'utf-8');
      const quiz = JSON.parse(data);

      // 过滤题目
      let questions = quiz.questions;

      if (chapter) {
        questions = questions.filter((q: any) => q.chapter === chapter);
      }

      if (type) {
        questions = questions.filter((q: any) => q.type === type);
      }

      return NextResponse.json({
        success: true,
        data: {
          quiz_id: quiz.quiz_id,
          title: quiz.title,
          total: questions.length,
          questions: questions,
          chapters: quiz.chapters,
          stats: quiz.stats,
        }
      });

    } catch (error) {
      return NextResponse.json(
        { success: false, error: '题库不存在' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('获取题库失败:', error);
    return NextResponse.json(
      { success: false, error: '获取题库失败' },
      { status: 500 }
    );
  }
}
