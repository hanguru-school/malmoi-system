import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../lib/auth/api-session";
import { getMailBaseUrlFromRequest } from "../../../../../lib/auth/http";
import { sendNoticePublishedMail } from "../../../../../lib/auth/email";
import {
  deleteNoticeByAdmin,
  getNoticeByIdForAdmin,
  getNoticeNotificationTargets,
  updateNoticeByAdmin,
} from "../../../../../lib/auth/store";

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

export async function GET(request, { params }) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const { id } = await params;
  const notice = await getNoticeByIdForAdmin(id);
  if (!notice) return NextResponse.json({ ok: false, error: "お知らせが見つかりません。" }, { status: 404 });
  return NextResponse.json({ ok: true, notice });
}

export async function PATCH(request, { params }) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const previous = await getNoticeByIdForAdmin(id);
    const notice = await updateNoticeByAdmin(id, body || {}, {
      userId: session.user.id,
      role: session.user.role,
    });
    if (!notice) return NextResponse.json({ ok: false, error: "お知らせが見つかりません。" }, { status: 404 });
    const wasInactive = previous ? previous.isActive === false : true;
    const forceResend = body?.resendMail === true;
    if ((wasInactive && notice.isActive) || (forceResend && notice.isActive)) {
      await notifyNoticePublished(request, notice);
    }
    return NextResponse.json({ ok: true, notice });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "お知らせ更新中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const { id } = await params;
  const ok = await deleteNoticeByAdmin(id, {
    userId: session.user.id,
    role: session.user.role,
  });
  if (!ok) return NextResponse.json({ ok: false, error: "お知らせが見つかりません。" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
