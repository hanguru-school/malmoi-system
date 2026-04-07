/**
 * 本日の未処理バックログ（表示用・JSON スキーマは変更しない）
 */

export function todayYmdJst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

function hwTripleKey(lessonUnitId, studentId, dateYmd) {
  return `${String(lessonUnitId || "").trim()}|${String(studentId || "").trim()}|${String(dateYmd || "").slice(0, 10)}`;
}

/**
 * @param {object} p
 * @param {string} p.todayYmd
 * @param {string} p.teacherUserId
 * @param {object[]} p.reservationsToday
 * @param {object[]} p.allNotesTeacher
 * @param {object[]} p.homeworksTeacher
 * @param {object[]} p.reservationsChangePending - 当該先生の change_requested
 */
export function buildTeacherTodayBacklog({
  todayYmd,
  teacherUserId,
  reservationsToday,
  allNotesTeacher,
  homeworksTeacher,
  reservationsChangePending = [],
}) {
  const notedUnitIds = new Set(
    (allNotesTeacher || []).filter((n) => n.lessonUnitId).map((n) => String(n.lessonUnitId))
  );
  const hwTodaySet = new Set(
    (homeworksTeacher || [])
      .filter((h) => String(h.lessonDate || "").slice(0, 10) === todayYmd)
      .map((h) => hwTripleKey(h.lessonUnitId, h.studentId, h.lessonDate))
  );

  const todays = (reservationsToday || []).filter(
    (r) =>
      String(r.instructorUserId || "") === String(teacherUserId) &&
      ["requested", "confirmed", "completed"].includes(String(r.status || ""))
  );

  const completed = todays.filter(
    (r) => String(r.status) === "completed" && r.lessonUnitId && r.studentId
  );

  const missingNotes = completed
    .filter((r) => !notedUnitIds.has(String(r.lessonUnitId)))
    .map((r) => ({
      id: `mn-${r.id}`,
      reservationId: r.id,
      lessonUnitId: r.lessonUnitId,
      studentName: r.studentNameKanji || "—",
      time: r.time || "—",
      href: `/teacher/lesson-notes?lessonUnitId=${encodeURIComponent(r.lessonUnitId || "")}&refDate=${encodeURIComponent(todayYmd)}&studentId=${encodeURIComponent(r.studentId || "")}`,
    }));

  const missingHomework = completed
    .filter((r) => !hwTodaySet.has(hwTripleKey(r.lessonUnitId, r.studentId, todayYmd)))
    .map((r) => ({
      id: `mh-${r.id}`,
      reservationId: r.id,
      lessonUnitId: r.lessonUnitId,
      studentId: r.studentId,
      studentName: r.studentNameKanji || "—",
      time: r.time || "—",
      href: `/teacher/homework?lessonUnitId=${encodeURIComponent(r.lessonUnitId || "")}&studentId=${encodeURIComponent(r.studentId || "")}&lessonDate=${encodeURIComponent(todayYmd)}`,
    }));

  const submittedQueue = (homeworksTeacher || [])
    .filter((h) => String(h.status) === "submitted")
    .slice(0, 80)
    .map((h) => ({
      id: h.id,
      title: h.title || "宿題",
      studentName: h.studentName || "—",
      lessonDate: h.lessonDate || "—",
      label: `${h.title || "宿題"} / ${h.studentName || "—"}（${h.lessonDate || "—"}）`,
      href: `/teacher/homework?studentId=${encodeURIComponent(h.studentId || "")}`,
    }));

  const reservationQueue = (reservationsChangePending || []).map((r) => ({
    id: r.id,
    label: `${r.date || "—"} ${r.time || ""} / ${r.studentNameKanji || "—"}`,
    href: `/teacher/schedule?date=${encodeURIComponent(String(r.date || todayYmd).slice(0, 10))}`,
  }));

  return { missingNotes, missingHomework, submittedQueue, reservationQueue };
}

/**
 * 管理者: 全日程の承認待ち・変更依頼 + 本日分の抜け + 提出待ち宿題
 */
export function buildAdminTodayBacklog({
  todayYmd,
  reservationsToday,
  allNotes,
  allHomeworks,
  reservationsPendingApproval,
  reservationsChangeRequested,
}) {
  const notedUnitIds = new Set((allNotes || []).filter((n) => n.lessonUnitId).map((n) => String(n.lessonUnitId)));

  const hwTodaySet = new Set(
    (allHomeworks || [])
      .filter((h) => String(h.lessonDate || "").slice(0, 10) === todayYmd)
      .map((h) => hwTripleKey(h.lessonUnitId, h.studentId, h.lessonDate))
  );

  const todaysDone = (reservationsToday || []).filter(
    (r) => String(r.status) === "completed" && r.lessonUnitId && r.studentId
  );

  const missingNotes = todaysDone
    .filter((r) => !notedUnitIds.has(String(r.lessonUnitId)))
    .map((r) => ({
      id: `mn-${r.id}`,
      reservationId: r.id,
      lessonUnitId: r.lessonUnitId,
      studentName: r.studentNameKanji || "—",
      time: r.time || "—",
      href: `/admin/lesson-notes?studentId=${encodeURIComponent(r.studentId || "")}`,
    }));

  const missingHomework = todaysDone
    .filter((r) => !hwTodaySet.has(hwTripleKey(r.lessonUnitId, r.studentId, todayYmd)))
    .map((r) => ({
      id: `mh-${r.id}`,
      reservationId: r.id,
      lessonUnitId: r.lessonUnitId,
      studentId: r.studentId,
      studentName: r.studentNameKanji || "—",
      time: r.time || "—",
      href: `/admin/homework?studentId=${encodeURIComponent(r.studentId || "")}&lessonUnitId=${encodeURIComponent(r.lessonUnitId || "")}`,
    }));

  const submittedQueue = (allHomeworks || [])
    .filter((h) => String(h.status) === "submitted")
    .slice(0, 80)
    .map((h) => ({
      id: h.id,
      title: h.title || "宿題",
      studentName: h.studentName || "—",
      lessonDate: h.lessonDate || "—",
      label: `${h.title || "宿題"} / ${h.studentName || "—"}（${h.lessonDate || "—"}）`,
      href: `/admin/homework?studentId=${encodeURIComponent(h.studentId || "")}`,
    }));

  const requested = (reservationsPendingApproval || []).map((r) => ({
    id: r.id,
    label: `${r.date || "—"} ${r.time || ""} / ${r.studentNameKanji || "—"} / 承認待ち`,
    href: `/admin/reservations?focus=pending`,
  }));

  const changeReq = (reservationsChangeRequested || []).map((r) => ({
    id: r.id,
    label: `${r.date || "—"} ${r.time || ""} / ${r.studentNameKanji || "—"} / 変更依頼`,
    href: `/admin/reservations`,
  }));

  return { missingNotes, missingHomework, submittedQueue, requested, changeReq };
}
