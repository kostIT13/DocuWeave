import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  Bot,
  Upload,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Users,
  Database,
} from 'lucide-react';
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        setStats({
          totalDocuments: 42,
          indexedDocuments: 38,
          totalChats: 15,
          activeProjects: 3,
        });

        setRecentDocuments([
          {
            id: '1',
            project_id: '1',
            filename: 'Annual_Report_2024.pdf',
            mime_type: 'application/pdf',
            file_size: 2456789,
            status: 'indexed',
            created_at: '2026-05-01T10:30:00Z',
            updated_at: '2026-05-01T10:35:00Z',
          },
          {
            id: '2',
            project_id: '1',
            filename: 'Project_Proposal.docx',
            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            file_size: 123456,
            status: 'processing',
            created_at: '2026-05-02T14:20:00Z',
            updated_at: '2026-05-02T14:20:00Z',
          },
          {
            id: '3',
            project_id: '2',
            filename: 'Technical_Specifications.txt',
            mime_type: 'text/plain',
            file_size: 78901,
            status: 'error',
            error_message: 'Failed to parse document',
            created_at: '2026-05-03T09:15:00Z',
            updated_at: '2026-05-03T09:20:00Z',
          },
        ]);

        setRecentChats([
          {
            id: '1',
            project_id: '1',
            title: 'Annual Report Analysis',
            created_at: '2026-05-02T16:45:00Z',
            updated_at: '2026-05-02T17:30:00Z',
            message_count: 12,
          },
          {
            id: '2',
            project_id: '1',
            title: 'Project Requirements',
            created_at: '2026-05-01T11:20:00Z',
            updated_at: '2026-05-01T12:15:00Z',
            message_count: 8,
          },
          {
            id: '3',
            project_id: '2',
            title: 'Technical Discussion',
            created_at: '2026-04-30T09:30:00Z',
            updated_at: '2026-04-30T10:45:00Z',
            message_count: 15,
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%',
      link: '/documents',
    },
    {
      title: 'Indexed Documents',
      value: stats.indexedDocuments,
      icon: Database,
      color: 'bg-green-500',
      change: '+8%',
      link: '/documents',
    },
    {
      title: 'Chat Sessions',
      value: stats.totalChats,
      icon: MessageSquare,
      color: 'bg-purple-500',
      change: '+23%',
      link: '/chat',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: Users,
      color: 'bg-orange-500',
      change: '+2',
      link: '/projects',
    },
  ];

  const quickActions = [
    {
      title: 'Upload Document',
      description: 'Add new documents for analysis',
      icon: Upload,
      link: '/upload',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Start New Chat',
      description: 'Ask questions about your documents',
      icon: MessageSquare,
      link: '/chat/new',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      title: 'Use Agent',
      description: 'Advanced analysis with AI agent',
      icon: Bot,
      link: '/agent',
      color: 'bg-green-100 text-green-700',
    },
    {
      title: 'View Analytics',
      description: 'Usage statistics and insights',
      icon: BarChart3,
      link: '/analytics',
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  const getStatusBadge = (status: Document['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      indexed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      error: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your documents.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <Link
                to={stat.link}
                className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View details
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.link}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
            <p className="text-sm text-gray-600">Latest uploaded documents</p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="px-5 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.filename}</p>
                      <div className="flex items-center mt-1 space-x-3">
                        <span className="text-xs text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
                {doc.error_message && (
                  <p className="mt-2 text-xs text-red-600">{doc.error_message}</p>
                )}
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-200">
            <Link
              to="/documents"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all documents →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Chats</h2>
            <p className="text-sm text-gray-600">Latest conversations</p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentChats.map((chat) => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                className="block px-5 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{chat.title}</p>
                      <div className="flex items-center mt-1 space-x-3">
                        <span className="text-xs text-gray-500">
                          {new Date(chat.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {chat.message_count} messages
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-200">
            <Link
              to="/chat"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all chats →
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">API Server</p>
              <p className="text-sm text-gray-600">Operational</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">Ollama LLM</p>
              <p className="text-sm text-gray-600">Connected</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">ChromaDB</p>
              <p className="text-sm text-gray-600">Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;