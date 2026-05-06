// frontend/src/pages/Chat.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Bot, User, Clock, Trash2, Plus, Loader2 } from 'lucide-react';
import { chatService } from '../services/api';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

interface SSEEvent {
  type: 'token' | 'sources' | 'done' | 'error';
  content?: string;
  data?: any;
  detail?: string;
}

const Chat = () => {
  const { projectId, chatId } = useParams<{ projectId: string; chatId: string }>();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string }>>([]);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // TODO: Заменить на реальный project_id из URL/контекста
  const currentProjectId = projectId || 'current-project-id';

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (chatId) {
      fetchMessages();
    } else {
      setIsLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingResponse]);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await chatService.getSessions(currentProjectId);
      if (response.success && response.data) {
        setSessions(response.data);
        
        if (!chatId && response.data.length > 0) {
          navigate(`/projects/${currentProjectId}/chat/${response.data[0].id}`, { replace: true });
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchMessages = async () => {
    if (!chatId) return;
    setIsLoading(true);
    try {
      const response = await chatService.getMessages(currentProjectId, chatId);
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewChat = async () => {
    setIsCreating(true);
    try {
      const response = await chatService.createSession(currentProjectId, 'New Chat');
      if (response.success && response.data?.id) {
        navigate(`/projects/${currentProjectId}/chat/${response.data.id}`);
        await fetchSessions();
        toast.success('New chat created');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to create new chat');
    } finally {
      setIsCreating(false);
    }
  };

  // Найди функцию handleSend и исправь эту часть:

  const handleSend = async () => {
    if (!input.trim() || !chatId || isSending) return;
  
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      session_id: chatId,
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
      metadata: {},
    };
  
  // Добавляем сообщение пользователя
    setMessages(prev => [...prev, userMessage]);
    const userQuery = input;
    setInput('');
    setIsSending(true);
    setStreamingResponse('');
    setSources([]);
  
    try {
    // ✅ ИСПРАВЛЕНО: добавлен await
      const es = await chatService.streamMessage(
        currentProjectId,
        chatId,
        userQuery,
      // onData callback
        (event: SSEEvent) => {
          console.log('SSE event:', event);
        
          if (event.type === 'token') {
          // Добавляем токен к стриминговому ответу
            setStreamingResponse(prev => prev + (event.content || ''));
          } else if (event.type === 'sources') {
          // Сохраняем источники
            const sourceList = event.data?.docs?.map((d: any) => d.file) || [];
            setSources(sourceList);
          } else if (event.type === 'done') {
          // Стриминг завершён — добавляем финальное сообщение
            if (streamingResponse) {
              setMessages(prev => [...prev, {
                id: `assistant-${Date.now()}`,
                session_id: chatId,
                role: 'assistant',
                content: streamingResponse,
                created_at: new Date().toISOString(),
                metadata: { sources }
              }]);
            }
            setIsSending(false);
            setStreamingResponse('');
          } else if (event.type === 'error') {
            toast.error(event.detail || 'Ошибка при получении ответа');
            setIsSending(false);
            setStreamingResponse('');
          }
        },
      // onError callback
        (error) => {
          console.error('Stream error:', error);
          toast.error('Connection error');
          setIsSending(false);
          setStreamingResponse('');
        }
      );
    
    // ✅ ТЕПЕРЬ es — это EventSource, а не Promise
      eventSourceRef.current = es;
    
    } catch (error) {
      console.error('Failed to start stream:', error);
      toast.error('Failed to send message');
      setIsSending(false);
    // Убираем временное сообщение при ошибке
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    }
  };

  const handleDeleteChat = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat session?')) return;
    
    try {
      const response = await chatService.deleteSession(currentProjectId, sessionId);
      if (response.success) {
        if (sessionId === chatId) {
          navigate(`/projects/${currentProjectId}/chat`);
        }
        await fetchSessions();
        toast.success('Chat deleted');
      }
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Показываем спиннер только при загрузке сообщений
  if (isLoading && chatId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Пустое состояние — нет выбранного чата
  if (!chatId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
            <p className="text-gray-600">Conversations about your documents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Recent Chats</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-500">
                    <p className="text-sm">No chat sessions yet</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => navigate(`/projects/${currentProjectId}/chat/${session.id}`)}
                      className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                          <MessageSquare className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{session.title}</p>
                            <p className="text-sm text-gray-500">Click to open</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-[600px]">
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {sessions.length === 0 ? 'No chats yet' : 'Select a chat'}
                </h3>
                <p className="text-gray-600 max-w-md mb-8">
                  {sessions.length === 0 
                    ? 'Start your first conversation about your documents. Ask questions and get AI-powered answers.'
                    : 'Choose a chat from the sidebar or create a new one to continue your conversation.'
                  }
                </p>
                <button
                  onClick={handleNewChat}
                  disabled={isCreating}
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl transition-all"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Chat
                    </>
                  )}
                </button>
                
                {sessions.length > 0 && (
                  <p className="mt-4 text-sm text-gray-500">
                    or select an existing chat from the sidebar
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Основной интерфейс чата
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <p className="text-gray-600">Conversations about your documents</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleNewChat}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Recent Chats</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-500">
                  <p className="text-sm">No chat sessions yet</p>
                  <button 
                    onClick={handleNewChat} 
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Create your first chat
                  </button>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/projects/${currentProjectId}/chat/${session.id}`)}
                    className={`px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      session.id === chatId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <MessageSquare className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{session.title}</p>
                          <p className="text-sm text-gray-500">Click to open</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(session.id, e)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 hover:opacity-100"
                        title="Delete chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-[600px]">
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bot className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {sessions.find(s => s.id === chatId)?.title || 'Chat Session'}
                    </h3>
                    <p className="text-sm text-gray-600">AI Assistant • Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {messages.length > 0 ? formatTime(messages[messages.length - 1].created_at) : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {messages.length === 0 && !streamingResponse ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Bot className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
                  <p className="text-gray-600 max-w-md">
                    Ask questions about your uploaded documents. The AI will search through your files to provide accurate answers.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          {message.role === 'assistant' ? (
                            <Bot className="w-4 h-4 text-blue-600 mr-2" />
                          ) : (
                            <User className="w-4 h-4 mr-2" />
                          )}
                          <span className={`text-xs font-medium ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          <span className={`text-xs ml-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                          }`}>
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        
                        {/* Sources */}
                        {message.metadata?.sources && message.metadata.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200/50">
                            <p className={`text-xs font-medium mb-1 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              Sources:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.metadata.sources.slice(0, 3).map((source: any, idx: number) => {
                                const sourceText = String(source || '');
                                const displayName = sourceText.split('/').pop()?.substring(0, 20) || 'Source';
                                return (
                                  <span
                                    key={idx}
                                    className={`text-xs px-2 py-1 rounded ${
                                      message.role === 'user'
                                        ? 'bg-blue-500/50 text-blue-50'
                                        : 'bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    {displayName}...
                                  </span>
                                );
                              })}
                              {message.metadata.sources.length > 3 && (
                                <span className={`text-xs ${
                                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                                }`}>
                                  +{message.metadata.sources.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* ✅ Streaming response */}
                  {streamingResponse && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md p-4 max-w-[85%]">
                        <div className="flex items-center mb-2">
                          <Bot className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-xs font-medium text-gray-500">AI Assistant</span>
                          {isSending && (
                            <span className="ml-2 text-xs text-blue-600 flex items-center">
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Thinking...
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{streamingResponse}</p>
                        
                        {/* Streaming sources */}
                        {sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200/50">
                            <p className="text-xs font-medium text-gray-500 mb-1">Sources:</p>
                            <div className="flex flex-wrap gap-1">
                              {sources.slice(0, 3).map((source: string, idx: number) => {
                                const displayName = source.split('/').pop()?.substring(0, 20) || 'Source';
                                return (
                                  <span key={idx} className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                                    {displayName}...
                                  </span>
                                );
                              })}
                              {sources.length > 3 && (
                                <span className="text-xs text-gray-400">+{sources.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isSending && !streamingResponse && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md p-4 max-w-[85%]">
                        <div className="flex items-center">
                          <Bot className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-xs font-medium text-gray-500">AI Assistant</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your documents... (Press Enter to send)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                    rows={2}
                    disabled={isSending || !chatId}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isSending || !chatId}
                  className={`self-end px-5 py-3 rounded-xl flex items-center justify-center transition-all ${
                    !input.trim() || isSending || !chatId
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                  }`}
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                AI may make mistakes. Verify important information from your documents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;