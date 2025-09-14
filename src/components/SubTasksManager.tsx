"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Table, Button, Space, Drawer, Form, Input, InputNumber, message, Popconfirm, Typography, Row, Col, Tag, Alert, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import Link from "next/link";
import { subTasksService } from "@/lib/api/subTasks.service";
import { mapTemplatesService } from "@/lib/api/mapTemplates.service";
import { NPC_TEMPLATES, npcNameById } from "@/lib/data/npcTemplates";

interface SubTask {
  id: number;
  task_main_id: number;
  NAME: string;
  max_count: number;
  notify: string;
  npc_id: number;
  map: number;
}

interface SubTasksResponse {
  subTasks: SubTask[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SubTasksManager({ taskMainId }: { taskMainId: number }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SubTask[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SubTask | null>(null);
  const [form] = Form.useForm();
  const [mapOptions, setMapOptions] = useState<{ value: number; label: string }[]>([]);

  const fetchData = useCallback(async (_page = page, _limit = pageSize) => {
    try {
      setLoading(true);
      const json = await subTasksService.list({ task_main_id: taskMainId, page: _page, limit: _limit });
      setData(json.subTasks);
      setTotal(json.total);
      setPage(json.page);
      setPageSize(json.limit);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Lỗi tải Sub Tasks");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, taskMainId]);

  useEffect(() => {
    fetchData(1, pageSize);
  }, [fetchData]);

  useEffect(() => {
    // Load map templates for display and form select
    (async () => {
      try {
        const res = await mapTemplatesService.list();
        setMapOptions(res.maps.map(m => ({ value: m.id, label: `${m.NAME} (#${m.id})` })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const openCreate = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    form.resetFields();
    form.setFieldsValue({ task_main_id: taskMainId, max_count: -1, npc_id: -1, map: 0 });
    setDrawerOpen(true);
  };

  const openEdit = (record: SubTask) => {
    setIsEdit(true);
    setCurrentRecord(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const onClose = () => setDrawerOpen(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && currentRecord) {
        await subTasksService.update(currentRecord.id, values);
        message.success("Đã cập nhật Sub Task");
      } else {
        await subTasksService.create(values);
        message.success("Đã tạo Sub Task");
      }
      setDrawerOpen(false);
      await fetchData(page, pageSize);
    } catch (e: any) {
      if (e?.errorFields) return;
      console.error(e);
      message.error(e.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (record: SubTask) => {
    try {
      await subTasksService.remove(record.id);
      message.success("Đã xóa Sub Task");
      await fetchData(page, pageSize);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Xóa Sub Task thất bại");
    }
  };

  const selectAndGo = (subId: number, target: 'requirements' | 'rewards') => {
    if (typeof window !== 'undefined') {
      const ev = new CustomEvent('task-sub-select', { detail: { taskMainId, subId, target } });
      window.dispatchEvent(ev);
      location.hash = `#${target}`;
    }
  };

  const columns = useMemo(() => [
    { title: "ID", dataIndex: "id", width: 80, render: (id: number) => <Tag color="purple">#{id}</Tag> },
    { title: "Tên", dataIndex: "NAME" },
    { title: "Max Count", dataIndex: "max_count", width: 110 },
    { title: "NPC", dataIndex: "npc_id", width: 180, render: (id: number) => (
      <Space size={4}>
        <Tag>#{id}</Tag>
        <Typography.Text type="secondary">{npcNameById(id) || '—'}</Typography.Text>
      </Space>
    ) },
    { title: "Map", dataIndex: "map", width: 200, render: (id: number) => (
      <Space size={4}>
        <Tag>#{id}</Tag>
        <Typography.Text type="secondary">{mapOptions.find(o => o.value === id)?.label?.replace(/ \(#\d+\)$/,'') || '—'}</Typography.Text>
      </Space>
    ) },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_: any, record: SubTask) => (
        <Space>
          <Link href={`/tasks/sub/${record.id}`}>
            <Button size="small" icon={<EditOutlined />}>Sửa</Button>
          </Link>
          <Popconfirm title="Xóa Sub Task" okText="Xóa" okType="danger" cancelText="Hủy" onConfirm={() => handleDelete(record)}>
            <Button size="small" danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
          <Button size="small" onClick={() => selectAndGo(record.id, 'requirements')}>Yêu cầu</Button>
          <Button size="small" onClick={() => selectAndGo(record.id, 'rewards')}>Phần thưởng</Button>
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
                <Typography.Text strong>Sub Tasks của Task</Typography.Text>
                <Tag color="blue">#{taskMainId}</Tag>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(page, pageSize)}>Tải lại</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm Sub Task</Button>
              </Space>
            </Col>
          </Row>
          <Typography.Text type="secondary">Mỗi Sub Task tương ứng một bước trong nhiệm vụ.</Typography.Text>
        </div>
      }
    >
      <Alert type="info" showIcon message="Gợi ý" description="Tạo Sub Task trước, sau đó cấu hình Requirements/Rewards cho từng Sub." style={{ marginBottom: 12 }} />
      <Table
        rowKey="id"
        loading={loading}
        columns={columns as any}
        dataSource={data}
        locale={{ emptyText: 'Chưa có Sub Task nào. Hãy bấm "Thêm Sub Task".' }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); fetchData(p, ps); },
        }}
        scroll={{ x: 800 }}
      />

      <Drawer
        title={isEdit ? `Chỉnh sửa Sub Task #${currentRecord?.id}` : `Thêm Sub Task cho Task #${taskMainId}`}
        width={520}
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
        <Form form={form} layout="vertical" initialValues={{ task_main_id: taskMainId, max_count: -1, npc_id: -1, map: 0 }}>
          <Form.Item name="task_main_id" label="Task Main ID" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} disabled />
          </Form.Item>
          <Form.Item name="NAME" label="Tên Sub Task" rules={[{ required: true, message: 'Nhập tên sub task' }]}>
            <Input placeholder="Tên Sub Task" />
          </Form.Item>
          <Form.Item name="max_count" label="Max Count">
            <InputNumber style={{ width: '100%' }} placeholder="-1 nếu không giới hạn" />
          </Form.Item>
          <Form.Item name="notify" label="Notify">
            <Input placeholder="Thông báo" />
          </Form.Item>
          <Form.Item name="npc_id" label="NPC">
            <Select
              showSearch
              allowClear
              placeholder="Chọn NPC"
              optionFilterProp="label"
              options={NPC_TEMPLATES.map(n => ({ value: n.id, label: `${n.name} (#${n.id})` }))}
            />
          </Form.Item>
          <Form.Item name="map" label="Map" rules={[{ required: true, message: 'Chọn map' }]}>
            <Select
              showSearch
              allowClear
              placeholder="Chọn map"
              optionFilterProp="label"
              options={mapOptions}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
}
