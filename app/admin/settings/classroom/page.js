import { Suspense } from "react";
import styles from "../../../login/login.module.css";
import { requireRole } from "../../../../lib/auth/session";
import { getSystemSettingsForAdmin } from "../../../../lib/auth/store";
import SettingsSubNav from "../SettingsSubNav";
import ClassroomHoursVisualPanel from "./ClassroomHoursVisualPanel";
import { CLASSROOM_HUB_SUBNAV } from "../classroomHubNav";

export default async function ClassroomSettingsPage() {
  const session = await requireRole(["admin"]);
  const settings = await getSystemSettingsForAdmin();

  return (
    <>
      <h2 className={styles.sectionTitle} style={{ fontSize: "1.15rem", marginTop: 0 }}>
        教室運営 — 営業時間
      </h2>
      <p className={styles.description}>
        曜日・休憩・特別日はすべてクリック操作です（JSON 入力なし）。基本情報・ペア・宿題は下のリンクから。
      </p>
      <Suspense fallback={null}>
        <SettingsSubNav items={CLASSROOM_HUB_SUBNAV} />
      </Suspense>
      <ClassroomHoursVisualPanel
        initialClassroomOperations={settings.classroomOperations || {}}
        initialSchoolBasic={settings.schoolBasic || {}}
        adminRank={session.user.adminRank || "ADMIN"}
      />
    </>
  );
}
