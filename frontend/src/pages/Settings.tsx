// frontend/src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Globe, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    // General
    language: 'en',
    timezone: 'UTC',
    theme: 'light',
    
    // Account - инициализируем пустыми, заполним из user
    email: '',
    name: '',
    notifications: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    
    // API
    apiKey: 'sk_••••••••••••••••••••••••••••••••',
    apiEndpoint: 'http://localhost:8000',
    
    // LLM Settings
    llmModel: 'qwen2.5:7b',
    embeddingModel: 'nomic-embed-text',
    temperature: 0.3,
    topK: 4,
  });

  // ✅ Загружаем данные пользователя при монтировании
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API', icon: Database },
    { id: 'llm', label: 'LLM Settings', icon: Globe },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // ✅ Реальный вызов API для обновления профиля
      const success = await updateProfile({ 
        name: settings.name 
        // email обычно нельзя менять, но если нужно: email: settings.email
      });
      
      if (success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to save changes. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
        <select
          value={settings.language}
          onChange={(e) => setSettings({ ...settings, language: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="en">English</option>
          <option value="ru">Russian</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
        <select
          value={settings.timezone}
          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="UTC">UTC</option>
          <option value="Europe/Moscow">Moscow (UTC+3)</option>
          <option value="America/New_York">Eastern Time (UTC-5)</option>
          <option value="Europe/London">London (UTC+0)</option>
          <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
        <div className="flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={settings.theme === 'light'}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Light</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={settings.theme === 'dark'}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Dark</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="system"
              checked={settings.theme === 'system'}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">System</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <input
          type="text"
          value={settings.name}
          onChange={(e) => setSettings({ ...settings, name: e.target.value })}
          placeholder="Enter your full name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <input
          type="email"
          value={settings.email}
          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          disabled
        />
        <p className="mt-1 text-xs text-gray-500">Email cannot be changed. Contact support to update.</p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="notifications"
          checked={settings.notifications}
          onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
          Receive email notifications
        </label>
      </div>
    </div>
  );

  const renderLLMSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">LLM Model</label>
        <select
          value={settings.llmModel}
          onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="qwen2.5:7b">Qwen2.5 7B (Recommended)</option>
          <option value="llama3.2:3b">Llama 3.2 3B (Fast)</option>
          <option value="mistral:7b">Mistral 7B</option>
          <option value="gemma:7b">Gemma 7B</option>
          <option value="phi3:mini">Phi-3 Mini</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">The language model used for generating responses</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Embedding Model</label>
        <select
          value={settings.embeddingModel}
          onChange={(e) => setSettings({ ...settings, embeddingModel: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="nomic-embed-text">Nomic Embed Text (Recommended)</option>
          <option value="all-minilm">All-MiniLM (Fast)</option>
          <option value="bge-small">BGE Small</option>
          <option value="bge-large">BGE Large (Accurate)</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">The model used for document embeddings and semantic search</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Temperature: {settings.temperature.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Controls randomness: lower values = more focused answers, higher = more creative
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Top K Documents</label>
        <input
          type="number"
          min="1"
          max="20"
          value={settings.topK}
          onChange={(e) => setSettings({ ...settings, topK: parseInt(e.target.value) || 4 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Number of relevant document chunks to retrieve for RAG (higher = more context, slower)
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'account':
        return renderAccountSettings();
      case 'notifications':
        return (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Notification settings coming soon</p>
          </div>
        );
      case 'security':
        return (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Security settings coming soon</p>
          </div>
        );
      case 'api':
        return (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">API settings coming soon</p>
          </div>
        );
      case 'llm':
        return renderLLMSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50/50">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6">
            {renderContent()}
            
            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Changes are saved to your account. Some settings may require a page refresh.
              </p>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;