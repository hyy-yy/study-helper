import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
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

function validateQuestions(data: any): Question[] {
  if (!Array.isArray(data)) {
    throw new Error('题库数据必须是数组格式');
  }

  return data.map((item, index) => {
    // 验证必填字段
    if (!item.type || !item.question || !item.answer) {
      throw new Error(`第 ${index + 1} 题缺少必填字段（type, question, answer）`);
    }

    // 验证题型
    if (!['single', 'multi', 'judge'].includes(item.type)) {
      throw new Error(`第 ${index + 1} 题类型无效，必须是 single、multi 或 judge`);
    }

    // 验证选项
    if (item.type !== 'judge' && (!item.options || !Array.isArray(item.options))) {
      throw new Error(`第 ${index + 1} 题缺少选项`);
    }

    return {
      id: index + 1,
      type: item.type,
      question: item.question,
      options: item.options,
      answer: item.answer,
      chapter: item.chapter || '未分类',
      difficulty: item.difficulty || 'medium',
      knowledge_point: item.knowledge_point,
      explanation: item.explanation,
    };
  });
}

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
      'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '只支持 JSON、Excel、CSV 格式' },
        { status: 400 }
      );
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 5MB' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const text = await file.text();
    let questions: Question[];

    try {
      const data = JSON.parse(text);
      questions = validateQuestions(data);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `文件格式错误: ${error instanceof Error ? error.message : '未知错误'}` },
        { status: 400 }
      );
    }

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
      title: file.name.replace(/\.[^/.]+$/, ''),
      source: 'user_uploaded',
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
    console.error('上传题库失败:', error);
    return NextResponse.json(
      { success: false, error: '上传题库失败，请重试' },
      { status: 500 }
    );
  }
}
