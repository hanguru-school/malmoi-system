/**
 * 決済レシート PDF（確定済みトランザクションの値のみ。再計算しない）
 * 日本語は pdf-lib 標準フォントの制約のため、氏名は学生番号中心で表記。
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function safeLine(s, max = 80) {
  return String(s ?? "")
    .replace(/\r|\n/g, " ")
    .slice(0, max);
}

export async function buildPaymentReceiptPdfBytes(tx, kind = "receipt") {
  const doc = await PDFDocument.create();
  const page = doc.addPage([420, 595]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const title = kind === "ryoshu" ? "RYOSHU (official-style summary)" : "RECEIPT (transaction slip)";
  let y = 545;
  const left = 48;
  const line = (text, size = 10, color = rgb(0.15, 0.2, 0.3)) => {
    page.drawText(safeLine(text), { x: left, y, size, font, color });
    y -= size + 6;
  };

  line(title, 13, rgb(0.1, 0.12, 0.2));
  y -= 2;

  if (kind === "ryoshu") {
    const issued = String(tx.registeredAt || tx.paidAt || "").slice(0, 10);
    line(`Issued date: ${issued}`);
    line(`Addressed to: ${tx.studentNameSnapshot || "-"}`);
    line(`Amount (incl. tax): ${tx.amountTaxInclusive ?? 0} JPY`);
    line(`Purpose: Lesson fee (fixed phrase; see web for JA)`);
    y -= 4;
  }

  line(`Transaction ID: ${tx.id}`);
  line(`Student No: ${tx.studentNumberSnapshot || "-"}`);
  line(`Paid at: ${tx.paidAt || "-"}`);
  line(`Method: ${tx.paymentMethod || "-"}`);
  line(`Tax excl: ${tx.amountTaxExclusive ?? 0} JPY`);
  line(`Tax: ${tx.taxAmount ?? 0} JPY`);
  line(`Total (incl. tax): ${tx.amountTaxInclusive ?? 0} JPY`);
  line(`Points (final): ${tx.finalPoints ?? 0} pt`);
  line(`Time granted (this): ${tx.grantedMinutes ?? 0} min`);
  if (tx.note) line(`Note: ${tx.note}`);
  y -= 8;
  line("Japanese layout / full wording: use browser print from admin receipt page.", 8, rgb(0.4, 0.45, 0.5));
  line("Data source: stored payment transaction only (no recalculation).", 8, rgb(0.4, 0.45, 0.5));

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
