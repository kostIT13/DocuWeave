import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestConfig extends RequestInit {
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      ...this.defaultHeaders,
      ...config.headers,
    };

    try {
      const response = await fetch(url, {
        ...config,
        headers,
        credentials: 'include',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          error: data?.detail || data?.error || `HTTP ${response.status}: ${response.statusText}`,
          message: data?.message,
        };
      }

      return {
        success: true,
        data,
        message: data?.message,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async uploadFile(
    endpoint: string,
    file: File,
    additionalData: Record<string, any> = {}
  ): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.defaultHeaders['Authorization'] || '',
        },
        body: formData,
        credentials: 'include',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          error: data?.detail || data?.error || `HTTP ${response.status}: ${response.statusText}`,
          message: data?.message,
        };
      }

      return {
        success: true,
        data,
        message: data?.message,
      };
    } catch (error) {
      console.error('File upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async stream<T = any>(
    endpoint: string,
    onData: (data: T) => void,
    onError?: (error: any) => void
  ): Promise<EventSource> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const eventSource = new EventSource(url, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onData(data);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      if (onError) {
        onError(error);
      }
      eventSource.close();
    };

    return eventSource;
  }
}

export const api = new ApiClient();

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, username: name }),
  
  logout: () => api.post('/auth/logout'),
  
  getCurrentUser: () => api.get('/auth/me'),
};

export const projectService = {
  getProjects: () => api.get('/projects'),
  
  getProject: (id: string) => api.get(`/projects/${id}`),
  
  createProject: (data: { name: string; description?: string; settings?: any }) =>
    api.post('/projects', data),
  
  updateProject: (id: string, data: any) =>
    api.patch(`/projects/${id}`, data),
  
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
};

export const documentService = {
  getDocuments: (projectId: string) =>
    api.get(`/documents?project_id=${projectId}`),
  
  uploadDocument: (projectId: string, file: File) =>
    api.uploadFile('/documents/upload', file, { project_id: projectId }),
  
  deleteDocument: (documentId: string, projectId: string, hard: boolean = false) =>
    api.delete(`/documents/${documentId}?project_id=${projectId}&hard=${hard}`),
  
  retryIndexing: (documentId: string, projectId: string) =>
    api.post(`/documents/${documentId}/retry?project_id=${projectId}`),
};

export const chatService = {
  getSessions: (projectId: string) =>
    api.get(`/chat/sessions?project_id=${projectId}`),
  
  createSession: (projectId: string, title?: string) =>
    api.post('/chat/sessions', { project_id: projectId, title }),
  
  getMessages: (chatId: string) =>
    api.get(`/chat/${chatId}/messages`),
  
  sendMessage: (chatId: string, content: string) =>
    api.post(`/chat/${chatId}/messages`, { content }),
  
  streamMessage: (chatId: string, content: string, onData: (data: any) => void) =>
    api.stream(`/chat/${chatId}/messages/stream?content=${encodeURIComponent(content)}`, onData),
  
  deleteSession: (chatId: string) =>
    api.delete(`/chat/sessions/${chatId}`),
};

export const agentService = {
  query: (data: any) =>
    api.post('/agent/query', data),
  
  queryWithRagFallback: (data: any) =>
    api.post('/agent/query/rag-fallback', data),
  
  analyzeDocument: (data: any) =>
    api.post('/agent/analyze-document', data),
  
  batchProcess: (data: any) =>
    api.post('/agent/batch-process', data),
  
  getInfo: () => api.get('/agent/info'),
  
  getHealth: () => api.get('/agent/health'),
};

export const handleApiError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'An unknown error occurred';
};