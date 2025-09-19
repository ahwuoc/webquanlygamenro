"use client";

import React from 'react';
import { Card, Typography, Space, Button, Tag, Descriptions, Breadcrumb } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TaskDetailTabs from '@/components/TaskDetailTabs';

export interface TaskData {
  id: number;
  NAME: string;
  detail: string;
}

export default function TaskDetailView({ task }: { task: TaskData }) {
  const _router = useRouter();
  return (
    <div className="w-full space-y-6" style={{ padding: '0 16px' }}>
      <Breadcrumb
        items={[
          { title: <Link href="/">Home</Link> },
          { title: <Link href="/tasks">Tasks</Link> },
          { title: `Task #${task.id}` },
        ]}
      />

      <Card>
        <Space align="center" size={16} style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space align="center" size={16}>
            <Link href="/tasks">
              <Button icon={<LeftOutlined />}>Quay lại</Button>
            </Link>
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                Task <Tag color="blue">#{task.id}</Tag>: {task.NAME}
              </Typography.Title>
              <Typography.Text type="secondary">Chi tiết nhiệm vụ</Typography.Text>
            </div>
          </Space>
        </Space>
      </Card>

      {/* Task Info */}
      <Card title="Thông tin Task">
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="ID">
            <Tag color="blue">#{task.id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tên Task">
            <Typography.Text strong>{task.NAME}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả">
            <Typography.Text>{task.detail}</Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>


      {/* Management Tabs */}
      <TaskDetailTabs taskId={task.id} />
    </div>
  );
}
