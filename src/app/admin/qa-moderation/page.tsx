"use client";

import React from "react";
import { QAModerationPanel } from "@/components/admin/qa-moderation-panel";

export default function QAModerationPage() {
  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "24px" }}>Q&A Moderation</h1>
      <QAModerationPanel />
    </div>
  );
}
