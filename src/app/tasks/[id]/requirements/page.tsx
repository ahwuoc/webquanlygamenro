"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Typography, Space, Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import RequirementsManager from '@/components/RequirementsManager';

export default function TaskRequirementsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const taskMainId = Number(params?.id);

  if (!taskMainId || Number.isNaN(taskMainId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <Typography.Text type="danger">ID không hợp lệ</Typography.Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-full space-y-6" style={{ padding: '0 16px' }}>
        <Card>
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => router.push(`/tasks/${taskMainId}`)}>Quay lại Task</Button>
            <Typography.Title level={3} style={{ margin: 0 }}>Requirements cho Task #{taskMainId}</Typography.Title>
          </Space>
        </Card>
        <RequirementsManager taskMainId={taskMainId} />
      </div>
    </div>
  );
}
