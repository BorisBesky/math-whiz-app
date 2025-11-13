import React, { useState, useEffect, useCallback } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import QuestionReviewModal from './QuestionReviewModal';
import { GRADES } from '../constants/topics';

const UploadQuestionsPDF = ({ classId, appId, onClose, onQuestionsSaved }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [polling, setPolling] = useState(false);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [checkingJobs, setCheckingJobs] = useState(true);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(GRADES.G3);

  // Helper function to process query snapshots into filtered and sorted jobs
  const processJobsSnapshot = useCallback((snapshot, shouldLog = false) => {
    if (shouldLog) {
      console.log(`Found ${snapshot.size} completed jobs`);
    }
    
    const jobs = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      
      if (shouldLog) {
        console.log(`Job ${docSnap.id}:`, {
          status: data.status,
          hasQuestions: !!data.questions,
          questionsLength: data.questions?.length || 0,
          imported: data.imported,
          fileName: data.fileName
        });
      }
      
      // Only show completed jobs with questions that haven't been imported
      // If imported field doesn't exist (older records), treat as not imported
      const isImported = data.imported === true;
      const hasQuestions = data.questions && Array.isArray(data.questions) && data.questions.length > 0;
      
      if (hasQuestions && !isImported) {
        const createdAt = data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date());
        jobs.push({
          id: docSnap.id,
          ...data,
          createdAt
        });
      }
    });
    
    // Sort by creation date (most recent first)
    jobs.sort((a, b) => b.createdAt - a.createdAt);
    
    if (shouldLog) {
      console.log(`Found ${jobs.length} pending jobs ready to import`);
    }
    
    return jobs;
  }, []);

  const checkPendingJobs = useCallback(async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setCheckingJobs(false);
        return;
      }

      const db = getFirestore();
      const currentAppId = appId || 'default-app-id';
      const jobsRef = collection(db, 'artifacts', currentAppId, 'pdfProcessingJobs');
      
      // Query for completed jobs only (simpler query, no composite index needed)
      const q = query(
        jobsRef,
        where('userId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      console.log(`Found ${snapshot.size} completed jobs for user ${user.uid}`);
      
      const jobs = processJobsSnapshot(snapshot, true);
      setPendingJobs(jobs);
    } catch (err) {
      console.error('Error checking pending jobs:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      // If query fails (e.g., missing index), try without orderBy
      if (err.code === 'failed-precondition') {
        console.log('Query requires index. Trying simpler query...');
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) return;
          
          const db = getFirestore();
          const jobsRef = collection(db, 'artifacts', appId || 'default-app-id', 'pdfProcessingJobs');
          const simpleQ = query(
            jobsRef,
            where('userId', '==', user.uid),
            where('status', '==', 'completed'),
            limit(10)
          );
          
          const snapshot = await getDocs(simpleQ);
          const jobs = processJobsSnapshot(snapshot, false);
          setPendingJobs(jobs);
        } catch (fallbackErr) {
          console.error('Fallback query also failed:', fallbackErr);
        }
      }
    } finally {
      setCheckingJobs(false);
    }
  }, [appId, processJobsSnapshot]);

  // Check for pending/completed jobs on mount
  useEffect(() => {
    checkPendingJobs();
  }, [checkPendingJobs]);

  const handleResumeJob = async (job) => {
    try {
      setExtractedQuestions(job.questions);
      setFileName(job.fileName || 'Unknown PDF');
      setCurrentJobId(job.id);
      setError(null);
    } catch (err) {
      console.error('Error resuming job:', err);
      setError('Failed to load job data');
    }
  };

  const handleDiscardJob = async (jobId) => {
    try {
      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Mark the job as discarded (similar to imported)
      const jobRef = doc(db, 'artifacts', appId || 'default-app-id', 'pdfProcessingJobs', jobId);
      await updateDoc(jobRef, { 
        imported: true, // Use the same flag so it won't show up in pending
        discarded: true, // Additional flag to distinguish from actual imports
        discardedAt: new Date() 
      });
      
      // Remove from pending jobs list
      setPendingJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err) {
      console.error('Error discarding job:', err);
      setError('Failed to discard job. Please try again.');
    }
  };

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
      formData.append('grade', selectedGrade);
      if (classId) {
        formData.append('classId', classId);
      }

      const response = await fetch('/.netlify/functions/upload-pdf-questions-background', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorMessage = 'Failed to upload PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Handle response - check status first
      if (response.status === 202) {
        // Background function - try to get job ID from body or header
        let jobId = null;
        
        // First try to get from response body
        try {
          const text = await response.text();
          if (text && text.trim()) {
            const data = JSON.parse(text);
            jobId = data.jobId;
          }
        } catch (e) {
          console.warn('Could not parse response body:', e);
        }
        
        // If no job ID from body, try header
        if (!jobId) {
          jobId = response.headers.get('X-Job-Id');
        }
        
        // If still no job ID, try to extract from any header
        if (!jobId) {
          const allHeaders = Object.fromEntries(response.headers.entries());
          console.log('All response headers:', allHeaders);
          // Try to find job ID in any header
          for (const [key, value] of Object.entries(allHeaders)) {
            if (key.toLowerCase().includes('job') || value.includes('_')) {
              // Might be a job ID pattern
              const match = value.match(/([^_]+_\d+_[a-z0-9]+)/);
              if (match) {
                jobId = match[1];
                break;
              }
            }
          }
        }
        
        if (!jobId) {
          console.error('Response status:', response.status);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));
          throw new Error('No job ID received from server. Please check the function logs.');
        }
        
        console.log('Got job ID:', jobId);
        
        // Background function - start polling
        setPolling(true);
        setFileName(file.name);
        pollJobStatus(jobId, token);
      } else {
        // Immediate response (shouldn't happen with background function)
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        setExtractedQuestions(data.questions);
        setFileName(data.fileName || file.name);
        setCurrentJobId(data.jobId || null);
        setUploading(false);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload and extract questions from PDF');
      setUploading(false);
      setPolling(false);
    }
  };

  const pollJobStatus = async (currentJobId, token) => {
    const maxDuration = 5 * 60 * 1000; // 5 minutes max (in milliseconds)
    const startTime = Date.now();
    let currentDelay = 1000; // Start with 1 second
    const maxDelay = 10000; // Cap at 10 seconds
    const backoffMultiplier = 1.5; // Increase delay by 50% each time

    const poll = async () => {
      // Check if we've exceeded max duration
      if (Date.now() - startTime >= maxDuration) {
        setError('Processing timeout. Please try again.');
        setUploading(false);
        setPolling(false);
        return;
      }

      try {
        const statusUrl = `/.netlify/functions/upload-pdf-questions-background?jobId=${currentJobId}&appId=${appId || 'default-app-id'}`;
        const response = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to check job status');
        }

        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          const text = await response.text();
          if (text.trim()) {
            try {
              data = JSON.parse(text);
            } catch (e) {
              console.error('Failed to parse JSON in polling:', text);
              throw new Error('Invalid response format');
            }
          } else {
            // Empty response - continue polling with exponential backoff
            currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
            setTimeout(poll, currentDelay);
            return;
          }
        } else {
          throw new Error('Unexpected response format');
        }
        
        setProgress(data.progress || 0);

        if (data.status === 'completed') {
          setExtractedQuestions(data.questions);
          setFileName(data.fileName || file.name);
          setCurrentJobId(currentJobId);
          setUploading(false);
          setPolling(false);
          // Refresh pending jobs list
          checkPendingJobs();
        } else if (data.status === 'error') {
          setError(data.error || 'Processing failed');
          setUploading(false);
          setPolling(false);
        } else {
          // Still processing - poll again with exponential backoff
          currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
          setTimeout(poll, currentDelay);
        }
      } catch (err) {
        console.error('Polling error:', err);
        // On error, continue polling with exponential backoff
        if (Date.now() - startTime < maxDuration) {
          currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
          setTimeout(poll, currentDelay);
        } else {
          setError('Failed to check processing status');
          setUploading(false);
          setPolling(false);
        }
      }
    };

    poll();
  };

  const handleQuestionsSaved = async () => {
    // Mark the current job as imported if we have a job ID
    if (currentJobId) {
      try {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user) {
          const jobRef = doc(db, 'artifacts', appId || 'default-app-id', 'pdfProcessingJobs', currentJobId);
          await updateDoc(jobRef, { 
            imported: true, 
            importedAt: new Date() 
          });
          
          // Remove from pending jobs list
          setPendingJobs(prev => prev.filter(j => j.id !== currentJobId));
        }
      } catch (err) {
        console.error('Error marking job as imported:', err);
      }
    }

    setExtractedQuestions(null);
    setFile(null);
    setFileName('');
    setCurrentJobId(null);
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
    setCurrentJobId(null);
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
            {/* Pending Jobs Section */}
            {!checkingJobs && pendingJobs.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">
                      Completed Processing ({pendingJobs.length})
                    </h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      You have {pendingJobs.length} completed PDF processing job{pendingJobs.length > 1 ? 's' : ''} ready to import.
                    </p>
                    <div className="space-y-2">
                      {pendingJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between bg-white rounded p-2 border border-yellow-300"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {job.fileName || 'Unknown PDF'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {job.totalQuestions || 0} questions • {job.grade === (GRADES?.G4 ?? 'G4') ? 'Grade 4' : 'Grade 3'} • {job.createdAt.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-3">
                            <button
                              onClick={() => handleDiscardJob(job.id)}
                              className="px-2 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors flex items-center"
                              title="Discard this job"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleResumeJob(job)}
                              className="px-3 py-1 text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 transition-colors flex items-center"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Import
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grade Selection */}
            <div>
              <label htmlFor="grade-select" className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <select
                id="grade-select"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                disabled={uploading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value={GRADES.G3}>Grade 3</option>
                <option value={GRADES.G4}>Grade 4</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select the grade level to match questions with appropriate topics
              </p>
            </div>

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
                {uploading || polling ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    {polling ? `Processing PDF... ${progress}%` : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Extract Questions
                  </>
                )}
              </button>
              {polling && progress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadQuestionsPDF;

