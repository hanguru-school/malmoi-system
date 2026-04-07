import { NextResponse } from "next/server";
import { getApiSession } from "../../../../../../../lib/auth/api-session";
import { getPaymentTransactionByIdForAdmin } from "../../../../../../../lib/auth/store";
import { buildPaymentReceiptPdfBytes } from "../../../../../../../lib/payments/receipt-pdf.js";

export async function GET(request, context) {
  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "管理者のみアクセスできます。" }, { status: 403 });
  }
  const params = await context.params;
  const transactionId = String(params?.transactionId || "").trim();
  const tx = await getPaymentTransactionByIdForAdmin(transactionId);
  if (!tx) {
    return NextResponse.json({ ok: false, error: "取引が見つかりません。" }, { status: 404 });
  }
  const kind = request.nextUrl.searchParams.get("kind") === "ryoshu" ? "ryoshu" : "receipt";
  const buf = await buildPaymentReceiptPdfBytes(tx, kind);
  const filename = kind === "ryoshu" ? `ryoshu_${transactionId}.pdf` : `receipt_${transactionId}.pdf`;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
