import React, { useState, useEffect } from 'react';
import { RefreshCw, Image as ImageIcon, AlertCircle, CheckCircle, Sparkles, Edit2, Trash2, X, Save } from 'lucide-react';
import { loadStoreImages, clearStoreImagesCache, updateStoreImage, deleteStoreImage, deleteStoreTheme } from '../utils/storeImages';
import ImageGenerationModal from './ImageGenerationModal';
import ConfirmationModal from './ui/ConfirmationModal';
import useConfirmation from '../hooks/useConfirmation';
import { useSearchParams } from 'react-router-dom';

const StoreImagesManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(null);
  const isModalOpen = searchParams.get('modal') === 'generate';
  const previewImageId = searchParams.get('preview');
  const previewImage = previewImageId
    ? images.find((img) => img.id === previewImageId) || null
    : null;
  
  const { confirmationProps, confirm } = useConfirmation();

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const openGenerateModal = () => {
    const next = new URLSearchParams(searchParams);
    next.set('modal', 'generate');
    setSearchParams(next);
  };

  const closeGenerateModal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('modal');
    setSearchParams(next);
  };

  const openPreview = (item) => {
    const next = new URLSearchParams(searchParams);
    next.set('preview', item.id);
    setSearchParams(next);
  };

  const closePreview = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('preview');
    setSearchParams(next);
  };

  // Get unique themes from images, case insensitive
  const availableThemes = [...new Set(images.map(img => (img.theme || '').toLowerCase()).filter(Boolean))].sort();

  // Filter images by theme
  const filteredImages = selectedTheme === 'all' 
    ? images 
    : images.filter(img => (img.theme || '').toLowerCase() === selectedTheme);

  // Count images by theme
  const themeCounts = availableThemes.reduce((acc, theme) => {
    acc[theme] = images.filter(img => (img.theme || '').toLowerCase() === theme).length;
    return acc;
  }, { all: images.length });

  const fetchImages = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      if (forceRefresh) {
        clearStoreImagesCache();
      }

      const storeItems = await loadStoreImages(forceRefresh);
      setImages(storeItems);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching store images:', err);
      setError(err.message || 'Failed to load store images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Modals are URL-driven via search params; browser back naturally closes them.

  const handleRefresh = () => {
    fetchImages(true);
  };

  const handleModalSuccess = () => {
    // Refresh images after successful addition
    fetchImages(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      description: item.description || '',
      theme: (item.theme || '').toLowerCase()
    });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setError(null);
  };

  const handleSaveEdit = async (id) => {
    if (!editForm.name.trim() || !editForm.theme.trim()) {
      setError('Name and theme are required');
      return;
    }

    setActionLoading(true);
    try {
      const normalizedForm = {
        ...editForm,
        theme: editForm.theme.toLowerCase()
      };
      await updateStoreImage({ id, ...normalizedForm });
      setEditingId(null);
      // Optimistic update or refresh
      fetchImages(true);
    } catch (err) {
      console.error('Error updating image:', err);
      setError(err.message || 'Failed to update image');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Delete Image',
      message: `Are you sure you want to delete "${item.name}"? This will permanently delete the image file and metadata.`,
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await deleteStoreImage(item.id);
      // Refresh to show changes
      fetchImages(true);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err.message || 'Failed to delete image');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTheme = async (theme) => {
    const count = themeCounts[theme] || 0;
    const ok = await confirm({
      title: 'Delete Theme',
      message: `Are you sure you want to delete the entire "${theme}" theme? This will permanently delete ALL ${count} images in this theme. This action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete Theme',
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await deleteStoreTheme(theme);
      // Refresh to show changes
      if (selectedTheme === theme) {
        setSelectedTheme('all');
      }
      fetchImages(true);
    } catch (err) {
      console.error('Error deleting theme:', err);
      setError(err.message || 'Failed to delete theme');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Store Images</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage background images available in the rewards store
          </p>
        </div>
        <div className="flex gap-2">
          <button
              onClick={openGenerateModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generate Images
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to Add Images</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Upload image files to Firebase Storage in the <code className="bg-blue-100 px-1 rounded">store-images/</code> folder</li>
          <li>Create or update <code className="bg-blue-100 px-1 rounded">image-metadata.json</code> in the same folder</li>
          <li>Each image entry should have: <code className="bg-blue-100 px-1 rounded">name</code>, <code className="bg-blue-100 px-1 rounded">description</code>, <code className="bg-blue-100 px-1 rounded">theme</code>, and <code className="bg-blue-100 px-1 rounded">filename</code></li>
          <li>Click "Refresh" to reload images from Firebase Storage</li>
        </ol>
      </div>

      {/* Status */}
      {lastRefresh && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Last refreshed: {lastRefresh.toLocaleString()}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Error</h4>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && images.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading store images...</span>
        </div>
      )}

      {/* Theme Filter */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTheme('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTheme === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({images.length})
          </button>
          {availableThemes.map((theme) => (
            <div key={theme} className="relative group">
              <button
                onClick={() => setSelectedTheme(theme)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors pr-8 ${
                  selectedTheme === theme
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)} ({themeCounts[theme] || 0})
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTheme(theme);
                }}
                className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                   selectedTheme === theme
                    ? 'text-blue-200 hover:text-white hover:bg-blue-700'
                    : 'text-gray-400 hover:text-red-600 hover:bg-gray-200'
                }`}
                title={`Delete theme "${theme}"`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Images Grid */}
      {!loading && images.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No store images found</p>
          <p className="text-sm text-gray-500 mt-1">
            Upload images to Firebase Storage and create image-metadata.json
          </p>
        </div>
      )}

      {filteredImages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative ${
                editingId === item.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {editingId === item.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">Edit Image</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={actionLoading}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Save"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={actionLoading}
                        className="p-1 text-gray-500 hover:bg-gray-50 rounded"
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Theme</label>
                    <div className="space-y-2">
                      <select
                        value={availableThemes.includes(editForm.theme) ? editForm.theme : 'custom'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setEditForm({ ...editForm, theme: '' });
                          } else {
                            setEditForm({ ...editForm, theme: val });
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {availableThemes.map(t => (
                          <option key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </option>
                        ))}
                        <option value="custom">+ New Theme</option>
                      </select>
                      {(!availableThemes.includes(editForm.theme) || editForm.theme === '') && (
                         <input
                           type="text"
                           placeholder="Enter new theme name"
                           value={editForm.theme}
                           onChange={(e) => setEditForm({ ...editForm, theme: e.target.value.toLowerCase() })}
                           className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                           autoFocus
                         />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows="3"
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div 
                    className="relative w-full h-48 mb-3 bg-gray-100 rounded-md overflow-hidden group cursor-pointer"
                    onClick={() => openPreview(item)}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {/* Overlay Actions */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-white text-gray-700 rounded-full shadow hover:text-blue-600 hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 bg-white text-gray-700 rounded-full shadow hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    {item.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {item.theme}
                      </span>
                      <span className="text-xs text-gray-500">ID: {item.id}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {images.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{images.length}</span> total image{images.length !== 1 ? 's' : ''} loaded
            {selectedTheme !== 'all' && (
              <span>, <span className="font-semibold">{filteredImages.length}</span> in {selectedTheme} theme</span>
            )}
          </p>
        </div>
      )}

      {/* Image Generation Modal */}
      <ImageGenerationModal
        isOpen={isModalOpen}
        onClose={closeGenerateModal}
        onSuccess={handleModalSuccess}
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={closePreview}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white cursor-pointer"
            />
            <div className="mt-4 text-white text-center">
              <h3 className="text-xl font-bold">{previewImage.name}</h3>
              {previewImage.description && (
                <p className="text-gray-300 mt-1 max-w-2xl">{previewImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal {...confirmationProps} />
    </div>
  );
};

export default StoreImagesManager;

