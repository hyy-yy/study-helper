import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('outlines')
      .select('id, title, course, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取提纲列表失败:', error);
      return NextResponse.json(
        { success: false, error: '获取提纲列表失败' },
        { status: 500 }
      );
    }

    // 转换字段名以保持兼容
    const outlines = data.map(item => ({
      outline_id: item.id,
      title: item.title,
      course: item.course || '未分类',
      created_at: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: outlines,
    });

  } catch (error) {
    console.error('获取提纲列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取提纲列表失败' },
      { status: 500 }
    );
  }
}
