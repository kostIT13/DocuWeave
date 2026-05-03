import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Globe, Save } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General
    language: 'en',
    timezone: 'UTC',
    theme: 'light',
    
    // Account
    email: 'user@example.com',
    name: 'John Doe',
    notifications: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    
    // API
    apiKey: 'sk_••••••••••••••••••••••••••••••••',
    apiEndpoint: 'http://localhost:8000',
    
    // LLM
    llmModel: 'qwen2.5:7b',
    embeddingModel: 'nomic-embed-text',
    temperature: 0.3,
    topK: 4,
  });

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API', icon: Database },
    { id: 'llm', label: 'LLM Settings', icon: Globe },
  ];

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
        <select
          value={settings.language}
          onChange={(e) => setSettings({ ...settings, language: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="en">English</option>
          <option value="ru">Russian</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
        <select
          value={settings.timezone}
          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="Europe/London">London</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={settings.theme === 'light'}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="mr-2"
            />
            Light
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={settings.theme === 'dark'}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="mr-2"
            />
            Dark
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="theme"
              value="system"
              checked={settings.theme === 'system'}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="mr-2"
            />
            System
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <input
          type="email"
          value={settings.email}
          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="qwen2.5:7b">Qwen2.5 7B</option>
          <option value="llama3.2:3b">Llama 3.2 3B</option>
          <option value="mistral:7b">Mistral 7B</option>
          <option value="gemma:7b">Gemma 7B</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">The language model used for generating responses</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Embedding Model</label>
        <select
          value={settings.embeddingModel}
          onChange={(e) => setSettings({ ...settings, embeddingModel: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="nomic-embed-text">Nomic Embed Text</option>
          <option value="all-minilm">All-MiniLM</option>
          <option value="bge-small">BGE Small</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">The model used for document embeddings and search</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Temperature: {settings.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>More focused</span>
          <span>More creative</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Controls randomness in responses (0 = deterministic, 1 = creative)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Top K Documents</label>
        <input
          type="number"
          min="1"
          max="10"
          value={settings.topK}
          onChange={(e) => setSettings({ ...settings, topK: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">Number of relevant documents to retrieve for RAG</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'account':
        return renderAccountSettings();
      case 'llm':
        return renderLLMSettings();
      default:
        return (
          <div className="text-center py-12">
            <SettingsIcon className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="mt-4 text-gray-500">Settings for this section are coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {renderContent()}
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
              <p className="mt-2 text-sm text-gray-500">
                Your settings will be applied immediately. Some changes may require a page refresh.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;