/**
 * 学生予約: 既存 API への送信直前でペイロードを組み立てる（契約は lib/adapters と同一）
 */

export {
  fetchStudentReservations,
  fetchStudentLessonTypes,
  fetchStudentReservationSlots,
  fetchStudentReservationCandidates,
  patchStudentReservation,
  postStudentReservation,
  postStudentReservationCancel,
} from "../../../lib/adapters/studentReservationClient";

export {
  buildStudentReservationCreatePayload,
} from "../../../lib/adapters/studentReservationView";
