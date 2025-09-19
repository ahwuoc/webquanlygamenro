"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Typography, Row, Col, Tag, Button, Space, Table, Input, Drawer, Form, InputNumber, message, Popconfirm } from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { tasksService } from "@/lib/api/tasks.service";

interface TaskMainTemplate {
  id: number;
  NAME: string;
  detail: string;
}

interface _PaginatedTasksResponse {
  tasks: TaskMainTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TasksManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TaskMainTemplate[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<TaskMainTemplate | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async (_page = page, _limit = pageSize) => {
    try {
      setLoading(true);
      const json = await tasksService.list(_page, _limit);
      let items = json.tasks;
      if (search.trim()) {
        const key = search.trim().toLowerCase();
        items = items.filter(
          (t) => `${t.id}`.includes(key) || t.NAME.toLowerCase().includes(key) || (t.detail || "").toLowerCase().includes(key)
        );
      }
      setData(items);
      setTotal(json.total);
      setPage(json.page);
      setPageSize(json.limit);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Không thể tải danh sách tasks");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = useCallback((record: TaskMainTemplate) => {
    setIsEdit(true);
    setCurrentRecord(record);
    form.setFieldsValue({ id: record.id, NAME: record.NAME, detail: record.detail });
    setDrawerOpen(true);
  }, [form]);

  // Removed quick edit first sub feature per request

  const onClose = () => setDrawerOpen(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && currentRecord) {
        await tasksService.update(currentRecord.id, { NAME: values.NAME, detail: values.detail });
        message.success("Đã cập nhật task");
      } else {
        await tasksService.create({ id: Number(values.id), NAME: values.NAME, detail: values.detail });
        message.success("Đã tạo task mới");
      }
      setDrawerOpen(false);
      await fetchData(1, pageSize);
    } catch (e: any) {
      if (e?.errorFields) return; // antd validation
      console.error(e);
      message.error(e.message || "Thao tác thất bại");
    }
  };

  const handleDelete = useCallback(async (record: TaskMainTemplate) => {
    try {
      await tasksService.remove(record.id);
      message.success("Đã xóa task");
      await fetchData(page, pageSize);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "Xóa task thất bại");
    }
  }, [fetchData, page, pageSize]);

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      setLoading(true);
      await Promise.all(selectedRowKeys.map((key) => tasksService.remove(Number(key))));
      message.success(`Đã xóa ${selectedRowKeys.length} task`);
      setSelectedRowKeys([]);
      await fetchData(page, pageSize);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || 'Xóa hàng loạt thất bại');
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        width: 90,
        sorter: (a: TaskMainTemplate, b: TaskMainTemplate) => a.id - b.id,
        render: (id: number) => <Tag color="blue">#{id}</Tag>,
      },
      {
        title: "Tên Task",
        dataIndex: "NAME",
        sorter: (a: TaskMainTemplate, b: TaskMainTemplate) => a.NAME.localeCompare(b.NAME),
        render: (name: string) => (
          <Typography.Text strong style={{ color: "#1890ff" }}>
            {name}
          </Typography.Text>
        ),
      },
      {
        title: "Mô tả",
        dataIndex: "detail",
        ellipsis: true,
        sorter: (a: TaskMainTemplate, b: TaskMainTemplate) => (a.detail || '').length - (b.detail || '').length,
        render: (detail: string) => (
          <Typography.Text type="secondary">
            {detail?.length > 100 ? `${detail.substring(0, 100)}...` : detail}
          </Typography.Text>
        ),
      },
      {
        title: "Hành động",
        key: "action",
        width: 360,
        render: (_: any, record: TaskMainTemplate) => (
          <Space wrap>
            <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              Sửa Main
            </Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/tasks/${record.id}#subtasks`)}>
              Quản lý Sub
            </Button>
            <Popconfirm
              title="Xóa task"
              description={`Bạn có chắc muốn xóa Task #${record.id}?`}
              okText="Xóa"
              okType="danger"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record)}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>Xóa</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleDelete, openEdit, router]
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    preserveSelectedRowKeys: true,
  };

  return (
    <div className="space-y-6">
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Quản lý Task System
            </Typography.Title>
            <Typography.Text type="secondary">Quản lý các nhiệm vụ chính trong game</Typography.Text>
          </Col>
          <Col xs={24} md={8}>
            <div className="text-right">
              <Space>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Tìm theo ID, tên, mô tả"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onPressEnter={() => fetchData(1, pageSize)}
                  style={{ width: 240 }}
                />
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(page, pageSize)}>
                  Tải lại
                </Button>
                <Popconfirm
                  title="Xóa các task đã chọn?"
                  okText="Xóa"
                  okType="danger"
                  cancelText="Hủy"
                  onConfirm={handleBulkDelete}
                  disabled={selectedRowKeys.length === 0}
                >
                  <Button danger disabled={selectedRowKeys.length === 0}>Xóa đã chọn ({selectedRowKeys.length})</Button>
                </Popconfirm>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Thêm Task Mới
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <div className="text-center">
              <Typography.Title level={3} style={{ margin: 0, color: "#1890ff" }}>
                {total}
              </Typography.Title>
              <Typography.Text type="secondary">Tổng Tasks</Typography.Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div className="text-center">
              <Typography.Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                Active
              </Typography.Title>
              <Typography.Text type="secondary">Trạng thái</Typography.Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Danh sách Tasks">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns as any}
          dataSource={data}
          size="middle"
          sticky
          rowSelection={rowSelection}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
              fetchData(p, ps);
            },
          }}
          scroll={{ x: 800, y: 520 }}
        />
      </Card>

      <Drawer
        title={isEdit ? `Chỉnh sửa Task #${currentRecord?.id}` : "Thêm Task Mới"}
        width={520}
        open={drawerOpen}
        onClose={onClose}
        destroyOnClose
        footer={
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit}>
              {isEdit ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </Space>
        }
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{ id: undefined, NAME: "", detail: "" }}
        >
          {!isEdit && (
            <Form.Item
              name="id"
              label="ID"
              rules={[{ required: true, message: "Vui lòng nhập ID" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} placeholder="Nhập ID (số nguyên)" />
            </Form.Item>
          )}

          <Form.Item
            name="NAME"
            label="Tên Task"
            rules={[{ required: true, message: "Vui lòng nhập tên task" }]}
          >
            <Input placeholder="Nhập tên task" />
          </Form.Item>

          <Form.Item
            name="detail"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
