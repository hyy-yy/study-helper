import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const outlinesDir = join(process.cwd(), 'outlines');

    try {
      const files = await readdir(outlinesDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const outlines = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const data = await readFile(join(outlinesDir, file), 'utf-8');
            const outline = JSON.parse(data);
            return {
              outline_id: outline.outline_id,
              title: outline.content?.title || '未命名提纲',
              course: outline.course || '未分类',
              created_at: outline.created_at,
            };
          } catch (error) {
            return null;
          }
        })
      );

      // 过滤掉无效数据并按时间排序
      const validOutlines = outlines
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json({
        success: true,
        data: validOutlines,
      });

    } catch (error) {
      // 目录不存在或为空
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

  } catch (error) {
    console.error('获取提纲列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取提纲列表失败' },
      { status: 500 }
    );
  }
}
