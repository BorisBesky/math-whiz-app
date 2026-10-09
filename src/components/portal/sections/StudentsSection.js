import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  BarChart3, RefreshCw, Download, Target, Trash2,
  ChevronUp, ChevronDown, CheckCircle, Sparkles, Loader2, AlertCircle, Users
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import { formatDate, normalizeDate, calculateTopicProgressForRange, getTodayDateString } from '../../../utils/common_utils';
import { SUBTOPICS_BY_GRADE_TOPIC } from '../../../constants/topics';
import {
  getAllGrades,
  getDefaultGradeKey,
  getTopicByName,
  getTopicNamesForGrade,
} from '../../../content/registry';
import { getStudentDisplayName, getStudentShortId } from '../../../utils/studentName';
import { buildCsvContent, downloadCsv } from '../../../utils/csvExport';
import ConfirmationModal from '../../ui/ConfirmationModal';
import useConfirmation from '../../../hooks/useConfirmation';
import GoalsModal from '../GoalsModal';
import StudentFocusModal from '../StudentFocusModal';
import StudentRowActions from '../StudentRowActions';
import useStudentGoals from '../../../hooks/useStudentGoals';
import { fetchStudentHistory } from '../../../services/studentHistoryService';
import {
  Alert, Avatar, EmptyState, IconButton, LoadingRow, PortalButton, SectionCard, SectionHeader,
} from '../PortalUI';

const fieldMap = {
  'grade': 'grade',
  'class': 'className',
  'questionsToday': 'questionsToday',
  'totalQuestions': 'totalQuestions',
  'accuracy': 'accuracy',
  'coins': 'coins'
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const StudentsSection = ({ students, loading, error, onRefresh, appId, initialStudentId, onInitialStudentHandled }) => {
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [sortField, setSortField] = useState('questionsToday');
  const [sortDirection, setSortDirection] = useState('desc');
  const [focusStudent, setFocusStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [aiFocusLoading, setAiFocusLoading] = useState(false);
  const [aiFocusApplying, setAiFocusApplying] = useState(false);
  const [aiFocusSaving, setAiFocusSaving] = useState(false);
  const [aiFocusDeleting, setAiFocusDeleting] = useState(false);
  const [aiFocusError, setAiFocusError] = useState(null);
  const [aiFocusResult, setAiFocusResult] = useState(null);
  const [reviewFocusMap, setReviewFocusMap] = useState({});
  const [aiFocusDirty, setAiFocusDirty] = useState(false);
  const [topicToAdd, setTopicToAdd] = useState('');
  const [studentDetailsCollapsed, setStudentDetailsCollapsed] = useState(false);
  const [aiFocusCollapsed, setAiFocusCollapsed] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const db = getFirestore();
  const { confirmationProps, confirm } = useConfirmation();
  const { goalsModalProps, openGoalsForStudent, openGoalsForStudents } = useStudentGoals({ appId, onSaved: onRefresh });

  // Sorting logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Sort once per [students, sortField, sortDirection] change — the previous
  // `useCallback` was invoked on every render (see line below), so the
  // `[...students].sort(...)` ran on every keystroke in the filter box and
  // every Firestore enrollment tick. For a class with 100+ students that was
  // meaningful wasted work.
  const sortedStudents = useMemo(() => {
    if (!sortField) return students;

    return [...students].sort((a, b) => {
      let aValue = a[fieldMap[sortField] || sortField];
      let bValue = b[fieldMap[sortField] || sortField];

      // Handle special cases
      if (sortField === 'student') {
        aValue = getStudentDisplayName(a, '');
        bValue = getStudentDisplayName(b, '');
      } else if (sortField === 'lastActivity') {
        aValue = new Date(a.latestActivity || 0).getTime();
        bValue = new Date(b.latestActivity || 0).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, sortField, sortDirection]);

  const getSortIcon = (field) => {
    if (sortField !== field) return <span className="inline-block w-4 h-4" aria-hidden="true" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Selection logic
  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // Actions
  const exportStudentData = () => {
    if (students.length === 0) return;

    const csvData = students.map(student => ({
      'Name': getStudentDisplayName(student),
      'Short ID': getStudentShortId(student),
      'Needs Name Review': student.needsNameReview ? 'Yes' : 'No',
      'Email': student.email || '',
      'Student ID': student.id,
      'Grade': student.grade,
      'Class': student.className,
      'Total Questions': student.totalQuestions,
      'Questions Today': student.questionsToday,
      'Accuracy (%)': (typeof student.accuracy === 'number' && Number.isFinite(student.accuracy))
        ? student.accuracy.toFixed(1)
        : '',
      'Coins': student.coins,
      'Latest Activity': student.latestActivity ? new Date(student.latestActivity).toLocaleDateString() : 'Never',
    }));

    const csvContent = buildCsvContent(csvData);
    downloadCsv(csvContent, `student_data_${getTodayDateString()}.csv`);
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;
    if (!appId) {
      console.error('App ID is missing');
      return;
    }

    const ok = await confirm({
      title: 'Delete Students',
      message: `Are you sure you want to delete ${selectedStudents.size} student(s)? This action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    try {
      const batch = writeBatch(db);
      selectedStudents.forEach(studentId => {
        // Use the correct path for the new data model
        const studentRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
        batch.delete(studentRef);
      });

      await batch.commit();
      setSelectedStudents(new Set());
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('Failed to delete students. Please try again.');
    }
  };

  // Goals logic is shared with the class roster (see useStudentGoals).
  const openGoalsModalForStudent = openGoalsForStudent;
  const openGoalsModalForSelected = () => openGoalsForStudents(selectedStudents);

  // Focus logic — StudentFocusModal loads its own data; just track which student is open.
  const openFocusModalForStudent = (student) => {
    if (!student) return;
    setFocusStudent(student);
  };

  const closeFocusModal = () => {
    setFocusStudent(null);
  };

  const getGradeForTopic = (topic) => (
    getTopicByName(topic)?.grade || viewingStudent?.grade || getDefaultGradeKey()
  );

  const hasReviewFocusAreas = (focusMap = reviewFocusMap) => (
    Object.values(focusMap || {}).some((subtopics) => Array.isArray(subtopics) && subtopics.length > 0)
  );

  const normalizeSavedRecommendation = (savedRecommendation) => {
    if (!savedRecommendation) return null;
    return {
      ...savedRecommendation,
      applied: savedRecommendation.status === 'applied',
      saved: true,
    };
  };

  const setRecommendationState = useCallback((recommendation) => {
    const normalized = normalizeSavedRecommendation(recommendation);
    setAiFocusResult(normalized);
    setReviewFocusMap(normalized?.focusMap || {});
    setAiFocusDirty(false);
    setTopicToAdd('');
  }, []);

  const setAnalysisResultState = useCallback((result) => {
    setAiFocusResult(result || null);
    setReviewFocusMap(result?.focusMap || {});
    setAiFocusDirty(false);
    setTopicToAdd('');
  }, []);

  const openStudentDetails = (student) => {
    const hasExistingHistory = Array.isArray(student.answeredQuestions) && student.answeredQuestions.length > 0;
    setViewingStudent({
      ...student,
      answeredQuestions: student.answeredQuestions || [],
      historyLoaded: hasExistingHistory,
      // Always revalidate when details open. A history array carried by the
      // table can be older than answers the student just submitted.
      historyRequestKey: null,
    });
    setAiFocusResult(null);
    setAiFocusError(null);
    setHistoryError(null);
    setReviewFocusMap({});
    setAiFocusDirty(false);
    setTopicToAdd('');
    setStudentDetailsCollapsed(false);
    setAiFocusCollapsed(false);
  };

  useEffect(() => {
    if (!viewingStudent?.id || !appId) return undefined;
    const requestKey = `${viewingStudent.id}_${viewingStudent.classId || ''}_${startDate}_${endDate}`;
    if (viewingStudent.historyRequestKey === requestKey) return undefined;

    let cancelled = false;
    const loadHistory = async () => {
      if (!viewingStudent.historyLoaded) setHistoryLoading(true);
      setHistoryError(null);
      try {
        const answeredQuestions = await fetchStudentHistory({
          appId,
          studentId: viewingStudent.id,
          classId: viewingStudent.classId,
          startDate,
          endDate,
        });
        if (!cancelled) {
          setViewingStudent((current) => (
            current?.id === viewingStudent.id
              ? { ...current, answeredQuestions, historyLoaded: true, historyRequestKey: requestKey }
              : current
          ));
        }
      } catch (err) {
        if (!cancelled) {
          setHistoryError(err?.message || 'Failed to load question history');
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [appId, viewingStudent?.id, viewingStudent?.classId, viewingStudent?.historyLoaded, viewingStudent?.historyRequestKey, startDate, endDate]);

  // Deep link from elsewhere in the portal (e.g. "View details" in a class
  // roster): open that student's detail view once the roster is available,
  // then let the parent clear the request so it doesn't re-trigger.
  useEffect(() => {
    if (!initialStudentId || loading) return;
    const target = students.find((student) => student.id === initialStudentId);
    if (target) openStudentDetails(target);
    if (onInitialStudentHandled) onInitialStudentHandled();
    // openStudentDetails is a plain function recreated each render; only the
    // request itself (and roster availability) should drive this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStudentId, loading, students]);

  // Keep an open history panel fresh without making the teacher close and
  // reopen it. Background refreshes retain the current list while revalidating.
  useEffect(() => {
    if (!viewingStudent?.id) return undefined;
    const studentId = viewingStudent.id;
    const invalidateHistory = () => {
      if (document.visibilityState !== 'visible') return;
      setViewingStudent((current) => {
        if (current?.id !== studentId || current.historyRequestKey === null) return current;
        return { ...current, historyRequestKey: null };
      });
    };

    const intervalId = window.setInterval(invalidateHistory, 30000);
    window.addEventListener('focus', invalidateHistory);
    document.addEventListener('visibilitychange', invalidateHistory);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', invalidateHistory);
      document.removeEventListener('visibilitychange', invalidateHistory);
    };
  }, [viewingStudent?.id]);

  // The roster refresh carries compact totals/latest activity. Merge those
  // into an open detail panel and immediately invalidate history when its
  // summary proves a new answer exists.
  useEffect(() => {
    if (!viewingStudent?.id) return;
    const latestStudent = students.find((student) => student.id === viewingStudent.id);
    if (!latestStudent) return;

    setViewingStudent((current) => {
      if (!current || current.id !== latestStudent.id) return current;
      const historyChanged =
        current.totalQuestions !== latestStudent.totalQuestions ||
        current.latestActivity !== latestStudent.latestActivity;
      const detailsChanged = historyChanged ||
        current.questionsToday !== latestStudent.questionsToday ||
        current.accuracy !== latestStudent.accuracy ||
        current.coins !== latestStudent.coins ||
        current.className !== latestStudent.className;
      if (!detailsChanged) return current;

      return {
        ...current,
        ...latestStudent,
        answeredQuestions: current.answeredQuestions,
        historyLoaded: current.historyLoaded,
        historyRequestKey: historyChanged ? null : current.historyRequestKey,
      };
    });
  }, [students, viewingStudent?.id]);

  const handleDateRangeChange = (setter) => (event) => {
    setter(event.target.value);
    setAiFocusResult(null);
    setAiFocusError(null);
    setReviewFocusMap({});
    setAiFocusDirty(false);
    setTopicToAdd('');
    setAiFocusCollapsed(false);
  };

  const requestAiFocus = useCallback(async (payload) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Sign in again to use AI focus recommendations.');
    }

    const token = await currentUser.getIdToken();
    const response = await fetch('/.netlify/functions/teacher-ai-focus-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        appId,
        studentId: viewingStudent.id,
        classId: viewingStudent.classId || '',
        ...payload,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `AI focus request failed with status ${response.status}`);
    }
    return data;
  }, [appId, viewingStudent]);

  const pollAiFocusJob = useCallback(async (jobId) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Sign in again to use AI focus recommendations.');
    }

    const token = await currentUser.getIdToken();
    const startedAt = Date.now();
    const timeoutMs = 14 * 60 * 1000;

    while (Date.now() - startedAt < timeoutMs) {
      await wait(2000);
      const response = await fetch(
        `/.netlify/functions/teacher-ai-focus-analysis-status?jobId=${encodeURIComponent(jobId)}&appId=${encodeURIComponent(appId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `AI focus status failed with status ${response.status}`);
      }
      if (data.status === 'completed') {
        return data.result || data;
      }
      if (data.status === 'failed') {
        throw new Error(data.error || 'AI focus analysis failed. Please try again.');
      }
    }

    throw new Error('AI focus analysis is still running. Please try again in a minute.');
  }, [appId]);

  const analyzeAiFocus = async () => {
    if (!viewingStudent || !appId) return;
    if (!viewingStudent.classId) {
      setAiFocusError('Assign this student to a class before saving AI focus recommendations.');
      return;
    }

    setAiFocusLoading(true);
    setAiFocusError(null);
    setAiFocusResult(null);
    setReviewFocusMap({});
    setAiFocusDirty(false);
    setAiFocusCollapsed(false);

    try {
      const data = await requestAiFocus({
        startDate,
        endDate,
        mode: 'suggest',
        answeredQuestions: (viewingStudent.answeredQuestions || []).filter((question) => {
          const questionDate = normalizeDate(question.date || question.timestamp);
          return questionDate >= startDate && questionDate <= endDate;
        }),
      });
      const completedData = data.jobId ? await pollAiFocusJob(data.jobId) : data;
      if (completedData.savedRecommendation) {
        setRecommendationState(completedData.savedRecommendation);
      } else {
        setAnalysisResultState(completedData);
      }
    } catch (err) {
      console.error('[StudentsSection] AI focus analysis failed', err);
      setAiFocusError(err?.message || 'AI focus analysis failed. Please try again.');
    } finally {
      setAiFocusLoading(false);
    }
  };

  useEffect(() => {
    if (!viewingStudent || !appId || !viewingStudent.classId) return undefined;

    let cancelled = false;
    const loadSavedRecommendation = async () => {
      try {
        const data = await requestAiFocus({ mode: 'get' });
        if (!cancelled && data.savedRecommendation) {
          setRecommendationState(data.savedRecommendation);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[StudentsSection] Failed to load saved AI focus recommendation', err);
        }
      }
    };

    loadSavedRecommendation();
    return () => {
      cancelled = true;
    };
  }, [viewingStudent, appId, requestAiFocus, setRecommendationState]);

  const toggleReviewSubtopic = (topic, subtopic) => {
    setReviewFocusMap((prev) => {
      const current = prev[topic] || [];
      const nextSubtopics = current.includes(subtopic)
        ? current.filter((item) => item !== subtopic)
        : [...current, subtopic];
      const next = { ...prev };
      if (nextSubtopics.length > 0) {
        next[topic] = nextSubtopics;
      } else {
        delete next[topic];
      }
      return next;
    });
    setAiFocusDirty(true);
  };

  const addReviewTopic = () => {
    if (!topicToAdd) return;
    setReviewFocusMap((prev) => ({ ...prev, [topicToAdd]: prev[topicToAdd] || [] }));
    setTopicToAdd('');
    setAiFocusDirty(true);
  };

  const saveAiFocusDraft = async () => {
    if (!viewingStudent || !appId || !hasReviewFocusAreas()) return;
    setAiFocusSaving(true);
    setAiFocusError(null);
    try {
      const data = await requestAiFocus({
        mode: 'update',
        focusMap: reviewFocusMap,
      });
      setRecommendationState(data.savedRecommendation);
    } catch (err) {
      console.error('[StudentsSection] Saving AI focus recommendation failed', err);
      setAiFocusError(err?.message || 'Saving AI focus recommendation failed. Please try again.');
    } finally {
      setAiFocusSaving(false);
    }
  };

  const deleteAiFocusDraft = async () => {
    if (!viewingStudent || !appId || !viewingStudent.classId) return;
    setAiFocusDeleting(true);
    setAiFocusError(null);
    try {
      await requestAiFocus({ mode: 'delete' });
      setRecommendationState(null);
    } catch (err) {
      console.error('[StudentsSection] Deleting AI focus recommendation failed', err);
      setAiFocusError(err?.message || 'Deleting AI focus recommendation failed. Please try again.');
    } finally {
      setAiFocusDeleting(false);
    }
  };

  const applyAiFocusRecommendations = async () => {
    if (!viewingStudent || !appId || !hasReviewFocusAreas()) return;
    if (!viewingStudent.classId) {
      setAiFocusError('Assign this student to a class before applying AI focus areas.');
      return;
    }

    setAiFocusApplying(true);
    setAiFocusError(null);

    try {
      const data = await requestAiFocus({
        startDate,
        endDate,
        mode: 'apply',
        focusMap: reviewFocusMap,
      });
      setRecommendationState(data.savedRecommendation || {
        ...(aiFocusResult || {}),
        ...data,
        focusMap: reviewFocusMap,
        applied: true,
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('[StudentsSection] Applying AI focus recommendations failed', err);
      setAiFocusError(err?.message || 'Applying AI focus recommendations failed. Please try again.');
    } finally {
      setAiFocusApplying(false);
    }
  };

  // sortedStudents is memoized above; no per-render sort.

  // Pagination logic
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = sortedStudents.slice(startIndex, endIndex);

  // Check if all students on current page are selected
  const isCurrentPageSelected = paginatedStudents.length > 0 && 
    paginatedStudents.every(student => selectedStudents.has(student.id));

  const handleSelectAll = () => {
    const currentPageIds = paginatedStudents.map(s => s.id);
    const allCurrentPageSelected = currentPageIds.every(id => selectedStudents.has(id));
    
    const newSelected = new Set(selectedStudents);
    
    if (allCurrentPageSelected) {
      // Deselect all on current page
      currentPageIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all on current page
      currentPageIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedStudents(newSelected);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Render Student Detail View
  if (viewingStudent) {
    const allFocusTopics = [...new Set(
      getAllGrades().flatMap((grade) => getTopicNamesForGrade(grade.key))
    )];
    const reviewTopics = Object.keys(reviewFocusMap || {});
    const addableTopics = allFocusTopics.filter((topic) => !reviewTopics.includes(topic));

    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {getStudentDisplayName(viewingStudent)}
            </h3>
            <p className="text-gray-600">ID: {viewingStudent.id}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
             <div className="flex items-center space-x-2 bg-white border rounded-md px-3 py-1">
                <span className="text-sm text-gray-600">Range:</span>
                <input
                  type="date"
                  aria-label="Start date"
                  value={startDate}
                  onChange={handleDateRangeChange(setStartDate)}
                  className="text-sm border-none focus:ring-0"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  aria-label="End date"
                  value={endDate}
                  onChange={handleDateRangeChange(setEndDate)}
                  className="text-sm border-none focus:ring-0"
                />
             </div>
             <button
               type="button"
               onClick={analyzeAiFocus}
               disabled={aiFocusLoading || !appId}
               className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {aiFocusLoading ? (
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               ) : (
                 <Sparkles className="w-4 h-4 mr-2" />
               )}
               AI Focus
             </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div>
            <h4 className="font-semibold text-gray-900">Student Details</h4>
            <p className="text-sm text-gray-500">Overview, grade progress, and question history</p>
          </div>
          <button
            type="button"
            onClick={() => setStudentDetailsCollapsed((collapsed) => !collapsed)}
            className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            aria-label={studentDetailsCollapsed ? 'Show student details' : 'Hide student details'}
            aria-expanded={!studentDetailsCollapsed}
            aria-controls="student-detail-sections"
          >
            {studentDetailsCollapsed ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronUp className="w-4 h-4 mr-2" />
            )}
            {studentDetailsCollapsed ? 'Show' : 'Hide'}
          </button>
        </div>

        {!studentDetailsCollapsed && (
        <div id="student-detail-sections" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overview Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Student Overview</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Grade:</span>
                <span className="font-medium">{viewingStudent.grade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Class:</span>
                <span className="font-medium">{viewingStudent.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium">{viewingStudent.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className={`font-medium ${viewingStudent.accuracy >= 80 ? 'text-green-600' : viewingStudent.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {(typeof viewingStudent.accuracy === 'number' && Number.isFinite(viewingStudent.accuracy)
                    ? viewingStudent.accuracy
                    : 0
                  ).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coins:</span>
                <span className="font-medium">{viewingStudent.coins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Active:</span>
                <span className="font-medium">{formatDate(viewingStudent.latestActivity)}</span>
              </div>
            </div>
          </div>

          {/* Per-grade progress panels (one per enabled grade) */}
          {getAllGrades().map((grade) => (
            <div key={grade.key} className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Grade {grade.ordinal} Progress
              </h4>
              <div className="space-y-3">
                {calculateTopicProgressForRange(viewingStudent, grade.key, startDate, endDate).map(topic => (
                  <div key={topic.topic} className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 truncate max-w-[150px]" title={topic.topic}>
                        {topic.topic}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {topic.averageCorrect}/{topic.goal}
                          {topic.activeDays > 1 && (
                            <span className="text-xs text-gray-400 ml-1">
                              ({topic.activeDays}d)
                            </span>
                          )}
                        </span>
                        {topic.completed && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${topic.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min((topic.averageCorrect / topic.goal) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}

        {(aiFocusError || aiFocusResult || aiFocusLoading) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                  AI Focus Recommendations
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Review the suggestions, then apply them to this student's Focus Areas if they look right.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {aiFocusResult?.applied && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Applied
                  </span>
                )}
                {aiFocusResult?.saved && !aiFocusResult?.applied && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    Saved
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setAiFocusCollapsed((collapsed) => !collapsed)}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  aria-label={aiFocusCollapsed ? 'Show AI focus recommendations' : 'Hide AI focus recommendations'}
                  aria-expanded={!aiFocusCollapsed}
                  aria-controls="ai-focus-recommendation-content"
                >
                  {aiFocusCollapsed ? (
                    <ChevronDown className="w-4 h-4 mr-2" />
                  ) : (
                    <ChevronUp className="w-4 h-4 mr-2" />
                  )}
                  {aiFocusCollapsed ? 'Show' : 'Hide'}
                </button>
              </div>
            </div>

            {!aiFocusCollapsed && aiFocusLoading && (
              <div className="flex items-center text-sm text-gray-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing performance by topic and subtopic...
              </div>
            )}

            {!aiFocusCollapsed && aiFocusError && (
              <div className="flex items-start rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{aiFocusError}</span>
              </div>
            )}

            {!aiFocusCollapsed && aiFocusResult && !aiFocusLoading && (
              <div id="ai-focus-recommendation-content" className="space-y-4">
                <p className="text-sm text-gray-700">{aiFocusResult.summary}</p>
                <div className="text-xs text-gray-500">
                  {aiFocusResult.metrics?.questionsAnalyzed || 0} question{aiFocusResult.metrics?.questionsAnalyzed === 1 ? '' : 's'} analyzed
                  {aiFocusResult.metrics?.startDate && aiFocusResult.metrics?.endDate && (
                    <span> from {formatDate(aiFocusResult.metrics.startDate)} to {formatDate(aiFocusResult.metrics.endDate)}</span>
                  )}
                </div>

                {aiFocusResult.recommendations?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiFocusResult.recommendations.map((item, index) => (
                      <div key={`${item.topic}-${item.subtopic}-${index}`} className="border border-blue-100 bg-blue-50 rounded-md p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="font-semibold text-blue-950">{item.subtopic}</h5>
                            <p className="text-xs text-blue-700 mt-0.5">{item.grade} - {item.topic}</p>
                          </div>
                          <span className="text-xs font-semibold text-blue-700 bg-white rounded-full px-2 py-1">
                            {item.confidence || 'medium'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-3">{item.reason}</p>
                        {item.metrics && (
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                            <span className="bg-white rounded px-2 py-1">{item.metrics.attempts} attempt{item.metrics.attempts === 1 ? '' : 's'}</span>
                            <span className="bg-white rounded px-2 py-1">{item.metrics.accuracy}% accuracy</span>
                            {item.metrics.averageTime && (
                              <span className="bg-white rounded px-2 py-1">{item.metrics.averageTime}s avg</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    No specific focus subtopics were recommended for this range.
                  </div>
                )}

                {aiFocusResult.notEnoughData?.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h5 className="text-sm font-semibold text-gray-800 mb-2">Needs more evidence</h5>
                    <div className="flex flex-wrap gap-2">
                      {aiFocusResult.notEnoughData.map((item, index) => (
                        <span key={`${item.topic}-${item.subtopic}-${index}`} className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {item.topic}{item.subtopic ? `: ${item.subtopic}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(reviewTopics.length > 0 || aiFocusResult.recommendations?.length > 0) && (
                  <div className="border-t border-gray-100 pt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800">Reviewed focus areas</h5>
                        <p className="text-xs text-gray-500 mt-1">
                          Adjust these before applying. Checked subtopics become this student's Focus Areas.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={topicToAdd}
                          onChange={(event) => setTopicToAdd(event.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-2 text-sm"
                          aria-label="Add focus topic"
                        >
                          <option value="">Add topic...</option>
                          {addableTopics.map((topic) => (
                            <option key={topic} value={topic}>{topic}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addReviewTopic}
                          disabled={!topicToAdd}
                          className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {reviewTopics.length > 0 ? (
                      <div className="space-y-3">
                        {reviewTopics.map((topic) => {
                          const grade = getGradeForTopic(topic);
                          const subtopics = SUBTOPICS_BY_GRADE_TOPIC[grade]?.[topic] || [];
                          return (
                            <div key={topic} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{topic}</p>
                                  <p className="text-xs text-gray-500">{grade}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewFocusMap((prev) => {
                                      const next = { ...prev };
                                      delete next[topic];
                                      return next;
                                    });
                                    setAiFocusDirty(true);
                                  }}
                                  className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                                  aria-label={`Remove ${topic}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {subtopics.map((subtopic) => {
                                  const checked = (reviewFocusMap[topic] || []).includes(subtopic);
                                  return (
                                    <label
                                      key={subtopic}
                                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${
                                        checked
                                          ? 'bg-white border-blue-300 text-blue-900'
                                          : 'bg-white border-gray-200 text-gray-700'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleReviewSubtopic(topic, subtopic)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                      <span>{subtopic}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        No reviewed focus areas selected.
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={saveAiFocusDraft}
                          disabled={aiFocusSaving || !aiFocusDirty || !hasReviewFocusAreas()}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-blue-200 bg-white text-blue-700 text-sm font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {aiFocusSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {aiFocusSaving ? 'Saving...' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={deleteAiFocusDraft}
                          disabled={aiFocusDeleting}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-red-200 bg-white text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {aiFocusDeleting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          {aiFocusDeleting ? 'Deleting...' : 'Delete recommendation'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {hasReviewFocusAreas() && !aiFocusResult.applied && (
                  <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-gray-600">
                      Applying these will update the student's Focus Areas for the class.
                    </p>
                    <button
                      type="button"
                      onClick={applyAiFocusRecommendations}
                      disabled={aiFocusApplying || !viewingStudent.classId}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiFocusApplying ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      {aiFocusApplying ? 'Applying...' : 'Apply recommendations'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!studentDetailsCollapsed && (
        <>
          {/* Questions by Date Range */}
          {(() => {
          const normalizedStartDate = normalizeDate(startDate);
          const normalizedEndDate = normalizeDate(endDate);

          const questionsInRange = viewingStudent.answeredQuestions?.filter(
            (q) => {
              const normalizedQuestionDate = normalizeDate(q.date);
              return normalizedQuestionDate >= normalizedStartDate && normalizedQuestionDate <= normalizedEndDate;
            }
          ) || [];
          
          return (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-700">
                  Questions {startDate === endDate ? `for ${formatDate(startDate)}` : `from ${formatDate(startDate)} to ${formatDate(endDate)}`}:
                </h4>
              </div>
              {historyLoading ? (
                <div className="flex items-center text-sm text-gray-500 py-6">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading question history...
                </div>
              ) : historyError ? (
                <div className="text-sm text-red-600 py-6">{historyError}</div>
              ) : questionsInRange.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {(() => {
                    // Group questions by date
                    const questionsByDate = questionsInRange.reduce((groups, question) => {
                      const date = question.date;
                      if (!groups[date]) {
                        groups[date] = [];
                      }
                      groups[date].push(question);
                      return groups;
                    }, {});

                    // Sort dates in descending order (most recent first)
                    const sortedDates = Object.keys(questionsByDate).sort((a, b) => new Date(b) - new Date(a));

                    return sortedDates.map(date => (
                      <div key={date} className="mb-6 last:mb-0">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                          <h5 className="text-lg font-semibold text-gray-800">
                            {formatDate(date)}
                          </h5>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {questionsByDate[date].length} question{questionsByDate[date].length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {questionsByDate[date].map((q, index) => (
                            <div
                              key={q.id || `${date}-${index}`}
                              className={`p-3 rounded-lg border-l-4 ${
                                q.isCorrect
                                  ? "bg-green-50 border-green-500"
                                  : "bg-red-50 border-red-500"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-sm text-gray-600">
                                  {q.topic}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {q.timeTaken ? `${q.timeTaken.toFixed(1)}s` : 'N/A'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 mb-1">{q.question}</p>
                              <div className="text-xs">
                                <span className="text-gray-600">Your answer: </span>
                                <span
                                  className={
                                    q.isCorrect
                                      ? "text-green-600 font-semibold"
                                      : "text-red-600 font-semibold"
                                  }
                                >
                                  {q.userAnswer || 'N/A'}
                                </span>
                                {!q.isCorrect && (
                                  <>
                                    <span className="text-gray-600 ml-2">Correct: </span>
                                    <span className="text-green-600 font-semibold">
                                      {q.correctAnswer || 'N/A'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No questions answered {startDate === endDate ? `on ${formatDate(startDate)}` : `in the selected date range`}
                  </p>
                </div>
              )}
            </div>
          );
            })()}
        </>
        )}
        
      </div>
    );
  }

  const renderSortHeader = ({ field, label, align = 'left', className = '' }) => (
    <th
      scope="col"
      aria-sort={sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-4 py-3 font-semibold text-gray-600 ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSort(field)}
        className={`group inline-flex items-center gap-1 rounded uppercase tracking-wide hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        <span>{label}</span>
        {getSortIcon(field)}
      </button>
    </th>
  );

  const selectedCount = selectedStudents.size;

  return (
    <div className="space-y-4">
      <SectionCard className="overflow-hidden">
        <div className="px-4 py-4 sm:px-5 border-b border-gray-100">
          <SectionHeader
            title={(
              <span className="flex items-center gap-2">
                Students
                {!loading && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 tabular-nums">
                    {students.length}
                  </span>
                )}
              </span>
            )}
            description="Manage your students and track progress"
            actions={(
              <>
                <IconButton icon={RefreshCw} label="Refresh" onClick={onRefresh} />
                <PortalButton
                  icon={Download}
                  onClick={exportStudentData}
                  disabled={students.length === 0}
                  title="Export CSV"
                >
                  <span className="hidden sm:inline">Export CSV</span>
                </PortalButton>
              </>
            )}
          />
        </div>

        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-5 border-b text-sm transition-colors ${
            selectedCount > 0 ? 'bg-blue-50 border-blue-100' : 'bg-gray-50/70 border-gray-100'
          }`}
        >
          <span className={selectedCount > 0 ? 'font-medium text-blue-800' : 'text-gray-500'}>
            {selectedCount > 0
              ? `${selectedCount} selected`
              : 'Select students to set goals or delete in bulk'}
          </span>
          <div className="flex items-center gap-2">
            <PortalButton
              icon={Target}
              onClick={openGoalsModalForSelected}
              disabled={selectedCount === 0}
              title="Set Goals"
              className="py-1.5"
            >
              <span>Set goals</span>
            </PortalButton>
            <PortalButton
              variant="danger"
              icon={Trash2}
              onClick={handleBulkDelete}
              disabled={selectedCount === 0}
              title="Delete Selected"
              className="py-1.5"
            >
              <span className="hidden sm:inline">Delete</span>
            </PortalButton>
          </div>
        </div>

        {error && (
          <div className="px-4 pt-4 sm:px-5">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white border-b border-gray-200 text-xs uppercase tracking-wide">
              <tr>
                <th scope="col" className="w-10 pl-4 pr-1 py-3 text-left sm:w-12 sm:px-4">
                  <input
                    type="checkbox"
                    checked={isCurrentPageSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    title={`Select all ${paginatedStudents.length} students on this page`}
                    aria-label="Select all students on this page"
                  />
                </th>
                {renderSortHeader({ field: 'student', label: 'Student', className: 'text-left !px-2 sm:!px-4' })}
                {renderSortHeader({ field: 'class', label: 'Class', className: 'hidden md:table-cell text-left' })}
                {renderSortHeader({ field: 'grade', label: 'Grade', className: 'hidden lg:table-cell text-left' })}
                {renderSortHeader({ field: 'totalQuestions', label: 'Questions', align: 'right', className: 'hidden sm:table-cell text-right' })}
                {renderSortHeader({ field: 'accuracy', label: 'Accuracy', align: 'right', className: 'text-right !px-2 sm:!px-4' })}
                {renderSortHeader({ field: 'questionsToday', label: 'Today', align: 'right', className: 'hidden sm:table-cell text-right' })}
                <th scope="col" className="relative px-2 py-3 text-right font-semibold text-gray-600 sm:px-4">
                  <span className="sr-only sm:not-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4">
                    <LoadingRow label="Loading students..." />
                  </td>
                </tr>
              ) : sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 sm:p-5">
                    <EmptyState
                      icon={Users}
                      title="No students found."
                      description="Students appear here once they join one of your classes with an invite link or code."
                    />
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const isSelected = selectedStudents.has(student.id);
                  const displayName = getStudentDisplayName(student);
                  const accuracyValue = (typeof student.accuracy === 'number' && Number.isFinite(student.accuracy))
                    ? student.accuracy
                    : 0;
                  return (
                    <tr
                      key={student.id}
                      className={`align-middle transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                      onDoubleClick={() => openStudentDetails(student)}
                    >
                      <td className="w-10 pl-4 pr-1 py-3 sm:w-12 sm:px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectStudent(student.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          aria-label={`Select ${displayName}`}
                        />
                      </td>
                      <td className="px-2 py-3 max-w-[11rem] sm:px-4 sm:max-w-[16rem]">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={displayName} seed={student.id} size="sm" />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openStudentDetails(student)}
                              className="block max-w-full truncate text-left font-medium text-gray-900 hover:text-blue-700 focus:outline-none focus-visible:underline"
                            >
                              {displayName}
                            </button>
                            <p className="text-xs text-gray-400 truncate">
                              <span className="lg:hidden">{student.grade} · </span>ID: {getStudentShortId(student)}
                            </p>
                            {student.email && (
                              <p className="text-xs text-gray-500 truncate" title={student.email}>{student.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 max-w-[14rem]">
                        <span
                          className={`inline-flex max-w-full truncate px-2 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${
                            student.className === 'Unassigned'
                              ? 'bg-gray-50 text-gray-600 ring-gray-500/20'
                              : 'bg-green-50 text-green-700 ring-green-600/20'
                          }`}
                          title={student.className}
                        >
                          {student.className}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          {student.grade}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-right font-medium text-gray-900 tabular-nums">
                        {student.totalQuestions}
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums sm:px-4">
                        <span className={`font-medium ${accuracyValue >= 80 ? 'text-green-600' : accuracyValue >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {accuracyValue.toFixed(1)}%
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-right tabular-nums text-gray-700">
                        <span className="inline-flex items-center justify-end gap-2">
                          {student.questionsToday > 0 && (
                            <span className="h-2 w-2 rounded-full bg-green-400" aria-hidden="true"></span>
                          )}
                          {student.questionsToday}
                        </span>
                      </td>
                      <td className="px-2 py-2 sm:px-4">
                        <StudentRowActions
                          displayName={displayName}
                          onViewDetails={() => openStudentDetails(student)}
                          onSetGoals={() => openGoalsModalForStudent(student)}
                          onSetFocus={() => openFocusModalForStudent(student)}
                          focusTitle={
                            student.classId
                              ? 'Set focus subtopics'
                              : 'Assign student to a class to set focus subtopics'
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {sortedStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 sm:px-5 border-t border-gray-100 bg-gray-50/70">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-600">
              <label htmlFor="students-per-page">Show</label>
              <select
                id="students-per-page"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
              <span className="text-gray-400" aria-hidden="true">·</span>
              <span className="tabular-nums">
                {startIndex + 1}–{Math.min(endIndex, sortedStudents.length)} of {sortedStudents.length}
              </span>
            </div>

            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                ) : (
                  <button
                    type="button"
                    key={page}
                    onClick={() => handlePageChange(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`min-w-[2rem] px-3 py-1 rounded-md border text-sm tabular-nums transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </SectionCard>

      <ConfirmationModal {...confirmationProps} />

      <GoalsModal {...goalsModalProps} />

      {focusStudent && (
        <StudentFocusModal
          isOpen={!!focusStudent}
          onClose={closeFocusModal}
          student={focusStudent}
          onSaved={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default StudentsSection;
