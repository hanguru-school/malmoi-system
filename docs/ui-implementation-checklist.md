# UI Implementation Checklist (Final Standard)

## Role Portals
- [x] Student portal baseline routes
- [x] Parent portal baseline routes
- [x] Teacher portal baseline routes
- [x] Admin portal baseline routes
- [x] Super Admin system-setting scope

## Common Entry
- [x] Intro page
- [x] Student login
- [x] Parent login
- [x] Teacher login
- [x] Admin login
- [x] Password reset request/verify
- [x] Student registration flow

## Navigation Unification
- [x] Admin top navigation
- [x] Teacher top navigation
- [x] Parent top navigation (child-aware)
- [x] Student top navigation parity (lesson-note route added)

## Home Priorities
- [x] Student: next reservation, notices, quick actions
- [x] Parent: child list, next lesson context, notices
- [x] Teacher: today lessons, missing notes, homework review
- [x] Admin: operations-first dashboard sections

## Management Flows
- [x] Student list/detail flow
- [x] Reservation list/detail/actions
- [x] Lesson-note flow with publish/share
- [x] Homework flow across admin/teacher/student/parent
- [x] Notice flow with active/important handling
- [x] Mail management history/template structure
- [x] System settings tabs + change logs

## Policy Coupling (UI -> Runtime)
- [x] Parent account enable/disable
- [x] Parent view-range policy
- [x] Pair lesson enable/disable
- [x] Reservation policy (bookable days/same-day/cancel cutoff)
- [x] Security policy (password mode/reset/login attempts)
- [x] Mail mode linkage (env-first, setting fallback)

## Final Gaps (Next)
- [x] Student dedicated lesson-note list page (`/student/lesson-notes`)
- [x] Teacher "student search" dedicated page (split from progress view)
- [x] Parent points/payment actual data binding (lesson minutes/points/logs)
- [ ] Shared role-header component abstraction (optional refactor)
