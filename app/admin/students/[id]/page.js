import { notFound } from "next/navigation";
import styles from "../../../login/login.module.css";
import { requireRole } from "../../../../lib/auth/session";
import {
  getStudentByIdForAdmin,
  getStudentLearningStatsForAdmin,
  getPaymentStudentDetailForAdmin,
  listAuditLogsForAdmin,
  listLessonNotesForAdmin,
  listNoticesForAdmin,
  listReservationsForAdmin,
  summarizeStudentRisksForAdmin,
} from "../../../../lib/auth/store";
import { pickRegistrationAuditHints } from "../../../../lib/adapters/registrationAuditHints";
import AdminTopNav from "../../AdminTopNav";
import adminStyles from "../../admin.module.css";
import StudentEditForm from "./StudentEditForm";
import detailStyles from "./student-detail.module.css";

export default async function AdminStudentDetailPage({ params }) {
  await requireRole(["admin"]);
  const { id } = await params;
  const student = await getStudentByIdForAdmin(id);

  if (!student) notFound();

  const reservationResult = await listReservationsForAdmin({
    studentId: id,
    page: 1,
    pageSize: 60,
  });
  const reservations = reservationResult?.items || [];
  const allNotes = await listLessonNotesForAdmin({});
  const studentLessonNotes = (allNotes || [])
    .filter((note) => Array.isArray(note.students) && note.students.some((row) => row.id === id))
    .slice(0, 60);
  const notices = (await listNoticesForAdmin()).slice(0, 20);
  const initialLearningStats = await getStudentLearningStatsForAdmin(id, { period: "30" });
  const initialPaymentDetail = await getPaymentStudentDetailForAdmin(id);
  const registrationAuditResult = await listAuditLogsForAdmin({
    studentId: id,
    page: 1,
    pageSize: 120,
  });
  const registrationAuditHints = pickRegistrationAuditHints(registrationAuditResult.items || []);
  const riskMap = await summarizeStudentRisksForAdmin([id]);
  const initialRiskBadges = riskMap[id] || [];

  return (
    <div className={adminStyles.adminShell}>
      <main className={`${adminStyles.adminCard} ${detailStyles.pageCard}`}>
        <h1 className={styles.sectionTitle}>学生詳細</h1>
        <p className={styles.description}>学生1名の状態を、上部サマリーとタブで運営しやすく整理しています。</p>
        <AdminTopNav currentPath="/admin/students" />
        <StudentEditForm
          student={student}
          initialReservations={reservations}
          initialLessonNotes={studentLessonNotes}
          initialNotices={notices}
          initialLearningStats={initialLearningStats}
          initialPaymentDetail={initialPaymentDetail}
          registrationAuditHints={registrationAuditHints}
          initialRiskBadges={initialRiskBadges}
        />
      </main>
    </div>
  );
}
