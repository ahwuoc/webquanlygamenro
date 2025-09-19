"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Table, Button, Space, Drawer, Form, Input, InputNumber, message, Popconfirm, Typography, Row, Col, Tag, Select, Tooltip, Alert } from "antd";
import { rewardsService } from "@/lib/api/rewards.service";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";

interface Reward {
  id: number;
  requirement_id?: number;
  task_main_id?: number;
  task_sub_id?: number;
  reward_type: string;
  reward_id: number;
  reward_quantity: string | number;
  reward_description?: string | null;
}

interface RewardsResponse { rewards: Reward[] }

export default function RewardsManager({ taskMainId }: { taskMainId: number }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Reward[]>([]);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterSubId, setFilterSubId] = useState<number | undefined>(undefined);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Reward | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const json = await rewardsService.list({ task_main_id: taskMainId, task_sub_id: filterSubId, reward_type: filterType });
      setData(json.rewards);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Lỗi tải Rewards");
    } finally {
      setLoading(false);
    }
  }, [taskMainId, filterType, filterSubId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Listen to selections made from SubTasksManager
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const detail = e?.detail || {};
        if (detail.taskMainId === taskMainId) {
          if (typeof detail.subId === 'number') {
            setFilterSubId(detail.subId);
            fetchData();
          }
        }
      } catch { }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('task-sub-select', handler as EventListener);
      return () => window.removeEventListener('task-sub-select', handler as EventListener);
    }
  }, [taskMainId, fetchData]);

  const openCreate = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    form.resetFields();
    form.setFieldsValue({ task_main_id: taskMainId, task_sub_id: 0, reward_type: 'ITEM', reward_quantity: 1 });
    setDrawerOpen(true);
  };

  const openEdit = (record: Reward) => {
    setIsEdit(true);
    setCurrentRecord(record);
    form.setFieldsValue({ ...record, reward_quantity: Number(record.reward_quantity) });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && currentRecord) {
        await rewardsService.update(currentRecord.id, values);
        message.success("Đã cập nhật reward");
      } else {
        await rewardsService.create(values);
        message.success("Đã tạo reward");
      }
      setDrawerOpen(false);
      await fetchData();
    } catch (e: any) {
      if (e?.errorFields) return;
      console.error(e);
      message.error(e.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (record: Reward) => {
    try {
      await rewardsService.remove(record.id);
      message.success("Đã xóa reward");
      await fetchData();
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Xóa reward thất bại");
    }
  };

  const typeColor = (t: string) => {
    switch (t) {
      case 'ITEM': return 'cyan';
      case 'EXP': return 'geekblue';
      case 'GOLD': return 'gold';
      case 'RUBY': return 'magenta';
      case 'POWER_POINT': return 'purple';
      default: return 'default';
    }
  };

  const columns = useMemo(() => [
    { title: "ID", dataIndex: "id", width: 80, render: (id: number) => <Tag>#{id}</Tag> },
    { title: "Sub ID", dataIndex: "task_sub_id", width: 90 },
    { title: "Type", dataIndex: "reward_type", render: (t: string) => <Tag color={typeColor(t)}>{t}</Tag> },
    { title: "Reward ID", dataIndex: "reward_id", width: 110 },
    { title: "Qty", dataIndex: "reward_quantity", width: 110, render: (q: string | number) => String(q) },
    { title: "Desc", dataIndex: "reward_description", ellipsis: true, render: (v: string) => v ? <Tooltip title={v}><Typography.Text>{v}</Typography.Text></Tooltip> : <Typography.Text type="secondary">—</Typography.Text> },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_: any, record: Reward) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Sửa</Button>
          <Popconfirm title="Xóa reward" okText="Xóa" okType="danger" cancelText="Hủy" onConfirm={() => handleDelete(record)}>
            <Button size="small" danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], []);

  return (
    <Card
      title={
        <div>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Typography.Text strong>Rewards</Typography.Text>
                <Tag color="blue">Task #{taskMainId}</Tag>
              </Space>
            </Col>
            <Col>
              <Space wrap>
                <InputNumber
                  placeholder="Sub ID"
                  value={filterSubId}
                  onChange={(v) => setFilterSubId(typeof v === 'number' ? v : undefined)}
                />
                <Select
                  placeholder="Loại"
                  allowClear
                  value={filterType}
                  onChange={(v) => setFilterType(v)}
                  style={{ minWidth: 160 }}
                  options={[
                    { label: 'ITEM', value: 'ITEM' },
                    { label: 'EXP', value: 'EXP' },
                    { label: 'GOLD', value: 'GOLD' },
                    { label: 'RUBY', value: 'RUBY' },
                    { label: 'POWER_POINT', value: 'POWER_POINT' },
                  ]}
                />
                <Button onClick={() => fetchData()} icon={<ReloadOutlined />}>Áp dụng</Button>
                <Button onClick={() => { setFilterSubId(undefined); setFilterType(undefined); }}>Xóa lọc</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm Reward</Button>
              </Space>
            </Col>
          </Row>
          <Typography.Text type="secondary">Reward xác định phần thưởng khi hoàn thành Sub Task.</Typography.Text>
        </div>
      }
    >
      <Alert type="info" showIcon message="Gợi ý" description="Có thể tạo nhiều Reward cho một Sub Task (ví dụ: ITEM + GOLD + EXP)." style={{ marginBottom: 12 }} />
      <Table
        rowKey="id"
        loading={loading}
        columns={columns as any}
        dataSource={data}
        pagination={false}
        locale={{ emptyText: 'Chưa có Reward nào. Hãy bấm "Thêm Reward".' }}
        scroll={{ x: 800 }}
      />

      <Drawer
        title={isEdit ? `Chỉnh sửa Reward #${currentRecord?.id}` : `Thêm Reward cho Task #${taskMainId}`}
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit}>{isEdit ? 'Lưu' : 'Tạo mới'}</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" initialValues={{ task_main_id: taskMainId, task_sub_id: 0, reward_type: 'ITEM', reward_quantity: 1 }}>
          <Form.Item name="task_main_id" label="Task Main ID" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} disabled />
          </Form.Item>
          <Form.Item name="task_sub_id" label="Task Sub ID" rules={[{ required: true, message: 'Nhập task_sub_id' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reward_type" label="Reward Type" rules={[{ required: true, message: 'Chọn loại reward' }]}>
            <Select
              options={[
                { label: 'Item', value: 'ITEM' },
                { label: 'EXP', value: 'EXP' },
                { label: 'Gold', value: 'GOLD' },
                { label: 'Ruby', value: 'RUBY' },
                { label: 'Power Point', value: 'POWER_POINT' },
              ]}
            />
          </Form.Item>
          <Form.Item name="reward_id" label="Reward ID">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reward_quantity" label="Reward Quantity" rules={[{ required: true, message: 'Nhập số lượng' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reward_description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
}
