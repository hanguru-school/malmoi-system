import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { getMailBaseUrlFromRequest } from "../../../../lib/auth/http";
import { sendLessonNoteParentMail, sendLessonNoteStudentMail } from "../../../../lib/auth/email";
import {
  createLessonNoteByAdmin,
  getLessonNoteNotificationTargets,
  listLessonNotesForAdmin,
} from "../../../../lib/auth/store";

async function notifyLessonNoteCreated(request, note) {
  try {
    const targets = await getLessonNoteNotificationTargets(note?.id);
    if (!targets) return;

    const baseUrl = getMailBaseUrlFromRequest(request);
    const lessonDate = targets.note.date || "-";
    const teacherName = targets.teacherName || "担当講師";
    const lessonTopic = targets.note.summary || targets.note.title || "-";
    const reviewPoint = targets.note.content || "-";
    const homework = targets.note.homeworkSummary || "-";

    const tasks = [];
    targets.studentTargets.forEach((target) => {
      tasks.push(
        sendLessonNoteStudentMail({
          toEmail: target.email,
          lessonDate,
          teacherName,
          lessonTopic,
          reviewPoint,
          homework,
          noteUrl: `${baseUrl}/student/lesson-notes`,
          recipientName: target.studentName || "",
          relatedStudentId: target.studentId || null,
          relatedLessonNoteId: targets.note.id || null,
        }),
      );
    });
    targets.parentTargets.forEach((target) => {
      tasks.push(
        sendLessonNoteParentMail({
          toEmail: target.email,
          lessonDate,
          teacherName,
          lessonTopic,
          reviewPoint,
          homework,
          noteUrl: `${baseUrl}/parent/children/${encodeURIComponent(target.studentId)}/lesson-notes`,
          recipientName: target.email,
          studentName: target.studentName || "",
          relatedStudentId: target.studentId || null,
          relatedParentId: target.parentUserId || null,
          relatedLessonNoteId: targets.note.id || null,
        }),
      );
    });
    if (tasks.length === 0) return;
    const results = await Promise.allSettled(tasks);
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      console.error("[lesson-note] notification mail partially failed", {
        noteId: note?.id,
        failedCount: failed.length,
        totalCount: tasks.length,
      });
    }
  } catch (error) {
    console.error("[lesson-note] notification mail failed", {
      noteId: note?.id,
      error: error?.message || error,
    });
  }
}

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "teacher") {
    return NextResponse.json({ ok: false, error: "先生のみアクセスできます。" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const lessonUnitId = String(searchParams.get("lessonUnitId") || "").trim();
  const notes = await listLessonNotesForAdmin({
    lessonUnitId,
    teacherUserId: session.user.id,
  });
  return NextResponse.json({ ok: true, notes });
}

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "teacher") {
    return NextResponse.json({ ok: false, error: "先生のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const note = await createLessonNoteByAdmin(
      {
        ...(body || {}),
        teacherUserId: session.user.id,
      },
      {
      userId: session.user.id,
      role: session.user.role,
      }
    );
    await notifyLessonNoteCreated(request, note);
    return NextResponse.json({ ok: true, note });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "レッスンノート作成中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}
