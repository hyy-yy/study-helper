import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as mammoth from 'mammoth';

// 文档解析函数
async function parseDocument(buffer: Buffer, ext: string): Promise<string> {
  try {
    if (ext === 'pptx') {
      const pptx2json = await import('pptx2json');
      const result = await pptx2json.default(buffer);
      return result.slides.map((slide: any) =>
        slide.texts.map((t: any) => t.text).join('\n')
      ).join('\n\n');
    } else if (ext === 'ppt') {
      const text = buffer.toString('utf-8');
      const printable = text.match(/[\x20-\x7E一-龥　-〿＀-￯]+/g);
      return printable ? printable.join('\n') : '无法解析 .ppt 格式，请转换为 .pptx 后重新上传';
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (ext === 'doc') {
      const text = buffer.toString('utf-8');
      const printable = text.match(/[\x20-\x7E一-龥　-〿＀-￯]+/g);
      return printable ? printable.join('\n') : '无法解析 .doc 格式，请转换为 .docx 后重新上传';
    }
    throw new Error('不支持的文件格式');
  } catch (error) {
    console.error('文档解析失败:', error);
    throw error;
  }
}

// AI生成提纲
async function generateOutline(text: string, course: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';

  if (!apiKey) {
    return generateMockOutline(text, course);
  }

  const courseContext = course ? `课程名称：${course}\n\n` : '';

  const prompt = `你是一位经验丰富的大学教师，正在为学生准备期末复习资料。

${courseContext}请根据以下文档内容，生成一份【考前冲刺型】知识点提纲。

## 要求

1. **结构清晰**：按章节/主题组织，使用树状层级
2. **重点标注**：
   - 🔴 必考重点（核心概念、原理、公式）
   - ⭐ 常考易考点（高频考点、易混淆点）
   - 📌 了解即可（背景知识、扩展内容）
3. **精简扼要**：每个知识点用1-2句话概括
4. **便于记忆**：适当使用口诀、对比、举例

## 输出格式（JSON）

{
  "title": "文档标题 - 知识点提纲",
  "summary": "一句话概括本资料核心内容",
  "chapters": [
    {
      "name": "第一章 章节名",
      "sections": [
        {
          "title": "一、主题名",
          "points": [
            {
              "content": "知识点内容",
              "importance": "high|medium|low",
              "tags": ["必考", "基础", "易错"],
              "note": "补充说明或记忆技巧（可选）"
            }
          ]
        }
      ]
    }
  ],
  "exam_tips": [
    "考试重点提示1",
    "考试重点提示2"
  ]
}

## 文档内容

${text.substring(0, 8000)}

请直接返回JSON格式，不要添加其他说明文字。`;

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'mimo-v2.5-pro',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error('AI API调用失败');
  }

  const data = await response.json();
  const content = data.content[0].text;

  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(content);
  } catch (e) {
    console.error('JSON解析失败:', content);
    throw new Error('AI返回格式错误');
  }
}

// 模拟提纲生成
function generateMockOutline(text: string, course: string): any {
  const lines = text.split('\n').filter(line => line.trim());
  const chapters = [];
  let currentChapter = {
    name: course || '主要内容',
    sections: [] as any[]
  };

  const samplePoints = lines.slice(0, 20).map((line, index) => ({
    content: line.substring(0, 100),
    importance: index < 5 ? 'high' : index < 15 ? 'medium' : 'low',
    tags: index < 5 ? ['必考'] : index < 15 ? ['常考'] : ['了解'],
    note: ''
  }));

  currentChapter.sections.push({
    title: '核心知识点',
    points: samplePoints
  });

  chapters.push(currentChapter);

  return {
    title: `${course || '复习资料'} - 知识点提纲`,
    summary: '本资料包含核心知识点和考试重点',
    chapters: chapters,
    exam_tips: [
      '重点关注标注为🔴的内容',
      '⭐标注的内容是常考易考点',
      '建议先掌握基础概念再深入理解'
    ]
  };
}

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

    // 验证文件类型
    const allowedExtensions = ['.ppt', '.pptx', '.doc', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
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

    // 解析文档
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const text = await parseDocument(buffer, ext);

    // 生成提纲
    const outline = await generateOutline(text, course);

    // 保存到 Supabase
    const { data: savedOutline, error: saveError } = await supabase
      .from('outlines')
      .insert({
        title: outline.title || file.name.replace(/\.[^/.]+$/, ''),
        course: course || '未分类',
        content: outline,
        file_name: file.name,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('保存提纲失败:', saveError);
      return NextResponse.json(
        { success: false, error: '保存提纲失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        file_id: savedOutline.id,
        outline_id: savedOutline.id,
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
