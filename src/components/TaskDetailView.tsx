"use client";

import React from 'react';
import { Card, Typography, Space, Button, Tag, Descriptions, Breadcrumb, Alert, Steps } from 'antd';
import { LeftOutlined, EditOutlined, ProfileOutlined, GiftOutlined, ApartmentOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TaskDetailTabs from '@/components/TaskDetailTabs';

export interface TaskData {
  id: number;
  NAME: string;
  detail: string;
}

export default function TaskDetailView({ task }: { task: TaskData }) {
  const router = useRouter();
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { title: <a href="/">Home</a> },
          { title: <a href="/tasks">Tasks</a> },
          { title: `Task #${task.id}` },
        ]}
      />

      <Alert
        message="Workflow quản lý Task"
        description={
          <div>
            <div>1) Tạo hoặc chỉnh sửa Main Task</div>
            <div>2) Thêm các Sub Task</div>
            <div>3) Với từng Sub Task, cấu hình Requirements và Rewards</div>
          </div>
        }
        type="info"
        showIcon
      />

      <Card>
        <Steps
          size="small"
          items={[
            { title: 'Main Task', description: 'Tên, mô tả' },
            { title: 'Sub Tasks', description: 'Các bước con' },
            { title: 'Reqs & Rewards', description: 'Điều kiện & thưởng' },
          ]}
        />
      </Card>
      {/* Header */}
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

      {/* Actions */}
      <Card title="Hành động">
        <Space wrap>
          <Button type="primary" icon={<EditOutlined />}>Chỉnh sửa Task</Button>
          <Button icon={<ApartmentOutlined />} onClick={() => router.push(`/tasks/${task.id}/subtasks`)}>Xem Sub Tasks</Button>
          <Button icon={<ProfileOutlined />} onClick={() => router.push(`/tasks/${task.id}/requirements`)}>Xem Requirements</Button>
          <Button icon={<GiftOutlined />} onClick={() => router.push(`/tasks/${task.id}/rewards`)}>Xem Rewards</Button>
        </Space>
      </Card>

      {/* Management Tabs */}
      <TaskDetailTabs taskId={task.id} />
    </div>
  );
}
