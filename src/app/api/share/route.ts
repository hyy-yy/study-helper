import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, expire_days = 7 } = body;

    if (!type || !id) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证类型
    if (!['outline', 'quiz'].includes(type)) {
      return NextResponse.json(
        { success: false, error: '无效的分享类型' },
        { status: 400 }
      );
    }

    // 验证目标是否存在
    const table = type === 'outline' ? 'outlines' : 'quizzes';
    const { data: target, error: targetError } = await supabase
      .from(table)
      .select('id')
      .eq('id', id)
      .single();

    if (targetError || !target) {
      return NextResponse.json(
        { success: false, error: '目标不存在' },
        { status: 404 }
      );
    }

    // 生成分享ID
    const shareId = uuidv4().substring(0, 8);

    // 计算过期时间
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + expire_days);

    // 保存到 Supabase
    const { error: saveError } = await supabase
      .from('shares')
      .insert({
        id: shareId,
        type: type,
        target_id: id,
        expire_at: expireAt.toISOString(),
        access_count: 0,
      });

    if (saveError) {
      console.error('保存分享记录失败:', saveError);
      return NextResponse.json(
        { success: false, error: '保存分享记录失败' },
        { status: 500 }
      );
    }

    // 生成分享URL - 自动检测当前域名
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || process.env.NEXT_PUBLIC_BASE_URL || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    const shareUrl = `${baseUrl}/share/${shareId}`;

    return NextResponse.json({
      success: true,
      data: {
        share_id: shareId,
        share_url: shareUrl,
        expire_at: expireAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('生成分享链接失败:', error);
    return NextResponse.json(
      { success: false, error: '生成分享链接失败' },
      { status: 500 }
    );
  }
}
