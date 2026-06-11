# 📚 期末复习助手

一个基于 Next.js 的期末复习提纲生成网站，上传 PPT/Word 文档后，AI 自动生成带有重点标注的知识点提纲，并支持题库刷题功能。

## ✨ 核心功能

### 📤 复习资料处理
- 支持上传 PPT (.pptx) 和 Word (.docx) 文档
- AI 自动提取知识点，生成考前冲刺型提纲
- 重点标注：🔴必考重点、⭐常考易考点、📌了解即可
- 支持导出 PDF，方便打印复习

### 📝 题库刷题
- 支持上传题库（JSON 格式）
- AI 从提纲自动生成练习题
- 支持单选、多选、判断三种题型
- 章节练习、错题记录、统计分析

### 🔗 分享功能
- 生成分享链接，同学可直接访问
- 无需登录，打开即用

## 🛠️ 技术栈

| 项目 | 技术 |
|-----|------|
| 前端 | Next.js 14 + React + Tailwind CSS |
| 后端 | Next.js API Routes |
| 文件解析 | mammoth (Word) + pptx2json (PPT) |
| AI | OpenAI API / Claude API |
| 数据库 | 文件存储（可扩展至 Vercel KV） |
| 部署 | Vercel |

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# OpenAI API Key（可选，不配置则使用模拟数据）
OPENAI_API_KEY=your_openai_api_key

# 网站地址（用于生成分享链接）
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
study-helper/
├── src/
│   ├── app/
│   │   ├── api/                    # API 路由
│   │   │   ├── generate/           # 提纲生成
│   │   │   ├── outline/            # 提纲相关
│   │   │   ├── quiz/               # 题库相关
│   │   │   ├── share/              # 分享相关
│   │   │   └── upload/             # 文件上传
│   │   ├── outline/[id]/           # 提纲展示页面
│   │   ├── practice/[id]/          # 刷题页面
│   │   ├── quiz/                   # 题库管理
│   │   ├── share/[id]/             # 分享查看页面
│   │   ├── upload/                 # 上传页面
│   │   ├── layout.tsx              # 根布局
│   │   └── page.tsx                # 首页
│   └── types/                      # 类型定义
├── uploads/                        # 上传文件存储
├── outlines/                       # 提纲数据存储
├── quizzes/                        # 题库数据存储
├── shares/                         # 分享数据存储
└── design.md                       # 设计文档
```

## 📋 API 接口

| 方法 | 路径 | 功能 |
|-----|------|------|
| POST | `/api/upload` | 上传文档 |
| POST | `/api/generate` | AI 生成提纲 |
| GET | `/api/outline/:id` | 获取提纲 |
| GET | `/api/outline/list` | 获取提纲列表 |
| POST | `/api/quiz/upload` | 上传题库 |
| POST | `/api/quiz/generate` | AI 生成题目 |
| GET | `/api/quiz/:id` | 获取题库 |
| GET | `/api/quiz/list` | 获取题库列表 |
| POST | `/api/share` | 生成分享链接 |
| GET | `/api/share/:id` | 获取分享内容 |

## 📝 题库格式

上传的题库文件需要是 JSON 格式：

```json
[
  {
    "type": "single",
    "question": "题目内容",
    "options": [
      {"key": "A", "value": "选项A"},
      {"key": "B", "value": "选项B"},
      {"key": "C", "value": "选项C"},
      {"key": "D", "value": "选项D"}
    ],
    "answer": "A",
    "chapter": "章节名"
  }
]
```

### 支持的题型

- `single` - 单选题
- `multi` - 多选题（answer 如 "AB"）
- `judge` - 判断题（answer 为 "true" 或 "false"）

## 🚀 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 一键部署

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**让期末复习更高效！** 📚✨
