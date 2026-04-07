"use client";

import { useEffect } from "react";
import { setOpsFlowQueue } from "../../../lib/ops/opsFlowQueue";

/**
 * 本日の未処理ページ表示時に連続処理キューを登録する
 */
export default function OpsFlowQueueBootstrap({ urls = [], role = "teacher" }) {
  useEffect(() => {
    setOpsFlowQueue(urls, role);
  }, [urls, role]);
  return null;
}
