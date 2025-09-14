"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Typography, Space, Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import RewardsManager from '@/components/RewardsManager';

export default function TaskRewardsPage() {
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
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => router.push(`/tasks/${taskMainId}`)}>Quay lại Task</Button>
            <Typography.Title level={3} style={{ margin: 0 }}>Rewards cho Task #{taskMainId}</Typography.Title>
          </Space>
        </Card>
        <RewardsManager taskMainId={taskMainId} />
      </div>
    </div>
  );
}
