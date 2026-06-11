import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const course = formData.get('course') as string || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: '没有上传文件' },
        { status: 400 }
      );
    }

    // 验证文件类型 - 支持 .ppt, .pptx, .doc, .docx
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];

    const allowedExtensions = ['.ppt', '.pptx', '.doc', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { success: false, error: '只支持 PPT 和 Word 文档格式' },
        { status: 400 }
      );
    }

    // 验证文件大小（20MB）
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 20MB' },
        { status: 400 }
      );
    }

    // 生成文件ID
    const fileId = uuidv4();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const filename = `${fileId}.${ext}`;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadDir, filename), buffer);

    // 保存文件元数据
    const metadata = {
      file_id: fileId,
      filename: file.name,
      size: file.size,
      type: file.type,
      ext: ext,
      course: course,
      created_at: new Date().toISOString(),
    };

    const metadataDir = join(process.cwd(), 'metadata');
    await mkdir(metadataDir, { recursive: true });
    await writeFile(join(metadataDir, `${fileId}.json`), JSON.stringify(metadata, null, 2));

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        file_id: fileId,
        filename: file.name,
        size: file.size,
        type: file.type,
        course: course,
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
