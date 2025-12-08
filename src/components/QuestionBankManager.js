import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, onSnapshot, updateDoc, doc, deleteDoc, setDoc, deleteField } from 'firebase/firestore';
import { BookOpen, Trash2, Users, Filter, X, ChevronDown, ChevronUp, Share2, User as UserIcon, Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import EditQuestionModal from './EditQuestionModal';
import { TOPICS } from '../constants/topics';
import { clearCachedClassQuestions } from '../utils/questionCache';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/contrib/auto-render';

const QuestionBankManager = ({
  classes,
  appId,
  userId,
  // Optional props for admin mode
  questions: externalQuestions = null,
  sharedQuestions: externalSharedQuestions = null,
  allTeachers = [],
  isAdmin = false,
  onAddToSharedBank = null,
  onRemoveFromSharedBank = null,
  onDeleteQuestion = null,
  onAssignToClass = null,
  groupingMode = 'source', // 'source' or 'teacher-source'
  viewMode = null, // null for teacher view, 'all'|'teachers'|'shared' for admin
  showViewModeTabs = false,
  onEditQuestion = null // Optional prop for custom edit handling (admin mode)
}) => {
  const [questions, setQuestions] = useState([]);
  const [sharedQuestions, setSharedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [filterTopic, setFilterTopic] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterHasImage, setFilterHasImage] = useState('');
  const [expandedSources, setExpandedSources] = useState(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassForAssignment, setSelectedClassForAssignment] = useState('');
  const [internalViewMode, setInternalViewMode] = useState(viewMode || 'all');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [pendingAssignmentQuestions, setPendingAssignmentQuestions] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegexMode, setIsRegexMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const questionContainerRef = useRef(null);

  const db = getFirestore();
  const currentAppId = appId || 'default-app-id';

  // Auto-render KaTeX when questions change
  useEffect(() => {
    if (questionContainerRef.current) {
      try {
        renderMathInElement(questionContainerRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        });
      } catch (e) {
        console.warn('KaTeX render error:', e);
      }
    }
  }, [questions, sharedQuestions, expandedSources, filterTopic, filterGrade, filterSource, filterTeacher, filterType, filterHasImage, internalViewMode, currentPage, searchQuery, isRegexMode]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTopic, filterGrade, filterSource, filterTeacher, filterType, filterHasImage, searchQuery, isRegexMode, internalViewMode]);

  const topicOptions = [
    TOPICS.MULTIPLICATION,
    TOPICS.DIVISION,
    TOPICS.FRACTIONS,
    TOPICS.MEASUREMENT_DATA,
    TOPICS.OPERATIONS_ALGEBRAIC_THINKING,
    TOPICS.BASE_TEN,
    TOPICS.FRACTIONS_4TH,
    TOPICS.MEASUREMENT_DATA_4TH,
    TOPICS.GEOMETRY,
    TOPICS.BINARY_ADDITION
  ];

  const gradeOptions = ['G3', 'G4'];

  // Load questions from teacher's questionBank (only if not provided externally)
  useEffect(() => {
    if (externalQuestions !== null) {
      setQuestions(externalQuestions);
      setLoading(false);
      return;
    }

    if (!userId || !db) return;

    const questionBankRef = collection(db, 'artifacts', currentAppId, 'users', userId, 'questionBank');

    // Try query without orderBy to avoid index issues
    let unsubscribe;
    try {
      console.log('[QuestionBankManager] Loading questions from questionBank for user:', userId);
      unsubscribe = onSnapshot(questionBankRef, (snapshot) => {
        console.log(`[QuestionBankManager] Loaded ${snapshot.size} questions from questionBank`);
        const questionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort client-side if createdAt exists
        questionsData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            const timeA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const timeB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return timeB - timeA; // desc
          }
          return 0;
        });
        setQuestions(questionsData);
        setLoading(false);
        setError(null); // Clear any previous errors
      }, (err) => {
        const errorMessage = err?.message || err?.toString() || 'Unknown error';
        console.error('[QuestionBankManager] Error loading questions:', {
          error: err,
          code: err?.code,
          message: errorMessage,
          userId
        });

        // Check if this is a missing index error
        if (errorMessage.toLowerCase().includes('index') || errorMessage.toLowerCase().includes('requires an index')) {
          setError('Database index required. Please check the browser console for the index creation link.');
        } else {
          setError('Failed to load questions: ' + errorMessage);
        }
        setLoading(false);
      });
    } catch (err) {
      const errorMessage = err?.message || err?.toString() || 'Unknown error';
      console.error('[QuestionBankManager] Error setting up questions listener:', {
        error: err,
        message: errorMessage,
        userId
      });
      setError('Failed to set up questions listener: ' + errorMessage);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, db, currentAppId, externalQuestions]);

  // Load shared questions (only if admin and not provided externally)
  useEffect(() => {
    if (externalSharedQuestions !== null) {
      setSharedQuestions(externalSharedQuestions);
      return;
    }

    if (!isAdmin || !db) return;

    const sharedRef = collection(db, 'artifacts', currentAppId, 'sharedQuestionBank');

    // Query without orderBy to avoid index requirements
    console.log('[QuestionBankManager] Loading shared questions');
    const unsubscribe = onSnapshot(sharedRef, (snapshot) => {
      console.log(`[QuestionBankManager] Loaded ${snapshot.size} shared questions`);
      // Spread doc data first, then override id/collection to ensure
      // Firestore doc.id is always used, even if the document
      // contains an "id" field copied from the teacher question.
      const questionsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        collection: 'sharedQuestionBank'
      }));

      // Sort client-side by addedAt or createdAt
      questionsData.sort((a, b) => {
        const timeFieldA = a.addedAt || a.createdAt;
        const timeFieldB = b.addedAt || b.createdAt;
        if (timeFieldA && timeFieldB) {
          const timeA = timeFieldA.toDate ? timeFieldA.toDate() : new Date(timeFieldA);
          const timeB = timeFieldB.toDate ? timeFieldB.toDate() : new Date(timeFieldB);
          return timeB - timeA; // desc
        }
        return 0;
      });

      // Deduplicate by ID to prevent duplicate keys in React
      const uniqueQuestions = Array.from(new Map(questionsData.map(q => [q.id, q])).values());
      setSharedQuestions(uniqueQuestions);
    }, (err) => {
      const errorMessage = err?.message || err?.toString() || 'Unknown error';
      console.error('[QuestionBankManager] Error loading shared questions:', {
        error: err,
        code: err?.code,
        message: errorMessage
      });

      // Check if this is a missing index error
      if (errorMessage.toLowerCase().includes('index') || errorMessage.toLowerCase().includes('requires an index')) {
        setError('Database index required for shared questions. Please check the browser console for the index creation link.');
      } else {
        // Don't overwrite existing error, just log it
        console.warn('[QuestionBankManager] Shared questions failed to load but continuing with other questions');
      }
    });

    return () => unsubscribe();
  }, [isAdmin, db, currentAppId, externalSharedQuestions]);

  // Group questions by source or teacher+source
  const groupQuestionsBySource = (questionsList) => {
    const grouped = {};
    questionsList.forEach(q => {
      let key;
      if (groupingMode === 'teacher-source') {
        const source = q.pdfSource || q.source || 'Unknown Source';
        key = `${q.userId || 'unknown'}_${source}`;
        if (!grouped[key]) {
          grouped[key] = {
            teacherId: q.userId,
            teacherName: q.teacherName || 'Unknown Teacher',
            teacherEmail: q.teacherEmail,
            source: source,
            questions: []
          };
        }
        grouped[key].questions.push(q);
      } else {
        const source = q.pdfSource || q.source || 'Unknown Source';
        if (!grouped[source]) {
          grouped[source] = [];
        }
        grouped[source].push(q);
      }
    });
    return grouped;
  };

  // Determine which questions to show based on view mode
  const questionsToShow = (() => {
    if (isAdmin && showViewModeTabs) {
      if (internalViewMode === 'teachers') return questions;
      if (internalViewMode === 'shared') return sharedQuestions;
      return questions; // For 'all', show teacher questions in grouped view, shared separately
    }
    return questions;
  })();

  // Filter questions (only filter teacher questions, shared questions filtered separately)
  const filteredQuestions = questionsToShow.filter(q => {
    if (filterTopic && q.topic !== filterTopic) return false;
    if (filterGrade && q.grade !== filterGrade) return false;
    if (filterType && q.questionType !== filterType) return false;
    if (filterHasImage) {
      const hasImage = q.images && q.images.length > 0;
      if (filterHasImage === 'yes' && !hasImage) return false;
      if (filterHasImage === 'no' && hasImage) return false;
    }
    if (filterSource) {
      const source = q.pdfSource || q.source || 'Unknown Source';
      if (source !== filterSource) return false;
    }
    if (isAdmin && filterTeacher && q.userId !== filterTeacher) return false;
    
    if (searchQuery) {
      if (isRegexMode) {
        try {
          const regex = new RegExp(searchQuery, 'i');
          return (
            regex.test(q.question || '') ||
            regex.test(q.topic || '') ||
            regex.test(q.concept || '') ||
            regex.test(q.standard || '')
          );
        } catch (e) {
          return false;
        }
      }
      const query = searchQuery.toLowerCase();
      return (
        (q.question || '').toLowerCase().includes(query) ||
        (q.topic || '').toLowerCase().includes(query) ||
        (q.concept || '').toLowerCase().includes(query) ||
        (q.standard || '').toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const groupedQuestions = groupQuestionsBySource(filteredQuestions);
  const sources = Object.keys(groupedQuestions).sort((a, b) => {
    const aQuestions = groupingMode === 'teacher-source' ? groupedQuestions[a].questions : groupedQuestions[a];
    const bQuestions = groupingMode === 'teacher-source' ? groupedQuestions[b].questions : groupedQuestions[b];
    const aDate = aQuestions[0]?.createdAt?.toDate?.() || new Date(0);
    const bDate = bQuestions[0]?.createdAt?.toDate?.() || new Date(0);
    return bDate - aDate; // Newest first
  });

  // Pagination for Teacher Questions (Sources)
  const totalPages = Math.ceil(sources.length / itemsPerPage);
  const paginatedSources = sources.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Filter and Pagination for Shared Questions
  const filteredSharedQuestions = sharedQuestions.filter(q => {
    if (filterTopic && q.topic !== filterTopic) return false;
    if (filterGrade && q.grade !== filterGrade) return false;
    if (filterType && q.questionType !== filterType) return false;
    if (filterHasImage) {
      const hasImage = q.images && q.images.length > 0;
      if (filterHasImage === 'yes' && !hasImage) return false;
      if (filterHasImage === 'no' && hasImage) return false;
    }
    if (searchQuery) {
      if (isRegexMode) {
        try {
          const regex = new RegExp(searchQuery, 'i');
          return (
            regex.test(q.question || '') ||
            regex.test(q.topic || '') ||
            regex.test(q.concept || '') ||
            regex.test(q.standard || '')
          );
        } catch (e) {
          return false;
        }
      }
      const query = searchQuery.toLowerCase();
      return (
        (q.question || '').toLowerCase().includes(query) ||
        (q.topic || '').toLowerCase().includes(query) ||
        (q.concept || '').toLowerCase().includes(query) ||
        (q.standard || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalSharedPages = Math.ceil(filteredSharedQuestions.length / itemsPerPage);
  const paginatedSharedQuestions = filteredSharedQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSourceExpansion = (source) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(source)) {
      newExpanded.delete(source);
    } else {
      newExpanded.add(source);
    }
    setExpandedSources(newExpanded);
  };

  const toggleQuestionSelection = (questionId) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const selectAllInSource = (source) => {
    const sourceQuestions = groupingMode === 'teacher-source'
      ? (groupedQuestions[source]?.questions || [])
      : (groupedQuestions[source] || []);
    const newSelected = new Set(selectedQuestions);
    
    // Check if all questions in this source are already selected
    const allSelected = sourceQuestions.every(q => selectedQuestions.has(q.id));
    
    if (allSelected) {
      // Deselect all questions in this source
      sourceQuestions.forEach(q => newSelected.delete(q.id));
    } else {
      // Select all questions in this source
      sourceQuestions.forEach(q => newSelected.add(q.id));
    }
    
    setSelectedQuestions(newSelected);
  };
  
  const isAllSelectedInSource = (source) => {
    const sourceQuestions = groupingMode === 'teacher-source'
      ? (groupedQuestions[source]?.questions || [])
      : (groupedQuestions[source] || []);
    return sourceQuestions.length > 0 && sourceQuestions.every(q => selectedQuestions.has(q.id));
  };

  const selectAllSharedOnPage = () => {
    const newSelected = new Set(selectedQuestions);
    
    // Check if all shared questions on current page are already selected
    const allSelected = paginatedSharedQuestions.length > 0 && 
      paginatedSharedQuestions.every(q => selectedQuestions.has(q.id));
    
    if (allSelected) {
      // Deselect all shared questions on current page
      paginatedSharedQuestions.forEach(q => newSelected.delete(q.id));
    } else {
      // Select all shared questions on current page
      paginatedSharedQuestions.forEach(q => newSelected.add(q.id));
    }
    
    setSelectedQuestions(newSelected);
  };

  const isAllSharedOnPageSelected = () => {
    return paginatedSharedQuestions.length > 0 && 
      paginatedSharedQuestions.every(q => selectedQuestions.has(q.id));
  };

  const handleAssignToClass = async () => {
    const questionsToAssign = pendingAssignmentQuestions.size > 0 ? pendingAssignmentQuestions : selectedQuestions;
    if (!selectedClassForAssignment || questionsToAssign.size === 0) return;

    // Use custom handler if provided (for admin mode)
    if (onAssignToClass) {
      await onAssignToClass(questionsToAssign, selectedClassForAssignment);
      setShowAssignModal(false);
      setSelectedClassForAssignment('');
      setPendingAssignmentQuestions(new Set());
      if (questionsToAssign === selectedQuestions) {
        setSelectedQuestions(new Set());
      }
      return;
    }

    // Default handler for teacher mode - create reference documents in class
    try {
      const updates = [];
      for (const questionId of questionsToAssign) {
        const question = questionsToShow.find(q => q.id === questionId);
        if (!question) continue;

        const isDrawingQuestion = question.questionType === 'drawing';

        // Create a reference document in the class questions subcollection
        // Use the same questionId to maintain consistency
        const classQuestionRef = doc(db, 'artifacts', currentAppId, 'classes', selectedClassForAssignment, 'questions', questionId);

        const classQuestionData = {
          // Reference information
          questionBankRef: `artifacts/${currentAppId}/users/${userId}/questionBank/${questionId}`,
          teacherId: userId,
          assignedAt: new Date(),

          // Essential question data (for querying and display)
          topic: question.topic,
          grade: question.grade,
          question: question.question,
          questionType: question.questionType || 'multiple-choice',
          hint: question.hint || '',
          standard: question.standard || '',
          concept: question.concept || '',
          images: question.images || [],
          source: question.source || 'questionBank',
          pdfSource: question.pdfSource || '',
          createdAt: question.createdAt || new Date()
        };

        // Only include correctAnswer and options for non-drawing questions
        if (!isDrawingQuestion) {
          classQuestionData.correctAnswer = question.correctAnswer;
          classQuestionData.options = question.options;
        }

        // Store reference information and essential question data
        updates.push(
          setDoc(classQuestionRef, classQuestionData, { merge: true })
        );

        // Also update the assignedClasses array in the original question for tracking
        const questionRef = doc(db, 'artifacts', currentAppId, 'users', userId, 'questionBank', questionId);
        const currentAssignedClasses = [...new Set(question?.assignedClasses || [])];
        if (!currentAssignedClasses.includes(selectedClassForAssignment)) {
          updates.push(
            updateDoc(questionRef, {
              assignedClasses: [...currentAssignedClasses, selectedClassForAssignment]
            })
          );
        }
      }

      await Promise.all(updates);

      // Clear cache for affected class/topic/grade combinations
      const affectedCombinations = new Set();
      for (const questionId of questionsToAssign) {
        const question = questionsToShow.find(q => q.id === questionId);
        if (question && question.topic && question.grade) {
          affectedCombinations.add(`${question.topic}_${question.grade}`);
        }
      }

      affectedCombinations.forEach(combo => {
        const [topic, grade] = combo.split('_');
        clearCachedClassQuestions(selectedClassForAssignment, topic, grade, currentAppId);
      });
      setShowAssignModal(false);
      setSelectedClassForAssignment('');
      setPendingAssignmentQuestions(new Set());
      if (questionsToAssign === selectedQuestions) {
        setSelectedQuestions(new Set());
      }
    } catch (err) {
      console.error('Error assigning questions to class:', err);
      setError('Failed to assign questions to class');
    }
  };

  const handleUnassignFromClass = async (questionId, classId) => {
    try {
      let question = questionsToShow.find(q => q.id === questionId);
      if (!question) {
        question = questions.find(q => q.id === questionId) || sharedQuestions.find(q => q.id === questionId);
      }
      
      const currentAssignedClasses = (question?.assignedClasses || []).filter(id => id !== classId);

      // Remove the reference document from class questions subcollection
      const classQuestionRef = doc(db, 'artifacts', currentAppId, 'classes', classId, 'questions', questionId);
      await deleteDoc(classQuestionRef);

      // Update the assignedClasses array in the original question
      if (question?.collection === 'sharedQuestionBank') {
        const questionRef = doc(db, 'artifacts', currentAppId, 'sharedQuestionBank', questionId);
        await updateDoc(questionRef, {
          assignedClasses: currentAssignedClasses
        });
      } else {
        const questionUserId = question?.userId || userId;
        const questionRef = doc(db, 'artifacts', currentAppId, 'users', questionUserId, 'questionBank', questionId);
        await updateDoc(questionRef, {
          assignedClasses: currentAssignedClasses
        });
      }

      // Clear cache for this class/topic/grade combination
      if (question?.topic && question?.grade) {
        clearCachedClassQuestions(classId, question.topic, question.grade, currentAppId);
      }
    } catch (err) {
      console.error('Error unassigning question from class:', err);
      setError('Failed to unassign question from class');
    }
  };

  const handleDeleteQuestions = async (idsToDelete = null) => {
    // If called from event, idsToDelete might be the event object
    let targetIds = selectedQuestions;
    if (idsToDelete && (idsToDelete instanceof Set || Array.isArray(idsToDelete))) {
      targetIds = idsToDelete instanceof Set ? idsToDelete : new Set(idsToDelete);
    }

    console.log('[QuestionBankManager] handleDeleteQuestions called');

    if (targetIds.size === 0) return;

    console.log('[QuestionBankManager] Showing confirm dialog');
    if (!window.confirm(`Are you sure you want to delete ${targetIds.size} question(s)?`)) {
      console.log('[QuestionBankManager] Delete cancelled by user');
      return;
    }
    console.log('[QuestionBankManager] Delete confirmed');

    // Use custom handler if provided (for admin mode)
    if (onDeleteQuestion) {
      console.log('[QuestionBankManager] Calling onDeleteQuestion (admin mode)');
      await onDeleteQuestion(targetIds);
      if (targetIds === selectedQuestions) {
        setSelectedQuestions(new Set());
      } else {
        const newSelected = new Set(selectedQuestions);
        targetIds.forEach(id => newSelected.delete(id));
        setSelectedQuestions(newSelected);
      }
      return;
    }

    // Default handler for teacher mode
    try {
      console.log('[QuestionBankManager] Deleting questions (teacher mode)');
      const deletes = Array.from(targetIds).map(questionId => {
        const questionRef = doc(db, 'artifacts', currentAppId, 'users', userId, 'questionBank', questionId);
        return deleteDoc(questionRef);
      });

      await Promise.all(deletes);
      
      if (targetIds === selectedQuestions) {
        setSelectedQuestions(new Set());
      } else {
        const newSelected = new Set(selectedQuestions);
        targetIds.forEach(id => newSelected.delete(id));
        setSelectedQuestions(newSelected);
      }
      console.log('[QuestionBankManager] Questions deleted successfully');
    } catch (err) {
      console.error('Error deleting questions:', err);
      setError('Failed to delete questions');
    }
  };

  const handleSaveEditedQuestion = async (updatedQuestion) => {
    try {
      // Use custom handler if provided (for admin mode)
      if (onEditQuestion) {
        await onEditQuestion(updatedQuestion);
        setEditingQuestion(null);
        return;
      }

      // Default handler for teacher mode
      const questionRef = doc(db, 'artifacts', currentAppId, 'users', userId, 'questionBank', updatedQuestion.id);

      // Remove id from data to be saved
      const { id, ...dataToSave } = updatedQuestion;

      // Deduplicate assignedClasses
      const uniqueAssignedClasses = [...new Set(dataToSave.assignedClasses || [])];

      // Prepare clean data based on question type
      const isDrawingQuestion = dataToSave.questionType === 'drawing';
      const cleanData = {
        ...dataToSave,
        assignedClasses: uniqueAssignedClasses,
        updatedAt: new Date()
      };

      // Remove correctAnswer and options for drawing questions
      if (isDrawingQuestion) {
        cleanData.correctAnswer = deleteField();
        cleanData.options = deleteField();
      }

      await updateDoc(questionRef, cleanData);

      // Also update any class references
      if (uniqueAssignedClasses.length > 0) {
        const updates = uniqueAssignedClasses.map(classId => {
          const classQuestionRef = doc(db, 'artifacts', currentAppId, 'classes', classId, 'questions', updatedQuestion.id);
          const classData = {
            topic: updatedQuestion.topic,
            grade: updatedQuestion.grade,
            question: updatedQuestion.question,
            questionType: updatedQuestion.questionType || 'multiple-choice',
            hint: updatedQuestion.hint || '',
            standard: updatedQuestion.standard || '',
            concept: updatedQuestion.concept || '',
            images: updatedQuestion.images || [],
          };

          // Only include correctAnswer and options for non-drawing questions
          if (!isDrawingQuestion) {
            classData.correctAnswer = updatedQuestion.correctAnswer;
            classData.options = updatedQuestion.options;
          }

          return setDoc(classQuestionRef, classData, { merge: true });
        });
        await Promise.all(updates);

        // Clear cache
        const affectedCombinations = new Set();
        if (updatedQuestion.topic && updatedQuestion.grade) {
          affectedCombinations.add(`${updatedQuestion.topic}_${updatedQuestion.grade}`);
        }

        uniqueAssignedClasses.forEach(classId => {
          affectedCombinations.forEach(combo => {
            const [topic, grade] = combo.split('_');
            clearCachedClassQuestions(classId, topic, grade, currentAppId);
          });
        });
      }

      setEditingQuestion(null);
    } catch (err) {
      console.error('Error updating question:', err);
      throw err; // Propagate to modal to show error
    }
  };

  const getClassNames = (assignedClasses) => {
    if (!assignedClasses || assignedClasses.length === 0) return [];
    // Deduplicate assignedClasses
    const uniqueAssignedClasses = [...new Set(assignedClasses)];
    return uniqueAssignedClasses.map(classId => {
      const classData = classes.find(c => c.id === classId);
      return classData ? { id: classId, name: classData.name } : { id: classId, name: 'Unknown Class' };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={questionContainerRef}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="mt-2 text-sm text-red-600 hover:text-red-800">
            Dismiss
          </button>
        </div>
      )}

      {/* View Mode Tabs (Admin only) */}
      {showViewModeTabs && isAdmin && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setInternalViewMode('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${internalViewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All Questions
            </button>
            <button
              onClick={() => setInternalViewMode('teachers')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${internalViewMode === 'teachers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Teacher Questions ({questions.length})
            </button>
            <button
              onClick={() => setInternalViewMode('shared')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${internalViewMode === 'shared' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Shared Bank ({sharedQuestions.length})
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search questions by text, topic, concept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="regex-mode"
              type="checkbox"
              checked={isRegexMode}
              onChange={(e) => setIsRegexMode(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="regex-mode" className="ml-2 block text-sm text-gray-900">
              Use Regular Expressions
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Topics</option>
                {topicOptions.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Grades</option>
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="numeric">Numeric</option>
                <option value="drawing">Drawing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <select
                value={filterHasImage}
                onChange={(e) => setFilterHasImage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All</option>
                <option value="yes">Has Image</option>
                <option value="no">No Image</option>
              </select>
            </div>
            {isAdmin && internalViewMode !== 'shared' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Teachers</option>
                  {allTeachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Sources</option>
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Bulk Actions */}
      {selectedQuestions.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedQuestions.size} question(s) selected
          </span>
          <div className="flex space-x-2">
            {isAdmin && internalViewMode === 'teachers' && onAddToSharedBank && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!window.confirm(`Are you sure you want to add ${selectedQuestions.size} question(s) to shared bank?`)) {
                    return;
                  }
                  try {
                    await onAddToSharedBank(selectedQuestions);
                    setSelectedQuestions(new Set());
                  } catch (err) {
                    if (err.message !== 'Cancelled') {
                      console.error('Error adding to shared bank:', err);
                      setError('Failed to add questions to shared bank');
                    }
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Add to Shared Bank</span>
              </button>
            )}
            {isAdmin && internalViewMode === 'shared' && onRemoveFromSharedBank && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!window.confirm(`Are you sure you want to remove ${selectedQuestions.size} question(s) from shared bank?`)) {
                    return;
                  }
                  try {
                    await onRemoveFromSharedBank(selectedQuestions);
                    setSelectedQuestions(new Set());
                  } catch (err) {
                    if (err.message !== 'Cancelled') {
                      console.error('Error removing from shared bank:', err);
                      setError('Failed to remove questions from shared bank');
                    }
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove from Shared Bank</span>
              </button>
            )}
            <button
              onClick={() => {
                setPendingAssignmentQuestions(selectedQuestions);
                setShowAssignModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Assign to Class</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteQuestions(selectedQuestions);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Teacher Questions Grouped by Source */}
      {(!isAdmin || internalViewMode !== 'shared') && (
        <div className="space-y-4">
          {isAdmin && showViewModeTabs && internalViewMode === 'all' && (
            <h2 className="text-xl font-semibold text-gray-900">Teacher Questions</h2>
          )}
          {paginatedSources.length === 0 && (!isAdmin || internalViewMode !== 'all' || sharedQuestions.length === 0) ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No questions found</p>
            </div>
          ) : paginatedSources.length > 0 ? (
            paginatedSources.map(source => {
              const sourceData = groupedQuestions[source];
              const sourceQuestions = groupingMode === 'teacher-source' ? sourceData.questions : sourceData;
              const isExpanded = expandedSources.has(source);
              const sourceDate = sourceQuestions[0]?.createdAt?.toDate?.() || new Date();

              return (
                <div key={source} className="bg-white border border-gray-200 rounded-lg">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                    onClick={() => toggleSourceExpansion(source)}
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      )}
                      <div>
                        {groupingMode === 'teacher-source' ? (
                          <>
                            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                              <UserIcon className="h-4 w-4" />
                              <span>{sourceData.teacherName}</span>
                            </h3>
                            <p className="text-sm text-gray-600">
                              {sourceData.source} • {sourceQuestions.length} question(s) • {sourceDate.toLocaleDateString()}
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900">{source}</h3>
                            <p className="text-sm text-gray-600">
                              {sourceQuestions.length} question(s) • {sourceDate.toLocaleDateString()}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <label 
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelectedInSource(source)}
                        onChange={() => selectAllInSource(source)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Select All</span>
                    </label>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 divide-y divide-gray-200">
                      {sourceQuestions.map(question => {
                        const assignedClasses = getClassNames(question.assignedClasses);
                        const isSelected = selectedQuestions.has(question.id);

                        return (
                          <div
                            key={question.id}
                            className={`p-4 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleQuestionSelection(question.id)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  {question.question}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                                  <span className="px-2 py-1 bg-gray-100 rounded">{question.topic}</span>
                                  <span className="px-2 py-1 bg-gray-100 rounded">{question.grade}</span>
                                  {question.questionType && (
                                    <span className={`px-2 py-1 rounded ${question.questionType === 'drawing'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                      }`}>
                                      {question.questionType === 'drawing' ? '✏️ Drawing' :
                                        question.questionType === 'numeric' ? '🔢 Numeric' : '📝 Multiple Choice'}
                                    </span>
                                  )}
                                  {question.correctAnswer && question.questionType !== 'drawing' && (
                                    <span className="px-2 py-1 bg-green-100 rounded">
                                      Answer: {question.correctAnswer}
                                    </span>
                                  )}
                                </div>
                                {assignedClasses.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {assignedClasses.map(classInfo => (
                                      <span
                                        key={classInfo.id}
                                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                      >
                                        <Users className="h-3 w-3 mr-1" />
                                        {classInfo.name}
                                        <button
                                          onClick={() => handleUnassignFromClass(question.id, classInfo.id)}
                                          className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {question.options && question.options.length > 0 && (
                                  <div className="text-xs text-gray-600">
                                    <strong>Options:</strong> {question.options.join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center ml-2 space-x-1">
                                <button
                                  onClick={() => setEditingQuestion(question)}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                  title="Edit Question"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setPendingAssignmentQuestions(new Set([question.id]));
                                    setShowAssignModal(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                  title="Assign to Class"
                                >
                                  <Users className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestions([question.id])}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                  title="Delete Question"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                  }
                </div>
              );
            })
          ) : null}
          
          {/* Pagination Controls for Teacher Questions */}
          {sources.length > itemsPerPage && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, sources.length)}</span> of <span className="font-medium">{sources.length}</span> sources
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === currentPage
                            ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )
      }

      {/* Shared Questions (Admin mode, when viewing shared or all) */}
      {
        isAdmin && showViewModeTabs && internalViewMode !== 'teachers' && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Shared Question Bank</h2>
              {paginatedSharedQuestions.length > 0 && (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllSharedOnPageSelected()}
                    onChange={selectAllSharedOnPage}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Select All on Page</span>
                </label>
              )}
            </div>
            {paginatedSharedQuestions.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No shared questions found</p>
              </div>
            ) : (
              <>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {paginatedSharedQuestions.map(question => {
                  const assignedClasses = getClassNames(question.assignedClasses);
                  const isSelected = selectedQuestions.has(question.id);

                  return (
                    <div
                      key={question.id}
                      className={`p-4 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleQuestionSelection(question.id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {question.question}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                            <span className="px-2 py-1 bg-gray-100 rounded">{question.topic}</span>
                            <span className="px-2 py-1 bg-gray-100 rounded">{question.grade}</span>
                            {question.questionType && (
                              <span className={`px-2 py-1 rounded ${question.questionType === 'drawing'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                                }`}>
                                {question.questionType === 'drawing' ? '✏️ Drawing' :
                                  question.questionType === 'numeric' ? '🔢 Numeric' : '📝 Multiple Choice'}
                              </span>
                            )}
                            {question.correctAnswer && question.questionType !== 'drawing' && (
                              <span className="px-2 py-1 bg-green-100 rounded">
                                Answer: {question.correctAnswer}
                              </span>
                            )}
                          </div>
                          {assignedClasses.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {assignedClasses.map(classInfo => (
                                <span
                                  key={classInfo.id}
                                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  {classInfo.name}
                                  <button
                                    onClick={() => handleUnassignFromClass(question.id, classInfo.id)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                        </div>
                        <div className="flex items-center ml-2 space-x-1">
                          <button
                            onClick={() => setEditingQuestion(question)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                            title="Edit Question"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setPendingAssignmentQuestions(new Set([question.id]));
                              setShowAssignModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                            title="Assign to Class"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestions([question.id])}
                            className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Pagination Controls for Shared Questions */}
              {filteredSharedQuestions.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg mt-4">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalSharedPages))}
                      disabled={currentPage === totalSharedPages}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredSharedQuestions.length)}</span> of <span className="font-medium">{filteredSharedQuestions.length}</span> questions
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {Array.from({ length: totalSharedPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              page === currentPage
                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalSharedPages))}
                          disabled={currentPage === totalSharedPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        )
      }

      {/* Assign to Class Modal */}
      {
        showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Questions to Class</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                <select
                  value={selectedClassForAssignment}
                  onChange={(e) => setSelectedClassForAssignment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a class</option>
                  {classes.map(classItem => (
                    <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedClassForAssignment('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignToClass}
                  disabled={!selectedClassForAssignment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Edit Question Modal */}
      {
        editingQuestion && (
          <EditQuestionModal
            question={editingQuestion}
            onSave={handleSaveEditedQuestion}
            onCancel={() => setEditingQuestion(null)}
          />
        )
      }
    </div >
  );
};

export default QuestionBankManager;

