import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as mammoth from 'mammoth';

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

// 从 Word 文档中解析题目
async function parseQuestionsFromWord(buffer: Buffer): Promise<Question[]> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  const questions: Question[] = [];

  // 按行分割文本
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  let currentQuestion: Partial<Question> | null = null;
  let currentOptions: { key: string; value: string }[] = [];
  let questionId = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测题目开始（支持多种格式）
    // 格式1: 1. 题目内容
    // 格式2: 1、题目内容
    // 格式3: 题目1: 内容
    // 格式4: (1) 内容
    const questionMatch = line.match(/^(?:(\d+)[.、)）]\s*|题目\s*(\d+)\s*[:：]\s*|[(（](\d+)[)）]\s*)(.+)/);

    if (questionMatch) {
      // 保存上一题
      if (currentQuestion && currentQuestion.question) {
        questions.push({
          id: ++questionId,
          type: currentQuestion.type || 'single',
          question: currentQuestion.question,
          options: currentOptions.length > 0 ? currentOptions : undefined,
          answer: currentQuestion.answer || 'A',
          chapter: currentQuestion.chapter || '未分类',
          difficulty: currentQuestion.difficulty || 'medium',
          explanation: currentQuestion.explanation,
        });
      }

      // 开始新题目
      const questionText = questionMatch[4];
      currentQuestion = {
        question: questionText,
        type: 'single',
        answer: 'A',
      };
      currentOptions = [];

      // 检测题型
      if (line.includes('[多选]') || line.includes('（多选）') || line.includes('(多选)')) {
        currentQuestion.type = 'multi';
      } else if (line.includes('[判断]') || line.includes('（判断）') || line.includes('(判断)') ||
                 line.includes('正确') || line.includes('错误') || line.includes('对') || line.includes('错')) {
        currentQuestion.type = 'judge';
      }

      continue;
    }

    // 检测选项（支持 A. A、 A) 等格式）
    const optionMatch = line.match(/^([A-Da-d])[.、)）]\s*(.+)/);
    if (optionMatch && currentQuestion) {
      const key = optionMatch[1].toUpperCase();
      const value = optionMatch[2];
      currentOptions.push({ key, value });
      continue;
    }

    // 检测答案（支持多种格式）
    const answerMatch = line.match(/^(?:答案|正确答案|答)[:：]\s*(.+)/i);
    if (answerMatch && currentQuestion) {
      const rawAnswer = answerMatch[1].trim();

      // 判断题答案转换（优先处理）
      if (currentQuestion.type === 'judge') {
        if (['正确', '对', 'TRUE', 'T', '√', '是'].includes(rawAnswer) ||
            rawAnswer.toUpperCase() === 'TRUE') {
          currentQuestion.answer = 'true';
        } else if (['错误', '错', 'FALSE', 'F', '×', '否'].includes(rawAnswer) ||
                   rawAnswer.toUpperCase() === 'FALSE') {
          currentQuestion.answer = 'false';
        } else {
          // 默认根据内容判断
          currentQuestion.answer = 'true';
        }
      } else {
        // 选择题答案处理
        const answer = rawAnswer.toUpperCase();
        // 处理多选答案
        if (answer.includes(',') || answer.includes('、') || answer.includes(' ')) {
          currentQuestion.answer = answer.replace(/[,、\s]+/g, '').split('').sort().join('');
        } else {
          // 单选题，只取第一个字母
          currentQuestion.answer = answer.charAt(0);
        }
      }
      continue;
    }

    // 检测解析
    const explanationMatch = line.match(/^(?:解析|解释|说明)[:：]\s*(.+)/);
    if (explanationMatch && currentQuestion) {
      currentQuestion.explanation = explanationMatch[1];
      continue;
    }

    // 检测章节
    const chapterMatch = line.match(/^(?:章节|章|节|单元)[:：]\s*(.+)/);
    if (chapterMatch && currentQuestion) {
      currentQuestion.chapter = chapterMatch[1];
      continue;
    }
  }

  // 保存最后一题
  if (currentQuestion && currentQuestion.question) {
    questions.push({
      id: ++questionId,
      type: currentQuestion.type || 'single',
      question: currentQuestion.question,
      options: currentOptions.length > 0 ? currentOptions : undefined,
      answer: currentQuestion.answer || 'A',
      chapter: currentQuestion.chapter || '未分类',
      difficulty: currentQuestion.difficulty || 'medium',
      explanation: currentQuestion.explanation,
    });
  }

  if (questions.length === 0) {
    throw new Error('未能从文档中识别出题目，请检查文档格式');
  }

  return questions;
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

    // 验证文件类型 - 支持 JSON、Word、Excel、CSV
    const allowedMimeTypes = [
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    const allowedExtensions = ['.json', '.docx', '.doc', '.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { success: false, error: '只支持 JSON、Word、Excel、CSV 格式' },
        { status: 400 }
      );
    }

    // 验证文件大小（10MB，Word 文档可能较大）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 10MB' },
        { status: 400 }
      );
    }

    let questions: Question[];

    // 根据文件类型处理
    if (fileExt === '.docx' || fileExt === '.doc') {
      // Word 文档处理
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        questions = await parseQuestionsFromWord(buffer);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: `Word 文档解析失败: ${error instanceof Error ? error.message : '未知错误'}` },
          { status: 400 }
        );
      }
    } else {
      // JSON 文件处理
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        questions = validateQuestions(data);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: `文件格式错误: ${error instanceof Error ? error.message : '未知错误'}` },
          { status: 400 }
        );
      }
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
