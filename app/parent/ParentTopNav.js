import styles from "../admin/admin.module.css";

export default function ParentTopNav({ currentPath = "/parent", studentId = "", permissions = null }) {
  const sid = String(studentId || "").trim();
  const items = [{ href: "/parent", label: "ホーム" }];
  if (sid) {
    items.push({ href: `/parent/children/${sid}`, label: "子ども概要" });
    if (permissions?.canViewReservations) items.push({ href: `/parent/children/${sid}/reservations`, label: "子どもの予約" });
    if (permissions?.canViewLessonNotes) items.push({ href: `/parent/children/${sid}/lesson-notes`, label: "レッスンノート" });
    if (permissions?.canViewHomework) items.push({ href: `/parent/children/${sid}/homework`, label: "宿題" });
    if (permissions?.canViewReservations || permissions?.canViewLessonNotes) {
      items.push({ href: `/parent/children/${sid}/progress`, label: "学習状況" });
    }
    items.push({ href: `/parent/children/${sid}/notices`, label: "お知らせ" });
  }

  return (
    <nav className={styles.navBar} aria-label="parent menu">
      {items.map((item) => {
        const active = currentPath === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={active ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
