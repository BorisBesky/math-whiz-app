# Pages — dependency trees

## /portal (PortalApp shell)
Entry: src/components/PortalApp.js
- src/components/portal/PortalLayout.js
  - src/components/portal/PortalUI.js (Avatar)
- src/components/portal/PortalUI.js
  - src/theme/accent.js (buttonClasses, MODAL)
- src/components/portal/sections/OverviewSection.js
- src/components/portal/sections/StudentsSection.js
- src/components/portal/sections/ClassesSection.js
- src/components/portal/sections/QuestionBankSection.js
- src/components/portal/sections/TeacherManagementSection.js
- src/components/portal/sections/ImagesSection.js
- src/components/portal/sections/MessagesSection.js
- src/components/portal/sections/SettingsSection.js
- src/components/portal/sections/AccountSection.js
- hooks: usePortalClasses, usePortalStudents, useClassAssignments, usePortalTeachers, useInternalMessages (logic only)

## Portal › Overview
Entry: src/components/portal/sections/OverviewSection.js
- src/components/portal/PortalUI.js (Alert, Avatar, EmptyState, SectionCard)
- src/utils/common_utils.js, src/utils/studentName.js (logic)

## Portal › Students
Entry: src/components/portal/sections/StudentsSection.js (render: lines 1198-1492; student detail view 651-1194)
- src/theme/accent.js (buttonClasses, BUTTON_SHAPE)
- src/components/portal/PortalUI.js
- src/components/portal/StudentRowActions.js
  - src/components/portal/PortalUI.js
- src/components/portal/GoalsModal.js
  - src/components/ui/ModalWrapper.js
    - src/theme/accent.js (MODAL)
  - src/components/portal/PortalUI.js (ModalHeader)
- src/components/portal/StudentFocusModal.js
  - src/components/ui/ModalWrapper.js
  - src/components/portal/PortalUI.js (ModalHeader)
- src/components/ui/ConfirmationModal.js
- src/hooks/useStudentGoals.js, useConfirmation.js (logic)

## Portal › Classes
Entry: src/components/portal/sections/ClassesSection.js
- src/components/CreateClassForm.js
- src/components/portal/sections/ClassDetailPanel.js (render: lines 591-1110 — main window 591-979 with shared MODAL chrome + ModalHeader; invite/message modals 980-1108)
  - src/theme/accent.js (MODAL)
  - src/components/ui/ModalWrapper.js
  - src/components/portal/SubtopicsFocusModal.js
  - src/components/messaging/MessageComposer.js
  - src/components/portal/QuestionPoolHealthBanner.js
  - src/components/EditClassForm.js
  - src/components/portal/PortalUI.js
  - src/components/portal/StudentRowActions.js
  - src/components/portal/GoalsModal.js
  - src/components/ui/ConfirmationModal.js
- src/components/ui/ConfirmationModal.js
- src/components/portal/PortalUI.js

## Portal › Question Bank
Entry: src/components/portal/sections/QuestionBankSection.js
- src/components/QuestionBankManager.js
  - src/components/GenerateQuestionsModal.js
  - src/components/EditQuestionModal.js
- src/components/AdminQuestionBankManager.js
- src/components/UploadQuestionsPDF.js

## Portal › Settings / Account / Messages
- src/components/portal/sections/SettingsSection.js
- src/components/portal/sections/AccountSection.js → src/components/account/AccountDataPanel.js
- src/components/portal/sections/MessagesSection.js → src/components/messaging/InternalInbox.js, MessageComposer.js

## / (Student app)
Entry: src/MainApp.js
- src/components/AppHeader.js
- src/components/TopicSelection.js
- src/components/QuizView.js
  - src/components/NumberPad.js, WriteInInput.jsx, DrawingCanvas.jsx, PlaceValueTable.js
- src/components/QuizResults.js
- src/components/Dashboard.js
- src/components/StudentProfile.js → src/components/account/AccountDataPanel.js
- src/components/RewardsStore.js → src/components/rewards/*
- src/components/TutorialOverlay.js
