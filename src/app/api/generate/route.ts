import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as mammoth from 'mammoth';

// 文档解析函数
async function parseDocument(filePath: string, ext: string): Promise<string> {
  try {
    const buffer = await readFile(filePath);

    if (ext === 'pptx') {
      // 解析 .pptx
      const pptx2json = await import('pptx2json');
      const result = await pptx2json.default(buffer);
      return result.slides.map((slide: any) =>
        slide.texts.map((t: any) => t.text).join('\n')
      ).join('\n\n');
    } else if (ext === 'ppt') {
      // 解析 .ppt - 使用文本提取
      // .ppt 格式较老，尝试提取可见文本
      const text = buffer.toString('utf-8');
      // 提取可打印字符
      const printable = text.match(/[\x20-\x7E一-龥　-〿＀-￯]+/g);
      return printable ? printable.join('\n') : '无法解析 .ppt 格式，请转换为 .pptx 后重新上传';
    } else if (ext === 'docx') {
      // 解析 .docx
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (ext === 'doc') {
      // 解析 .doc - 使用文本提取
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
async function generateOutline(text: string, style: string, course: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';

  if (!apiKey) {
    // 如果没有配置API Key，返回模拟数据
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
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API错误:', errorText);
    throw new Error('AI API调用失败');
  }

  const data = await response.json();
  const content = data.content[0].text;

  // 尝试提取JSON
  try {
    // 如果返回的是markdown代码块，提取其中的JSON
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

// 模拟提纲生成（用于测试）
function generateMockOutline(text: string, course: string): any {
  const lines = text.split('\n').filter(line => line.trim());
  const chapters = [];
  let currentChapter = {
    name: course || '主要内容',
    sections: [] as any[]
  };

  // 简单提取一些内容作为示例
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
    const body = await request.json();
    const { file_id, style = 'exam_focus', course = '' } = body;

    if (!file_id) {
      return NextResponse.json(
        { success: false, error: '缺少文件ID' },
        { status: 400 }
      );
    }

    // 查找文件
    const uploadDir = join(process.cwd(), 'uploads');
    const extensions = ['pptx', 'ppt', 'docx', 'doc'];
    let filePath = '';
    let ext = '';

    for (const e of extensions) {
      const testPath = join(uploadDir, `${file_id}.${e}`);
      try {
        await readFile(testPath);
        filePath = testPath;
        ext = e;
        break;
      } catch {
        continue;
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: '文件不存在' },
        { status: 404 }
      );
    }

    // 解析文档
    const text = await parseDocument(filePath, ext);

    // 生成提纲
    const outline = await generateOutline(text, style, course);

    // 生成提纲ID
    const outlineId = uuidv4();

    // 保存提纲
    const outlineData = {
      outline_id: outlineId,
      file_id: file_id,
      style: style,
      course: course,
      content: outline,
      created_at: new Date().toISOString(),
    };

    // 保存到文件
    const outlinesDir = join(process.cwd(), 'outlines');
    await mkdir(outlinesDir, { recursive: true });
    await writeFile(join(outlinesDir, `${outlineId}.json`), JSON.stringify(outlineData, null, 2));

    return NextResponse.json({
      success: true,
      data: {
        outline_id: outlineId,
        status: 'completed',
      }
    });

  } catch (error) {
    console.error('生成提纲失败:', error);
    return NextResponse.json(
      { success: false, error: '生成提纲失败，请重试' },
      { status: 500 }
    );
  }
}
