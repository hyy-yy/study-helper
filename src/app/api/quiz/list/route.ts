import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, title, source, stats, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取题库列表失败:', error);
      return NextResponse.json(
        { success: false, error: '获取题库列表失败' },
        { status: 500 }
      );
    }

    // 转换字段名以保持兼容
    const quizzes = data.map(item => ({
      quiz_id: item.id,
      title: item.title,
      source: item.source,
      stats: item.stats,
      created_at: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: quizzes,
    });

  } catch (error) {
    console.error('获取题库列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取题库列表失败' },
      { status: 500 }
    );
  }
}
