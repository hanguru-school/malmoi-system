import { NextResponse } from "next/server";
import { getApiSession } from "../../../../lib/auth/api-session";
import { createRoleInvitationByAdmin, listRoleInvitationsForAdmin } from "../../../../lib/auth/store";
import { sendRoleInviteMail } from "../../../../lib/auth/email";

function baseUrlFromRequest(request) {
  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(request) {
  const session = await getApiSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const items = await listRoleInvitationsForAdmin();
  return NextResponse.json({ ok: true, invitations: items });
}

export async function POST(request) {
  const session = await getApiSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  try {
    const body = (await request.json()) || {};
    const result = await createRoleInvitationByAdmin(body, {
      userId: session.user.id,
      role: session.user.role,
      adminRank: session.user.adminRank,
    });
    const baseUrl = baseUrlFromRequest(request);
    const inviteUrl = `${baseUrl}/register/invite?token=${encodeURIComponent(result.rawToken)}`;
    try {
      await sendRoleInviteMail({
        toEmail: body.email,
        inviteUrl,
        expiresAt: result.expiresAt,
        role: body.role,
      });
    } catch (mailErr) {
      return NextResponse.json({
        ok: true,
        invitationId: result.invitationId,
        inviteUrl,
        mailWarning: mailErr?.message || "メール送信に失敗しました。URLを手動で共有してください。",
      });
    }
    return NextResponse.json({
      ok: true,
      invitationId: result.invitationId,
      inviteUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "招待の作成に失敗しました。" },
      { status: 400 }
    );
  }
}
