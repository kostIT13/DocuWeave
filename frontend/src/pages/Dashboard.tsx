import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

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
      color: 'bg-primary-500',
      gradient: 'from-primary-500 to-primary-600',
      change: '+12%',
      link: '/documents',
    },
    {
      title: 'Indexed Documents',
      value: stats.indexedDocuments,
      icon: Database,
      color: 'bg-accent-green',
      gradient: 'from-accent-green to-emerald-600',
      change: '+8%',
      link: '/documents',
    },
    {
      title: 'Chat Sessions',
      value: stats.totalChats,
      icon: MessageSquare,
      color: 'bg-teal-500',
      gradient: 'from-teal-500 to-cyan-600',
      change: '+23%',
      link: '/chat',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: Users,
      color: 'bg-lime-500',
      gradient: 'from-lime-500 to-green-600',
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
      color: 'bg-primary-50 text-primary-800 border border-primary-200',
      hover: 'hover:bg-primary-100 hover:border-primary-300',
    },
    {
      title: 'Start New Chat',
      description: 'Ask questions about your documents',
      icon: MessageSquare,
      link: '/chat/new',
      color: 'bg-teal-50 text-teal-800 border border-teal-200',
      hover: 'hover:bg-teal-100 hover:border-teal-300',
    },
    {
      title: 'Use Agent',
      description: 'Advanced analysis with AI agent',
      icon: Bot,
      link: '/agent',
      color: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      hover: 'hover:bg-emerald-100 hover:border-emerald-300',
    },
    {
      title: 'View Analytics',
      description: 'Usage statistics and insights',
      icon: BarChart3,
      link: '/analytics',
      color: 'bg-lime-50 text-lime-800 border border-lime-200',
      hover: 'hover:bg-lime-100 hover:border-lime-300',
    },
  ];

  const getStatusBadge = (status: Document['status']) => {
    const statusConfig = {
      pending: { color: 'bg-amber-100 text-amber-800 border border-amber-200', icon: Clock },
      processing: { color: 'bg-primary-100 text-primary-800 border border-primary-200', icon: Clock },
      indexed: { color: 'bg-emerald-100 text-emerald-800 border border-emerald-200', icon: CheckCircle },
      error: { color: 'bg-red-100 text-red-800 border border-red-200', icon: AlertCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-2">Welcome back! Here's what's happening with your documents.</p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              className="bg-white rounded-2xl border border-border p-6 shadow-soft hover:shadow-green-glow transition-all duration-300 animate-fade-in hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-accent-green flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <Link
                to={stat.link}
                className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
              >
                View details
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.link}
                className={`group bg-white rounded-2xl border p-6 transition-all duration-300 animate-slide-up ${action.color} ${action.hover} hover:shadow-green-glow`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-text-primary group-hover:text-primary-700 transition-colors">{action.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-primary-50">
            <h2 className="text-lg font-semibold text-text-primary">Recent Documents</h2>
            <p className="text-sm text-text-muted">Latest uploaded documents</p>
          </div>
          <div className="divide-y divide-border">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="px-6 py-4 hover:bg-primary-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-primary-400 mr-3" />
                    <div>
                      <p className="font-medium text-text-primary">{doc.filename}</p>
                      <div className="flex items-center mt-1 space-x-3">
                        <span className="text-xs text-text-muted">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-text-muted">
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
          <div className="px-6 py-4 border-t border-border bg-primary-50">
            <Link
              to="/documents"
              className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors inline-flex items-center"
            >
              View all documents
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-primary-50">
            <h2 className="text-lg font-semibold text-text-primary">Recent Chats</h2>
            <p className="text-sm text-text-muted">Latest conversations</p>
          </div>
          <div className="divide-y divide-border">
            {recentChats.map((chat) => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                className="block px-6 py-4 hover:bg-primary-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 text-primary-400 mr-3" />
                    <div>
                      <p className="font-medium text-text-primary group-hover:text-primary-700 transition-colors">{chat.title}</p>
                      <div className="flex items-center mt-1 space-x-3">
                        <span className="text-xs text-text-muted">
                          {new Date(chat.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-text-muted">
                          {chat.message_count} messages
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-primary-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-border bg-primary-50">
            <Link
              to="/chat"
              className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors inline-flex items-center"
            >
              View all chats
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-text-primary mb-6">System Status</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex items-center p-4 bg-primary-50 rounded-xl border border-primary-200">
            <div className="w-3 h-3 bg-accent-green rounded-full mr-4 animate-pulse-green"></div>
            <div>
              <p className="font-medium text-text-primary">API Server</p>
              <p className="text-sm text-text-muted">Operational</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-primary-50 rounded-xl border border-primary-200">
            <div className="w-3 h-3 bg-accent-green rounded-full mr-4 animate-pulse-green"></div>
            <div>
              <p className="font-medium text-text-primary">Ollama LLM</p>
              <p className="text-sm text-text-muted">Connected</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-primary-50 rounded-xl border border-primary-200">
            <div className="w-3 h-3 bg-accent-green rounded-full mr-4 animate-pulse-green"></div>
            <div>
              <p className="font-medium text-text-primary">ChromaDB</p>
              <p className="text-sm text-text-muted">Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;