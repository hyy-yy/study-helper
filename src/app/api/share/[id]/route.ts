import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

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

    // 读取分享记录
    const sharesDir = join(process.cwd(), 'shares');
    const sharePath = join(sharesDir, `${id}.json`);

    try {
      const shareData = JSON.parse(await readFile(sharePath, 'utf-8'));

      // 检查是否过期
      if (new Date(shareData.expire_at) < new Date()) {
        return NextResponse.json(
          { success: false, error: '分享链接已过期' },
          { status: 410 }
        );
      }

      // 增加访问次数
      shareData.access_count += 1;
      await writeFile(sharePath, JSON.stringify(shareData, null, 2));

      // 读取目标内容
      const targetDir = shareData.type === 'outline' ? 'outlines' : 'quizzes';
      const targetPath = join(process.cwd(), targetDir, `${shareData.target_id}.json`);

      try {
        const targetData = JSON.parse(await readFile(targetPath, 'utf-8'));

        return NextResponse.json({
          success: true,
          data: {
            type: shareData.type,
            content: targetData,
            share_info: {
              created_at: shareData.created_at,
              expire_at: shareData.expire_at,
              access_count: shareData.access_count,
            }
          }
        });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: '内容不存在' },
          { status: 404 }
        );
      }

    } catch (error) {
      return NextResponse.json(
        { success: false, error: '分享链接不存在' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('获取分享内容失败:', error);
    return NextResponse.json(
      { success: false, error: '获取分享内容失败' },
      { status: 500 }
    );
  }
}
