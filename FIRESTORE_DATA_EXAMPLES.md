# Firestore Data Model - Examples and Sample Data

This document provides concrete examples of data structures used in the Math Whiz App Firestore database.

## Sample Data Hierarchy

```
artifacts/
├── default-app-id/
    ├── users/
    │   ├── student123/                    # Student user document
    │   ├── teacher456/                    # Teacher user document
    │   └── admin789/                      # Admin user document
    ├── classes/
    │   ├── class_001/                     # Math class document
    │   └── class_002/                     # Another class document
    ├── classStudents/
    │   ├── enrollment_001/                # Student enrollment record
    │   └── enrollment_002/                # Another enrollment record
    └── teachers/
        ├── teacher_jane_doe_gmail_com/    # Teacher profile
        └── teacher_john_smith_school_edu/ # Another teacher profile
```

## Sample Documents

### 1. Student User Document

**Path**: `/artifacts/default-app-id/users/student123`

```json
{
  "id": "student123",
  "email": "sarah.student@email.com",
  "displayName": "Sarah Johnson",
  "role": "student",
  "isAnonymous": false,
  "classId": "class_001",
  "createdAt": "2024-01-15T10:30:00Z",
  "answeredQuestions": [
    {
      "questionId": "q_001",
      "topic": "addition",
      "difficulty": 2,
      "isCorrect": true,
      "date": "2024-01-20",
      "timestamp": "2024-01-20T14:25:30Z",
      "timeSpent": 12500,
      "complexity": 1.2
    },
    {
      "questionId": "q_002", 
      "topic": "subtraction",
      "difficulty": 3,
      "isCorrect": false,
      "date": "2024-01-20",
      "timestamp": "2024-01-20T14:27:15Z",
      "timeSpent": 18750,
      "complexity": 1.8
    }
  ],
  "topicMastery": {
    "addition": {
      "level": 3,
      "questionsAnswered": 15,
      "correctAnswers": 12,
      "lastUpdated": "2024-01-20T14:25:30Z"
    },
    "subtraction": {
      "level": 2,
      "questionsAnswered": 8,
      "correctAnswers": 5,
      "lastUpdated": "2024-01-20T14:27:15Z"
    }
  },
  "progressByGrade": {
    "2024-01-20": {
      "G3": {
        "addition": {
          "correct": 8,
          "incorrect": 2,
          "timeSpent": 125000
        },
        "subtraction": {
          "correct": 3,
          "incorrect": 2,
          "timeSpent": 98000
        }
      },
      "G4": {
        "fractions_4th": {
          "correct": 2,
          "incorrect": 1,
          "timeSpent": 45000
        }
      }
    }
  },
  "dailyGoalsByGrade": {
    "G3": {
      "addition": 10,
      "subtraction": 8,
      "multiplication": 6,
      "division": 6,
      "fractions": 5,
      "measurement_data": 4
    },
    "G4": {
      "operations_algebraic_thinking": 8,
      "base_ten": 6,
      "fractions_4th": 7,
      "measurement_data_4th": 5,
      "geometry": 4,
      "binary_addition": 3
    }
  },
  "pausedQuizzes": {
    "addition": {
      "questions": [
        {
          "question": "What is 5 + 3?",
          "options": ["6", "7", "8", "9"],
          "correct": 2,
          "explanation": "5 + 3 = 8"
        }
      ],
      "index": 0,
      "score": 0
    }
  },
  "lastAskedComplexityByTopic": {
    "addition": 1.2,
    "subtraction": 1.8,
    "multiplication": 0.9
  },
  "coins": 340,
  "ownedBackgrounds": ["default", "space", "underwater"],
  "activeBackground": "space",
  "dailyStories": {
    "2024-01-20": {
      "addition": {
        "story": "Sarah has 5 apples. Her friend gives her 3 more. How many apples does Sarah have now?",
        "cached": true
      }
    }
  },
  "totalCorrect": 17,
  "totalAnswered": 23,
  "currentStreak": 3,
  "longestStreak": 8,
  "points": 340,
  "preferredDifficulty": 2,
  "lastActiveDate": "2024-01-20"
}
```

### 2. Anonymous Student User Document

**Path**: `/artifacts/default-app-id/users/anonymous456`

```json
{
  "id": "anonymous456",
  "role": "student",
  "isAnonymous": true,
  "createdAt": "2024-01-20T16:45:00Z",
  "answeredQuestions": [
    {
      "questionId": "q_003",
      "topic": "multiplication",
      "difficulty": 1,
      "isCorrect": true,
      "date": "2024-01-20",
      "timestamp": "2024-01-20T16:50:00Z",
      "timeSpent": 8200,
      "complexity": 0.8
    }
  ],
  "totalCorrect": 1,
  "totalAnswered": 1,
  "currentStreak": 1,
  "longestStreak": 1,
  "points": 20,
  "lastActiveDate": "2024-01-20"
}
```

### 3. Teacher User Document

**Path**: `/artifacts/default-app-id/users/teacher456`

```json
{
  "id": "teacher456",
  "email": "jane.doe@school.edu",
  "displayName": "Jane Doe",
  "role": "teacher",
  "isAnonymous": false,
  "createdAt": "2024-01-10T08:00:00Z",
  "needsPasswordReset": false
}
```

### 4. Admin User Document

**Path**: `/artifacts/default-app-id/users/admin789`

```json
{
  "id": "admin789",
  "email": "admin@mathwhiz.com",
  "displayName": "System Administrator",
  "role": "admin",
  "isAnonymous": false,
  "isAdmin": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 5. Class Document

**Path**: `/artifacts/default-app-id/classes/class_001`

```json
{
  "id": "class_001",
  "teacherId": "teacher456",
  "name": "4th Grade Math - Room 201",
  "subject": "Mathematics",
  "gradeLevel": "4th Grade",
  "description": "Introduction to multiplication, division, and fractions",
  "period": "2nd Period",
  "createdAt": "2024-01-12T09:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "studentCount": 3
}
```

### 6. Class Student Enrollment Document

**Path**: `/artifacts/default-app-id/classStudents/enrollment_001`

```json
{
  "id": "enrollment_001",
  "classId": "class_001",
  "studentId": "student123",
  "studentEmail": "sarah.student@email.com",
  "studentName": "Sarah Johnson",
  "joinedAt": "2024-01-15T10:30:00Z",
  "progress": 75
}
```

### 7. Teacher Profile Document

**Path**: `/artifacts/default-app-id/teachers/teacher_jane_doe_school_edu`

```json
{
  "id": "teacher_jane_doe_school_edu",
  "uid": "teacher456",
  "name": "Jane Doe",
  "email": "jane.doe@school.edu",
  "role": "teacher",
  "classes": ["class_001", "class_002"],
  "createdAt": "2024-01-10T08:00:00Z",
  "needsPasswordReset": false
}
```

## Nested Profile Structure Examples

Some legacy data may be stored in nested subcollections:

### User Math Data Profile

**Path**: `/artifacts/default-app-id/users/student123/math_whiz_data/profile`

```json
{
  "id": "student123",
  "email": "sarah.student@email.com",
  "answeredQuestions": [...],
  "topicMastery": {...},
  "totalCorrect": 17,
  "totalAnswered": 23
}
```

### User Auth Profile

**Path**: `/artifacts/default-app-id/users/student123/profile/main`

```json
{
  "name": "Sarah Johnson",
  "displayName": "Sarah Johnson", 
  "email": "sarah.student@email.com",
  "role": "student",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Query Examples

### Get all students in a teacher's classes

```javascript
// 1. Get teacher's classes
const teacherClasses = await db
  .collection('artifacts/default-app-id/classes')
  .where('teacherId', '==', 'teacher456')
  .get();

const classIds = teacherClasses.docs.map(doc => doc.id);

// 2. Get all student enrollments for those classes
const enrollments = await db
  .collection('artifacts/default-app-id/classStudents')
  .where('classId', 'in', classIds)
  .get();

// 3. Get full student data
const studentIds = enrollments.docs.map(doc => doc.data().studentId);
const students = await Promise.all(
  studentIds.map(id => 
    db.doc(`artifacts/default-app-id/users/${id}`).get()
  )
);
```

### Get student progress for specific topics

```javascript
const studentDoc = await db
  .doc('artifacts/default-app-id/users/student123')
  .get();

const data = studentDoc.data();
const additionMastery = data.topicMastery?.addition;
const recentQuestions = data.answeredQuestions?.filter(q => 
  q.topic === 'addition' && 
  q.date === '2024-01-20'
);
```

### Update student progress after answering a question

```javascript
const userRef = db.doc('artifacts/default-app-id/users/student123');

await userRef.update({
  answeredQuestions: arrayUnion({
    questionId: 'q_004',
    topic: 'division',
    difficulty: 2,
    isCorrect: true,
    date: '2024-01-21',
    timestamp: new Date(),
    timeSpent: 15000,
    complexity: 1.5
  }),
  totalCorrect: increment(1),
  totalAnswered: increment(1),
  points: increment(25),
  lastActiveDate: '2024-01-21'
});
```

## Real-world Data Considerations

### Large Datasets
- Students with hundreds of answered questions
- Classes with 30+ students
- Teachers managing multiple classes

### Data Cleanup
- Remove old answered questions to prevent document size limits
- Archive inactive student data
- Aggregate statistics for reporting

### Performance Optimizations
- Use composite indexes for complex queries
- Implement pagination for large result sets
- Cache frequently accessed data

### Security Examples

Sample Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /artifacts/{appId}/users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Teachers can read their classes and students
    match /artifacts/{appId}/classes/{classId} {
      allow read, write: if request.auth != null && 
        resource.data.teacherId == request.auth.uid;
    }
    
    // Admins have full access
    match /artifacts/{appId}/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```