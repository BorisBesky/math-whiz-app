import React, { useState } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import QuestionReviewModal from './QuestionReviewModal';

const UploadQuestionsPDF = ({ classId, appId, onClose, onQuestionsSaved }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a PDF file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('appId', appId || 'default-app-id');
      if (classId) {
        formData.append('classId', classId);
      }

      const response = await fetch('/.netlify/functions/upload-pdf-questions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload PDF');
      }

      const data = await response.json();
      setExtractedQuestions(data.questions);
      setFileName(data.fileName || file.name);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload and extract questions from PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleQuestionsSaved = () => {
    setExtractedQuestions(null);
    setFile(null);
    setFileName('');
    if (onQuestionsSaved) {
      onQuestionsSaved();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    setExtractedQuestions(null);
    setFile(null);
    setFileName('');
    setError(null);
    if (onClose) {
      onClose();
    }
  };

  // If questions are extracted, show review modal
  if (extractedQuestions) {
    return (
      <QuestionReviewModal
        questions={extractedQuestions}
        fileName={fileName}
        classId={classId}
        appId={appId}
        onSave={handleQuestionsSaved}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Upload PDF Questions
              </h3>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={uploading}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a PDF file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".pdf,application/pdf"
                        className="sr-only"
                        onChange={handleFileSelect}
                        disabled={uploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF up to 10MB
                  </p>
                </div>
              </div>
              {fileName && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-700">
                  <FileText className="h-4 w-4" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Upload a PDF containing math quiz questions. 
                Our AI will analyze the PDF and extract all questions, including any images or graphics. 
                You'll be able to review and edit the extracted questions before saving them.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Processing PDF...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Extract Questions
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

export default UploadQuestionsPDF;

