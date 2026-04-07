import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { getMailBaseUrlFromRequest } from "../../../../lib/auth/http";
import {
  sendHomeworkAssignedParentMail,
  sendHomeworkAssignedStudentMail,
} from "../../../../lib/auth/email";
import {
  createHomeworkByAdmin,
  getHomeworkNotificationTargets,
  listHomeworksForAdmin,
} from "../../../../lib/auth/store";

function homeworkTypeLabel(type) {
  if (type === "vocabulary") return "単語";
  if (type === "grammar") return "文法";
  if (type === "writing") return "作文";
  if (type === "conversation") return "会話練習";
  if (type === "pronunciation") return "発音練習";
  if (type === "reading") return "読解";
  if (type === "listening") return "聞き取り";
  return "自由課題";
}

async function notifyHomeworkPublished(request, homework) {
  try {
    const targets = await getHomeworkNotificationTargets(homework?.id);
    if (!targets || !targets.homework?.isPublished) return;
    const baseUrl = getMailBaseUrlFromRequest(request);
    const homeworkType = homeworkTypeLabel(targets.homework.type);
    const lessonDate = targets.homework.lessonDate || "-";
    const teacherName = targets.teacherName || "担当講師";
    const homeworkTitle = targets.homework.title || "宿題";

    const tasks = [];
    if (targets.studentTarget?.email) {
      tasks.push(
        sendHomeworkAssignedStudentMail({
          toEmail: targets.studentTarget.email,
          homeworkTitle,
          lessonDate,
          homeworkType,
          teacherName,
          homeworkUrl: `${baseUrl}/student/homework`,
          recipientName: targets.studentTarget.studentName || "",
          relatedStudentId: targets.studentTarget.studentId || null,
        })
      );
    }
    (targets.parentTargets || []).forEach((target) => {
      tasks.push(
        sendHomeworkAssignedParentMail({
          toEmail: target.email,
          studentName: target.studentName || "-",
          homeworkTitle,
          lessonDate,
          homeworkType,
          teacherName,
          homeworkUrl: `${baseUrl}/parent/children/${encodeURIComponent(target.studentId)}/homework`,
          recipientName: target.email,
          relatedStudentId: target.studentId || null,
          relatedParentId: target.parentUserId || null,
        })
      );
    });
    if (tasks.length === 0) return;
    await Promise.allSettled(tasks);
  } catch (error) {
    console.error("[homework] notify failed", { error: error?.message || error });
  }
}

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (!["admin", "teacher"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "権限がありません。" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const filters = {
    query: String(searchParams.get("query") || "").trim(),
    studentId: String(searchParams.get("studentId") || "").trim(),
    status: String(searchParams.get("status") || "").trim(),
    type: String(searchParams.get("type") || "").trim(),
    fromDate: String(searchParams.get("fromDate") || "").trim(),
    toDate: String(searchParams.get("toDate") || "").trim(),
    lessonUnitId: String(searchParams.get("lessonUnitId") || "").trim(),
    teacherUserId:
      session.user.role === "teacher"
        ? session.user.id
        : String(searchParams.get("teacherUserId") || "").trim(),
    publishedOnly: String(searchParams.get("publishedOnly") || "") === "1",
  };
  const items = await listHomeworksForAdmin(filters);
  return NextResponse.json({ ok: true, items });
}

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session) return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  if (!["admin", "teacher"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "権限がありません。" }, { status: 403 });
  }
  try {
    const body = (await request.json()) || {};
    const item = await createHomeworkByAdmin(
      {
        ...body,
        teacherUserId: session.user.role === "teacher" ? session.user.id : body.teacherUserId,
      },
      { userId: session.user.id, role: session.user.role }
    );
    if (item?.isPublished) await notifyHomeworkPublished(request, item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "宿題作成中にエラーが発生しました。" },
      { status: 400 }
    );
  }
}
