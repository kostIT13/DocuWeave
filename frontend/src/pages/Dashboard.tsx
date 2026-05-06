// frontend/src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, MessageSquare, Bot, Upload, BarChart3,
  Clock, CheckCircle, AlertCircle, ArrowUpRight,
  Users, Database, Loader2,
} from 'lucide-react';
import { documentService, chatService, projectService } from '../services/api';
import type { Document, ChatSession } from '../types';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    indexedDocuments: 0,
    totalChats: 0,
    activeProjects: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    api: 'checking',
    llm: 'checking',
    vector: 'checking',
  });

  // TODO: Заменить на реальный project_id
  const currentProjectId = 'current-project-id';

  useEffect(() => {
    fetchDashboardData();
    checkSystemStatus();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [docsRes, chatsRes, projectsRes] = await Promise.allSettled([
        documentService.getDocuments(currentProjectId),
        chatService.getSessions(currentProjectId),
        projectService.getProjects(),
      ]);

      const docs = docsRes.status === 'fulfilled' && docsRes.value.success ? docsRes.value.data || [] : [];
      const chats = chatsRes.status === 'fulfilled' && chatsRes.value.success ? chatsRes.value.data || [] : [];
      const projects = projectsRes.status === 'fulfilled' && projectsRes.value.success ? projectsRes.value.data || [] : [];

      setStats({
        totalDocuments: docs.length,
        indexedDocuments: docs.filter((d: Document) => d.status === 'indexed').length,
        totalChats: chats.length,
        activeProjects: projects.length,
      });

      setRecentDocuments(docs.slice(0, 3));
      setRecentChats(chats.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      // Проверка бэкенда
      const apiRes = await fetch('/api/health').catch(() => null);
      setSystemStatus(prev => ({ ...prev, api: apiRes?.ok ? 'healthy' : 'error' }));
      
      // Проверка Ollama (через прокси бэкенда)
      const llmRes = await fetch('/api/agent/health').catch(() => null);
      setSystemStatus(prev => ({ ...prev, llm: llmRes?.ok ? 'healthy' : 'error' }));
      
      // Chroma считается рабочим если бэкенд работает
      setSystemStatus(prev => ({ ...prev, vector: prev.api === 'healthy' ? 'healthy' : 'error' }));
    } catch {
      setSystemStatus({ api: 'error', llm: 'error', vector: 'error' });
    }
  };

  const statCards = [
    {
      title: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
      change: '+12%',
      link: '/documents',
    },
    {
      title: 'Indexed',
      value: stats.indexedDocuments,
      icon: Database,
      gradient: 'from-green-500 to-emerald-600',
      change: '+8%',
      link: '/documents',
    },
    {
      title: 'Chat Sessions',
      value: stats.totalChats,
      icon: MessageSquare,
      gradient: 'from-teal-500 to-cyan-600',
      change: '+23%',
      link: '/chat',
    },
    {
      title: 'Projects',
      value: stats.activeProjects,
      icon: Users,
      gradient: 'from-purple-500 to-violet-600',
      change: '+2',
      link: '/projects',
    },
  ];

  const quickActions = [
    { title: 'Upload', desc: 'Add documents', icon: Upload, link: '/upload', color: 'bg-blue-50 text-blue-700' },
    { title: 'New Chat', desc: 'Start conversation', icon: MessageSquare, link: '/chat', color: 'bg-teal-50 text-teal-700' },
    { title: 'AI Agent', desc: 'Advanced analysis', icon: Bot, link: '/agent', color: 'bg-purple-50 text-purple-700' },
    { title: 'Analytics', desc: 'View insights', icon: BarChart3, link: '/analytics', color: 'bg-orange-50 text-orange-700' },
  ];

  const getStatusBadge = (status: Document['status']) => {
    const config: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      indexed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      error: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    };
    const { color, icon: Icon } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="ml-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    {stat.change} this month
                  </p>
                </div>
                <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.link}
                className={`${action.color} rounded-xl border p-5 hover:shadow-md transition-all group`}
              >
                <div className="w-12 h-12 rounded-lg bg-white/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold">{action.title}</h3>
                <p className="mt-1 text-sm opacity-80">{action.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Documents */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold">Recent Documents</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentDocuments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No documents yet</p>
                <Link to="/documents" className="text-blue-600 hover:underline mt-2 inline-block">
                  Upload your first document
                </Link>
              </div>
            ) : (
              recentDocuments.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <FileText className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{doc.filename}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()} • {doc.file_size ? `${Math.round(doc.file_size / 1024 / 1024)} MB` : ''}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <Link to="/documents" className="text-sm text-blue-600 hover:underline flex items-center">
              View all documents <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Recent Chats */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold">Recent Chats</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentChats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No chats yet</p>
                <Link to="/chat" className="text-blue-600 hover:underline mt-2 inline-block">
                  Start your first chat
                </Link>
              </div>
            ) : (
              recentChats.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <MessageSquare className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                          {chat.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(chat.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <Link to="/chat" className="text-sm text-blue-600 hover:underline flex items-center">
              View all chats <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'API Server', key: 'api' },
            { label: 'Ollama LLM', key: 'llm' },
            { label: 'Vector DB', key: 'vector' },
          ].map((item) => (
            <div key={item.key} className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                systemStatus[item.key as keyof typeof systemStatus] === 'healthy' 
                  ? 'bg-green-500 animate-pulse' 
                  : systemStatus[item.key as keyof typeof systemStatus] === 'error'
                  ? 'bg-red-500'
                  : 'bg-yellow-500 animate-pulse'
              }`} />
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {systemStatus[item.key as keyof typeof systemStatus]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;