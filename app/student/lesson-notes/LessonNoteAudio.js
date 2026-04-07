"use client";

import { useMemo } from "react";
import styles from "../student.module.css";

function extractAudioUrl(text) {
  const raw = String(text || "");
  const m =
    raw.match(/https?:\/\/[^\s"'<>]+\.(mp3|m4a|wav|ogg)/i) ||
    raw.match(/src=["']([^"']+\.(mp3|m4a|wav|ogg))["']/i);
  return m ? m[1] || m[0] : "";
}

export default function LessonNoteAudio({ content, summary }) {
  const url = useMemo(() => extractAudioUrl(`${content || ""}${summary || ""}`), [content, summary]);
  if (!url) return null;
  return (
    <div className={styles.noteAudioWrap}>
      <audio className={styles.noteAudioEl} controls preload="none" src={url}>
        お使いのブラウザは音声再生に対応していません。
      </audio>
    </div>
  );
}
