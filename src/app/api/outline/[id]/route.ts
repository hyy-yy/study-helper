import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('outlines')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '提纲不存在' },
        { status: 404 }
      );
    }

    // 转换字段名以保持兼容
    const outline = {
      outline_id: data.id,
      file_id: data.file_name,
      style: 'exam_focus',
      course: data.course,
      content: data.content,
      created_at: data.created_at,
    };

    return NextResponse.json({
      success: true,
      data: outline,
    });

  } catch (error) {
    console.error('获取提纲失败:', error);
    return NextResponse.json(
      { success: false, error: '获取提纲失败' },
      { status: 500 }
    );
  }
}
