import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, orderBy, setDoc, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { BookOpen, Trash2, Users, Filter, X, CheckCircle, ChevronDown, ChevronUp, Share2, User as UserIcon } from 'lucide-react';
import { TOPICS } from '../constants/topics';

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
  showViewModeTabs = false
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
  const [expandedSources, setExpandedSources] = useState(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassForAssignment, setSelectedClassForAssignment] = useState('');
  const [internalViewMode, setInternalViewMode] = useState(viewMode || 'all');

  const db = getFirestore();
  const currentAppId = appId || 'default-app-id';

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
      console.log('Loading questions from questionBank for user:', userId);
      unsubscribe = onSnapshot(questionBankRef, (snapshot) => {
        console.log(`Loaded ${snapshot.size} questions from questionBank`);
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
      }, (err) => {
        console.error('Error loading questions:', err);
        setError('Failed to load questions: ' + err.message);
        setLoading(false);
      });
    } catch (err) {
      console.error('Error setting up questions listener:', err);
      setError('Failed to load questions: ' + err.message);
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
    const q = query(sharedRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        collection: 'sharedQuestionBank',
        ...doc.data()
      }));
      setSharedQuestions(questionsData);
    }, (err) => {
      console.error('Error loading shared questions:', err);
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
    if (filterSource) {
      const source = q.pdfSource || q.source || 'Unknown Source';
      if (source !== filterSource) return false;
    }
    if (isAdmin && filterTeacher && q.userId !== filterTeacher) return false;
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
    sourceQuestions.forEach(q => newSelected.add(q.id));
    setSelectedQuestions(newSelected);
  };

  const handleAssignToClass = async () => {
    if (!selectedClassForAssignment || selectedQuestions.size === 0) return;

    // Use custom handler if provided (for admin mode)
    if (onAssignToClass) {
      await onAssignToClass(selectedQuestions, selectedClassForAssignment);
      setShowAssignModal(false);
      setSelectedClassForAssignment('');
      setSelectedQuestions(new Set());
      return;
    }

    // Default handler for teacher mode - create reference documents in class
    try {
      const updates = [];
      for (const questionId of selectedQuestions) {
        const question = questionsToShow.find(q => q.id === questionId);
        if (!question) continue;

        // Create a reference document in the class questions subcollection
        // Use the same questionId to maintain consistency
        const classQuestionRef = doc(db, 'artifacts', currentAppId, 'classes', selectedClassForAssignment, 'questions', questionId);
        
        // Store reference information and essential question data
        updates.push(
          setDoc(classQuestionRef, {
            // Reference information
            questionBankRef: `artifacts/${currentAppId}/users/${userId}/questionBank/${questionId}`,
            teacherId: userId,
            assignedAt: new Date(),
            
            // Essential question data (for querying and display)
            topic: question.topic,
            grade: question.grade,
            question: question.question,
            correctAnswer: question.correctAnswer,
            options: question.options,
            hint: question.hint || '',
            standard: question.standard || '',
            concept: question.concept || '',
            images: question.images || [],
            source: question.source || 'questionBank',
            pdfSource: question.pdfSource || '',
            createdAt: question.createdAt || new Date()
          }, { merge: true })
        );

        // Also update the assignedClasses array in the original question for tracking
        const questionRef = doc(db, 'artifacts', currentAppId, 'users', userId, 'questionBank', questionId);
        const currentAssignedClasses = question?.assignedClasses || [];
        if (!currentAssignedClasses.includes(selectedClassForAssignment)) {
          updates.push(
            updateDoc(questionRef, {
              assignedClasses: [...currentAssignedClasses, selectedClassForAssignment]
            })
          );
        }
      }

      await Promise.all(updates);
      setShowAssignModal(false);
      setSelectedClassForAssignment('');
      setSelectedQuestions(new Set());
    } catch (err) {
      console.error('Error assigning questions to class:', err);
      setError('Failed to assign questions to class');
    }
  };

  const handleUnassignFromClass = async (questionId, classId) => {
    try {
      const question = questionsToShow.find(q => q.id === questionId);
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
    } catch (err) {
      console.error('Error unassigning question from class:', err);
      setError('Failed to unassign question from class');
    }
  };

  const handleDeleteQuestions = async () => {
    if (selectedQuestions.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedQuestions.size} question(s)?`)) return;

    // Use custom handler if provided (for admin mode)
    if (onDeleteQuestion) {
      await onDeleteQuestion(selectedQuestions);
      setSelectedQuestions(new Set());
      return;
    }

    // Default handler for teacher mode
    try {
      const deletes = Array.from(selectedQuestions).map(questionId => {
        const questionRef = doc(db, 'artifacts', currentAppId, 'users', userId, 'questionBank', questionId);
        return deleteDoc(questionRef);
      });

      await Promise.all(deletes);
      setSelectedQuestions(new Set());
    } catch (err) {
      console.error('Error deleting questions:', err);
      setError('Failed to delete questions');
    }
  };

  const getClassNames = (assignedClasses) => {
    if (!assignedClasses || assignedClasses.length === 0) return [];
    return assignedClasses.map(classId => {
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
    <div className="space-y-6">
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
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                internalViewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Questions
            </button>
            <button
              onClick={() => setInternalViewMode('teachers')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                internalViewMode === 'teachers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Teacher Questions ({questions.length})
            </button>
            <button
              onClick={() => setInternalViewMode('shared')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                internalViewMode === 'shared' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Shared Bank ({sharedQuestions.length})
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Bulk Actions */}
      {selectedQuestions.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedQuestions.size} question(s) selected
          </span>
          <div className="flex space-x-2">
            {isAdmin && internalViewMode === 'teachers' && onAddToSharedBank && (
              <button
                onClick={async () => {
                  await onAddToSharedBank(selectedQuestions);
                  setSelectedQuestions(new Set());
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Add to Shared Bank</span>
              </button>
            )}
            {isAdmin && internalViewMode === 'shared' && onRemoveFromSharedBank && (
              <button
                onClick={async () => {
                  await onRemoveFromSharedBank(selectedQuestions);
                  setSelectedQuestions(new Set());
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove from Shared Bank</span>
              </button>
            )}
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Assign to Class</span>
            </button>
            <button
              onClick={handleDeleteQuestions}
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
          {sources.length === 0 && (!isAdmin || internalViewMode !== 'all' || sharedQuestions.length === 0) ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No questions found</p>
            </div>
          ) : sources.length > 0 ? (
          sources.map(source => {
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAllInSource(source);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
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
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 mb-1">
                                    {question.question}
                                  </p>
                                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                    <span className="px-2 py-1 bg-gray-100 rounded">{question.topic}</span>
                                    <span className="px-2 py-1 bg-gray-100 rounded">{question.grade}</span>
                                    {question.correctAnswer && (
                                      <span className="px-2 py-1 bg-green-100 rounded">
                                        Answer: {question.correctAnswer}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {assignedClasses.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {assignedClasses.map(classInfo => (
                                    <span
                                      key={classInfo.id}
                                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                    >
                                      <Users className="h-3 w-3 mr-1" />
                                      {classInfo.name}
                                      {!isAdmin && (
                                        <button
                                          onClick={() => handleUnassignFromClass(question.id, classInfo.id)}
                                          className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {question.options && question.options.length > 0 && (
                                <div className="mt-2 text-xs text-gray-600">
                                  <strong>Options:</strong> {question.options.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
          ) : null}
        </div>
      )}

      {/* Shared Questions (Admin mode, when viewing shared or all) */}
      {isAdmin && showViewModeTabs && internalViewMode !== 'teachers' && (
        <div className="space-y-4 mt-6">
          <h2 className="text-xl font-semibold text-gray-900">Shared Question Bank</h2>
          {sharedQuestions.filter(q => {
            if (filterTopic && q.topic !== filterTopic) return false;
            if (filterGrade && q.grade !== filterGrade) return false;
            return true;
          }).length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No shared questions found</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
              {sharedQuestions.filter(q => {
                if (filterTopic && q.topic !== filterTopic) return false;
                if (filterGrade && q.grade !== filterGrade) return false;
                return true;
              }).map(question => {
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
                        {question.correctAnswer && (
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
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assign to Class Modal */}
      {showAssignModal && (
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
      )}
    </div>
  );
};

export default QuestionBankManager;

