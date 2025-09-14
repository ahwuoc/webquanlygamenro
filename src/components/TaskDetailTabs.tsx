"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, Tabs } from "antd";
import SubTasksManager from "@/components/SubTasksManager";
import RequirementsManager from "@/components/RequirementsManager";
import RewardsManager from "@/components/RewardsManager";

export default function TaskDetailTabs({ taskId }: { taskId: number }) {
  // Initialize to a stable default to keep server and client markup identical
  const [activeKey, setActiveKey] = useState<string>('subtasks');

  useEffect(() => {
    const syncFromHash = () => {
      const hash = (window.location.hash || '').replace('#', '');
      if (hash && ['subtasks', 'requirements', 'rewards'].includes(hash)) {
        setActiveKey(hash);
      }
    };
    window.addEventListener('hashchange', syncFromHash);
    // Also react to custom selection events from SubTasksManager
    const onSelect = (e: any) => {
      const target = e?.detail?.target;
      if (target && ['requirements', 'rewards'].includes(target)) {
        setActiveKey(target);
      }
    };
    window.addEventListener('task-sub-select', onSelect as EventListener);
    // Initial sync
    syncFromHash();
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('task-sub-select', onSelect as EventListener);
    };
  }, []);

  const items = useMemo(() => ([
    { key: 'subtasks', label: 'Sub Tasks', children: <div id="subtasks"><SubTasksManager taskMainId={taskId} /></div> },
    { key: 'requirements', label: 'Requirements', children: <div id="requirements"><RequirementsManager taskMainId={taskId} /></div> },
    { key: 'rewards', label: 'Rewards', children: <div id="rewards"><RewardsManager taskMainId={taskId} /></div> },
  ]), [taskId]);

  return (
    <Card>
      <Tabs
        activeKey={activeKey}
        onChange={(k) => {
          setActiveKey(k);
          if (typeof window !== 'undefined') {
            window.location.hash = `#${k}`;
          }
        }}
        items={items}
      />
    </Card>
  );
}
