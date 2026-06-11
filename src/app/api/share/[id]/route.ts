import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少分享ID' },
        { status: 400 }
      );
    }

    // 从 Supabase 获取分享记录
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*')
      .eq('id', id)
      .single();

    if (shareError || !share) {
      return NextResponse.json(
        { success: false, error: '分享链接不存在' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (new Date(share.expire_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: '分享链接已过期' },
        { status: 410 }
      );
    }

    // 增加访问次数
    await supabase
      .from('shares')
      .update({ access_count: share.access_count + 1 })
      .eq('id', id);

    // 获取目标内容
    const table = share.type === 'outline' ? 'outlines' : 'quizzes';
    const { data: target, error: targetError } = await supabase
      .from(table)
      .select('*')
      .eq('id', share.target_id)
      .single();

    if (targetError || !target) {
      return NextResponse.json(
        { success: false, error: '内容不存在' },
        { status: 404 }
      );
    }

    // 转换字段名以保持兼容
    let content = target;
    if (share.type === 'outline') {
      content = {
        outline_id: target.id,
        file_id: target.file_name,
        style: 'exam_focus',
        course: target.course,
        content: target.content,
        created_at: target.created_at,
      };
    } else {
      content = {
        quiz_id: target.id,
        title: target.title,
        source: target.source,
        questions: target.questions,
        chapters: target.chapters,
        stats: target.stats,
        created_at: target.created_at,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        type: share.type,
        content: content,
        share_info: {
          created_at: share.created_at,
          expire_at: share.expire_at,
          access_count: share.access_count + 1,
        }
      }
    });

  } catch (error) {
    console.error('获取分享内容失败:', error);
    return NextResponse.json(
      { success: false, error: '获取分享内容失败' },
      { status: 500 }
    );
  }
}
