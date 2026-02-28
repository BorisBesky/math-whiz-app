import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Edit2, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const APP_ID = 'default-app-id';
const POLL_INTERVAL = 2000; // Poll every 2 seconds
const JOB_TIMEOUT_MS = 12 * 60 * 1000; // 12 minutes (server timeout is 10m)

const ImageGenerationModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [count, setCount] = useState(3);
  const [descriptions, setDescriptions] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const cancelledRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Cancel any in-flight operations
      cancelledRef.current = true;
      
      // Clear any existing polling interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      
      // Reset cancellation flag for new session
      cancelledRef.current = false;
      
      // Reset all state to initial values
      setStep(1);
      setTheme('');
      setThemeDescription('');
      setCount(3);
      setDescriptions([]);
      setGeneratedImages([]);
      setSelectedIndices([]);
      setEditingIndex(null);
      setEditValue('');
      setLoading(false);
      setGeneratingImages(false);
      setError(null);
      setProgress(0);
      setProgressMessage('');
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Poll for job status
  const pollJobStatus = async (jobId, onComplete) => {
    try {
      // Check if operation was cancelled before making the request
      if (cancelledRef.current) {
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(
        `/.netlify/functions/gemini-image-generation-status?jobId=${jobId}&appId=${APP_ID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check job status');
      }

      const result = await response.json();
      
      // Check again after async operation completes
      if (cancelledRef.current) {
        return;
      }
      
      // Update progress
      setProgress(result.progress || 0);
      setProgressMessage(result.message || '');

      if (result.status === 'completed') {
        // Clear both interval and timeout
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }
        // Check one more time before calling completion callback
        if (!cancelledRef.current) {
          onComplete(result);
        }
      } else if (result.status === 'error') {
        // Clear both interval and timeout
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }
        throw new Error(result.error || 'Job failed');
      }
    } catch (err) {
      // Don't update state if cancelled
      if (cancelledRef.current) {
        return;
      }
      console.error('Polling error:', err);
      // Clear both interval and timeout on error
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      throw err;
    }
  };

  const handleGenerateDescriptions = async () => {
    if (!theme.trim() || !themeDescription.trim() || count < 1 || count > 10) {
      setError('Please enter a valid theme name, theme description, and count (1-10)');
      return;
    }

    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    // Reset cancellation flag for new operation
    cancelledRef.current = false;

    setLoading(true);
    setError(null);
    setProgress(0);
    setProgressMessage('Starting...');

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch('/.netlify/functions/gemini-image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'generate-descriptions',
          theme: theme.trim(),
          themeDescription: themeDescription.trim(),
          count: parseInt(count),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to start job: ${response.statusText}`);
      }

      const result = await response.json();
      const jobId = result.jobId;

      pollTimeoutRef.current = setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (!cancelledRef.current) {
          setError('Timed out while generating descriptions. Please try again.');
          setLoading(false);
          setProgress(0);
          setProgressMessage('');
        }
      }, JOB_TIMEOUT_MS);

      // Start polling
      pollIntervalRef.current = setInterval(async () => {
        try {
          await pollJobStatus(jobId, (completedResult) => {
            setDescriptions(completedResult.descriptions || []);
            setStep(2);
            setLoading(false);
            setProgress(0);
            setProgressMessage('');
          });
        } catch (pollErr) {
          setError(pollErr.message || 'Failed while generating descriptions');
          setLoading(false);
          setProgress(0);
          setProgressMessage('');
        }
      }, POLL_INTERVAL);

    } catch (err) {
      console.error('Error generating descriptions:', err);
      setError(err.message || 'Failed to generate descriptions');
      setLoading(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleEditDescription = (index) => {
    setEditingIndex(index);
    const desc = descriptions[index];
    setEditValue(typeof desc === 'string' ? desc : desc.fullDescription || '');
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const updated = [...descriptions];
      const currentDesc = updated[editingIndex];
      if (typeof currentDesc === 'string') {
        updated[editingIndex] = editValue;
      } else {
        updated[editingIndex] = {
          ...currentDesc,
          fullDescription: editValue
        };
      }
      setDescriptions(updated);
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleGenerateImages = async () => {
    if (descriptions.length === 0) {
      setError('No descriptions available');
      return;
    }

    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    // Reset cancellation flag for new operation
    cancelledRef.current = false;

    setGeneratingImages(true);
    setError(null);
    setProgress(0);
    setProgressMessage('Starting image generation...');

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch('/.netlify/functions/gemini-image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'generate-images',
          theme: theme.trim(),
          descriptions: descriptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to start job: ${response.statusText}`);
      }

      const result = await response.json();
      const jobId = result.jobId;

      pollTimeoutRef.current = setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (!cancelledRef.current) {
          setError('Timed out while generating images. Please try again.');
          setGeneratingImages(false);
          setProgress(0);
          setProgressMessage('');
        }
      }, JOB_TIMEOUT_MS);

      // Start polling
      pollIntervalRef.current = setInterval(async () => {
        try {
          await pollJobStatus(jobId, (completedResult) => {
            setGeneratedImages(completedResult.images || []);
            setSelectedIndices((completedResult.images || []).map((_, idx) => idx));
            setStep(3);
            setGeneratingImages(false);
            setProgress(0);
            setProgressMessage('');
          });
        } catch (pollErr) {
          setError(pollErr.message || 'Failed while generating images');
          setGeneratingImages(false);
          setProgress(0);
          setProgressMessage('');
        }
      }, POLL_INTERVAL);

    } catch (err) {
      console.error('Error generating images:', err);
      setError(err.message || 'Failed to generate images');
      setGeneratingImages(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleToggleSelection = (index) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleAddToStore = async () => {
    if (selectedIndices.length === 0) {
      setError('Please select at least one image to add');
      return;
    }

    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    // Reset cancellation flag for new operation
    cancelledRef.current = false;

    setLoading(true);
    setError(null);
    setProgress(0);
    setProgressMessage('Adding images to store...');

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch('/.netlify/functions/gemini-image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'add-to-store',
          theme: theme.trim(),
          selectedIndices: selectedIndices,
          generatedImages: generatedImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to start job: ${response.statusText}`);
      }

      const result = await response.json();
      const jobId = result.jobId;

      pollTimeoutRef.current = setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (!cancelledRef.current) {
          setError('Timed out while adding images to store. Please try again.');
          setLoading(false);
          setProgress(0);
          setProgressMessage('');
        }
      }, JOB_TIMEOUT_MS);

      // Start polling
      pollIntervalRef.current = setInterval(async () => {
        try {
          await pollJobStatus(jobId, (completedResult) => {
            // Close modal and refresh
            handleClose();
            if (onSuccess) {
              onSuccess(completedResult);
            }
          });
        } catch (pollErr) {
          setError(pollErr.message || 'Failed while adding images to store');
          setLoading(false);
          setProgress(0);
          setProgressMessage('');
        }
      }, POLL_INTERVAL);

    } catch (err) {
      console.error('Error adding images to store:', err);
      setError(err.message || 'Failed to add images to store');
      setLoading(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleClose = () => {
    // Cancel any in-flight operations
    cancelledRef.current = true;
    
    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    
    // Reset state
    setStep(1);
    setTheme('');
    setThemeDescription('');
    setCount(3);
    setDescriptions([]);
    setGeneratedImages([]);
    setSelectedIndices([]);
    setEditingIndex(null);
    setEditValue('');
    setError(null);
    setProgress(0);
    setProgressMessage('');
    onClose();
  };

  const handleBack = () => {
    if (step > 1) {
      // Cancel any in-flight operations to prevent race conditions
      cancelledRef.current = true;
      
      // Clear any existing polling interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      
      // Reset loading states
      setLoading(false);
      setGeneratingImages(false);
      setProgress(0);
      setProgressMessage('');
      setError(null);
      setStep(step - 1);
      
      // Reset cancellation flag after state update
      cancelledRef.current = false;
    }
  };

  const handleNext = () => {
    if (step === 1) {
      handleGenerateDescriptions();
    } else if (step === 2) {
      handleGenerateImages();
    } else if (step === 3) {
      setStep(4);
    }
  };

  const canGoNext = () => {
    if (step === 1) {
      return theme.trim() && themeDescription.trim() && count >= 1 && count <= 10;
    } else if (step === 2) {
      return descriptions.length > 0;
    } else if (step === 3) {
      return selectedIndices.length > 0;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Generate Store Images</h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {step} of 4: {step === 1 && 'Input Theme'}
              {step === 2 && 'Review Descriptions'}
              {step === 3 && 'Select Images'}
              {step === 4 && 'Review & Confirm'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    s <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      s < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Loading Progress Bar */}
        {(loading || generatingImages) && progress > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-900">{progressMessage}</span>
              <span className="text-sm font-semibold text-blue-900">{progress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-sm text-red-800 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Input */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme Name
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., Safari, Space, Ocean, Fantasy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a short theme name for categorization (e.g., "Safari", "Space", "Ocean")
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme Description
                </label>
                <textarea
                  value={themeDescription}
                  onChange={(e) => setThemeDescription(e.target.value)}
                  placeholder="e.g., Safari animals in playful, colorful settings with bright backgrounds and friendly expressions"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Detailed description to guide AI image generation (be specific about style, mood, colors, etc.)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Images
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many images to generate (1-10)
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Descriptions */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Review and edit the generated descriptions. The full description will be used to create the images.
              </p>
              {descriptions.map((desc, index) => {
                const descObj = typeof desc === 'string' 
                  ? { fullDescription: desc, shortDescription: desc.substring(0, 100), shortName: `image-${index + 1}` }
                  : desc;
                const fullDesc = descObj.fullDescription || descObj.description || '';
                const shortDesc = descObj.shortDescription || '';
                const shortName = descObj.shortName || '';

                return (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 space-y-3"
                  >
                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Full Description (for image generation)
                          </label>
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                            placeholder="Detailed description for generating the image..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-500">Full Description:</span>
                              <p className="text-gray-800 mt-1">{fullDesc}</p>
                            </div>
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-500">Short Description:</span>
                              <p className="text-gray-700 mt-1">{shortDesc}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Short Name:</span>
                              <p className="text-gray-700 mt-1 font-mono text-sm">{shortName}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditDescription(index)}
                            className="ml-4 text-blue-600 hover:text-blue-800"
                            title="Edit full description"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 3: Images */}
          {step === 3 && (
            <div className="space-y-4">
              {generatingImages ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600">Generating images... This may take several minutes.</p>
                  {progressMessage && (
                    <p className="text-sm text-gray-500 mt-2">{progressMessage}</p>
                  )}
                </div>
              ) : generatedImages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No images generated yet.
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Select the images you want to add to the store. Click on an image to view it larger.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {generatedImages.map((img, index) => (
                      <div
                        key={index}
                        className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                          selectedIndices.includes(index)
                            ? 'border-blue-600 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleToggleSelection(index)}
                      >
                        <div className="relative aspect-square bg-gray-100">
                          <img
                            src={img.url}
                            alt={img.description}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          {selectedIndices.includes(index) && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 line-clamp-2">{img.shortDescription || img.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    {selectedIndices.length} of {generatedImages.length} images selected
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Review your selections before adding to the store.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Theme Name: <strong>{theme}</strong></li>
                  <li>Theme Description: <strong>{themeDescription}</strong></li>
                  <li>Selected Images: <strong>{selectedIndices.length}</strong></li>
                </ul>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {generatedImages
                  .filter((_, index) => selectedIndices.includes(index))
                  .map((img, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div className="relative aspect-square bg-gray-100">
                        <img
                          src={img.url}
                          alt={img.description}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 line-clamp-2">{img.shortDescription || img.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleBack}
            disabled={step === 1 || loading || generatingImages}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canGoNext() || loading || generatingImages}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || generatingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {step === 1 ? 'Generating...' : 'Generating Images...'}
                  </>
                ) : (
                  <>
                    {step === 1 && 'Generate Descriptions'}
                    {step === 2 && 'Generate Images'}
                    {step === 3 && 'Continue'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleAddToStore}
                disabled={loading || selectedIndices.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Add to Store
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationModal;
