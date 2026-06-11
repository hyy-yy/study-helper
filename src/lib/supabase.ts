import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库类型定义
export interface Database {
  public: {
    Tables: {
      outlines: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          course: string;
          content: any;
          file_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          course?: string;
          content: any;
          file_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          course?: string;
          content?: any;
          file_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          source: string;
          questions: any[];
          chapters: string[];
          stats: any;
          outline_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          source?: string;
          questions: any[];
          chapters?: string[];
          stats?: any;
          outline_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          source?: string;
          questions?: any[];
          chapters?: string[];
          stats?: any;
          outline_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shares: {
        Row: {
          id: string;
          type: string;
          target_id: string;
          expire_at: string;
          access_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          target_id: string;
          expire_at: string;
          access_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          target_id?: string;
          expire_at?: string;
          access_count?: number;
          created_at?: string;
        };
      };
      wrong_answers: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          quiz_title: string;
          question: string;
          question_type: string;
          options: any[] | null;
          correct_answer: string;
          user_answer: string;
          explanation: string | null;
          chapter: string | null;
          wrong_count: number;
          last_wrong_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          quiz_title: string;
          question: string;
          question_type: string;
          options?: any[] | null;
          correct_answer: string;
          user_answer: string;
          explanation?: string | null;
          chapter?: string | null;
          wrong_count?: number;
          last_wrong_time?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_id?: string;
          quiz_title?: string;
          question?: string;
          question_type?: string;
          options?: any[] | null;
          correct_answer?: string;
          user_answer?: string;
          explanation?: string | null;
          chapter?: string | null;
          wrong_count?: number;
          last_wrong_time?: string;
          created_at?: string;
        };
      };
    };
  };
}
