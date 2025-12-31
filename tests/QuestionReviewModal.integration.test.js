import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QUESTION_TYPES } from 'src/constants/topics';

// Mock firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'teacher123' } }))
}));

jest.mock('firebase/firestore', () => {
  const addDoc = jest.fn((ref, data) => { console.log('MOCK addDoc called', { ref, dataKeys: Object.keys(data || {}) }); return Promise.resolve({ id: 'newDocId' }); });
  const collection = jest.fn((db, ...paths) => { console.log('MOCK collection called', paths); return ({ _collectionPath: paths }); });
  const doc = jest.fn((db, ...paths) => { console.log('MOCK doc called', paths); return ({ _docPath: paths }); });
  const setDoc = jest.fn((docRef, data) => { console.log('MOCK setDoc called', { docRef, dataKeys: Object.keys(data || {}) }); return Promise.resolve(); });
  const getFirestore = jest.fn(() => ({ _db: true }));

  return {
    addDoc,
    collection,
    doc,
    setDoc,
    getFirestore,
  };
});

// Import mocked functions for assertions
const { addDoc, collection, doc, setDoc, getFirestore } = require('firebase/firestore');

// Mock question cache clear to avoid side effects
jest.mock('../../utils/questionCache', () => ({
  clearCachedClassQuestions: jest.fn()
}));

// Import component AFTER mocking firebase so that imports use mocks
const QuestionReviewModal = require('../QuestionReviewModal').default;

describe('QuestionReviewModal integration save flow', () => {
  beforeEach(() => {
    // Ensure auth mock returns a user
    const { getAuth } = require('firebase/auth');
    getAuth.mockReturnValue({ currentUser: { uid: 'teacher123' } });

    // Reset call history but keep/reinstate known implementations
    addDoc.mockClear();
    addDoc.mockImplementation((ref, data) => Promise.resolve({ id: 'newDocId' }));

    collection.mockClear();
    collection.mockImplementation((db, ...paths) => ({ _collectionPath: paths }));

    doc.mockClear();
    doc.mockImplementation((db, ...paths) => ({ _docPath: paths }));

    setDoc.mockClear();
    setDoc.mockImplementation((docRef, data) => Promise.resolve());

    getFirestore.mockClear();
    getFirestore.mockImplementation(() => ({ _db: true }));
  });

  test('saves fill-in-the-blanks and persists inputTypes to class doc', async () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();

    const question = {
      question: 'Divide. a. __ b. __',
      questionType: QUESTION_TYPES.FILL_IN_THE_BLANKS,
      correctAnswer: '63 ;; 2,141',
      topic: 'Base Ten',
      grade: 'G4',
      // note: no inputTypes provided initially
    };

    render(
      <QuestionReviewModal
        questions={[question]}
        fileName="test.pdf"
        classId="class123"
        appId="testApp"
        onSave={onSave}
        onCancel={onCancel}
        source="pdf-upload"
      />
    );

    // Click the Save button
    const saveButton = screen.getByRole('button', { name: /Save \d+ Question\(s\)/i });
    fireEvent.click(saveButton);

    // Wait for addDoc to be called and setDoc to be called for class reference
    await waitFor(() => expect(addDoc).toHaveBeenCalled());
    await waitFor(() => expect(setDoc).toHaveBeenCalled());

    // Inspect what was added to the question bank
    const addDocData = addDoc.mock.calls[0][1];
    expect(addDocData).toBeDefined();
    // inputTypes should be auto-detected (numeric for both answers)
    expect(Array.isArray(addDocData.inputTypes)).toBe(true);
    expect(addDocData.inputTypes).toEqual(['numeric', 'numeric']);

    // Inspect class question setDoc payload
    const setDocData = setDoc.mock.calls[0][1];
    expect(setDocData).toBeDefined();
    expect(Array.isArray(setDocData.inputTypes)).toBe(true);
    expect(setDocData.inputTypes).toEqual(['numeric', 'numeric']);

    // onSave should be called
    expect(onSave).toHaveBeenCalled();

    // Verify Firestore functions were called with expected path segments
    expect(collection).toHaveBeenCalledWith(expect.any(Object), 'artifacts', 'testApp', 'users', 'teacher123', 'questionBank');
    expect(doc).toHaveBeenCalledWith(expect.any(Object), 'artifacts', 'testApp', 'classes', 'class123', 'questions', 'newDocId');
  });
});
