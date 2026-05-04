import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  FileText,
  Search,
  Zap,
  Brain,
  Clock,
  CheckCircle,
  Copy,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { agentService } from '../services/api';
import type { AgentResponse, AgentQueryRequest, DocumentAnalysisRequest } from '../types';

const Agent = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>
  >([]);
  const [useRag, setUseRag] = useState(true);
  const [useTools, setUseTools] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<'summary' | 'key_points' | 'sentiment' | 'structure'>('summary');
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const documents = [
    { id: '1', name: 'Annual_Report_2024.pdf', content: 'Annual financial report for 2024...' },
    { id: '2', name: 'Project_Proposal.docx', content: 'Project proposal document...' },
    { id: '3', name: 'Technical_Specifications.txt', content: 'Technical specifications...' },
  ];

  useEffect(() => {
    fetchAgentInfo();
    scrollToBottom();
  }, [conversationHistory]);

  const fetchAgentInfo = async () => {
    try {
      const response = await agentService.getInfo();
      if (response.success) {
        setAgentInfo(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch agent info:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    const userMessageObj = {
      role: 'user' as const,
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    
    setConversationHistory(prev => [...prev, userMessageObj]);
    setIsProcessing(true);

    try {
      const request: AgentQueryRequest = {
        input_text: userMessage,
        project_id: '1', 
        use_rag: useRag,
        use_tools: useTools,
        conversation_history: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      };

      const response = await agentService.query(request);
      
      if (response.success && response.data) {
        setAgentResponse(response.data);
        
        const assistantMessageObj = {
          role: 'assistant' as const,
          content: response.data.response,
          timestamp: new Date().toISOString(),
        };
        
        setConversationHistory(prev => [...prev, assistantMessageObj]);
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessageObj = {
        role: 'assistant' as const,
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      
      setConversationHistory(prev => [...prev, errorMessageObj]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedDocument) {
      alert('Please select a document first');
      return;
    }

    const document = documents.find(doc => doc.id === selectedDocument);
    if (!document) return;

    setIsProcessing(true);

    try {
      const request: DocumentAnalysisRequest = {
        document_content: document.content,
        analysis_type: analysisType,
      };

      const response = await agentService.analyzeDocument(request);
      
      if (response.success && response.data) {
        const analysisMessage = {
          role: 'assistant' as const,
          content: `Document analysis (${analysisType}):\n\n${response.data.analysis}`,
          timestamp: new Date().toISOString(),
        };
        
        setConversationHistory(prev => [...prev, analysisMessage]);
        setAgentResponse({
          success: true,
          response: response.data.analysis,
          context: [],
          tools_used: response.data.tools_used,
          steps: 1,
          processing_time: response.data.processing_time,
          agent_version: '1.0.0',
          metadata: { analysis_type: analysisType },
        });
      }
    } catch (error) {
      console.error('Failed to analyze document:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearConversation = () => {
    setConversationHistory([]);
    setAgentResponse(null);
  };

  const handleCopyResponse = () => {
    if (agentResponse?.response) {
      navigator.clipboard.writeText(agentResponse.response);
      alert('Response copied to clipboard!');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getToolIcon = (toolName: string) => {
    const toolIcons: Record<string, React.ReactNode> = {
      rag_search: <Search className="w-3 h-3" />,
      document_analysis: <FileText className="w-3 h-3" />,
      summarize: <Brain className="w-3 h-3" />,
      extract_entities: <Zap className="w-3 h-3" />,
      answer_with_context: <Bot className="w-3 h-3" />,
      classify_query: <Brain className="w-3 h-3" />,
    };
    
    return toolIcons[toolName] || <Bot className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agent</h1>
          <p className="text-gray-600">Intelligent document analysis and conversation</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleClearConversation}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Chat
          </button>
          <button
            onClick={fetchAgentInfo}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Agent Info
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Agent Status</h3>
                <p className="text-sm text-gray-600">Version {agentInfo?.agent_version || '1.0.0'}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">LLM Service</span>
                <span className="text-sm font-medium text-gray-900">{agentInfo?.llm_service || 'Ollama'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tools Available</span>
                <span className="text-sm font-medium text-gray-900">{agentInfo?.tools_available?.length || 6}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Health Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Healthy
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Agent Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Use RAG Search</p>
                  <p className="text-xs text-gray-500">Search documents before answering</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useRag}
                    onChange={(e) => setUseRag(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Use Tools</p>
                  <p className="text-xs text-gray-500">Enable document analysis tools</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useTools}
                    onChange={(e) => setUseTools(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Document Analysis</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Document
                </label>
                <select
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a document...</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Type
                </label>
                <select
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="summary">Summary</option>
                  <option value="key_points">Key Points</option>
                  <option value="sentiment">Sentiment Analysis</option>
                  <option value="structure">Structure Analysis</option>
                </select>
              </div>

              <button
                onClick={handleAnalyzeDocument}
                disabled={!selectedDocument || isProcessing}
                className={`w-full px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center ${
                  !selectedDocument || isProcessing
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Brain className="w-4 h-4 mr-2" />
                {isProcessing ? 'Analyzing...' : 'Analyze Document'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-[500px]">
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bot className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Conversation</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {agentResponse && (
                    <button
                      onClick={handleCopyResponse}
                      className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {conversationHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Bot className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
                  <p className="text-gray-600 max-w-md">
                    Ask questions about your documents, request analysis, or use the agent tools for advanced tasks.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {conversationHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-blue-50 border border-blue-100'
                            : 'bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          {message.role === 'assistant' ? (
                            <Bot className="w-4 h-4 text-blue-600 mr-2" />
                          ) : (
                            <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                          )}
                          <span className="text-sm font-medium">
                            {message.role === 'user' ? 'You' : 'AI Agent'}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 max-w-[80%]">
                        <div className="flex items-center">
                          <Bot className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium">AI Agent</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={isProcessing}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isProcessing}
                  className={`self-end px-4 py-3 rounded-lg flex items-center ${
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

          {agentResponse && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Response Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Processing Time</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {agentResponse.processing_time.toFixed(2)}s
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Brain className="w-5 h-5 text-gray-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Steps Taken</p>
                      <p className="text-lg font-semibold text-gray-900">{agentResponse.steps}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Zap className="w-5 h-5 text-gray-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Tools Used</p>
                      <p className="text-lg font-semibold text-gray-900">{agentResponse.tools_used.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {agentResponse.tools_used.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Tools Used</p>
                  <div className="flex flex-wrap gap-2">
                    {agentResponse.tools_used.map((tool, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {getToolIcon(tool)}
                        <span className="ml-1">{tool.replace('_', ' ')}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {agentResponse.context && agentResponse.context.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Relevant Documents</p>
                  <div className="space-y-2">
                    {agentResponse.context.slice(0, 3).map((doc, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              Document {index + 1} (Score: {(doc.score * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {doc.content.substring(0, 200)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agent;