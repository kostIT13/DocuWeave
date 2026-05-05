import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Bot,
  Settings,
  Upload,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Agent', href: '/agent', icon: Bot },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const projects = [
    { id: '1', name: 'Project Alpha' },
    { id: '2', name: 'Project Beta' },
    { id: '3', name: 'Project Gamma' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background-offwhite">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-gradient-to-r from-primary-50 to-white">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-green-glow">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-text-primary">DocuWeave</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-primary-700 hover:bg-primary-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-border bg-primary-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse-green"></div>
                <span className="text-sm font-medium text-primary-800">Active Project</span>
              </div>
              <ChevronDown className="w-4 h-4 text-primary-600" />
            </div>
            <select className="mt-2 w-full px-3 py-2 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white">
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    active
                      ? 'bg-primary-100 text-primary-800 shadow-sm border-l-4 border-primary-500'
                      : 'text-text-secondary hover:bg-primary-50 hover:text-primary-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-border">
            <Link
              to="/upload"
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-accent-green rounded-lg hover:from-primary-600 hover:to-accent-emerald transition-all shadow-md hover:shadow-green-glow"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Link>
          </div>

          <div className="px-4 py-4 border-t border-border bg-primary-50">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center w-full p-2 text-sm text-left rounded-lg hover:bg-primary-100 focus:outline-none transition-colors"
              >
                <div className="flex items-center flex-1">
                  <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-700" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-text-primary">{user?.name || 'User'}</p>
                    <p className="text-xs text-text-muted">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-primary-600" />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-primary-200 py-1">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-primary-50"
                  >
                    <User className="w-4 h-4 mr-2 text-primary-600" />
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm text-text-secondary hover:bg-primary-50"
                  >
                    <LogOut className="w-4 h-4 mr-2 text-primary-600" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-white border-b border-border lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-primary-600 hover:text-primary-800 hover:bg-primary-50"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-green-glow">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">DocuWeave</span>
          </div>
          <div className="w-10"></div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-4 lg:p-6 bg-background-white rounded-tl-2xl lg:rounded-tl-3xl shadow-soft">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;