# Firestore Data Model Documentation

This document describes the Firestore data model for the application.

The entire data model is stored under a top-level collection named `artifacts`. Within this collection, data is further scoped by an `appId`. The general path structure is `artifacts/{appId}/{collection}/{documentId}`.

## Collections

### 1. `users`

This is the primary collection for all users within the application, including students, teachers, and admins.

-   **Path:** `artifacts/{appId}/users/{userId}`
-   **Document ID (`userId`):** The Firebase Authentication UID of the user.

Each user document contains a `profile` subcollection, which in turn contains a `main` document with the user's core profile information.

-   **Subcollection Path:** `artifacts/{appId}/users/{userId}/profile/main`

#### `main` Document Fields:

-   `displayName` (string): The user's display name.
-   `email` (string): The user's email address.
-   `role` (string): The user's role. Possible values are `'student'`, `'teacher'`, or `'admin'`.
-   `createdAt` (Timestamp): The timestamp when the user account was created.
-   `isAnonymous` (boolean): Indicates if the user is an anonymous user.
-   `needsPasswordReset` (boolean, optional): If `true`, it indicates that a newly created teacher needs to set their password for the first time.

### 2. `teachers`

This collection stores additional information specific to users with the `'teacher'` role. It appears to be a supplementary collection to the main `users` collection.

-   **Path:** `artifacts/{appId}/teachers/{teacherId}`
-   **Document ID (`teacherId`):** A sanitized version of the teacher's email address (e.g., `teacher_test_com` for `teacher@test.com`).

#### Document Fields:

-   `uid` (string): The Firebase Authentication UID of the teacher. This links back to the `users` collection.
-   `name` (string): The teacher's name.
-   `email` (string): The teacher's email address.
-   `classes` (array): An array of `classId` strings that the teacher manages.
-   `createdAt` (string): The ISO 8601 timestamp string of when the teacher profile was created.
-   `role` (string): Hardcoded to `'teacher'`.

### 3. `classes`

This collection contains all the classes created by teachers.

-   **Path:** `artifacts/{appId}/classes/{classId}`
-   **Document ID (`classId`):** An auto-generated unique ID.

#### Document Fields:

-   `teacherId` (string): The ID of the teacher who owns the class. This ID corresponds to the sanitized email ID from the `teachers` collection.
-   `name` (string): The name of the class (e.g., "Algebra 1").
-   `subject` (string): The subject of the class (e.g., "Math").
-   `gradeLevel` (string): The grade level for the class (e.g., "9th Grade").
-   `description` (string): A brief description of the class.
-   `period` (string, optional): The class period (e.g., "3rd Period").
-   `studentCount` (number): The number of students enrolled in the class. This is updated automatically when students are added or removed.
-   `createdAt` (Timestamp): The timestamp when the class was created.
-   `updatedAt` (Timestamp): The timestamp when the class was last updated.

### 4. `classStudents`

This collection serves as a many-to-many join table between the `classes` and `users` (specifically students) collections, managing student enrollments.

-   **Path:** `artifacts/{appId}/classStudents/{enrollmentId}`
-   **Document ID (`enrollmentId`):** An auto-generated unique ID for the enrollment record.

#### Document Fields:

-   `classId` (string): The ID of the class the student is enrolled in. This references a document in the `classes` collection.
-   `studentId` (string): The Firebase Authentication UID of the enrolled student. This references a document in the `users` collection.
-   `studentEmail` (string, optional): The student's email address.
-   `studentName` (string, optional): The student's name.
-   `joinedAt` (Timestamp): The timestamp when the student was enrolled in the class.
-   `progress` (number): A numerical value representing the student's progress in the class, initialized to `0`.

## Relationships between Collections

-   **Teacher ↔ Class (One-to-Many):**
    -   A `teacher` can have multiple `classes`.
    -   The relationship is defined by `classes.teacherId` which links to `teachers.teacherId`.
    -   The `teachers.classes` array also stores a list of `classId`s for a given teacher, though this is likely for quick lookups and may introduce data redundancy.

-   **Class ↔ Student (Many-to-Many):**
    -   A `class` can have many `students`, and a `student` can be enrolled in multiple `classes`.
    -   This relationship is managed through the `classStudents` collection. An enrollment document in `classStudents` links a `classId` to a `studentId`.

-   **User ↔ Teacher/Student Profile:**
    -   The `users` collection is the central authority for user identity.
    -   If `users.profile.main.role` is `'teacher'`, there is a corresponding document in the `teachers` collection linked by the `uid`.
    -   If `users.profile.main.role` is `'student'`, their enrollment in classes is tracked in the `classStudents` collection via their `studentId` (which is their UID).
