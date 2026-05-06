// frontend/src/pages/Agent.tsx
import { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, FileText, Search, Zap, Brain,
  CheckCircle, Copy, RefreshCw, Settings, Loader2,
} from 'lucide-react';
import { agentService, documentService } from '../services/api';
import toast from 'react-hot-toast';
import type { Document } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const Agent = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [useRag, setUseRag] = useState(true);
  const [useTools, setUseTools] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<'summary' | 'key_points' | 'sentiment' | 'structure'>('summary');
  const [agentInfo, setAgentInfo] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentProjectId = 'current-project-id'; // TODO: заменить на реальный

  useEffect(() => {
    fetchAgentInfo();
    fetchDocuments();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const fetchAgentInfo = async () => {
    try {
      const response = await agentService.getInfo();
      if (response.success) setAgentInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch agent info:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await documentService.getDocuments(currentProjectId);
      if (response.success && response.data) {
        setDocuments(response.data.filter((d: Document) => d.status === 'indexed'));
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setInputText('');
    setConversationHistory(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const request = {
        input_text: userMessage.content,
        project_id: currentProjectId,
        use_rag: useRag,
        use_tools: useTools,
        conversation_history: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      };

      const response = await agentService.query(request);
      
      if (response.success && response.data?.response) {
        setConversationHistory(prev => [...prev, {
          role: 'assistant',
          content: response.data!.response,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        throw new Error(response.error || 'No response from agent');
      }
    } catch (error: any) {
      console.error('Agent error:', error);
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response'}`,
        timestamp: new Date().toISOString(),
      }]);
      toast.error('Failed to get response from agent');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedDocument || isProcessing) return;

    const doc = documents.find(d => d.id === selectedDocument);
    if (!doc) {
      toast.error('Document not found');
      return;
    }

    setIsProcessing(true);
    try {
      const request = {
        document_id: doc.id,
        analysis_type: analysisType,
        project_id: currentProjectId,
      };

      const response = await agentService.analyzeDocument(request);
      
      if (response.success && response.data?.analysis) {
        setConversationHistory(prev => [...prev, {
          role: 'assistant',
          content: `📊 ${analysisType.toUpperCase()}:\n\n${response.data!.analysis}`,
          timestamp: new Date().toISOString(),
        }]);
        toast.success('Analysis completed');
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearConversation = () => {
    setConversationHistory([]);
    toast.success('Conversation cleared');
  };

  const handleCopyResponse = () => {
    const lastMsg = conversationHistory.slice().reverse().find(m => m.role === 'assistant');
    if (lastMsg) {
      navigator.clipboard.writeText(lastMsg.content);
      toast.success('Copied to clipboard');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getToolIcon = (toolName: string) => {
    const icons: Record<string, React.ReactNode> = {
      rag_search: <Search className="w-3 h-3" />,
      document_analysis: <FileText className="w-3 h-3" />,
      summarize: <Brain className="w-3 h-3" />,
      extract_entities: <Zap className="w-3 h-3" />,
    };
    return icons[toolName] || <Bot className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agent</h1>
          <p className="text-gray-600">Intelligent document analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleClearConversation}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear
          </button>
          <button
            onClick={fetchAgentInfo}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Info
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Agent Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold">Agent Status</h3>
                <p className="text-sm text-gray-600">v{agentInfo?.agent_version || '1.0'}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">LLM</span>
                <span className="font-medium">{agentInfo?.llm_service || 'Ollama'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tools</span>
                <span className="font-medium">{agentInfo?.tools_available?.length || 6}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Health</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" /> Healthy
                </span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Use RAG</p>
                  <p className="text-xs text-gray-500">Search documents first</p>
                </div>
                <input
                  type="checkbox"
                  checked={useRag}
                  onChange={(e) => setUseRag(e.target.checked)}
                  className="w-10 h-5 bg-gray-200 rounded-full appearance-none checked:bg-blue-600 relative cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Use Tools</p>
                  <p className="text-xs text-gray-500">Enable analysis tools</p>
                </div>
                <input
                  type="checkbox"
                  checked={useTools}
                  onChange={(e) => setUseTools(e.target.checked)}
                  className="w-10 h-5 bg-gray-200 rounded-full appearance-none checked:bg-blue-600 relative cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Document Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold mb-4">Analyze Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document</label>
                <select
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select document...</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.filename}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Analysis Type</label>
                <select
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="summary">Summary</option>
                  <option value="key_points">Key Points</option>
                  <option value="sentiment">Sentiment</option>
                  <option value="structure">Structure</option>
                </select>
              </div>
              <button
                onClick={handleAnalyzeDocument}
                disabled={!selectedDocument || isProcessing}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
                {isProcessing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-[500px]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <Bot className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold">Conversation</h3>
              </div>
              {conversationHistory.length > 0 && (
                <button onClick={handleCopyResponse} className="text-sm text-gray-600 hover:text-gray-900 flex items-center">
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5">
              {conversationHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Bot className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                  <p className="text-gray-600 max-w-md">
                    Ask questions about your documents or use the analysis tools above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-md' 
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}>
                        <div className="flex items-center mb-2">
                          {msg.role === 'assistant' ? (
                            <Bot className="w-4 h-4 text-blue-600 mr-2" />
                          ) : (
                            <div className="w-4 h-4 bg-white/20 rounded-full mr-2" />
                          )}
                          <span className={`text-xs ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {msg.role === 'user' ? 'You' : 'AI Agent'}
                          </span>
                          <span className={`text-xs ml-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md p-4">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-500">Thinking</span>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                          </div>
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
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask the agent... (Enter to send)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  disabled={isProcessing}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isProcessing}
                  className={`px-5 py-3 rounded-xl flex items-center justify-center ${
                    !inputText.trim() || isProcessing
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agent;