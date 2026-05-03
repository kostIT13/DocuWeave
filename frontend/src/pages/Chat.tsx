import { useState } from 'react';
import { MessageSquare, Send, Bot, User, Clock, MoreVertical } from 'lucide-react';

const Chat = () => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hello! How can I help you with your documents today?', timestamp: '10:30 AM' },
    { id: 2, role: 'user', content: 'Can you summarize the annual report?', timestamp: '10:31 AM' },
    { id: 3, role: 'assistant', content: 'I\'d be happy to help summarize the annual report. I found the document in your library. The key points are...', timestamp: '10:32 AM' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      role: 'user' as const,
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, newMessage]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        role: 'assistant' as const,
        content: 'I understand your question. Let me analyze the relevant documents and provide a detailed response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <p className="text-gray-600">Conversations about your documents</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            New Chat
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Upload & Chat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Recent Chats</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {[1, 2, 3].map((chat) => (
                <div key={chat} className="px-5 py-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Chat {chat}</p>
                        <p className="text-sm text-gray-500">3 messages • Today</p>
                      </div>
                    </div>
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-[600px]">
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bot className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Annual Report Discussion</h3>
                    <p className="text-sm text-gray-600">3 participants • Active now</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">10:32 AM</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
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
                          <User className="w-4 h-4 text-blue-600 mr-2" />
                        )}
                        <span className="text-sm font-medium">
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">{message.timestamp}</span>
                      </div>
                      <p className="text-gray-900">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input area */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here... (Press Enter to send)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`self-end px-4 py-3 rounded-lg flex items-center ${
                    !input.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Ask questions about your documents. The AI will search through your uploaded files to provide answers.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;