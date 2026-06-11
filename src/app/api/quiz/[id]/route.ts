import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // 从 Supabase 获取题库
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !quiz) {
      return NextResponse.json(
        { success: false, error: '题库不存在' },
        { status: 404 }
      );
    }

    // 过滤题目
    let questions = quiz.questions || [];

    if (chapter) {
      questions = questions.filter((q: any) => q.chapter === chapter);
    }

    if (type) {
      questions = questions.filter((q: any) => q.type === type);
    }

    return NextResponse.json({
      success: true,
      data: {
        quiz_id: quiz.id,
        title: quiz.title,
        total: questions.length,
        questions: questions,
        chapters: quiz.chapters || [],
        stats: quiz.stats || {},
      }
    });

  } catch (error) {
    console.error('获取题库失败:', error);
    return NextResponse.json(
      { success: false, error: '获取题库失败' },
      { status: 500 }
    );
  }
}
