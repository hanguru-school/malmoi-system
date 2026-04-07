import { Suspense } from "react";
import PasswordResetVerifyContent from "./PasswordResetVerifyContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PasswordResetVerifyContent />
    </Suspense>
  );
}
