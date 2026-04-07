import rv2 from "./register-v2.module.css";

export default function StudentRegisterChromeV2({ step, title, subtitle, metaExtra, children }) {
  const steps = [1, 2, 3];
  return (
    <div className={rv2.shell}>
      <main className={rv2.card}>
        <p className={rv2.brand}>MalMoi 学生登録</p>
        <h1 className={rv2.title}>{title}</h1>
        {subtitle ? <p className={rv2.sub}>{subtitle}</p> : null}
        <div className={rv2.meta}>
          {steps.map((s) => (
            <span key={s} className={rv2.pill}>
              ステップ {s}/3{s === step ? "（現在）" : s < step ? "（完了）" : ""}
            </span>
          ))}
          {metaExtra ? <span className={rv2.pill}>{metaExtra}</span> : null}
        </div>
        <div className={rv2.stepRail} aria-hidden>
          {steps.map((s) => (
            <span
              key={s}
              className={`${rv2.stepSeg} ${s < step ? rv2.stepSegDone : ""} ${s === step ? rv2.stepSegActive : ""}`}
            />
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
