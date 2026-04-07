# MalMoi Portal UI Final Standard

## 1) Scope
- This document defines the final UI structure for five portals:
  - Student
  - Parent
  - Teacher
  - Admin
  - Super Admin system settings scope
- Goal:
  - Keep role-based structure stable as features grow
  - Prioritize real classroom operation flows
  - Keep shared design language while changing menu priority by role

## 2) Global Entry Flow
- Intro (`/`)
  - Brand-first entry with one CTA: portal entry
- Login hubs
  - Student login (`/login`)
  - Parent login (`/login/parent`)
  - Teacher login (`/login/teacher`)
  - Admin login (`/login/admin`)
- Auth support
  - Password reset request (`/password-reset/request`)
  - Password reset verify (`/password-reset/verify`)
  - Force password change (`/password/change-required`)
- Student onboarding
  - Start (`/student/register/start`)
  - Profile (`/student/register/profile`)
  - Consent (`/student/register/consent`)

## 3) Portal Structure

### 3.1 Student Portal
- Primary goal:
  - Reservation, lesson-note review, homework handling, notice reading, learning continuity
- Main menu:
  - Home
  - Reservation
  - Lesson Notes
  - Homework
  - Progress
  - Notices
  - Profile
- Current route map:
  - Home: `/student`
  - Reservation: `/student/reservations`
  - Lesson notes: integrated from dashboard links (expandable as dedicated list if needed)
  - Homework: `/student/homework`, `/student/homework/[id]`
  - Progress: `/student/progress`
  - Notices: `/student/notices`, `/student/notices/[id]`
  - Profile: `/student/profile`
- Home priority cards:
  - Next reservation
  - Recent lesson notes
  - Homework requiring action
  - Progress snapshot
  - Important notices

### 3.2 Parent Portal
- Primary goal:
  - Child reservation/notes/homework/progress visibility and notice awareness
- Main menu:
  - Home
  - Child Reservations
  - Lesson Notes
  - Homework
  - Progress
  - Notices
- Current route map:
  - Home: `/parent`
  - Child hub: `/parent/children/[studentId]`
  - Reservation: `/parent/children/[studentId]/reservations`
  - Lesson notes: `/parent/children/[studentId]/lesson-notes`
  - Homework: `/parent/children/[studentId]/homework`, `/parent/children/[studentId]/homework/[id]`
  - Progress: `/parent/children/[studentId]/progress`
  - Notices: `/parent/children/[studentId]/notices`
- Home priority cards:
  - Next lesson per child
  - Recent lesson note summary
  - Homework status summary
  - Recent important notices
- Policy coupling:
  - Parent account feature toggle
  - Parent view-range policy (reservation/note/homework/progress)

### 3.3 Teacher Portal
- Primary goal:
  - Daily teaching execution: today lessons, note writing, homework follow-up
- Main menu:
  - Home
  - Today Lessons
  - Lesson Notes
  - Homework
  - Student Search
- Current route map:
  - Home: `/teacher`
  - Lesson notes: `/teacher/lesson-notes`
  - Homework: `/teacher/homework`
  - Progress/search style view: `/teacher/progress`
- Home priority cards (target standard):
  - Today reservations
  - Missing lesson notes
  - Homework requiring review
  - Recently handled students

### 3.4 Admin Portal
- Primary goal:
  - Operation control center for class management
- Main menu:
  - Dashboard
  - Student Management
  - Reservation Management
  - Lesson Notes
  - Homework Management
  - Parent Management
  - Notices
  - Mail Management
  - System Settings
- Current route map:
  - Dashboard: `/admin`
  - Students: `/admin/students`, `/admin/students/[id]`
  - Reservations: `/admin/reservations`
  - Lesson notes: `/admin/lesson-notes`
  - Homework: `/admin/homework`
  - Parents: `/admin/parents`
  - Notices: `/admin/notices`
  - Mail: `/admin/mail`
  - System settings: `/admin/settings`
  - Admin users: `/admin/admin-users`
- Dashboard core sections:
  - Today schedule
  - Items requiring action
  - Quick menu
  - Recent activity
  - Mail failure/retry indicators
  - Important notices

### 3.5 Super Admin System Scope
- Scope:
  - Managed inside Admin System Settings (`/admin/settings`)
- Super Admin exclusive edit scope:
  - Mail settings
  - Security settings
- Shared tabs:
  - School basics
  - Reservation
  - Lesson
  - Homework
  - Notifications
  - Mail
  - Security
  - Parent
  - Pair
  - System info
  - Change logs

## 4) Core Management Structures

### 4.1 Student Management
- List:
  - Search, state filters, create, row/card view
- Detail tabs (standard):
  - Basic info
  - Reservations
  - Lesson notes
  - Homework
  - Learning stats
  - Parents
  - Notice history
  - Admin memo
- Top summary:
  - Status, latest reservation/note, parent link, unresolved items

### 4.2 Reservation Management
- Views:
  - Date selector
  - List view and timeline/table view switch
  - Teacher/status filters
  - Add reservation
  - Detail side panel
- Detail panel:
  - Student, date/time, teacher, lesson mode, status, memo, related note, actions
- Linked flows:
  - Reservation -> Student detail
  - Reservation -> Note write
  - Reservation -> Change/Cancel

### 4.3 Lesson Notes
- List:
  - Date filter, student search, teacher filter, state filter
- Editor:
  - Base info, theme, key points, review points, homework, next lesson plan
- Linked flows:
  - Completed reservation -> missing note indicator
  - Note publish -> student/parent visibility
  - Note publish -> mail notification options

### 4.4 Homework
- Admin/Teacher:
  - Search, status filter, create, detail
- Student:
  - Not started / In progress / Submitted / Completed
- Linked flows:
  - Note -> create homework
  - Student checks/submits
  - Parent checks status
  - Connected to learning stats

### 4.5 Notices
- Admin:
  - List, write, important flag, targeting, publish window
- Student/Parent:
  - Important on top, latest list, title/summary/date, detail

### 4.6 Mail Management
- Sending history:
  - Type, recipient, state, send time, subject, related links
- Template management:
  - Registration, password reset, reservation, lesson note, homework, notice templates

## 5) Role UX Priority
- Student/Parent:
  - Simpler language and fewer controls
  - Action-first cards ("what to do now")
  - Mobile-first readability
- Teacher/Admin:
  - Operation density with fast list -> detail -> edit flow
  - Strong filtering and quick actions

## 6) Shared Design Rules
- Card-first sections
- Unified top header and role navigation
- Mobile-first responsive grid
- Japanese status badge vocabulary consistency
- Action hierarchy:
  - Primary action one per block
  - Secondary actions grouped
  - Dangerous actions require confirmation
- Detail layout:
  - Tabs or right-side panel by data size
- Logging:
  - Critical setting changes and operational actions traceable

## 7) Final Implementation Priority
- Priority 1:
  - Login/registration
  - Student portal home
  - Admin dashboard
  - Student management
  - Reservation management
- Priority 2:
  - Lesson notes
  - Homework
  - Notices
  - Parent portal simplification
- Priority 3:
  - Learning stats refinements
  - Mail management enhancements
  - System settings hardening and Super Admin policies
