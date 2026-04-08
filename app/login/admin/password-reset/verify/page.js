import { Suspense } from "react";
import AdminPasswordResetVerifyClient from "./AdminPasswordResetVerifyClient";

export default function AdminPasswordResetVerifyPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>読み込み中…</p>
        </div>
      }
    >
      <AdminPasswordResetVerifyClient />
    </Suspense>
  );
}
