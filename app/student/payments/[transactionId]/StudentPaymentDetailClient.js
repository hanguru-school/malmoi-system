"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "../../student.module.css";
import spStyles from "../student-payments.module.css";

/**
 * 保存済み決済の表示用プレーンオブジェクト（再計算なし）
 * @typedef {{
 *   id: string;
 *   paidAtLabel: string;
 *   amountTaxInclusiveLabel: string;
 *   paymentMethod: string;
 *   finalPoints: number;
 *   grantedMinutes: number;
 *   issuedDateLabel: string;
 *   classroomName: string;
 *   contactFooterText: string;
 * }} StudentTxView
 */

export default function StudentPaymentDetailClient({ txView }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const titleId = "student-ryoshu-doc-title";
  const printRootId = "student-ryoshu-print-root";

  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("student-ryoshu-modal-open");
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove("student-ryoshu-modal-open");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <>
      <div className={spStyles.detailShell}>
        <div className={spStyles.detailCard}>
          <div className={spStyles.detailRow}>
            <span className={spStyles.detailLab}>決済日時</span>
            <span className={spStyles.detailVal}>{txView.paidAtLabel}</span>
          </div>
          <div className={spStyles.detailRow}>
            <span className={spStyles.detailLab}>決済金額</span>
            <span className={`${spStyles.detailVal} ${spStyles.detailEm}`}>{txView.amountTaxInclusiveLabel}</span>
          </div>
          <div className={spStyles.detailRow}>
            <span className={spStyles.detailLab}>お支払い方法</span>
            <span className={spStyles.detailVal}>{txView.paymentMethod || "—"}</span>
          </div>
          <div className={spStyles.detailRow}>
            <span className={spStyles.detailLab}>付与ポイント</span>
            <span className={spStyles.detailVal}>{txView.finalPoints} pt</span>
          </div>
          <div className={spStyles.detailRow}>
            <span className={spStyles.detailLab}>換算時間</span>
            <span className={spStyles.detailVal}>{txView.grantedMinutes} 分</span>
          </div>
        </div>

        <button type="button" className={spStyles.ryoshuOpenBtn} onClick={() => setOpen(true)}>
          領収書を表示
        </button>

        <p className={spStyles.detailHint}>表示内容は保存済みの決済記録です。再計算は行っていません。</p>

        <p className={spStyles.detailBack}>
          <Link href="/student/payments">決済履歴へ戻る</Link>
        </p>
      </div>

      {open ? (
        <div
          className={spStyles.modalBackdrop}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div
            className={spStyles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className={spStyles.modalHead}>
              <span className={spStyles.modalHeadSpacer} aria-hidden />
              <button ref={closeRef} type="button" className={spStyles.modalClose} onClick={onClose} aria-label="閉じる">
                ×
              </button>
            </div>

            <div id={printRootId} className={spStyles.ryoshuSheet}>
              <p id={titleId} className={spStyles.ryoshuDocTitle}>
                領収書
              </p>
              <dl className={spStyles.ryoshuDl}>
                <div className={spStyles.ryoshuDlRow}>
                  <dt>発行日</dt>
                  <dd>{txView.issuedDateLabel}</dd>
                </div>
                <div className={spStyles.ryoshuDlRow}>
                  <dt>金額</dt>
                  <dd className={spStyles.ryoshuAmount}>{txView.amountTaxInclusiveLabel}</dd>
                </div>
                <div className={spStyles.ryoshuDlRow}>
                  <dt>但し書き</dt>
                  <dd>レッスン料として</dd>
                </div>
                <div className={spStyles.ryoshuDlRow}>
                  <dt>お支払い方法</dt>
                  <dd>{txView.paymentMethod || "—"}</dd>
                </div>
                <div className={spStyles.ryoshuDlRow}>
                  <dt>決済ID</dt>
                  <dd className={spStyles.ryoshuMono}>{txView.id}</dd>
                </div>
              </dl>
              <p className={spStyles.ryoshuIssuer}>
                {txView.classroomName}
                <br />
                {txView.contactFooterText}
              </p>
              <p className={spStyles.ryoshuFine}>本書は保存済みの決済データに基づきます（再計算は行っていません）。</p>
            </div>

            <div className={spStyles.modalActions}>
              <button type="button" className={spStyles.modalBtnSecondary} onClick={onClose}>
                閉じる
              </button>
              <button type="button" className={spStyles.modalBtnPrimary} onClick={handlePrint}>
                印刷
              </button>
              <button
                type="button"
                className={spStyles.modalBtnPrimary}
                onClick={handlePrint}
                title="ブラウザの「PDFに保存」を選べます"
              >
                PDFで保存
              </button>
            </div>
            <p className={spStyles.modalPdfHint}>「PDFで保存」は印刷ダイアログで「PDFに保存」を選んでください。</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
