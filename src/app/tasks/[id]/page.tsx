"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TaskDetailView from '../../../components/TaskDetailView';
import { tasksService, TaskMain } from '@/lib/api/tasks.service';

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const [task, setTask] = useState<TaskMain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idStr = params?.id;
    const taskId = parseInt(String(idStr));
    if (!idStr || Number.isNaN(taskId)) {
      setError('ID không hợp lệ');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const t = await tasksService.get(taskId);
        setTask(t);
      } catch (e: any) {
        setError(e?.message || 'Không thể tải chi tiết task');
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-semibold">Đang tải...</h2>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-semibold">{error || 'Không tìm thấy task'}</h2>
          <Link href="/tasks" className="inline-block mt-4 text-blue-600">Quay lại</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <TaskDetailView task={task} />
    </div>
  );
}
