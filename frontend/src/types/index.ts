/**
 * Основные типы для DocuWeave frontend
 */

// Пользователь
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// Проект
export interface Project {
  id: string;
  name: string;
  description: string;
  settings: ProjectSettings;
  created_at: string;
  updated_at: string;
}

// Настройки проекта
export interface ProjectSettings {
  llm_model: string;
  embedding_model: string;
  temperature: number;
  top_k: number;
  chunk_size: number;
  chunk_overlap: number;
  [key: string]: any;
}

// Документ
export interface Document {
  id: string;
  project_id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'indexed' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Сессия чата
export interface ChatSession {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

// Сообщение
export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sources?: Document[];
    tools_used?: string[];
    processing_time?: number;
    [key: string]: any;
  };
  created_at: string;
}

// Ответ агента
export interface AgentResponse {
  success: boolean;
  response: string;
  context: Array<{
    content: string;
    metadata: Record<string, any>;
    score: number;
    rank: number;
  }>;
  tools_used: string[];
  steps: number;
  error?: string;
  processing_time: number;
  agent_version: string;
  metadata: Record<string, any>;
}

// Запрос к агенту
export interface AgentQueryRequest {
  input_text: string;
  project_id: string;
  use_rag: boolean;
  use_tools: boolean;
  conversation_history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// Анализ документа
export interface DocumentAnalysisRequest {
  document_content: string;
  analysis_type: 'summary' | 'key_points' | 'sentiment' | 'structure';
  project_settings?: ProjectSettings;
}

export interface DocumentAnalysisResponse {
  analysis_type: string;
  content_preview: string;
  analysis: string;
  tools_used: string[];
  success: boolean;
  processing_time: number;
  error?: string;
}

// API ответы
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Состояние загрузки
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Пагинация
export interface Pagination<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Фильтры
export interface DocumentFilters {
  status?: Document['status'];
  search?: string;
  from_date?: string;
  to_date?: string;
}

export interface ChatFilters {
  search?: string;
  from_date?: string;
  to_date?: string;
}