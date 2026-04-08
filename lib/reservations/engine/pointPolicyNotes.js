/**
 * ポイントと予約の「会計モード」方針（運用レポート用）
 *
 * 現行実装（JSON ストア）:
 * - レッスン時間（分）は lessonMinutes 原簿が主。
 * - ポイントは student.points.balance と決済 finalPoints が主。
 * - 予約作成・キャンセル・管理者変更時に store.pointLedgers と students[].points を更新（reservationPointBilling.js）。
 * - 管理画面の expectedPointsConsume は「目安・監査用フィールド」として保存。
 *
 * 将来 DB 移行時: PointLedger + reservation_hold をここで宣言したモードに合わせて配線する。
 */
export const RESERVATION_POINT_ACCOUNTING_MODE = "minutes_primary_points_advisory";

export const POINT_POLICY_SUMMARY_KO =
  "현재: 레슨 **시간(분) 원장**이 예약·완료 처리의 중심이고, **포인트**는 병행 잔액·표시·관리자 예상 소비액으로 쓰입니다. 예약 시점에 포인트 원장을 자동 차감/홀드하지는 않으며, 취소·변경 시의 포인트 재정산은 단계적 구현 대상입니다.";
