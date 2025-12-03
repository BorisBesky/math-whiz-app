import React, { useState, useEffect } from 'react';
import { RefreshCw, Image as ImageIcon, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { loadStoreImages, clearStoreImagesCache } from '../utils/storeImages';
import ImageGenerationModal from './ImageGenerationModal';

const StoreImagesManager = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get unique themes from images
  const themes = ['all', ...new Set(images.map(img => img.theme).filter(Boolean))];

  // Filter images by theme
  const filteredImages = selectedTheme === 'all' 
    ? images 
    : images.filter(img => img.theme === selectedTheme);

  // Count images by theme
  const themeCounts = themes.reduce((acc, theme) => {
    if (theme === 'all') {
      acc[theme] = images.length;
    } else {
      acc[theme] = images.filter(img => img.theme === theme).length;
    }
    return acc;
  }, {});

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

  const handleRefresh = () => {
    fetchImages(true);
  };

  const handleModalSuccess = () => {
    // Refresh images after successful addition
    fetchImages(true);
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
            onClick={() => setIsModalOpen(true)}
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
          {themes.map(theme => (
            <button
              key={theme}
              onClick={() => setSelectedTheme(theme)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTheme === theme
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {theme === 'all' ? 'All' : theme.charAt(0).toUpperCase() + theme.slice(1)} ({themeCounts[theme] || 0})
            </button>
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
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative w-full h-48 mb-3 bg-gray-100 rounded-md overflow-hidden">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
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
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default StoreImagesManager;

