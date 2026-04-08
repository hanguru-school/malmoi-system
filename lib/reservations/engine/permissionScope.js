/**
 * 役割ごとの API / 画面の意図する境界（実際の拒否は各 route + store で実施）
 */
export const RoleCapabilities = {
  student: {
    can: [
      "self_reservation_crud",
      "self_lesson_minutes_view",
      "self_points_detail_view",
      "self_notes_homework_progress",
    ],
    cannot: ["policy_edit", "other_student_pii", "admin_exception_booking_ui"],
  },
  teacher: {
    can: ["self_availability_edit", "assigned_schedule_view", "assigned_notes", "own_reservations_view"],
    cannot: ["classroom_hours_edit", "point_adjust", "other_teacher_settings"],
  },
  admin: {
    can: [
      "student_search",
      "reservation_crud",
      "classroom_hours",
      "teacher_availability_override",
      "lesson_catalog",
      "policy_edit_non_security",
      "point_adjust",
      "exception_days",
    ],
    cannot: ["super_only_security_mail"],
  },
  SUPER_ADMIN: {
    can: ["admin_accounts", "security_mail", "audit_full", "password_reset_tools"],
    cannot: [],
  },
};
