/**
 * 論理エンティティ ↔ 現行 auth-store.json（systemSettings / reservationPolicy 等）の対応表
 * RDB 移行時のカラム分割のたたき台。
 */
export const LogicalEntityMap = {
  LessonType: {
    storage: "systemSettings.lessonServiceCatalog.services[]",
    fieldMap: {
      id: "id",
      name: "name",
      displayName: "displayNameJa",
      description: "description",
      durationMinutes: "durationMinutes",
      pointCost: "consumePoints",
      setupBufferBeforeMinutes: "prepBeforeMinutes",
      setupBufferAfterMinutes: "prepAfterMinutes",
      lessonMode: "lessonFormat",
      maxCapacity: "maxStudents",
      pairAllowed: "allowPair",
      groupAllowed: "allowGroup",
      studentSelfBookingEnabled: "studentSelectable",
      adminOnlyBooking: "adminOnlyBooking",
      rescheduleAllowed: "allowReschedule",
      cancelAllowed: "allowCancel",
      cancellationRuleId: "cancelPolicyType",
      active: "enabled",
      sortOrder: "sortOrder",
      allowedTeacherIds: "teacherUserIds",
    },
  },
  ClassroomBusinessRule: {
    storage: "systemSettings.classroomOperations.weekdayHours + defaultOpen/defaultClose/defaultBreaks",
    note: "曜日キー 0–6 JSON。RDB では 1 行 1 区間に正規化推奨。",
  },
  ClassroomBusinessException: {
    storage: "systemSettings.classroomOperations.dateOverrides[]",
  },
  TeacherAvailabilityRule: {
    storage: "teacherAvailabilityProfiles[].weekly + exceptions + adminLocks",
  },
  ReservationPolicy: {
    storage: "systemSettings.reservation + store.reservationPolicy（重複同期）",
    fieldMap: {
      sameDayBookingAllowed: "allowSameDayBooking",
      minLeadMinutes: "minBookingLeadMinutes",
      maxBookableDays: "maxBookableDays",
      cancelDeadlineHours: "cancelCutoffHours",
      rescheduleDeadlineHours: "studentChangeDeadlineDays（近似）",
      lessonGapMinutes: "prepMinutes（ポリシー全体）",
      managerOverrideAllowed: "adminOverrideSameDay",
      defaultSlotGenerationMode: "timeGenerationMode",
    },
  },
  ReservationSlot: {
    storage: "reservationSlots[]",
  },
  Reservation: {
    storage: "reservations[]",
  },
  PointLedger: {
    storage: "store.pointLedgers[]（予約 charge / refund / cancel_fee / reschedule_adjustment）",
  },
  StudentPointBalance: {
    storage: "students[].points + students[].lessonMinutes",
  },
};
