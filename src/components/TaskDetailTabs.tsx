"use client";

import React from "react";
import { Card } from "antd";
import RequirementsManager from "@/components/RequirementsManager";

export default function TaskDetailTabs({ taskId }: { taskId: number }) {
  return (
    <Card>
      <RequirementsManager taskMainId={taskId} />
    </Card>
  );
}
