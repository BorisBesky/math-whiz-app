# Project Plan: Teacher Dashboard

## Phase 1: Core Class & Student Management

**Objective:** Establish the basic functionality for teachers to organize their classes and students within the application.

**Features:**

* **Teacher Dashboard:**
  * A dedicated dashboard view for logged-in teachers.
  * Overview of all classes and students at a glance.
  * Login authentication and authorization to ensure only teachers can access this dashboard.

* **Create and Manage Classes:**
  * A dedicated dashboard view for logged-in teachers.
  * Functionality to create a new class (e.g., "Algebra 1 - Period 3").
  * A list view of all classes created by the teacher.
  * Ability to edit or delete existing classes.
  * Ability to set goals for each topic for a class overall, or for individual students.
  * Remove the ability of students to set their own goals, making it a teacher-driven process.
* **Manage Student Rosters:**
  * A detailed view for each class that lists all enrolled students.
  * Functionality to manually remove a student from a class.

**Technical Tasks:**

* **Backend:**
  * Develop API endpoints for CRUD (Create, Read, Update, Delete) operations on classes.
  * Implement API endpoints to manage the relationship between students and classes (add/remove).
  * Update database schema to include `Classes` and a join table for `ClassStudents`.
* **Frontend:**
  * Create UI components for the teacher dashboard, class creation form, and the class detail view.

---

## Phase 2: Communication & Onboarding

**Objective:** Enable teachers to easily invite students to their classes and send communications.

**Features:**

* **Student Invitations:**
  * An interface to send invitation emails to prospective students.
  * Emails should contain a unique link or code for students to join the correct class upon registration.
* **Email Communication:**
  * A simple form to compose and send an email to all students currently enrolled in a specific class.

**Technical Tasks:**

* **Backend:**
  * Integrate an email sending service (e.g., SendGrid, Nodemailer).
  * Create an API endpoint to handle sending batch invitation emails.
  * Develop the logic for generating and validating invitation codes/links.
  * Create an API endpoint for sending messages to all members of a class.
* **Frontend:**
  * Build the UI for the invitation form and the class email composition tool.

---

## Phase 3: Analytics & Reporting

**Objective:** Provide teachers with valuable insights into class and student performance.

**Features:**

* **View Class Records:**
  * A comprehensive table or log displaying all student activity and scores for a given class.
  * Filtering options to narrow down records (e.g., by date, by quiz).
* **View Class Statistics:**
  * A visual analytics dashboard with charts and graphs.
  * Breakdowns of performance by topic to identify class-wide strengths and weaknesses.
  * Statistics for individual students to track their progress.
  * Overall class performance metrics.

**Technical Tasks:**

* **Backend:**
  * Develop API endpoints to aggregate and serve student performance data.
  * Create queries to calculate statistics by class, student, and topic.
* **Frontend:**
  * Implement a data grid or table component to display raw class records.
  * Integrate a charting library (e.g., Chart.js, D3.js) to a-zA-Z0-9-]*[a-zA-Z0-9])?visualize the statistics.
  * Design and build the analytics dashboard UI.
