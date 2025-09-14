"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Typography, Form, Input, InputNumber, Space, Button, message, Result } from 'antd';
import { LeftOutlined, SaveOutlined } from '@ant-design/icons';

interface SubTask {
  id: number;
  task_main_id: number;
  NAME: string;
  max_count: number;
  notify: string;
  npc_id: number;
  map: number;
}

export default function SubTaskEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const subId = Number(params?.id);

  const [form] = Form.useForm<Partial<SubTask>>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SubTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!subId || Number.isNaN(subId)) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/task-sub-templates/${subId}`);
        if (!res.ok) throw new Error('Không thể tải dữ liệu sub task');
        const json: SubTask = await res.json();
        setData(json);
        form.setFieldsValue(json);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subId, form]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await fetch(`/api/task-sub-templates/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Lưu thất bại');
      message.success('Đã lưu Sub Task');
      if (data?.task_main_id) {
        router.push(`/tasks/${data.task_main_id}#subtasks`);
      }
    } catch (e: any) {
      if (e?.errorFields) return; // antd validation
      console.error(e);
      message.error(e.message || 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (!subId || Number.isNaN(subId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card style={{ maxWidth: 520, width: '100%' }}>
          <Result status="error" title="ID không hợp lệ" />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card loading={loading}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center">
            <Space>
              <Button icon={<LeftOutlined />} onClick={() => router.back()}>Quay lại</Button>
              <div>
                <Typography.Title level={3} style={{ margin: 0 }}>Sửa Sub Task #{subId}</Typography.Title>
                {data?.task_main_id && (
                  <Typography.Text type="secondary">Thuộc Task Main #{data.task_main_id}</Typography.Text>
                )}
              </div>
            </Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={onSubmit} loading={saving}>Lưu</Button>
          </Space>
        </Card>

        {error ? (
          <Card>
            <Result status="error" title="Lỗi tải dữ liệu" subTitle={error} />
          </Card>
        ) : (
          <Card title="Thông tin Sub Task" loading={loading}>
            <Form form={form} layout="vertical" initialValues={{ max_count: -1, npc_id: -1 }}>
              <Form.Item name="NAME" label="Tên Sub Task" rules={[{ required: true, message: 'Nhập tên' }]}>
                <Input placeholder="Tên Sub Task" />
              </Form.Item>
              <Form.Item name="max_count" label="Max Count">
                <InputNumber style={{ width: '100%' }} placeholder="-1 nếu không giới hạn" />
              </Form.Item>
              <Form.Item name="notify" label="Notify">
                <Input placeholder="Thông báo" />
              </Form.Item>
              <Form.Item name="npc_id" label="NPC ID">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="map" label="Map" rules={[{ required: true, message: 'Nhập map' }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Card>
        )}
      </div>
    </div>
  );
}
