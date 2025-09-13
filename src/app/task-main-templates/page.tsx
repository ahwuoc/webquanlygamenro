'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Modal, Space, Table, message } from 'antd';

interface TaskMainTemplate {
  id: number;
  NAME: string;
  detail: string;
}

export default function TaskMainTemplatesPage() {
  const [data, setData] = useState<TaskMainTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<TaskMainTemplate | null>(null);
  const [form] = Form.useForm<TaskMainTemplate>();

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search.trim()) params.set('search', search.trim());
    const res = await fetch(`/api/task-main-templates?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.pagination?.totalCount || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search]);

  function onCreate() {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }
  function onEdit(row: TaskMainTemplate) {
    setEditing(row);
    form.setFieldsValue(row);
    setOpen(true);
  }
  async function onDelete(id: number) {
    const res = await fetch(`/api/task-main-templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      message.success('Đã xóa');
      fetchData();
    } else {
      message.error('Xóa thất bại');
    }
  }

  async function handleOk() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        const res = await fetch(`/api/task-main-templates/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ NAME: values.NAME, detail: values.detail }),
        });
        if (!res.ok) throw new Error('Cập nhật thất bại');
        message.success('Đã cập nhật');
      } else {
        const res = await fetch(`/api/task-main-templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error('Tạo mới thất bại');
        message.success('Đã tạo mới');
      }
      setOpen(false);
      fetchData();
    } catch (e: any) {
      if (e?.message) message.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 100 },
    { title: 'Tên (NAME)', dataIndex: 'NAME' },
    { title: 'Mô tả (detail)', dataIndex: 'detail' },
    {
      title: 'Hành động', key: 'actions', width: 180,
      render: (_: any, r: TaskMainTemplate) => (
        <Space>
          <Button size="small" onClick={() => onEdit(r)}>Sửa</Button>
          <Button size="small" danger onClick={() => onDelete(r.id)}>Xóa</Button>
          <Button size="small" href={`/task-main-templates/${r.id}/subs`}>Task con</Button>
        </Space>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Task Main Templates</h1>
            <p className="text-gray-600">Quản lý structure nhiệm vụ chính</p>
          </div>
          <Space>
            <Input placeholder="Tìm theo tên" value={search} onChange={(e) => setSearch(e.target.value)} onPressEnter={() => { setPage(1); fetchData(); }} />
            <Button type="primary" onClick={onCreate}>+ Thêm Template</Button>
          </Space>
        </div>

        <Card>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns as any}
            dataSource={data}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              showSizeChanger: true,
              onChange: (p, ps) => { setPage(p); setLimit(ps); },
            }}
          />
        </Card>

        <Modal
          open={open}
          title={editing ? 'Sửa Task Main Template' : 'Thêm Task Main Template'}
          onCancel={() => setOpen(false)}
          onOk={handleOk}
          confirmLoading={saving}
        >
          <Form form={form} layout="vertical">
            {!editing && (
              <Form.Item label="ID" name="id" rules={[{ required: true, message: 'Nhập ID' }]}>
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            )}
            <Form.Item label="Tên (NAME)" name="NAME" rules={[{ required: true, message: 'Nhập NAME' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Mô tả (detail)" name="detail" rules={[{ required: true, message: 'Nhập detail' }]}>
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
