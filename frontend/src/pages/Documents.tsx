// frontend/src/pages/Documents.tsx
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
  Loader2,
} from 'lucide-react';
import { documentService } from '../services/api';
import toast from 'react-hot-toast';
import type { Document } from '../types';

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Document['status'] | 'all'>('all');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // TODO: Заменить на реальный project_id из контекста/роута
  const currentProjectId = 'current-project-id';

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await documentService.getDocuments(currentProjectId);
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !currentProjectId) return;
    
    setIsUploading(true);
    try {
      const response = await documentService.uploadDocument(currentProjectId, uploadFile);
      
      if (response.success) {
        toast.success('Document uploaded successfully!');
        setShowUploadModal(false);
        setUploadFile(null);
        fetchDocuments(); // Refresh list
      } else {
        toast.error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetryIndexing = async (documentId: string) => {
    try {
      const response = await documentService.retryIndexing(documentId, currentProjectId);
      if (response.success) {
        toast.success('Retrying indexing...');
        fetchDocuments();
      } else {
        toast.error(response.error || 'Failed to retry');
      }
    } catch (error) {
      console.error('Retry error:', error);
      toast.error('Failed to retry indexing');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await documentService.deleteDocument(documentId, currentProjectId, false);
      if (response.success) {
        toast.success('Document deleted');
        setDocuments(docs => docs.filter(doc => doc.id !== documentId));
      } else {
        toast.error(response.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.length === 0) return;
    
    if (!window.confirm(`Delete ${selectedDocs.length} document(s)?`)) {
      return;
    }

    try {
      for (const docId of selectedDocs) {
        await documentService.deleteDocument(docId, currentProjectId, false);
      }
      toast.success(`${selectedDocs.length} document(s) deleted`);
      setDocuments(docs => docs.filter(doc => !selectedDocs.includes(doc.id)));
      setSelectedDocs([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some documents');
    }
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

  const getStatusBadge = (status: Document['status']) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw, label: 'Processing' },
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
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('text')) return <FileText className="w-5 h-5 text-gray-500" />;
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
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
            className={`px-4 py-2 text-sm font-medium rounded-lg border flex items-center ${
              selectedDocs.length === 0
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete ({selectedDocs.length})
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Document['status'] | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="indexed">Indexed</option>
              <option value="error">Error</option>
            </select>
          </div>
          <button
            onClick={fetchDocuments}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-gray-500">No documents found</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="mt-4 text-sm text-blue-600 hover:underline"
                    >
                      Upload your first document
                    </button>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.id)}
                        onChange={() => handleSelectDoc(doc.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getFileIcon(doc.mime_type)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{doc.filename}</div>
                          <div className="text-sm text-gray-500">{doc.mime_type.split('/')[1]?.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatFileSize(doc.file_size)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(doc.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {doc.status === 'error' && (
                          <button
                            onClick={() => handleRetryIndexing(doc.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Retry"
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
        {[
          { label: 'Total', value: documents.length, color: 'blue' },
          { label: 'Indexed', value: documents.filter(d => d.status === 'indexed').length, color: 'green' },
          { label: 'Processing', value: documents.filter(d => d.status === 'processing').length, color: 'yellow' },
          { label: 'Errors', value: documents.filter(d => d.status === 'error').length, color: 'red' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                {uploadFile ? uploadFile.name : 'Drag & drop or click to browse'}
              </p>
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.docx,.txt,.md"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100"
              >
                Browse Files
              </label>
              <p className="mt-2 text-xs text-gray-500">PDF, DOCX, TXT up to 100MB</p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => { setShowUploadModal(false); setUploadFile(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;