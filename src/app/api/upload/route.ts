import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '没有上传文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '只支持 .pptx 和 .docx 格式' },
        { status: 400 }
      );
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // 生成文件ID
    const fileId = uuidv4();
    const ext = file.name.split('.').pop();
    const filename = `${fileId}.${ext}`;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadDir, filename), buffer);

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        file_id: fileId,
        filename: file.name,
        size: file.size,
        type: file.type,
      }
    });

  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { success: false, error: '上传失败，请重试' },
      { status: 500 }
    );
  }
}
