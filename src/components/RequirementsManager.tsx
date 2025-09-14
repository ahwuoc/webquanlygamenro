"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Table, Button, Space, Drawer, Form, Input, InputNumber, message, Popconfirm, Typography, Row, Col, Tag, Select, Switch, Tooltip, Alert } from "antd";
import { requirementsService } from "@/lib/api/requirements.service";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";

interface Requirement {
  id: number;
  task_main_id: number;
  task_sub_id: number;
  requirement_type: string;
  target_id: number;
  target_count: number;
  map_restriction?: string | null;
  extra_data?: string | null;
  is_active: boolean;
}

interface RequirementsResponse { requirements: Requirement[] }

export default function RequirementsManager({ taskMainId }: { taskMainId: number }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Requirement[]>([]);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterSubId, setFilterSubId] = useState<number | undefined>(undefined);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Requirement | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const json = await requirementsService.list({ task_main_id: taskMainId, task_sub_id: filterSubId, requirement_type: filterType });
      setData(json.requirements);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Lỗi tải Requirements");
    } finally {
      setLoading(false);
    }
  }, [taskMainId, filterSubId, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Listen to selections made from SubTasksManager
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const detail = e?.detail || {};
        if (detail.taskMainId === taskMainId) {
          if (typeof detail.subId === 'number') {
            setFilterSubId(detail.subId);
            // Optionally adjust type filter or leave as-is
            fetchData();
          }
        }
      } catch {}
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
    form.setFieldsValue({ task_main_id: taskMainId, task_sub_id: 0, target_count: 1, is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (record: Requirement) => {
    setIsEdit(true);
    setCurrentRecord(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && currentRecord) {
        await requirementsService.update(currentRecord.id, values);
        message.success("Đã cập nhật requirement");
      } else {
        await requirementsService.create(values);
        message.success("Đã tạo requirement");
      }
      setDrawerOpen(false);
      await fetchData();
    } catch (e: any) {
      if (e?.errorFields) return;
      console.error(e);
      message.error(e.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (record: Requirement) => {
    try {
      await requirementsService.remove(record.id);
      message.success("Đã xóa requirement");
      await fetchData();
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Xóa requirement thất bại");
    }
  };

  const typeColor = (t: string) => {
    switch (t) {
      case 'KILL_MOB': return 'volcano';
      case 'KILL_BOSS': return 'red';
      case 'TALK_NPC': return 'geekblue';
      case 'PICK_ITEM': return 'gold';
      case 'GO_TO_MAP': return 'green';
      case 'USE_ITEM': return 'purple';
      default: return 'default';
    }
  };

  const columns = useMemo(() => [
    { title: "ID", dataIndex: "id", width: 80, render: (id: number) => <Tag>#{id}</Tag> },
    { title: "Sub ID", dataIndex: "task_sub_id", width: 90 },
    { title: "Type", dataIndex: "requirement_type", render: (t: string) => <Tag color={typeColor(t)}>{t}</Tag> },
    { title: "Target ID", dataIndex: "target_id", width: 100 },
    { title: "Count", dataIndex: "target_count", width: 90 },
    { title: "Map", dataIndex: "map_restriction", ellipsis: true, render: (v: string) => v ? <Tooltip title={v}><Typography.Text>{v}</Typography.Text></Tooltip> : <Typography.Text type="secondary">—</Typography.Text> },
    { title: "Extra", dataIndex: "extra_data", ellipsis: true, render: (v: string) => v ? <Tooltip title={v}><Typography.Text>{v}</Typography.Text></Tooltip> : <Typography.Text type="secondary">—</Typography.Text> },
    { title: "Active", dataIndex: "is_active", width: 90, render: (v: boolean) => v ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag> },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_: any, record: Requirement) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Sửa</Button>
          <Popconfirm title="Xóa requirement" okText="Xóa" okType="danger" cancelText="Hủy" onConfirm={() => handleDelete(record)}>
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
                <Typography.Text strong>Requirements</Typography.Text>
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
                    { label: 'KILL_MOB', value: 'KILL_MOB' },
                    { label: 'KILL_BOSS', value: 'KILL_BOSS' },
                    { label: 'TALK_NPC', value: 'TALK_NPC' },
                    { label: 'PICK_ITEM', value: 'PICK_ITEM' },
                    { label: 'GO_TO_MAP', value: 'GO_TO_MAP' },
                    { label: 'USE_ITEM', value: 'USE_ITEM' },
                  ]}
                />
                <Button onClick={() => fetchData()} icon={<ReloadOutlined />}>Áp dụng</Button>
                <Button onClick={() => { setFilterSubId(undefined); setFilterType(undefined); }}>Xóa lọc</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm Requirement</Button>
              </Space>
            </Col>
          </Row>
          <Typography.Text type="secondary">Requirement xác định điều kiện để hoàn thành Sub Task.</Typography.Text>
        </div>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        columns={columns as any}
        dataSource={data}
        locale={{ emptyText: 'Chưa có Requirement nào. Hãy bấm "Thêm Requirement".' }}
        pagination={false}
        scroll={{ x: 800 }}
      />

      <Drawer
        title={isEdit ? `Chỉnh sửa Requirement #${currentRecord?.id}` : `Thêm Requirement cho Task #${taskMainId}`}
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
        <Form form={form} layout="vertical" initialValues={{ task_main_id: taskMainId, task_sub_id: 0, target_count: 1, is_active: true }}>
          <Form.Item name="task_main_id" label="Task Main ID" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} disabled />
          </Form.Item>
          <Form.Item name="task_sub_id" label="Task Sub ID" rules={[{ required: true, message: 'Nhập task_sub_id' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="requirement_type" label="Requirement Type" rules={[{ required: true, message: 'Nhập requirement type' }]}>
            <Select
              placeholder="Chọn loại requirement"
              options={[
                { label: 'Kill', value: 'KILL' },
                { label: 'Collect', value: 'COLLECT' },
                { label: 'Talk', value: 'TALK' },
                { label: 'Reach', value: 'REACH' },
              ]}
              showSearch
              allowClear
            />
          </Form.Item>
          <Form.Item name="target_id" label="Target ID" rules={[{ required: true, message: 'Nhập target_id' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="target_count" label="Target Count">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="map_restriction" label="Map Restriction">
            <Input placeholder="VD: map1,map2 hoặc để trống" />
          </Form.Item>
          <Form.Item name="extra_data" label="Extra Data">
            <Input.TextArea rows={3} placeholder="JSON hoặc text" />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
}
