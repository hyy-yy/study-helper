import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少提纲ID' },
        { status: 400 }
      );
    }

    // 读取提纲文件
    const outlinesDir = join(process.cwd(), 'outlines');
    const filePath = join(outlinesDir, `${id}.json`);

    try {
      const data = await readFile(filePath, 'utf-8');
      const outline = JSON.parse(data);

      return NextResponse.json({
        success: true,
        data: outline
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '提纲不存在' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('获取提纲失败:', error);
    return NextResponse.json(
      { success: false, error: '获取提纲失败' },
      { status: 500 }
    );
  }
}
