import { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';
import type { Document } from '../types';

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Document['status'] | 'all'>('all');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      // В реальном приложении здесь был бы вызов API
      // Сейчас симулируем данные
      setTimeout(() => {
        setDocuments([
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
          {
            id: '4',
            project_id: '1',
            filename: 'Meeting_Minutes_April.pdf',
            mime_type: 'application/pdf',
            file_size: 345678,
            status: 'indexed',
            created_at: '2026-04-28T16:45:00Z',
            updated_at: '2026-04-28T16:50:00Z',
          },
          {
            id: '5',
            project_id: '3',
            filename: 'Research_Paper.pdf',
            mime_type: 'application/pdf',
            file_size: 4567890,
            status: 'pending',
            created_at: '2026-05-03T08:10:00Z',
            updated_at: '2026-05-03T08:10:00Z',
          },
        ]);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Document['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Processing' },
      indexed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Indexed' },
      error: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Error' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    if (mimeType.includes('text')) {
      return <FileText className="w-5 h-5 text-gray-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRetryIndexing = async (documentId: string) => {
    try {
      // В реальном приложении здесь был бы вызов API
      console.log('Retrying indexing for document:', documentId);
      // Обновляем статус документа
      setDocuments(docs =>
        docs.map(doc =>
          doc.id === documentId ? { ...doc, status: 'processing' } : doc
        )
      );
    } catch (error) {
      console.error('Failed to retry indexing:', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      // В реальном приложении здесь был бы вызов API
      console.log('Deleting document:', documentId);
      setDocuments(docs => docs.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleBulkDelete = () => {
    if (selectedDocs.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedDocs.length} document(s)?`)) {
      return;
    }

    // В реальном приложении здесь был бы вызов API
    setDocuments(docs => docs.filter(doc => !selectedDocs.includes(doc.id)));
    setSelectedDocs([]);
  };

  const handleSelectAll = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleSelectDoc = (docId: string) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage and analyze your uploaded documents</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBulkDelete}
            disabled={selectedDocs.length === 0}
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${
              selectedDocs.length === 0
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Delete Selected ({selectedDocs.length})
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Document['status'] | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="indexed">Indexed</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchDocuments}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Documents table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-gray-500">No documents found</p>
                    <p className="text-sm text-gray-400">Try uploading a document or adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.id)}
                        onChange={() => handleSelectDoc(doc.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.mime_type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{doc.filename}</div>
                          <div className="text-sm text-gray-500">
                            {doc.mime_type.split('/')[1].toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                      {doc.error_message && (
                        <p className="mt-1 text-xs text-red-600">{doc.error_message}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => console.log('View document:', doc.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {doc.status === 'error' && (
                          <button
                            onClick={() => handleRetryIndexing(doc.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Retry indexing"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Indexed</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'indexed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'processing').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'error').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal (simplified) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-sm text-gray-600">Drag and drop files here</p>
              <p className="text-xs text-gray-500">or</p>
              <button className="mt-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                Browse files
              </button>
              <p className="mt-2 text-xs text-gray-500">PDF, DOCX, TXT up to 100MB</p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // В реальном приложении здесь была бы загрузка файла
                  setShowUploadModal(false);
                  fetchDocuments();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;