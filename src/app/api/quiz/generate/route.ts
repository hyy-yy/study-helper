import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface Question {
  id: number;
  type: 'single' | 'multi' | 'judge';
  question: string;
  options?: { key: string; value: string }[];
  answer: string;
  chapter?: string;
  difficulty?: string;
  knowledge_point?: string;
  explanation?: string;
}

// AI生成题目
async function generateQuestions(outlineContent: any, count: number, types: string[]): Promise<Question[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';

  if (!apiKey) {
    // 如果没有配置API Key，返回模拟数据
    return generateMockQuestions(outlineContent, count);
  }

  const prompt = `你是一位出题经验丰富的大学教师，请根据以下知识点提纲生成练习题。

## 要求

1. **题型分布**：
   - 单选题：${Math.ceil(count * 0.6)}道
   - 多选题：${Math.ceil(count * 0.2)}道
   - 判断题：${Math.ceil(count * 0.2)}道

2. **难度分布**：
   - 简单题（基础记忆）：30%
   - 中等题（理解应用）：50%
   - 困难题（综合分析）：20%

3. **出题原则**：
   - 覆盖所有重要知识点
   - 选项要有迷惑性
   - 避免歧义和争议

4. **标注信息**：
   - 所属章节
   - 对应知识点
   - 难度等级

## 输出格式（JSON）

{
  "questions": [
    {
      "id": 1,
      "type": "single|multi|judge",
      "chapter": "章节名",
      "knowledge_point": "对应知识点",
      "difficulty": "easy|medium|hard",
      "question": "题目内容",
      "options": [
        {"key": "A", "value": "选项内容"},
        {"key": "B", "value": "选项内容"},
        {"key": "C", "value": "选项内容"},
        {"key": "D", "value": "选项内容"}
      ],
      "answer": "A|AB|true|false",
      "explanation": "解析说明"
    }
  ]
}

## 知识点提纲

${JSON.stringify(outlineContent, null, 2).substring(0, 6000)}

请直接返回JSON格式，不要添加其他说明文字。`;

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
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
      const result = JSON.parse(jsonMatch[1]);
      return result.questions;
    }
    const result = JSON.parse(content);
    return result.questions;
  } catch (e) {
    console.error('JSON解析失败:', content);
    throw new Error('AI返回格式错误');
  }
}

// 模拟题目生成
function generateMockQuestions(outlineContent: any, count: number): Question[] {
  const questions: Question[] = [];
  const chapters = outlineContent.chapters || [];

  for (let i = 0; i < count; i++) {
    const chapter = chapters[i % chapters.length];
    const section = chapter?.sections?.[0];
    const point = section?.points?.[i % (section?.points?.length || 1)];

    const type = i % 5 === 0 ? 'multi' : i % 3 === 0 ? 'judge' : 'single';

    if (type === 'judge') {
      questions.push({
        id: i + 1,
        type: 'judge',
        question: `${point?.content || '这是一个知识点'}，这个说法正确吗？`,
        answer: i % 2 === 0 ? 'true' : 'false',
        chapter: chapter?.name || '未分类',
        difficulty: i < count * 0.3 ? 'easy' : i < count * 0.8 ? 'medium' : 'hard',
        knowledge_point: point?.content?.substring(0, 50) || '知识点',
        explanation: '这是解析说明',
      });
    } else {
      questions.push({
        id: i + 1,
        type: type as 'single' | 'multi',
        question: `关于"${point?.content?.substring(0, 30) || '知识点'}"，以下说法正确的是？`,
        options: [
          { key: 'A', value: '选项A内容' },
          { key: 'B', value: '选项B内容' },
          { key: 'C', value: '选项C内容' },
          { key: 'D', value: '选项D内容' },
        ],
        answer: type === 'multi' ? 'AB' : 'A',
        chapter: chapter?.name || '未分类',
        difficulty: i < count * 0.3 ? 'easy' : i < count * 0.8 ? 'medium' : 'hard',
        knowledge_point: point?.content?.substring(0, 50) || '知识点',
        explanation: '这是解析说明',
      });
    }
  }

  return questions;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outline_id, count = 20, types = ['single', 'multi', 'judge'] } = body;

    if (!outline_id) {
      return NextResponse.json(
        { success: false, error: '缺少提纲ID' },
        { status: 400 }
      );
    }

    // 读取提纲
    const outlinesDir = join(process.cwd(), 'outlines');
    const outlinePath = join(outlinesDir, `${outline_id}.json`);

    let outlineData;
    try {
      outlineData = JSON.parse(await readFile(outlinePath, 'utf-8'));
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '提纲不存在' },
        { status: 404 }
      );
    }

    // 生成题目
    const questions = await generateQuestions(outlineData.content, count, types);

    // 生成题库ID
    const quizId = uuidv4();

    // 统计信息
    const chapters = [...new Set(questions.map(q => q.chapter))];
    const stats = {
      total: questions.length,
      single: questions.filter(q => q.type === 'single').length,
      multi: questions.filter(q => q.type === 'multi').length,
      judge: questions.filter(q => q.type === 'judge').length,
    };

    // 保存题库
    const quizData = {
      quiz_id: quizId,
      outline_id: outline_id,
      title: `${outlineData.content.title} - 练习题`,
      source: 'ai_generated',
      questions: questions,
      chapters: chapters,
      stats: stats,
      created_at: new Date().toISOString(),
    };

    const quizzesDir = join(process.cwd(), 'quizzes');
    await mkdir(quizzesDir, { recursive: true });
    await writeFile(join(quizzesDir, `${quizId}.json`), JSON.stringify(quizData, null, 2));

    return NextResponse.json({
      success: true,
      data: {
        quiz_id: quizId,
        title: quizData.title,
        stats: stats,
      }
    });

  } catch (error) {
    console.error('生成题目失败:', error);
    return NextResponse.json(
      { success: false, error: '生成题目失败，请重试' },
      { status: 500 }
    );
  }
}
