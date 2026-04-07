import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { getMailBaseUrlFromRequest } from "../../../../lib/auth/http";
import { sendNoticePublishedMail } from "../../../../lib/auth/email";
import { createNoticeByAdmin, getNoticeNotificationTargets, listNoticesForAdmin } from "../../../../lib/auth/store";

async function notifyNoticePublished(request, notice) {
  try {
    if (!notice?.isActive) return;
    const targets = await getNoticeNotificationTargets(notice.id);
    if (!targets) return;
    const baseUrl = getMailBaseUrlFromRequest(request);
    const noticeTitle = targets.notice.title || "お知らせ";
    const noticeSummary = targets.notice.summary || "";
    const tasks = [];

    (targets.studentTargets || []).forEach((target) => {
      if (!target.email) return;
      tasks.push(
        sendNoticePublishedMail({
          toEmail: target.email,
          noticeTitle,
          noticeSummary,
          noticeUrl: `${baseUrl}/student/notices`,
          relatedNoticeId: targets.notice.id,
          relatedStudentId: target.studentId || null,
          recipientName: target.studentName || "",
          recipientRole: "student",
        })
      );
    });

    (targets.parentTargets || []).forEach((target) => {
      if (!target.email) return;
      tasks.push(
        sendNoticePublishedMail({
          toEmail: target.email,
          noticeTitle,
          noticeSummary,
          noticeUrl: `${baseUrl}/parent/children/${encodeURIComponent(target.studentId || "")}/notices`,
          relatedNoticeId: targets.notice.id,
          relatedStudentId: target.studentId || null,
          relatedParentId: target.parentUserId || null,
          recipientName: target.parentName || "",
          recipientRole: "parent",
        })
      );
    });
    if (tasks.length === 0) return;
    await Promise.allSettled(tasks);
  } catch (error) {
    console.error("[notice] notification mail failed", { error: error?.message || error });
  }
}

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  const notices = await listNoticesForAdmin();
  return NextResponse.json({ ok: true, notices });
}

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const notice = await createNoticeByAdmin(body || {}, {
      userId: session.user.id,
      role: session.user.role,
    });
    await notifyNoticePublished(request, notice);
    return NextResponse.json({ ok: true, notice });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "お知らせ作成中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}
